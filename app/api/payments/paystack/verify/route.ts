import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { HttpError, route, str } from "@/server/http";
import { orgRole } from "@/server/events";
import { ownerFromMetadata, paystackSecret, settleTransaction, simulationAllowed } from "@/server/paystack";

/**
 * Called when the buyer returns from Paystack. Confirms the transaction with Paystack
 * and credits it. Crediting is idempotent, so this and the webhook can both run.
 */
export const GET = route("payments/verify", async (request) => {
  const user = await requireUser(request);
  const reference = str(new URL(request.url).searchParams.get("reference"), 200);
  if (!reference) throw new HttpError(400, "Missing reference");

  const secret = paystackSecret();
  if (!secret) {
    if (!simulationAllowed()) {
      throw new HttpError(503, "Payments are not available right now.", "PAYMENTS_NOT_CONFIGURED");
    }
    return NextResponse.json({ success: false, simulated: true, message: "Simulation mode: no tokens credited." });
  }

  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const payload = await verifyRes.json();
  if (!verifyRes.ok || !payload.status || payload.data?.status !== "success") {
    throw new HttpError(400, payload?.message || "Transaction verification failed", "NOT_SUCCESSFUL");
  }

  // Only the buyer, or a member of the org that was paid for, may trigger crediting.
  const metadata = payload.data.metadata || {};
  const owner = ownerFromMetadata(metadata);
  const isBuyer = metadata.uid === user.uid || (owner?.ownerType === "personal" && owner.ownerId === user.uid);
  const isOrgMember = owner?.ownerType === "org" && !!(await orgRole(owner.ownerId, user.uid));
  if (!isBuyer && !isOrgMember) {
    throw new HttpError(403, "This payment belongs to a different account.", "FORBIDDEN");
  }

  const result = await settleTransaction(payload.data);
  return NextResponse.json({
    success: true,
    tokens: result.tokens,
    balance: result.balance,
    alreadyProcessed: result.alreadyProcessed,
  });
});
