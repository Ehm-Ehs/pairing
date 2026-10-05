import { logger } from "@/utils/logger";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { HttpError, route } from "@/server/http";
import { paystackSecret, settleTransaction } from "@/server/paystack";

/**
 * Paystack webhook. Every request must carry a valid HMAC signature; unsigned or
 * wrongly signed requests are rejected before the body is parsed.
 */
export const POST = route("payments/webhook", async (request) => {
  const secret = paystackSecret();
  if (!secret) throw new HttpError(503, "Payments are not configured.");

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") || "";
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  const valid =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) throw new HttpError(401, "Invalid signature");

  let payload: { event?: string; data?: unknown };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    throw new HttpError(400, "Invalid payload");
  }

  if (payload.event !== "charge.success") {
    return NextResponse.json({ status: "ignored" });
  }

  try {
    const result = await settleTransaction(payload.data);
    return NextResponse.json({ status: "success", alreadyProcessed: result.alreadyProcessed });
  } catch (err) {
    // A payload we can never credit (bad metadata, wrong amount) must not be retried forever.
    if (err instanceof HttpError && err.status === 400) {
      logger.error("[payments/webhook] Charge not credited:", err.code, err.message);
      return NextResponse.json({ status: "ignored", reason: err.code });
    }
    throw err;
  }
});
