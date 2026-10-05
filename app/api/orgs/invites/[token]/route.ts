import { NextResponse } from "next/server";
import { HttpError, clientIp, route } from "@/server/http";
import { rateLimit } from "@/server/rateLimit";
import { findPendingInvite } from "@/server/orgs";

/** Lets the invite page show what an invitation is for, without exposing the invites collection. */
export const GET = route<{ params: Promise<{ token: string }> }>("orgs/invite", async (request, { params }) => {
  const { token } = await params;
  await rateLimit(`invite-view:${clientIp(request)}`, 30, 600);
  const invite = await findPendingInvite(token);
  if (!invite) {
    throw new HttpError(404, "This invitation token is invalid, expired, or has already been used.", "INVALID_INVITE");
  }
  const { orgId, orgName, email, role } = invite.data;
  return NextResponse.json({ invite: { orgId, orgName, email, role, token, status: "pending" } });
});
