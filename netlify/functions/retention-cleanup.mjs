import { createHash } from "node:crypto";

/**
 * Runs once a day on the live site and asks the app to do its data cleanup:
 * events with no activity for 24 months and organizations whose deletion date has passed.
 * The work itself lives in src/server/retention.ts.
 *
 * Netlify runs scheduled functions on the production site only.
 */
async function retentionCleanup() {
  const site = process.env.URL;
  const secret = (process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "").trim();
  if (!site || !secret) {
    console.error("[retention-cleanup] URL or FIREBASE_SERVICE_ACCOUNT_KEY is not set.");
    return new Response("not configured", { status: 500 });
  }

  const token = createHash("sha256").update(`pairform-cleanup:${secret}`).digest("hex");
  const response = await fetch(`${site}/api/maintenance/cleanup`, {
    method: "POST",
    headers: { "x-cleanup-token": token },
  });
  const body = await response.text();
  console.log(`[retention-cleanup] ${response.status} ${body}`);
  return new Response(body, { status: response.status });
}

export default retentionCleanup;

export const config = { schedule: "@daily" };
