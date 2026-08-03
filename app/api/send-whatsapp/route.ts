import { NextResponse } from "next/server";

/**
 * Serverless API Route replacing Resend email endpoint with WhatsApp API.
 * Supports Meta WhatsApp Cloud API, Twilio WhatsApp, UltraMsg, or Custom Webhooks.
 */
export async function POST(request: Request) {
  try {
    const { to, phone, message } = await request.json();
    const recipientPhone = (phone || to || "").replace(/\D+/g, "");

    if (!recipientPhone || !message) {
      return NextResponse.json(
        { error: "Missing required fields: phone/to and message" },
        { status: 400 }
      );
    }

    const whatsappApiUrl = process.env.WHATSAPP_API_URL || process.env.NEXT_PUBLIC_WHATSAPP_API_URL;
    const whatsappApiToken = process.env.WHATSAPP_API_TOKEN || process.env.NEXT_PUBLIC_WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID;

    // 1. Meta WhatsApp Cloud API (Standard official Meta API)
    if (phoneNumberId && whatsappApiToken) {
      const metaUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
      const metaRes = await fetch(metaUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${whatsappApiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipientPhone,
          type: "text",
          text: { preview_url: true, body: message },
        }),
      });

      const metaData = await metaRes.json();
      if (!metaRes.ok) {
        console.error("Meta WhatsApp Cloud API error:", metaData);
        return NextResponse.json({ error: metaData.error || "Meta WhatsApp API error" }, { status: metaRes.status });
      }

      return NextResponse.json({ success: true, provider: "Meta WhatsApp API", data: metaData });
    }

    // 2. Custom Webhook / Provider API
    if (whatsappApiUrl) {
      const customRes = await fetch(whatsappApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(whatsappApiToken ? { Authorization: `Bearer ${whatsappApiToken}` } : {}),
        },
        body: JSON.stringify({
          to: recipientPhone,
          phone: recipientPhone,
          message: message,
          text: message,
        }),
      });

      const customData = await customRes.json();
      return NextResponse.json({ success: true, provider: "Custom WhatsApp Webhook", data: customData });
    }

    // 3. Fallback Log Mode (when API keys are not configured yet in .env)
    console.log("-----------------------------------------");
    console.log("[WhatsApp API Simulator - Configure WHATSAPP_API_TOKEN in .env]");
    console.log("Sending WhatsApp to:", recipientPhone);
    console.log("Message:\n", message);
    console.log("-----------------------------------------");

    return NextResponse.json({
      success: true,
      simulated: true,
      message: "WhatsApp API received message. Configure WHATSAPP_API_TOKEN in .env for production sending.",
      to: recipientPhone,
    });
  } catch (error: any) {
    console.error("Server error processing WhatsApp API request:", error);
    return NextResponse.json(
      { error: "Failed to send WhatsApp message", details: error.message },
      { status: 500 }
    );
  }
}
