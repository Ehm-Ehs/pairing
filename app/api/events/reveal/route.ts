import { NextResponse } from "next/server";
import { HttpError, clientIp, route, str } from "@/server/http";
import { rateLimit } from "@/server/rateLimit";
import { describeAssignment, findByToken, loadEvent } from "@/server/events";

/**
 * Returns one participant's own assignment. The private token in their link is the
 * only credential, so the response never includes anyone else's match.
 */
export const GET = route("events/reveal", async (request) => {
  const { searchParams } = new URL(request.url);
  const eventId = str(searchParams.get("id") || searchParams.get("eventId"), 200);
  const token = str(searchParams.get("t"), 200);
  if (!eventId || !token) throw new HttpError(400, "This link is incomplete.");

  await rateLimit(`reveal:${clientIp(request)}`, 300, 600);

  const { data } = await loadEvent({ eventId });
  const found = findByToken(data, token);
  if (!found) throw new HttpError(404, "This link is not valid for this event.", "INVALID_LINK");

  return NextResponse.json({ assignment: describeAssignment(data, found) });
});
