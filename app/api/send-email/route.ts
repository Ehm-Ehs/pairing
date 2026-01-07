import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { to, subject, html, from } = await request.json();
    console.log("Attempting to send email to:", to);
    console.log(
      "Using API Key starting with:",
      process.env.NEXT_PUBLIC_RESEND_API_KEY?.substring(0, 5)
    );
    console.log("From:", from);

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const data = await resend.emails.send({
      from: from,
      to: to,
      subject: subject,
      html: html,
    });

    if (data.error) {
      console.error("Resend API returned error:", data.error);
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    console.log("Resend API success:", data);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Server error processing email:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: error.message },
      { status: 500 }
    );
  }
}
