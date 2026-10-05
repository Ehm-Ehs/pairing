import { errorMessage } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { Resend } from "resend";
import { formatWhatsAppPhone } from "../utils/phone";
import { EMAIL_SENDERS } from "../services/emailTemplates";

/**
 * Server-only message delivery. Nothing here is reachable from the browser:
 * routes decide who gets a message and build the content from templates.
 */

export type Channel = "email" | "whatsapp" | "both";

export interface SendResult {
  success: boolean;
  skipped?: boolean;
  error?: string;
}

const ALLOWED_SENDERS = new Set<string>(Object.values(EMAIL_SENDERS));
let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) resendClient = new Resend(apiKey);
  return resendClient;
}

export async function sendEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}): Promise<SendResult> {
  const resend = getResend();
  if (!resend) {
    logger.warn("[messaging] RESEND_API_KEY is not set; email not sent.");
    return { success: false, skipped: true, error: "Email is not configured." };
  }
  const from = input.from && ALLOWED_SENDERS.has(input.from) ? input.from : EMAIL_SENDERS.NOTIFY;
  try {
    const result = await resend.emails.send({ from, to: input.to, subject: input.subject, html: input.html });
    if (result.error) {
      logger.error("[messaging] Resend error:", result.error.message);
      return { success: false, error: result.error.message };
    }
    return { success: true };
  } catch (err) {
    logger.error("[messaging] Email send failed:", errorMessage(err));
    return { success: false, error: "Email send failed." };
  }
}

interface WhatsAppInput {
  phone: string;
  /** Free-form text. Used directly, or as the fallback if the template is rejected. */
  message?: string;
  templateName?: string;
  participantName?: string;
  eventName?: string;
  /** URL placed in the template button. */
  buttonParam?: string;
  languageCode?: string;
}

/** The part of a Meta Graph API response we read. */
interface MetaResponse {
  error?: { code?: number; message?: string };
}

async function postToMeta(payload: unknown): Promise<{ ok: boolean; status: number; data: MetaResponse }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
}

export async function sendWhatsApp(input: WhatsAppInput): Promise<SendResult> {
  const to = formatWhatsAppPhone(input.phone);
  if (!to) return { success: false, skipped: true, error: "Recipient phone number missing." };

  const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_API_TOKEN;
  if (!token || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    logger.warn("[messaging] WhatsApp is not configured; message not sent.");
    return { success: false, skipped: true, error: "WhatsApp is not configured." };
  }

  const base = { messaging_product: "whatsapp", recipient_type: "individual", to };
  const textPayload = (body: string) => ({ ...base, type: "text", text: { preview_url: true, body } });

  try {
    if (input.templateName) {
      const components: unknown[] = [
        {
          type: "body",
          parameters: [
            { type: "text", parameter_name: "participant_name", text: input.participantName || "Participant" },
            { type: "text", parameter_name: "event_name", text: input.eventName || "PairForm Event" },
          ],
        },
      ];
      if (input.buttonParam) {
        components.push({
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [{ type: "text", text: input.buttonParam }],
        });
      }
      const result = await postToMeta({
        ...base,
        type: "template",
        template: { name: input.templateName, language: { code: input.languageCode || "en" }, components },
      });
      if (result.ok) return { success: true };

      logger.warn(
        `[messaging] WhatsApp template '${input.templateName}' failed (${result.data?.error?.code}); trying text.`
      );
      const fallback =
        input.message ||
        `Hello ${input.participantName || "there"}! You have an update for ${input.eventName || "a PairForm event"}.${
          input.buttonParam ? ` ${input.buttonParam}` : ""
        }`;
      const textResult = await postToMeta(textPayload(fallback));
      if (textResult.ok) return { success: true };
      return { success: false, error: textResult.data?.error?.message || "WhatsApp send failed." };
    }

    if (!input.message) return { success: false, skipped: true, error: "Nothing to send." };
    const result = await postToMeta(textPayload(input.message));
    if (result.ok) return { success: true };
    return { success: false, error: result.data?.error?.message || "WhatsApp send failed." };
  } catch (err) {
    logger.error("[messaging] WhatsApp send failed:", errorMessage(err));
    return { success: false, error: "WhatsApp send failed." };
  }
}

/**
 * Delivers one notification over the channels the event is configured for.
 * Email goes out when the recipient has an email; WhatsApp when they have a phone number.
 */
export async function deliver(
  channel: Channel | undefined,
  recipient: { email?: string; phone?: string },
  content: {
    email?: { subject: string; html: string; from?: string };
    whatsapp?: Omit<WhatsAppInput, "phone">;
  }
): Promise<{ email?: SendResult; whatsapp?: SendResult }> {
  const mode = channel || "both";
  const out: { email?: SendResult; whatsapp?: SendResult } = {};
  const jobs: Promise<void>[] = [];

  if ((mode === "email" || mode === "both") && recipient.email && content.email) {
    jobs.push(
      sendEmail({ to: recipient.email, ...content.email }).then((r) => {
        out.email = r;
      })
    );
  }
  if ((mode === "whatsapp" || mode === "both") && recipient.phone && content.whatsapp) {
    jobs.push(
      sendWhatsApp({ phone: recipient.phone, ...content.whatsapp }).then((r) => {
        out.whatsapp = r;
      })
    );
  }
  await Promise.all(jobs);
  return out;
}
