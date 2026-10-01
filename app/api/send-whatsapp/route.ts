import { NextResponse } from "next/server";

/**
 * Task 3: Send function Endpoint
 * Sends Meta WhatsApp Cloud API template & text messages via graph.facebook.com/v20.0/
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, phone, message, templateName, components, languageCode = "en", participantName, eventName, buttonParam } = body;

    // Format phone: recipient full international number with auto +234 country code for local 10/11 digit numbers
    const rawPhone = phone || to || "";
    let cleanPhone = rawPhone.replace(/\D+/g, "");
    if (cleanPhone.length === 11 && cleanPhone.startsWith("0")) {
      cleanPhone = "234" + cleanPhone.substring(1);
    } else if (cleanPhone.length === 10 && /^[789]/.test(cleanPhone)) {
      cleanPhone = "234" + cleanPhone;
    }
    const recipientPhone = cleanPhone.replace(/^0+/, "");

    if (!recipientPhone) {
      return NextResponse.json(
        { error: "Missing recipient phone number" },
        { status: 400 }
      );
    }

    const whatsappAccessToken =
      process.env.WHATSAPP_ACCESS_TOKEN ||
      process.env.WHATSAPP_API_TOKEN ||
      process.env.NEXT_PUBLIC_WHATSAPP_API_TOKEN;

    const phoneNumberId =
      process.env.WHATSAPP_PHONE_NUMBER_ID ||
      process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID;

    // 1. Meta WhatsApp Cloud API Endpoint (v20.0 per Task 3 brief)
    if (phoneNumberId && whatsappAccessToken) {
      const metaUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

      const sendPayload = async (payloadObj: any) => {
        const metaRes = await fetch(metaUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${whatsappAccessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payloadObj),
        });
        const metaData = await metaRes.json();
        return { ok: metaRes.ok, status: metaRes.status, data: metaData };
      };

      // Function to build template components
      const buildComponents = (tmplComp: any[]) => {
        if (tmplComp && tmplComp.length > 0) return tmplComp;
        const comps: any[] = [];
        const pName = participantName || "Participant";
        const eName = eventName || "PairForm Event";

        comps.push({
          type: "body",
          parameters: [
            { type: "text", parameter_name: "participant_name", text: pName },
            { type: "text", parameter_name: "event_name", text: eName },
          ],
        });

        const cleanParam = typeof buttonParam === "string"
          ? (buttonParam.startsWith("http") ? new URL(buttonParam).searchParams.get("id") || buttonParam : buttonParam)
          : buttonParam || "invite";

        comps.push({
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [{ type: "text", text: cleanParam }],
        });

        return comps;
      };

      let initialPayload: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientPhone,
      };

      let primaryTemplateName = templateName;
      if (primaryTemplateName) {
        const comps = buildComponents(components);
        initialPayload.type = "template";
        initialPayload.template = {
          name: primaryTemplateName,
          language: { code: languageCode },
          ...(comps.length > 0 ? { components: comps } : {}),
        };
      } else {
        if (!message) {
          return NextResponse.json(
            { error: "Missing required field: message or templateName" },
            { status: 400 }
          );
        }
        initialPayload.type = "text";
        initialPayload.text = { preview_url: true, body: message };
      }

      console.log(`[Meta WhatsApp Cloud API v20.0] Sending to ${recipientPhone}...`);
      let result = await sendPayload(initialPayload);

      // Fallback 1: If custom template fails, try text message or hello_world template
      if (!result.ok && primaryTemplateName) {
        console.warn(`[Meta WhatsApp API] Template '${primaryTemplateName}' returned error ${result.data?.error?.code}. Attempting fallback...`);

        // Try freeform text message fallback if text content exists
        const fallbackText = message || `Hello ${participantName || "there"}! You've been added to ${eventName || "a PairForm event"}. ${buttonParam ? "View event: " + buttonParam : ""}`.trim();
        if (fallbackText) {
          const textPayload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: recipientPhone,
            type: "text",
            text: { preview_url: true, body: fallbackText },
          };
          const textResult = await sendPayload(textPayload);
          if (textResult.ok) {
            console.log("[Meta WhatsApp API] Text message fallback SUCCESS!");
            return NextResponse.json({ success: true, provider: "Meta WhatsApp Cloud API v20.0 (Text Fallback)", data: textResult.data });
          }
        }

        // Fallback 2: Try default 'hello_world' template (pre-approved by Meta for test numbers)
        const helloWorldPayload = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipientPhone,
          type: "template",
          template: {
            name: "hello_world",
            language: { code: "en_US" },
          },
        };
        const hwResult = await sendPayload(helloWorldPayload);
        if (hwResult.ok) {
          console.log("[Meta WhatsApp API] hello_world template fallback SUCCESS!");
          return NextResponse.json({ success: true, provider: "Meta WhatsApp Cloud API v20.0 (hello_world Fallback)", data: hwResult.data });
        }
      }

      if (!result.ok) {
        console.error("[Meta WhatsApp Cloud API ERROR]:", {
          status: result.status,
          errorBody: result.data,
        });

        const errCode = result.data?.error?.code;
        let hint = "";
        if (errCode === 131030) {
          hint = "Recipient phone number is not in Meta WhatsApp Sandbox allowed list. Add recipient number in Meta Developer Console under WhatsApp -> API Setup.";
        } else if (errCode === 100 || errCode === 132001) {
          hint = "Template does not exist or is not approved in Meta WhatsApp Business Manager.";
        }

        return NextResponse.json(
          {
            error: "Meta WhatsApp API Error",
            statusCode: result.status,
            metaError: result.data?.error || result.data,
            hint,
            recipientPhone,
          },
          { status: result.status }
        );
      }

      console.log("[Meta WhatsApp Cloud API SUCCESS]:", result.data);
      return NextResponse.json({ success: true, provider: "Meta WhatsApp Cloud API v20.0", data: result.data });
    }

    // Fallback log simulator mode if tokens are missing in environment
    console.log("-----------------------------------------");
    console.log("[WhatsApp API Simulator - Configure WHATSAPP_ACCESS_TOKEN in .env]");
    console.log("Recipient Phone:", recipientPhone);
    console.log("Template Name:", templateName || "N/A");
    console.log("Message Content:", message || "Template parameters provided");
    console.log("-----------------------------------------");

    return NextResponse.json({
      success: true,
      simulated: true,
      message: "WhatsApp API received message in simulation mode. Configure WHATSAPP_ACCESS_TOKEN in .env for live Meta sending.",
      to: recipientPhone,
    });
  } catch (error: any) {
    console.error("[WhatsApp Server Endpoint Error]:", error);
    return NextResponse.json(
      { error: "Failed to process WhatsApp request", details: error.message },
      { status: 500 }
    );
  }
}
