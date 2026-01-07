import { getWelcomeEmail } from "./emailTemplates";

interface EmailData {
  to: string | string[];
  subject: string;
  html?: string;
  from?: string;
  templateParams?: Record<string, unknown>;
}

export const sendEmail = async (data: EmailData) => {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: data.to,
        subject: data.subject,
        html: data.html,
        from: data.from,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || "Failed to send email" };
    }

    console.log("Email sent successfully:", result.data);
    return { success: true, data: result.data };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  try {
    const emailContent = getWelcomeEmail(name);

    return await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      from: emailContent.from,
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return null;
  }
};
