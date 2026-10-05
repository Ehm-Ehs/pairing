import { errorMessage } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Meta WhatsApp Cloud API webhook.
 * GET is the verification handshake. POST receives delivery statuses and replies.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (
    verifyToken &&
    searchParams.get("hub.mode") === "subscribe" &&
    searchParams.get("hub.verify_token") === verifyToken
  ) {
    // Meta requires the raw challenge value as plain text.
    return new Response(searchParams.get("hub.challenge") || "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return new Response("Forbidden", { status: 403 });
}

function hasValidSignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return header.length === expected.length && crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

export async function POST(request: NextRequest) {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    logger.error("[whatsapp webhook] WHATSAPP_APP_SECRET is not set; rejecting webhook.");
    return new Response("Webhook not configured", { status: 503 });
  }

  const rawBody = await request.text();
  if (!hasValidSignature(rawBody, request.headers.get("x-hub-signature-256"), appSecret)) {
    return new Response("Invalid signature", { status: 401 });
  }

  // Signed by Meta from here on. Always acknowledge quickly so Meta does not retry.
  try {
    const body = JSON.parse(rawBody);
    const value = body?.entry?.[0]?.changes?.[0]?.value;
    for (const status of Array.isArray(value?.statuses) ? value.statuses : []) {
      if (status.errors) {
        logger.error("[whatsapp webhook] Delivery error:", status.status, JSON.stringify(status.errors));
      }
    }
  } catch (err) {
    logger.error("[whatsapp webhook] Could not parse payload:", errorMessage(err));
  }
  return NextResponse.json({ status: "success" }, { status: 200 });
}
