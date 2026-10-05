import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/services/firebaseAdmin";
import { getUser } from "@/server/auth";
import { HttpError, clientIp, obj, readJson, route, str } from "@/server/http";
import { rateLimit } from "@/server/rateLimit";

/** Stores a Web Push subscription. The owner is taken from the session, not the request body. */
export const POST = route("notifications/subscribe", async (request) => {
  const user = await getUser(request);
  await rateLimit(`push-sub:${clientIp(request)}`, 20, 600);

  const body = await readJson(request);
  const subscription = obj(body.subscription);
  const endpoint = str(subscription.endpoint, 2000);
  if (!endpoint || !/^https:\/\//.test(endpoint)) {
    throw new HttpError(400, "Invalid push subscription object");
  }

  // One document per endpoint, so repeat subscriptions update instead of duplicating.
  const id = createHash("sha256").update(endpoint).digest("hex").slice(0, 40);
  await adminDb
    .collection("push_subscriptions")
    .doc(id)
    .set(
      {
        endpoint,
        keys: obj(subscription.keys),
        userId: user?.uid || null,
        userAgent: str(body.userAgent, 500) || null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  return NextResponse.json({ success: true, message: "Push subscription saved." });
});
