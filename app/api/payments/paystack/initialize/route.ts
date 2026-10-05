import { logger } from "@/utils/logger";
import { NextResponse } from "next/server";
import { TOKEN_PACKS } from "@/types/tokenTypes";
import { isAnonymous, requireUser } from "@/server/auth";
import { HttpError, appOrigin, readJson, route, str } from "@/server/http";
import { orgRole } from "@/server/events";
import { paystackSecret, simulationAllowed } from "@/server/paystack";

/**
 * Starts a Paystack checkout for the signed-in user. The account to credit comes
 * from the verified session (or an org the user belongs to), never from the request body.
 */
export const POST = route("payments/initialize", async (request) => {
  const user = await requireUser(request);
  if (isAnonymous(user) || !user.email) {
    throw new HttpError(403, "Please create an account before buying tokens.", "ACCOUNT_REQUIRED");
  }

  const body = await readJson<Record<string, unknown>>(request);
  const pack = TOKEN_PACKS.find((p) => p.id === body.packId);
  if (!pack) throw new HttpError(400, "Invalid token pack selected");

  let ownerType: "personal" | "org" = "personal";
  let ownerId = user.uid;
  if (body.accountType === "org") {
    const orgId = str(body.accountId, 200);
    if (!orgId || !(await orgRole(orgId, user.uid))) {
      throw new HttpError(403, "You are not a member of that organization.", "FORBIDDEN");
    }
    ownerType = "org";
    ownerId = orgId;
  }

  const callbackUrl = `${appOrigin(request)}/pricing?payment=success`;
  const secret = paystackSecret();

  if (!secret) {
    if (!simulationAllowed()) {
      throw new HttpError(503, "Payments are not available right now.", "PAYMENTS_NOT_CONFIGURED");
    }
    // Local development without a Paystack key: no money moves and no tokens are credited.
    return NextResponse.json({
      success: true,
      simulated: true,
      authorizationUrl: `${callbackUrl}&simulated=1`,
      reference: `sim_${Date.now()}`,
    });
  }

  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: user.email,
      amount: pack.priceNGN * 100, // kobo
      currency: "NGN",
      callback_url: callbackUrl,
      metadata: {
        uid: user.uid,
        ownerType,
        ownerId,
        packId: pack.id,
        custom_fields: [
          { display_name: "Token Pack", variable_name: "token_pack", value: pack.name },
          { display_name: "Tokens Granted", variable_name: "tokens_granted", value: pack.tokens },
        ],
      },
    }),
  });
  const data = await paystackRes.json();
  if (!paystackRes.ok || !data.status) {
    logger.error("[payments/initialize] Paystack error:", data?.message);
    throw new HttpError(502, data?.message || "Failed to initialize Paystack transaction");
  }

  return NextResponse.json({
    success: true,
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
  });
});
