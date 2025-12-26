interface EmailData {
  to: string | string[];
  subject: string;
  html?: string;
  templateParams?: Record<string, unknown>;
}

export const sendEmail = async (data: EmailData) => {
  console.log(
    "Email sending service (EmailJS) has been removed. Email would have been sent to:",
    data.to
  );
  console.log("Subject:", data.subject);
  console.log("Data:", data.templateParams);
  return "Email service removed";
};
