import emailjs from "@emailjs/browser";

interface EmailData {
  to: string | string[];
  subject: string;
  html?: string;
  templateParams?: Record<string, unknown>;
}

// Initialize EmailJS (call this once, e.g., in App.tsx, or lazy load)
// Ideally, this should be in an init function, but for simplicity:
// emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

export const sendEmail = async (data: EmailData) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn("EmailJS credentials missing. Email not sent.");
    return;
  }

  try {
    const templateParams = {
      to_email: Array.isArray(data.to) ? data.to.join(",") : data.to,
      subject: data.subject,
      ...data.templateParams,
    };

    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      publicKey
    );

    console.log(
      "SUCCESS: Email sent via EmailJS",
      response.status,
      response.text
    );
    return response.text;
  } catch (error) {
    console.error("FAILURE: EmailJS failed:", error);
    // Don't throw, just log, so user flow isn't broken?
    // Or throw if we want to show error toast. Let's throw.
    throw error;
  }
};
