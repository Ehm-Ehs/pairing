import { NextResponse } from "next/server";
import { adminDb } from "@/services/firebaseAdmin";
import { requireUser } from "@/server/auth";
import { HttpError, appOrigin, obj, readJson, route, str } from "@/server/http";
import { rateLimit } from "@/server/rateLimit";
import { applyCharge, planCharge, prepareCharge } from "@/server/ledger";
import { allParticipants, assertCanManage, eventOwner, eventTitle, loadEvent } from "@/server/events";
import { sendEmail } from "@/server/messaging";
import { getRoundNotificationEmail } from "@/services/emailTemplates";
import { formatWhatsAppPhone } from "@/utils/phone";

const TOKENS_PER_NOTIFICATION = 0.5;

/**
 * Notifies speed-networking participants of their table for a round.
 * Organizer only. Recipients must be participants of the event.
 */
export const POST = route("events/notify-round", async (request) => {
  const user = await requireUser(request);
  const body = await readJson(request);
  const eventId = str(body.eventId, 200);
  const roundNumber = Number(body.roundNumber) || 1;
  const channel = body.channel === "whatsapp" || body.channel === "both" ? body.channel : "email";
  if (!eventId || !Array.isArray(body.notifications) || body.notifications.length === 0) {
    throw new HttpError(400, "Invalid parameters. Missing eventId or notifications list.");
  }

  const loaded = await loadEvent({ eventId, ownerHint: user.uid });
  const event = loaded.data;
  await assertCanManage(user.uid, event);
  await rateLimit(`notify-round:${user.uid}:${eventId}`, 30, 3600);

  // Only people who are actually in the event can be messaged.
  const emails = new Set<string>();
  const phones = new Set<string>();
  for (const { participant } of allParticipants(event)) {
    if (participant.email) emails.add(String(participant.email).trim().toLowerCase());
    if (participant.phone) phones.add(formatWhatsAppPhone(String(participant.phone)));
  }
  const notifications = (body.notifications as unknown[])
    .slice(0, 1000)
    .map(obj)
    .map((item) => ({
      name: str(item.name, 120),
      email: str(item.email, 200).toLowerCase(),
      phone: str(item.phone, 30),
      tableNumber: Number(item.tableNumber) || 0,
      partners: str(item.partners, 500),
    }))
    .filter((item) => (item.email && emails.has(item.email)) || (item.phone && phones.has(formatWhatsAppPhone(item.phone))));
  if (notifications.length === 0) {
    throw new HttpError(400, "None of the recipients are participants of this event.");
  }

  const requiredTokens = notifications.length * TOKENS_PER_NOTIFICATION;
  const owner = eventOwner(event);
  const { exempt } = await prepareCharge(owner);

  const remainingTokens = await adminDb
    .runTransaction(async (tx) => {
      const plan = await planCharge(tx, owner, requiredTokens, { exempt });
      return applyCharge(tx, plan, requiredTokens, {
        type: "round_notification",
        eventId,
        roundNumber,
        participantCount: notifications.length,
      });
    })
    .catch((err) => {
      if (err instanceof HttpError && err.status === 402) {
        throw new HttpError(
          402,
          `Insufficient token balance! Notifying ${notifications.length} participants for Round ${roundNumber} requires ${requiredTokens} tokens (0.5 tokens/attendee). Please top up your token balance.`,
          "TOKEN_BALANCE_DEPLETED",
          { requiredTokens }
        );
      }
      throw err;
    });

  const eventName = eventTitle(event);
  const groupLink = `${appOrigin(request)}/event/results/${event.createdBy || event.ownerId}/${eventId}`;
  const whatsAppPayloads: Record<string, string>[] = [];
  const emailJobs: Promise<unknown>[] = [];

  for (const item of notifications) {
    const tableText = item.tableNumber === 0 ? "Solo / Floating Facilitator" : `Table ${item.tableNumber}`;
    const msgText = `Hi ${item.name},\n\nRound ${roundNumber} for *${eventName}* has started! 🚀\n\n📍 *Assigned Location:* ${tableText}\n👥 *Partner(s):* ${item.partners || "Floating Facilitator"}\n\n🔗 View your group & table schedule:\n${groupLink}\n\n- The PairForm Team`;
    const phoneDigits = formatWhatsAppPhone(item.phone);
    whatsAppPayloads.push({
      participantName: item.name,
      phone: item.phone,
      whatsAppLink: phoneDigits
        ? `https://api.whatsapp.com/send?phone=${phoneDigits}&text=${encodeURIComponent(msgText)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(msgText)}`,
      formattedText: msgText,
    });

    if ((channel === "email" || channel === "both") && item.email) {
      const mail = getRoundNotificationEmail(eventName, item.name, roundNumber, item.tableNumber, item.partners, groupLink);
      emailJobs.push(sendEmail({ to: item.email, ...mail }));
    }
  }
  await Promise.allSettled(emailJobs);

  return NextResponse.json({
    success: true,
    deductedTokens: exempt ? 0 : requiredTokens,
    remainingTokens,
    notifiedCount: notifications.length,
    roundNumber,
    groupLink,
    whatsAppPayloads,
  });
});
