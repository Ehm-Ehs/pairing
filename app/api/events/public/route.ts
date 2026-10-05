import { NextResponse } from "next/server";
import { adminDb } from "@/services/firebaseAdmin";
import { clientIp, route } from "@/server/http";
import { rateLimit } from "@/server/rateLimit";
import { EventDoc, eventLocator, eventOwner, loadEvent, sanitizeEvent } from "@/server/events";

/**
 * Public, read-only view of an event for join and results pages.
 * Contact details, wishlists, private tokens and draw results are stripped.
 */
export const GET = route("events/public", async (request) => {
  const { searchParams } = new URL(request.url);
  await rateLimit(`public:${clientIp(request)}`, 1200, 60);

  const loaded = await loadEvent(eventLocator(Object.fromEntries(searchParams)));

  const event: EventDoc = { ...loaded.data, id: loaded.data.id || loaded.ref.id };
  const organizerId = event.createdBy || (eventOwner(event).ownerType === "personal" ? event.ownerId : null);
  let organizer = { firstName: "", lastName: "" };
  let messages = { closed: "", full: "" };

  if (organizerId) {
    const userSnap = await adminDb.collection("Users").doc(organizerId).get();
    const data = userSnap.data();
    if (data) {
      organizer = { firstName: data.firstName || "", lastName: data.lastName || "" };
      messages = {
        closed: data.settings?.defaults?.closedEventMessage || "",
        full: data.settings?.defaults?.fullEventMessage || "",
      };
    }
  }

  return NextResponse.json({ event: sanitizeEvent(event), organizer, messages });
});
