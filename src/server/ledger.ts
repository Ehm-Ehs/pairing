import { FieldValue, Transaction, DocumentReference } from "firebase-admin/firestore";
import { adminDb } from "../services/firebaseAdmin";
import { HttpError } from "./http";
import type { LedgerEntryType } from "../types/tokenTypes";
import { FREE_GRANT, canSpendFrom, isPaidLedger } from "../utils/tokens";

/**
 * The single place where token balances change.
 *
 * The balance lives only on TokenLedgers/{ledger_user_<uid> | ledger_org_<orgId>}.
 * Every change is written together with a TokenLedgerEntries record in one transaction.
 */

export type LedgerOwner = { ownerType: "personal" | "org"; ownerId: string };

function ledgerDocId(owner: LedgerOwner): string {
  return owner.ownerType === "personal" ? `ledger_user_${owner.ownerId}` : `ledger_org_${owner.ownerId}`;
}

function ledgerRef(owner: LedgerOwner): DocumentReference {
  return adminDb.collection("TokenLedgers").doc(ledgerDocId(owner));
}

function entryAccountType(owner: LedgerOwner): "user" | "org" {
  return owner.ownerType === "org" ? "org" : "user";
}

async function isSuperAdmin(uid: string): Promise<boolean> {
  const snap = await adminDb.collection("Users").doc(uid).get();
  const data = snap.data();
  return !!data && (data.role === "super_admin" || data.isSuperAdmin === true);
}

/**
 * Creates the ledger if it does not exist yet. Safe to call repeatedly.
 *
 * - An account that already had a balance before ledgers existed (stored on its profile or
 *   organization record) keeps that balance, its purchases and its paid status.
 * - Otherwise a new personal ledger gets 50 free tokens, and an org ledger gets 75 only for
 *   the first organization its creator made.
 */
export async function ensureLedger(owner: LedgerOwner, opts: { grant?: boolean } = {}): Promise<void> {
  const ref = ledgerRef(owner);
  if ((await ref.get()).exists) return;

  const accountSnap = await adminDb
    .collection(owner.ownerType === "personal" ? "Users" : "Organizations")
    .doc(owner.ownerId)
    .get();
  const account = accountSnap.data() || {};
  const carriedOver = typeof account.tokenBalance === "number";

  let grant = 0;
  if (!carriedOver && opts.grant !== false) {
    if (owner.ownerType === "personal") {
      grant = FREE_GRANT.personal;
    } else if (account.createdBy) {
      const created = await adminDb.collection("Organizations").where("createdBy", "==", account.createdBy).get();
      grant = created.size <= 1 ? FREE_GRANT.org : 0;
    }
  }

  const paid = carriedOver && isPaidLedger(account);
  const now = Date.now();
  const batch = adminDb.batch();
  batch.create(ref, {
    id: ref.id,
    ownerType: owner.ownerType,
    ownerId: owner.ownerId,
    balance: carriedOver ? account.tokenBalance : grant,
    freeGrantAmount: carriedOver
      ? typeof account.freeTokensGranted === "number"
        ? account.freeTokensGranted
        : FREE_GRANT[owner.ownerType]
      : grant,
    freeGrantUsed: true,
    purchasedTokens: carriedOver && typeof account.paidTokensPurchased === "number" ? account.paidTokensPurchased : 0,
    hasEverPaid: paid,
    tier: paid ? "paid" : "free",
    createdAt: now,
    updatedAt: now,
  });

  const amount = carriedOver ? account.tokenBalance : grant;
  if (carriedOver || grant > 0) {
    const entryRef = adminDb.collection("TokenLedgerEntries").doc(`grant_${ref.id}`);
    batch.set(entryRef, {
      id: entryRef.id,
      accountId: owner.ownerId,
      accountType: entryAccountType(owner),
      type: carriedOver ? "balance_carried_over" : "free_grant",
      amount,
      createdAt: now,
    });
  }
  try {
    await batch.commit();
  } catch (err) {
    // Another request created it first; that is fine.
    if ((err as { code?: number }).code !== 6) throw err;
  }
}

export interface ChargePlan {
  owner: LedgerOwner;
  ref: DocumentReference;
  balance: number;
  exempt: boolean;
}

/**
 * Transaction read step: loads the ledger and checks the charge is allowed.
 * Call before any writes in the transaction, then pass the result to applyCharge.
 */
