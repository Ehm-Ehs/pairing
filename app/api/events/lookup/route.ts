import { EMAIL_NOT_REGISTERED } from "@/utils/messages";
import { NextResponse } from "next/server";
import { HttpError, appOrigin, clientIp, readJson, route, str } from "@/server/http";
import { rateLimit } from "@/server/rateLimit";
import {
  describeAssignment,
  backfillAccessTokens,
  eventTitle,
  findByEmail,
  isSecretDraw,
  eventLocator,
  loadEvent,
  revealUrl,
} from "@/server/events";
import { deliver } from "@/server/messaging";
import { getPrivateLinkEmail } from "@/services/emailTemplates";

/**
 * "Already registered?" lookup by email.
 *
 * For Secret Santa the match is never shown to whoever typed the email. Instead the
 * participant's private link is sent to their registered email or WhatsApp number.
 * For the other event types the assignment is already public, so it is returned directly.
 */
export const POST = route("events/lookup", async (request) => {
  const body = await readJson<Record<string, unknown>>(request);
  const email = str(body.email, 200).toLowerCase();
  if (!email) throw new HttpError(400, "Email is required.");

  const loaded = await loadEvent(eventLocator(body));
  await rateLimit(`lookup:${clientIp(request)}:${loaded.ref.id}`, 60, 600);

  let event = loaded.data;
  let found = findByEmail(event, email);
  if (!found) throw new HttpError(404, EMAIL_NOT_REGISTERED, "NOT_FOUND");

  if (!isSecretDraw(event)) {
    return NextResponse.json({ assignment: describeAssignment(event, found) });
  }

  if (!found.participant.accessToken) {
    event = await backfillAccessTokens(loaded.ref);
    found = findByEmail(event, email);
    if (!found) throw new HttpError(404, EMAIL_NOT_REGISTERED, "NOT_FOUND");
  }

  const title = eventTitle(event);
  const link = revealUrl(appOrigin(request), loaded.ref.id, found.participant.accessToken);
  const mail = getPrivateLinkEmail(title, found.participant.name || "there", link);
  const result = await deliver(
    event.notificationChannel,
    { email: found.participant.email, phone: found.participant.phone },
    {
      email: mail,
      whatsapp: {
        message: `Hi ${found.participant.name || "there"}! Here is your private link for ${title}: ${link}`,
      },
    }
  );

  const sent = [result.email, result.whatsapp].some((r) => r?.success);
  if (!sent) {
    throw new HttpError(
      502,
      "We could not send your private link right now. Please ask the organizer to resend it.",
      "DELIVERY_FAILED"
    );
  }
  return NextResponse.json({
    sent: true,
    message: "We sent your private link to your registered contact. Open it to see your match.",
  });
});
