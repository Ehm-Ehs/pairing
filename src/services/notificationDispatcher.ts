import { sendWhatsAppNotification } from "./whatsappService";

interface NotificationPayload {
  recipient: {
    name: string;
    email?: string;
    phone?: string;
  };
  eventTitle: string;
  subject: string;
  textMessage: string;
  htmlMessage?: string;
  channel?: "email" | "whatsapp" | "both";
}

/**
 * Dispatcher function supporting dual notifications via Email (Resend) and WhatsApp API.
 * The channel setting ("email" | "whatsapp" | "both") determines which providers are invoked.
 */
export const dispatchNotification = async (payload: NotificationPayload) => {
  const { recipient, eventTitle, subject, textMessage, htmlMessage, channel = "both" } = payload;
  const targetContact = recipient.phone || recipient.email || "";

  if (!targetContact) {
    console.warn("Recipient has no valid email or phone number");
    return;
  }

  // 1. Send via Resend Email API if channel is 'email' or 'both'
  if ((channel === "email" || channel === "both") && recipient.email) {
    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipient.email,
          subject: subject,
          html: htmlMessage || `<p>${textMessage.replace(/\n/g, "<br/>")}</p>`,
        }),
      });
    } catch (err) {
      console.error("Resend Email Dispatch Error:", err);
    }
  }

  // 2. Send via WhatsApp API if channel is 'whatsapp' or 'both'
  if (channel === "whatsapp" || channel === "both") {
    try {
      await sendWhatsAppNotification({
        phone: targetContact,
        message: textMessage,
        eventTitle: eventTitle,
      });
    } catch (err) {
      console.error("WhatsApp API Dispatch Error:", err);
    }
  }
};
