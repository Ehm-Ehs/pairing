interface WhatsAppNotificationData {
  phone?: string;
  to?: string;
  message: string;
  eventTitle?: string;
}

/**
 * Sends automated WhatsApp notification via WhatsApp API endpoint.
 * Replaces Resend email API to send direct WhatsApp messages to participants.
 */
export const sendWhatsAppNotification = async (data: WhatsAppNotificationData) => {
  const recipient = data.phone || data.to;
  if (!recipient) {
    console.warn("No phone number provided for WhatsApp notification");
    return { success: false, error: "Recipient phone number missing" };
  }

  try {
    const response = await fetch("/api/send-whatsapp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: recipient,
        phone: recipient,
        message: data.message,
        eventTitle: data.eventTitle,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("WhatsApp API Error:", result.error);
      return { success: false, error: result.error || "Failed to send WhatsApp message" };
    }

    console.log("WhatsApp message sent successfully:", result);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error sending WhatsApp notification:", error);
    return { success: false, error: error.message || "Unknown WhatsApp API error" };
  }
};

/**
 * Sends a Secret Santa pair assignment via WhatsApp API.
 */
export const sendSecretSantaWhatsAppAssignment = async (
  phone: string,
  santaName: string,
  receiverName: string,
  eventTitle: string
) => {
  const message = `🎅 *Secret Santa Assignment: ${eventTitle}*\n\nHi ${santaName}! Your Secret Santa pair has been drawn.\n\n🎁 *You are buying a gift for: ${receiverName}*\n\nKeep it a secret and have fun!`;
  return await sendWhatsAppNotification({ phone, message, eventTitle });
};

/**
 * Sends a Group/Role assignment notification via WhatsApp API.
 */
export const sendGroupAssignmentWhatsApp = async (
  phone: string,
  participantName: string,
  groupName: string,
  roleName: string,
  eventTitle: string
) => {
  const message = `👥 *Group Assignment: ${eventTitle}*\n\nHi ${participantName}!\n\nYou have been assigned to *${groupName}* as *${roleName}*.\n\nBest of luck with your team!`;
  return await sendWhatsAppNotification({ phone, message, eventTitle });
};
