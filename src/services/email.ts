import { sendWhatsAppNotification } from "./whatsappService";

interface NotificationData {
  to: string | string[];
  subject: string;
  html?: string;
  from?: string;
  message?: string;
}

/**
 * Sends notification via WhatsApp API (replacing Resend email service).
 */
export const sendEmail = async (data: NotificationData) => {
  try {
    const recipient = Array.isArray(data.to) ? data.to[0] : data.to;
    const msg = data.message || `*${data.subject}*\n\nYour PairForm event notification details.`;
    return await sendWhatsAppNotification({ phone: recipient, message: msg, eventTitle: data.subject });
  } catch (error: any) {
    console.error("Error sending WhatsApp notification:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  try {
    const msg = `👋 *Welcome to PairForm, ${name}!*\n\nYour account has been created successfully. Create and share pairing events easily!`;
    return await sendWhatsAppNotification({ phone: email, message: msg, eventTitle: "Welcome to PairForm" });
  } catch (error) {
    console.error("Error sending welcome notification:", error);
    return null;
  }
};
