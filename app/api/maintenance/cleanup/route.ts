import { NextResponse } from "next/server";
import { HttpError, route } from "@/server/http";
import { isCleanupToken, purgeDueOrganizations, purgeInactiveEvents } from "@/server/retention";

/**
 * Daily data cleanup, called by the scheduled job in netlify/functions/retention-cleanup.mjs.
 * Add ?dryRun=1 to count what would be deleted without deleting anything.
 */
export const POST = route("maintenance/cleanup", async (request) => {
  if (!isCleanupToken(request.headers.get("x-cleanup-token") || "")) {
    throw new HttpError(404, "Not found.");
  }
  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
  const now = Date.now();
  const events = await purgeInactiveEvents(now, dryRun);
  const organizations = await purgeDueOrganizations(now, dryRun);
  return NextResponse.json({ success: true, dryRun, events, organizations });
});
