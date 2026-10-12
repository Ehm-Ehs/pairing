import { NextResponse } from "next/server";
import { isAnonymous, requireUser } from "@/server/auth";
import { deleteAccount } from "@/server/deletion";
import { HttpError, route } from "@/server/http";
import { rateLimit } from "@/server/rateLimit";

/** Permanently deletes the signed-in user's account. Token and payment records are kept. */
export const POST = route("users/delete", async (request) => {
  const user = await requireUser(request);
  if (isAnonymous(user)) throw new HttpError(403, "There is no account to delete.", "FORBIDDEN");
  await rateLimit(`delete-account:${user.uid}`, 3, 3600);
  await deleteAccount(user.uid, user.email);
  return NextResponse.json({ success: true });
});
