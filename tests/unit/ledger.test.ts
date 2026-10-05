import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeFirestore } from "../helpers/fakeFirestore";

const holder = vi.hoisted(() => ({ db: null as any }));
vi.mock("../../src/services/firebaseAdmin", () => ({
  get adminDb() {
    return holder.db;
  },
  adminAuth: {},
}));

import { applyCharge, creditPurchase, ensureLedger, ensurePersonalGrant, planCharge } from "../../src/server/ledger";
import { HttpError } from "../../src/server/http";

const personal = { ownerType: "personal" as const, ownerId: "u1" };
const ledgerPath = "TokenLedgers/ledger_user_u1";

const charge = (amount: number, exempt = false) =>
  holder.db.runTransaction(async (tx: any) => {
    const plan = await planCharge(tx, personal, amount, { exempt });
    return applyCharge(tx, plan, amount, { type: "participant_join", eventId: "e1" });
  });

const entries = () => [...holder.db.store.keys()].filter((k: string) => k.startsWith("TokenLedgerEntries/"));

beforeEach(() => {
  holder.db = createFakeFirestore();
});

describe("free grant", () => {
  it("creates a personal ledger with 50 tokens, once", async () => {
    await ensureLedger(personal);
    await ensureLedger(personal);
    expect(holder.db.store.get(ledgerPath)).toMatchObject({ balance: 50, tier: "free", hasEverPaid: false });
    expect(entries()).toEqual(["TokenLedgerEntries/grant_ledger_user_u1"]);
  });

  it("gives 75 tokens to a creator's first org and 0 to later ones", async () => {
    holder.db.store.set("Organizations/o1", { createdBy: "u1" });
    await ensureLedger({ ownerType: "org", ownerId: "o1" });
    holder.db.store.set("Organizations/o2", { createdBy: "u1" });
    await ensureLedger({ ownerType: "org", ownerId: "o2" });
    expect(holder.db.store.get("TokenLedgers/ledger_org_o1").balance).toBe(75);
    expect(holder.db.store.get("TokenLedgers/ledger_org_o2").balance).toBe(0);
  });

  it("upgrades a guest ledger to the free grant exactly once", async () => {
    await ensureLedger(personal, { grant: false });
    expect(holder.db.store.get(ledgerPath).balance).toBe(0);
    await ensurePersonalGrant("u1");
    await ensurePersonalGrant("u1");
    expect(holder.db.store.get(ledgerPath).balance).toBe(50);
  });
});

describe("charging", () => {
  it("deducts the amount and records an entry", async () => {
    await ensureLedger(personal);
    const remaining = await charge(1);
    expect(remaining).toBe(49);
    expect(holder.db.store.get(ledgerPath).balance).toBe(49);
    expect(entries()).toHaveLength(2);
  });

  it("stops a free account at zero and charges nothing", async () => {
    holder.db.store.set(ledgerPath, { balance: 0, tier: "free", hasEverPaid: false });
    await expect(charge(1)).rejects.toMatchObject({ status: 402, code: "TOKEN_BALANCE_DEPLETED" });
    expect(holder.db.store.get(ledgerPath).balance).toBe(0);
    expect(entries()).toHaveLength(0);
  });

  it("lets a paid account go down to -20 but no further", async () => {
    holder.db.store.set(ledgerPath, { balance: -19, tier: "paid", hasEverPaid: true });
    await expect(charge(1)).resolves.toBe(-20);
    await expect(charge(1)).rejects.toBeInstanceOf(HttpError);
  });

  it("treats legacy tier names as paid", async () => {
    holder.db.store.set(ledgerPath, { balance: 0, tier: "pro" });
    await expect(charge(1)).resolves.toBe(-1);
  });

  it("does not charge exempt (super admin) accounts", async () => {
    holder.db.store.set(ledgerPath, { balance: 0, tier: "free" });
    await expect(charge(1, true)).resolves.toBe(0);
    expect(entries()).toHaveLength(0);
  });

  it("supports fractional charges", async () => {
    await ensureLedger(personal);
    await expect(charge(1.5)).resolves.toBe(48.5);
  });
});

describe("creditPurchase", () => {
  const purchase = { reference: "ref_123", owner: personal, tokens: 200, packId: "pack_200", amountKobo: 1800000 };

  it("credits tokens and marks the account as paid", async () => {
    const result = await creditPurchase(purchase);
    expect(result).toEqual({ alreadyProcessed: false, balance: 250 });
    expect(holder.db.store.get(ledgerPath)).toMatchObject({ balance: 250, tier: "paid", hasEverPaid: true });
    expect(holder.db.store.get("Payments/ref_123")).toMatchObject({ tokens: 200, ownerId: "u1" });
  });

  it("credits the same payment reference only once", async () => {
    await creditPurchase(purchase);
    const second = await creditPurchase(purchase);
    const third = await creditPurchase(purchase);
    expect(second.alreadyProcessed).toBe(true);
    expect(third.alreadyProcessed).toBe(true);
    expect(holder.db.store.get(ledgerPath).balance).toBe(250);
    expect(entries().filter((e: string) => e.includes("purchase_"))).toHaveLength(1);
  });

  it("rejects an empty reference or non-positive token count", async () => {
    await expect(creditPurchase({ ...purchase, reference: "" })).rejects.toBeInstanceOf(HttpError);
    await expect(creditPurchase({ ...purchase, tokens: 0 })).rejects.toBeInstanceOf(HttpError);
  });
});

describe("accounts that existed before ledgers", () => {
  it("keeps the balance, purchases and paid status stored on the profile", async () => {
    holder.db.store.set("Users/u1", { tokenBalance: 180, freeTokensGranted: 50, paidTokensPurchased: 200, hasEverPaid: true, tier: "pro" });
    await ensureLedger(personal);
    expect(holder.db.store.get(ledgerPath)).toMatchObject({ balance: 180, freeGrantAmount: 50, purchasedTokens: 200, hasEverPaid: true, tier: "paid" });
    expect(holder.db.store.get("TokenLedgerEntries/grant_ledger_user_u1")).toMatchObject({ type: "balance_carried_over", amount: 180 });
  });

  it("does not hand out a second free grant on top of a carried-over balance", async () => {
    holder.db.store.set("Users/u1", { tokenBalance: 12, freeTokensGranted: 50 });
    await ensurePersonalGrant("u1");
    await ensurePersonalGrant("u1");
    expect(holder.db.store.get(ledgerPath).balance).toBe(12);
  });

  it("gives the normal free grant to a profile with no stored balance", async () => {
    holder.db.store.set("Users/u1", { firstName: "Ada" });
    await ensurePersonalGrant("u1");
    expect(holder.db.store.get(ledgerPath).balance).toBe(50);
  });
});