export async function planCharge(
  tx: Transaction,
  owner: LedgerOwner,
  amount: number,
  opts: { exempt?: boolean } = {}
): Promise<ChargePlan> {
  const ref = ledgerRef(owner);
  const snap = await tx.get(ref);
  if (!snap.exists) {
    throw new HttpError(409, "Token ledger is not ready. Please try again.", "LEDGER_MISSING");
  }
  const data = snap.data()!;
  const balance = typeof data.balance === "number" ? data.balance : 0;
  const exempt = opts.exempt === true;

  if (!exempt) {
    if (!canSpendFrom({ ...data, balance }, amount)) {
      throw new HttpError(402, "Token balance is too low for this action.", "TOKEN_BALANCE_DEPLETED", {
        isDepleted: true,
        requiredTokens: amount,
      });
    }
  }
  return { owner, ref, balance, exempt };
}

/** Transaction write step. Returns the remaining balance. */
export function applyCharge(
  tx: Transaction,
  plan: ChargePlan,
  amount: number,
  entry: { type: LedgerEntryType } & Record<string, unknown>
): number {
  if (plan.exempt || amount === 0) return plan.balance;
  const now = Date.now();
  tx.update(plan.ref, { balance: FieldValue.increment(-amount), updatedAt: now });
  const entryRef = adminDb.collection("TokenLedgerEntries").doc();
  tx.set(entryRef, {
    ...entry,
    id: entryRef.id,
    accountId: plan.owner.ownerId,
    accountType: entryAccountType(plan.owner),
    amount: -amount,
    createdAt: now,
  });
  return plan.balance - amount;
}

/**
 * Credits a completed purchase exactly once. The payment reference is the idempotency key:
 * a second call with the same reference changes nothing and reports alreadyProcessed.
 */
export async function creditPurchase(input: {
  reference: string;
  owner: LedgerOwner;
  tokens: number;
  packId: string;
  paidBy?: string;
  amountKobo: number;
}): Promise<{ alreadyProcessed: boolean; balance: number }> {
  const { reference, owner, tokens, packId } = input;
  if (!reference || tokens <= 0) throw new HttpError(400, "Invalid purchase.");

  await ensureLedger(owner);
  const ref = ledgerRef(owner);
  const paymentRef = adminDb.collection("Payments").doc(reference.replace(/\//g, "_"));

  return adminDb.runTransaction(async (tx) => {
    const [paymentSnap, ledgerSnap] = await Promise.all([tx.get(paymentRef), tx.get(ref)]);
    const balance = (ledgerSnap.data()?.balance as number) || 0;
    if (paymentSnap.exists) return { alreadyProcessed: true, balance };

    const now = Date.now();
    tx.create(paymentRef, {
      reference,
      provider: "paystack",
      ownerType: owner.ownerType,
      ownerId: owner.ownerId,
      packId,
      tokens,
      amountKobo: input.amountKobo,
      paidBy: input.paidBy || null,
      createdAt: now,
    });
    tx.update(ref, {
      balance: FieldValue.increment(tokens),
      purchasedTokens: FieldValue.increment(tokens),
      hasEverPaid: true,
      tier: "paid",
      updatedAt: now,
    });
    const entryRef = adminDb.collection("TokenLedgerEntries").doc(`purchase_${paymentRef.id}`);
    tx.set(entryRef, {
      id: entryRef.id,
      accountId: owner.ownerId,
      accountType: entryAccountType(owner),
      type: "pack_purchase",
      amount: tokens,
      packName: packId,
      reference,
      createdAt: now,
    });
    return { alreadyProcessed: false, balance: balance + tokens };
  });
}

/**
 * Makes sure a registered user has received the personal free grant exactly once.
 * Covers guests whose ledger was created without a grant before they signed up.
 */
export async function ensurePersonalGrant(uid: string): Promise<void> {
  const owner: LedgerOwner = { ownerType: "personal", ownerId: uid };
  await ensureLedger(owner);
  const ref = ledgerRef(owner);
  const entryRef = adminDb.collection("TokenLedgerEntries").doc(`grant_${ref.id}`);
  await adminDb.runTransaction(async (tx) => {
    const [ledger, entry] = await Promise.all([tx.get(ref), tx.get(entryRef)]);
    const data = ledger.data();
    if (!data || entry.exists || (data.freeGrantAmount || 0) > 0) return;
    const now = Date.now();
    tx.update(ref, {
      balance: FieldValue.increment(FREE_GRANT.personal),
      freeGrantAmount: FREE_GRANT.personal,
      updatedAt: now,
    });
    tx.set(entryRef, {
      id: entryRef.id,
      accountId: uid,
      accountType: "user",
      type: "free_grant",
      amount: FREE_GRANT.personal,
      createdAt: now,
    });
  });
}

/**
 * Gets an owner's ledger ready to be charged: makes sure it exists and works out
 * whether the owner is exempt from charges (super admins are).
 */
export async function prepareCharge(owner: LedgerOwner): Promise<{ exempt: boolean }> {
  await ensureLedger(owner);
  return { exempt: owner.ownerType === "personal" && (await isSuperAdmin(owner.ownerId)) };
}
