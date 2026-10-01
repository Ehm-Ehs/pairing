interface WhatsAppNotificationData {
  phone?: string;
  to?: string;
  message?: string;
  eventTitle?: string;
  templateName?: string;
  participantName?: string;
  eventName?: string;
  buttonParam?: string;
  components?: any[];
  languageCode?: string;
}

/**
 * Formats a phone number to full international format with digits only (no '+' or leading zeros).
 * e.g., "+234 801 234 5678" -> "2348012345678"
 */
export const formatWhatsAppPhone = (phone: string): string => {
  if (!phone) return "";
  let digits = phone.replace(/\D+/g, "");
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = "234" + digits.substring(1);
  } else if (digits.length === 10 && /^[789]/.test(digits)) {
    digits = "234" + digits;
  }
  return digits.replace(/^0+/, "");
};

/**
 * Task 3: Reusable function sendWhatsAppTemplate(to, templateName, params, languageCode)
 * Posts template message payloads to Meta WhatsApp Cloud API v20.0 backend endpoint.
 */
export const sendWhatsAppTemplate = async (
  to: string,
  templateName: string,
  params?: {
    participantName?: string;
    eventName?: string;
    buttonParam?: string;
    components?: any[];
  },
  languageCode = "en"
) => {
  const formattedPhone = formatWhatsAppPhone(to);
  if (!formattedPhone) {
    console.warn("[WhatsApp Service] Recipient phone number missing or invalid:", to);
    return { success: false, error: "Recipient phone number missing or invalid" };
  }

  try {
    const response = await fetch("/api/send-whatsapp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: formattedPhone,
        phone: formattedPhone,
        templateName,
        participantName: params?.participantName,
        eventName: params?.eventName,
        buttonParam: params?.buttonParam,
        components: params?.components,
        languageCode,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`[WhatsApp API Error - Template: ${templateName}]:`, result);
      return { success: false, error: result.metaError || result.error || "Failed to send WhatsApp template" };
    }

    console.log(`[WhatsApp Template Sent - ${templateName}]:`, result);
    return { success: true, data: result };
  } catch (error: any) {
    console.error(`[WhatsApp Service Error - Template: ${templateName}]:`, error);
    return { success: false, error: error.message || "Unknown WhatsApp API error" };
  }
};

/**
 * Task 4 Trigger 1: Send 'pairform_invite' WhatsApp Template
 * Fired when a participant is added or invited to join an event/group.
 */
export const sendJoinInviteWhatsApp = async ({
  phone,
  participantName,
  eventName,
  inviteUrl,
}: {
  phone: string;
  participantName: string;
  eventName: string;
  inviteUrl?: string;
}) => {
  return await sendWhatsAppTemplate(phone, "pairform_invite", {
    participantName: participantName || "Participant",
    eventName: eventName || "PairForm Event",
    buttonParam: inviteUrl,
  });
};

/**
 * Task 4 Trigger 2: Send 'pairform_result_ready' WhatsApp Template
 * Fired when group balancing finalizes / placement is locked / Secret Santa drawn.
 */
export const sendResultReadyWhatsApp = async ({
  phone,
  participantName,
  eventName,
  resultUrl,
}: {
  phone: string;
  participantName: string;
  eventName: string;
  resultUrl?: string;
}) => {
  return await sendWhatsAppTemplate(phone, "pairform_result_ready", {
    participantName: participantName || "Participant",
    eventName: eventName || "PairForm Event",
    buttonParam: resultUrl,
  });
};

/**
 * Sends automated WhatsApp notification (text or template) via /api/send-whatsapp.
 */
export const sendWhatsAppNotification = async (data: WhatsAppNotificationData) => {
  const recipient = data.phone || data.to || "";
  const formattedPhone = formatWhatsAppPhone(recipient);
  if (!formattedPhone) {
    console.warn("No valid phone number provided for WhatsApp notification");
    return { success: false, error: "Recipient phone number missing" };
  }

  if (data.templateName) {
    return await sendWhatsAppTemplate(
      formattedPhone,
      data.templateName,
      {
        participantName: data.participantName,
        eventName: data.eventName || data.eventTitle,
        buttonParam: data.buttonParam,
        components: data.components,
      },
      data.languageCode || "en"
    );
  }

  try {
    const response = await fetch("/api/send-whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: formattedPhone,
        phone: formattedPhone,
        message: data.message,
        eventTitle: data.eventTitle,
      }),
    });

    const result = await response.json();
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

export const sendRoundNotificationWhatsApp = async ({
  phone,
  participantName,
  eventName,
  roundNumber,
  tableNumber,
  partnerNames,
  groupUrl,
}: {
  phone: string;
  participantName: string;
  eventName: string;
  roundNumber: number | string;
  tableNumber: number | string;
  partnerNames: string;
  groupUrl: string;
}) => {
  return await sendWhatsAppTemplate(phone, "pairform_round_assignment", {
    participantName: participantName || "Participant",
    eventName: eventName || "PairForm Event",
    buttonParam: groupUrl,
  });
};
