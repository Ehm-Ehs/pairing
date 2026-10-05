import { TOKEN_PACKS } from "../types/tokenTypes";
import { HttpError } from "./http";
import { LedgerOwner, creditPurchase } from "./ledger";

/* eslint-disable @typescript-eslint/no-explicit-any -- Paystack payloads are external JSON */

export function paystackSecret(): string | null {
  return process.env.PAYSTACK_SECRET_KEY || null;
}

/** Simulated checkout is only ever available outside production builds. */
export function simulationAllowed(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function ownerFromMetadata(metadata: any): LedgerOwner | null {
  if (!metadata) return null;
  if (metadata.ownerId && (metadata.ownerType === "org" || metadata.ownerType === "personal")) {
    return { ownerType: metadata.ownerType, ownerId: String(metadata.ownerId) };
  }
  // Checkouts started before this change used accountId / accountType.
  if (metadata.accountId) {
    return { ownerType: metadata.accountType === "org" ? "org" : "personal", ownerId: String(metadata.accountId) };
  }
  return null;
}

/**
 * Credits a successful Paystack transaction. Used by both the webhook and the
 * verify route; the transaction reference makes it safe to call from both.
 *
 * The number of tokens comes from our own pack table and the amount Paystack says
 * was actually paid, never from numbers supplied by the browser.
 */
export async function settleTransaction(data: any) {
  if (!data || data.status !== "success") {
    throw new HttpError(400, "Transaction was not successful.", "NOT_SUCCESSFUL");
  }
  const metadata = typeof data.metadata === "object" && data.metadata ? data.metadata : {};
  const pack = TOKEN_PACKS.find((p) => p.id === metadata.packId);
  const owner = ownerFromMetadata(metadata);
  if (!pack || !owner) {
    throw new HttpError(400, "Transaction is missing purchase details.", "BAD_METADATA");
  }
  if (data.currency && data.currency !== "NGN") {
    throw new HttpError(400, "Unexpected payment currency.", "BAD_CURRENCY");
  }
  const amountKobo = Number(data.amount);
  if (!Number.isFinite(amountKobo) || amountKobo < pack.priceNGN * 100) {
    throw new HttpError(400, "Amount paid does not match the token pack price.", "AMOUNT_MISMATCH");
  }

  const result = await creditPurchase({
    reference: String(data.reference),
    owner,
    tokens: pack.tokens,
    packId: pack.id,
    paidBy: metadata.uid ? String(metadata.uid) : undefined,
    amountKobo,
  });
  return { ...result, tokens: pack.tokens, owner };
}
