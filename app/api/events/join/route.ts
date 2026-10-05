import { NextResponse } from "next/server";
import { adminDb } from "@/services/firebaseAdmin";
import { getUser } from "@/server/auth";
import { HttpError, appOrigin, clientIp, obj, readJson, route, str } from "@/server/http";
import { rateLimit } from "@/server/rateLimit";
import { applyCharge, planCharge, prepareCharge } from "@/server/ledger";
import {
  EventDoc,
  canManageEvent,
  eventOwner,
  eventTitle,
  isSecretDraw,
  eventLocator,
  loadEvent,
  notifyOrganizer,
  revealUrl,
} from "@/server/events";
import { Placement, placeParticipant } from "@/server/join";
import { deliver } from "@/server/messaging";
import { getGroupCompleteEmail, getRoleAssignedEmail } from "@/services/emailTemplates";
import { isEmail } from "@/utils/validation";


interface JoinOutcome extends Placement {
  event: EventDoc;
  remainingTokens: number;
}

/**
 * Adds one participant to an event. Public: participants do not need an account.
 * The whole join (closed check, capacity, duplicate email, slot choice, token charge,
 * write) happens in one transaction, so concurrent joins cannot overwrite each other
 * and a token is only charged when the participant is actually added.
 */
export const POST = route("events/join", async (request) => {
  const body = await readJson(request);
  const input = obj(body.participant);

  const name = str(input.name, 120);
  const email = str(input.email, 200).toLowerCase();
  const phone = str(input.phone ?? input.contact, 30);
  const wishlist = str(input.wishlist, 1000);
  const track = str(input.track ?? input.role, 120);

  if (!name) throw new HttpError(400, "Name is required.");
  if (email && !isEmail(email)) throw new HttpError(400, "Please enter a valid email address.");

  const user = await getUser(request);
  const loaded = await loadEvent(eventLocator(body));
  const eventId = loaded.ref.id;
  const isManager = !!user && (await canManageEvent(user.uid, loaded.data));

  if (!isManager) {
    // Sized so a whole room on one shared network can join, while still bounding abuse.
    await rateLimit(`join:${clientIp(request)}:${eventId}`, 300, 600);
  }

  const owner = eventOwner(loaded.data);
  const { exempt } = await prepareCharge(owner);

  const outcome = await adminDb.runTransaction<JoinOutcome>(async (tx) => {
    const snap = await tx.get(loaded.ref);
    if (!snap.exists) throw new HttpError(404, "Event not found.", "EVENT_NOT_FOUND");
    const event = snap.data() as EventDoc;

    const plan = await planCharge(tx, owner, 1, { exempt }).catch((err) => {
      if (err instanceof HttpError && err.status === 402) {
        // Participants are not told about the organizer's balance.
        throw new HttpError(
          402,
          "This event cannot accept new participants. Contact the organizer.",
          "TOKEN_BALANCE_DEPLETED",
          { isDepleted: true }
        );
      }
      throw err;
    });

    // Decide where the person goes. This throws, before anything is written, if they cannot join.
    const placement = placeParticipant(event, {
      name,
      email,
      phone,
      wishlist,
      track,
      groupKey: str(body.groupKey, 200),
      slotId: str(body.slotId, 200),
      pairIndex: Number.isInteger(input.pairIndex) ? (input.pairIndex as number) : undefined,
      positionLetter: str(input.positionLetter, 1),
      assignedNumber: Number.isInteger(input.assignedNumber) ? (input.assignedNumber as number) : undefined,
      isManager,
    });

    const remainingTokens = applyCharge(tx, plan, 1, {
      type: "participant_join",
      eventId,
      participantId: placement.participant.id,
    });
    tx.update(loaded.ref, placement.update);
    return { ...placement, event, remainingTokens };
  });

  // The join is committed. Notifications are best effort and never fail the request.
  const { event, participant } = outcome;
  const origin = appOrigin(request);
  const title = eventTitle(event);
  const link = revealUrl(origin, eventId, participant.accessToken);
  const channel = event.notificationChannel;

  let groupLabel: string | number = "Participant Pool";
  let roleLabel = "";
  if (event.type === "role-based") {
    groupLabel = outcome.groupKey || "";
    roleLabel = participant.role || track;
  } else if (event.type === "random-positioning") {
    groupLabel = participant.assignedNumber ? `Position #${participant.assignedNumber}` : "Position pending";
    roleLabel = "Participant";
  } else if (isSecretDraw(event)) {
    groupLabel = "Secret Santa Participant Pool";
    roleLabel = "Gift Giver";
  } else {
    groupLabel = `Pair ${participant.pairIndex + 1}`;
    roleLabel = `Side ${participant.positionLetter}`;
  }

  const confirmation = getRoleAssignedEmail(title, name, groupLabel, roleLabel, link);
  const jobs: Promise<unknown>[] = [
    notifyOrganizer({ ...event, id: eventId }, `${name} joined ${title}`),
    deliver(
      channel,
      { email, phone },
      {
        email: confirmation,
        whatsapp: {
          templateName: "pairform_invite",
          participantName: name,
          eventName: title,
          buttonParam: link,
          message: `Hi ${name}! You have joined ${title}. View your assignment: ${link}`,
        },
      }
    ),
  ];

  if (outcome.isFull) {
    if (event.type === "role-based" && outcome.groupMembers) {
      const emails = outcome.groupMembers.map((m) => m.email).filter((e) => typeof e === "string" && e);
      if (emails.length > 0 && channel !== "whatsapp") {
        const complete = getGroupCompleteEmail(origin, outcome.groupKey || "", outcome.groupMembers);
        jobs.push(
          ...emails.map((to) =>
            deliver("email", { email: to }, { email: { subject: complete.subject, html: complete.html, from: complete.from } })
          )
        );
      }
    } else {
      jobs.push(notifyOrganizer({ ...event, id: eventId }, `${title} is now full.`, "success"));
    }
  }
  await Promise.allSettled(jobs);

  return NextResponse.json({
    success: true,
    message: "Participant joined successfully.",
    participant: {
      id: participant.id,
      name,
      assignedNumber: participant.assignedNumber ?? null,
      pairIndex: participant.pairIndex ?? null,
      positionLetter: participant.positionLetter ?? "",
      role: participant.role ?? "",
    },
    groupKey: outcome.groupKey || null,
    isFull: outcome.isFull,
    revealUrl: link,
    ...(isManager ? { remainingTokens: outcome.remainingTokens } : {}),
  });
});
