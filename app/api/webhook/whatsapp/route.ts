import { NextRequest, NextResponse } from "next/server";

/**
 * Task 1: Webhook endpoint (GET — verification handshake)
 * Registers webhook URL with Meta WhatsApp Cloud API Dashboard.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    console.log("[WhatsApp Webhook GET] Verification handshake request received:", {
      mode,
      token,
      challenge,
    });

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "pairform_verify_token";

    if (mode === "subscribe" && token === verifyToken) {
      console.log("[WhatsApp Webhook GET] Verification handshake successful!");
      // Meta requires returning raw challenge value as plain text with 200 OK
      return new Response(challenge || "", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    console.warn("[WhatsApp Webhook GET] Verification failed: Token mismatch or invalid mode.");
    return new Response("Forbidden", { status: 403 });
  } catch (error) {
    console.error("[WhatsApp Webhook GET] Verification error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

/**
 * Task 2: Webhook endpoint (POST — event receiver)
 * Receives delivery status updates, read receipts, and incoming replies from Meta.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Log full payload to console for shape inspection
    console.log(
      "[WhatsApp Webhook POST] Received event payload:\n",
      JSON.stringify(body, null, 2)
    );

    // 2. Parse delivery/read statuses if present
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (value?.statuses && Array.isArray(value.statuses)) {
      value.statuses.forEach((statusObj: any) => {
        console.log(`[WhatsApp Status Update] Recipient: ${statusObj.recipient_id} | Status: ${statusObj.status} | Timestamp: ${statusObj.timestamp}`);
        if (statusObj.errors) {
          console.error("[WhatsApp Status Error]:", statusObj.errors);
        }
      });
    }

    // 3. Parse incoming replies if present
    if (value?.messages && Array.isArray(value.messages)) {
      value.messages.forEach((msgObj: any) => {
        console.log(`[WhatsApp Incoming Message] From: ${msgObj.from} | Type: ${msgObj.type} | Content:`, msgObj.text || msgObj);
      });
    }

    // 4. Always respond 200 OK quickly (Meta requires ack within seconds)
    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error: any) {
    console.error("[WhatsApp Webhook POST] Error processing event:", error);
    // Still return 200 to prevent Meta retry loops on bad payloads
    return NextResponse.json({ status: "error", error: error.message }, { status: 200 });
  }
}
