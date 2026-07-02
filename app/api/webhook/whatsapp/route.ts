import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    console.log("WhatsApp Webhook verification request received:", {
      mode,
      token,
      challenge,
    });

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (!verifyToken) {
      console.error("WHATSAPP_VERIFY_TOKEN is not configured on the server.");
      return new Response("Server Configuration Error", { status: 500 });
    }

    if (mode === "subscribe" && token === verifyToken) {
      console.log("WhatsApp Webhook successfully verified!");
      // Meta requires returning the challenge parameter back exactly as a plain text string
      return new Response(challenge || "", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    console.warn(
      "WhatsApp Webhook verification failed: token mismatch or invalid mode."
    );
    return new Response("Forbidden", { status: 403 });
  } catch (error) {
    console.error("Error in WhatsApp webhook verification:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse the incoming body as JSON
    const body = await request.json();

    // Log the payload to console for debugging and testing purposes
    console.log(
      "WhatsApp Webhook received event payload:",
      JSON.stringify(body, null, 2)
    );

    // Meta expects a 200 OK response to acknowledge receipt of the event.
    // If you do not return a 200, Meta will keep retrying to deliver the webhook event.
    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error: any) {
    console.error("Error processing WhatsApp webhook event:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
