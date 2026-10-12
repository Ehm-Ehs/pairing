import { errorMessage } from "@/utils/errors";
import { NextResponse } from "next/server";
import { adminDb } from "@/services/firebaseAdmin";
import { requireUser } from "@/server/auth";
import { HttpError, appOrigin, readJson, route, str } from "@/server/http";
import {
  EventDoc,
  assertCanManage,
  ensureAccessTokens,
  isEmptySlot,
  eventTitle,
  isSecretDraw,
  loadEvent,
  revealUrl,
} from "@/server/events";
import { deliver } from "@/server/messaging";
import { getPairingEmail } from "@/services/emailTemplates";
import { Exclusion, drawSecretSanta, randomPositions } from "@/utils/draw";

const clearSlot = (slot: EventDoc): EventDoc => ({
  id: slot.id,
  number: slot.number,
  role: slot.role || "",
  name: "",
  email: "",
});

/**
 * Organizer-only changes to who is in an event and to draw results.
 * These fields cannot be written from the browser, so token charges cannot be bypassed.
 */
export const POST = route("events/manage", async (request) => {
  const user = await requireUser(request);
  const body = await readJson(request);
  const action = str(body.action, 40);
  const eventId = str(body.eventId, 200);
  if (!eventId) throw new HttpError(400, "eventId is required.");

  const loaded = await loadEvent({ eventId, ownerHint: user.uid });
  await assertCanManage(user.uid, loaded.data);

  const mutate = <T>(fn: (event: EventDoc) => { update: Record<string, unknown>; result: T }) =>
    adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(loaded.ref);
      if (!snap.exists) throw new HttpError(404, "Event not found.", "EVENT_NOT_FOUND");
      const event = snap.data() as EventDoc;
      const { update, result } = fn(event);
      // Recorded so the retention cleanup can tell a dormant event from one still in use.
      if (Object.keys(update).length > 0) {
        update.lastActivityAt = Date.now();
        tx.update(loaded.ref, update as FirebaseFirestore.UpdateData<EventDoc>);
      }
      const { "config.exclusions": exclusions, ...top } = update;
      const merged = { ...event, ...top } as EventDoc;
      if (exclusions !== undefined) merged.config = { ...(event.config || {}), exclusions };
      return { event: merged, result };
    });

  if (action === "removeParticipants") {
    const ids = new Set<string>(Array.isArray(body.ids) ? body.ids.filter((i: unknown) => typeof i === "string") : []);
    if (ids.size === 0) throw new HttpError(400, "No participants selected.");

    const { event, result } = await mutate((event) => {
      if (event.type === "role-based") {
        if (event.status === "locked") throw new HttpError(400, "This event is closed. Slots cannot be modified.");
        let removed = 0;
        const groups: Record<string, EventDoc[]> = event.groups || {};
        for (const key of Object.keys(groups)) {
          groups[key] = (groups[key] || []).map((slot) => {
            if (ids.has(slot.id) && !isEmptySlot(slot)) {
              removed++;
              return clearSlot(slot);
            }
            return slot;
          });
        }
        return { update: removed ? { groups } : {}, result: removed };
      }

      if (event.type === "secret-santa" && event.status === "locked") {
        throw new HttpError(400, "This event is closed. Participants cannot be modified.");
      }
      const before: EventDoc[] = event.participants || [];
      const participants = before.filter((p) => !ids.has(p.id));
      const update: Record<string, unknown> = { participants };
      if (Array.isArray(event.pairs)) {
        update.pairs = event.pairs.filter((p: EventDoc) => !ids.has(p.santaId) && !ids.has(p.receiverId));
      }
      if (Array.isArray(event.config?.exclusions)) {
        update["config.exclusions"] = event.config.exclusions.filter(
          (x: { a: string; b: string }) => !ids.has(x.a) && !ids.has(x.b)
        );
      }
      return { update, result: before.length - participants.length };
    });
    return NextResponse.json({ success: true, removed: result, event });
  }

  if (action === "updateGroups") {
    const incoming = body.groups;
    if (!incoming || typeof incoming !== "object") throw new HttpError(400, "groups is required.");

    const { event } = await mutate((event) => {
      if (event.type !== "role-based") throw new HttpError(400, "Only role-based events have groups.");
      const current: Record<string, EventDoc[]> = event.groups || {};
      const known = new Map<string, EventDoc>();
      Object.values(current).forEach((members) => (members || []).forEach((m) => known.set(m.id, m)));

      // Organizers may move or clear people, but new people must come through the join flow.
      const groups: Record<string, EventDoc[]> = {};
      const seen = new Set<string>();
      for (const [key, members] of Object.entries(incoming as Record<string, unknown>)) {
        if (!Array.isArray(members)) throw new HttpError(400, "Invalid groups.");
        groups[key] = members.map((slot: EventDoc) => {
          const existing = known.get(slot?.id);
          if (!existing || seen.has(slot.id)) throw new HttpError(400, "Groups contain an unknown slot.");
          seen.add(slot.id);
          if (isEmptySlot(slot)) return clearSlot({ ...existing, ...slot });
          if (isEmptySlot(existing)) {
            throw new HttpError(400, "Add new participants with the join link or CSV import.");
          }
          return { ...existing, role: slot.role ?? existing.role, number: slot.number ?? existing.number };
        });
      }
      return { update: { groups }, result: null };
    });
    return NextResponse.json({ success: true, event });
  }

  if (action === "setExclusions") {
    const raw: unknown[] = Array.isArray(body.exclusions) ? body.exclusions : [];
    const { event } = await mutate((event) => {
      if (event.type !== "secret-santa") throw new HttpError(400, "Exclusions only apply to Secret Santa.");
      if (event.status === "locked") throw new HttpError(400, "Pairs have already been drawn.");
      const ids = new Set((event.participants || []).map((p: EventDoc) => p.id));
      const seen = new Set<string>();
      const exclusions: { a: string; b: string }[] = [];
      for (const item of raw) {
        const a = str((item as EventDoc)?.a, 200);
        const b = str((item as EventDoc)?.b, 200);
        if (!ids.has(a) || !ids.has(b) || a === b) throw new HttpError(400, "Exclusions must name two different participants.");
        const key = a < b ? `${a}|${b}` : `${b}|${a}`;
        if (seen.has(key)) continue;
        seen.add(key);
        exclusions.push({ a, b });
      }
      return { update: { "config.exclusions": exclusions }, result: null };
    });
    return NextResponse.json({ success: true, exclusions: event.config?.exclusions || [] });
  }

  if (action === "generate") {
    const { event } = await mutate((event) => {
      const participants: EventDoc[] = event.participants || [];
      ensureAccessTokens(event);

      if (event.type === "secret-santa") {
        if (participants.length < 2) throw new HttpError(400, "Not enough participants to generate pairs");
        if (!isSecretDraw(event)) {
          return { update: { participants, status: "locked" }, result: null };
        }
        if (Array.isArray(event.pairs) && event.pairs.length > 0) {
          throw new HttpError(409, "Pairs have already been generated for this event.", "ALREADY_DRAWN");
        }
        const exclusions: Exclusion[] = (event.config?.exclusions || []).map(
          (x: { a: string; b: string }) => [x.a, x.b] as Exclusion
        );
        let pairs;
        try {
          pairs = drawSecretSanta(participants.map((p) => p.id), exclusions);
        } catch (err) {
          throw new HttpError(400, errorMessage(err), "DRAW_IMPOSSIBLE");
        }
        return { update: { participants, pairs, status: "locked" }, result: null };
      }

      if (event.type === "random-positioning") {
        if (participants.length === 0) throw new HttpError(400, "No participants to generate positions for");
        const numbers = randomPositions(participants.length);
        participants.forEach((p, i) => {
          p.assignedNumber = numbers[i];
        });
        return { update: { participants, status: "locked" }, result: null };
      }

      throw new HttpError(400, "This event type has no draw.");
    });

    // Deliver each result privately over the channel configured for the event.
    const origin = appOrigin(request);
    const title = eventTitle(event);
    const participants: EventDoc[] = event.participants || [];
    const byId = new Map(participants.map((p) => [p.id, p]));
    const jobs: ReturnType<typeof deliver>[] = [];

    if (event.type === "secret-santa" && Array.isArray(event.pairs)) {
      for (const pair of event.pairs) {
        const santa = byId.get(pair.santaId);
        const receiver = byId.get(pair.receiverId);
        if (!santa || !receiver) continue;
        const link = revealUrl(origin, eventId, santa.accessToken);
        const mail = getPairingEmail(title, santa.name, receiver.name, true, receiver.wishlist || undefined, link);
        jobs.push(
          deliver(
            event.notificationChannel,
            { email: santa.email, phone: santa.phone },
            {
              email: mail,
              whatsapp: {
                message: `🎅 *Secret Santa Assignment: ${title}*\n\nHi ${santa.name}! Your Secret Santa pair has been drawn.\n\n🎁 *You are buying a gift for: ${receiver.name}*\n\nYour private link: ${link}\n\nKeep it a secret and have fun!`,
              },
            }
          )
        );
      }
    } else if (event.type === "random-positioning") {
      for (const p of participants) {
        if (!p.assignedNumber) continue;
        const link = revealUrl(origin, eventId, p.accessToken);
        const mail = getPairingEmail(title, p.name, `Position #${p.assignedNumber}`, false, undefined, link);
        jobs.push(
          deliver(
            event.notificationChannel,
            { email: p.email, phone: p.phone },
            {
              email: mail,
              whatsapp: {
                message: `🎲 *Random Position Assigned: ${title}*\n\nHi ${p.name}!\n\nYour position is: *Position #${p.assignedNumber}*\n\n${link}`,
              },
            }
          )
        );
      }
    }
    const results = await Promise.allSettled(jobs);
    const delivered = results.filter(
      (r) => r.status === "fulfilled" && Object.values(r.value).some((sent) => sent?.success)
    ).length;

    return NextResponse.json({ success: true, event, notified: delivered });
  }

  throw new HttpError(400, "Unknown action.");
});
