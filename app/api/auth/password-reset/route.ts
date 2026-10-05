import { NextResponse } from "next/server";
import { HttpError, clientIp, readJson, route, str } from "@/server/http";
import { rateLimit } from "@/server/rateLimit";
import { sendEmail } from "@/server/messaging";
import { RESET_CODE_MINUTES, createResetCode, resetPasswordWithCode, verifyResetCode } from "@/server/passwordReset";
import { getPasswordResetCodeEmail } from "@/services/emailTemplates";
import { isEmail } from "@/utils/validation";

const MIN_PASSWORD = 6;
const MAX_PASSWORD = 128;

/**
 * Password reset in three steps, all through this route:
 *   { action: "request", email }                  sends a 6-digit code by email
 *   { action: "verify",  email, code }            checks the code
 *   { action: "confirm", email, code, password }  sets the new password
 */
export const POST = route("auth/password-reset", async (request) => {
  const body = await readJson(request);
  const action = str(body.action, 20);
  const email = str(body.email, 200).toLowerCase();
  const ip = clientIp(request);

  if (!isEmail(email)) throw new HttpError(400, "Please enter a valid email address.");

  if (action === "request") {
    if (!process.env.RESEND_API_KEY) {
      throw new HttpError(503, "Password reset is not available right now. Please try again later.", "EMAIL_NOT_CONFIGURED");
    }
    await rateLimit(`pw-reset-request:${ip}`, 10, 3600);
    await rateLimit(`pw-reset-request:${email}`, 5, 3600);

    const created = await createResetCode(email);
    if (!created) {
      throw new HttpError(
        404,
        "We couldn't find an account with that email. Check the spelling, or sign up for a new account.",
        "NO_ACCOUNT"
      );
    }

    const mail = getPasswordResetCodeEmail(created.code, created.name, RESET_CODE_MINUTES);
    const sent = await sendEmail({ to: email, ...mail });
    if (!sent.success) {
      throw new HttpError(502, "We couldn't send the code right now. Please try again in a moment.", "EMAIL_FAILED");
    }
    return NextResponse.json({ success: true });
  }

  const code = str(body.code, 12).replace(/\D/g, "");
  if (code.length !== 6) throw new HttpError(400, "Please enter all 6 digits of the code.");
  await rateLimit(`pw-reset-check:${ip}`, 40, 900);

  if (action === "verify") {
    await verifyResetCode(email, code);
    return NextResponse.json({ success: true });
  }

  if (action === "confirm") {
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < MIN_PASSWORD) {
      throw new HttpError(400, `Password must be at least ${MIN_PASSWORD} characters.`);
    }
    if (password.length > MAX_PASSWORD) throw new HttpError(400, "That password is too long.");
    await resetPasswordWithCode(email, code, password);
    return NextResponse.json({ success: true });
  }

  throw new HttpError(400, "Unknown action.");
});
