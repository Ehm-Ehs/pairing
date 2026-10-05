import { describe, it, expect, vi, beforeEach } from "vitest";

const creditPurchase = vi.hoisted(() => vi.fn());
vi.mock("../../src/server/ledger", () => ({ creditPurchase }));

import { settleTransaction, ownerFromMetadata } from "../../src/server/paystack";
import { TOKEN_PACKS } from "../../src/types/tokenTypes";

const pack = TOKEN_PACKS[1];
const ok = () => ({
  status: "success",
  reference: "ref_1",
  currency: "NGN",
  amount: pack.priceNGN * 100,
  metadata: { uid: "u1", ownerType: "personal", ownerId: "u1", packId: pack.id, tokens: 999999 },
});

beforeEach(() => {
  creditPurchase.mockReset();
  creditPurchase.mockResolvedValue({ alreadyProcessed: false, balance: 250 });
});

describe("settleTransaction", () => {
  it("credits the pack's token count, ignoring any token number in the metadata", async () => {
    const result = await settleTransaction(ok());
    expect(result.tokens).toBe(pack.tokens);
    expect(creditPurchase).toHaveBeenCalledWith(
      expect.objectContaining({ reference: "ref_1", tokens: pack.tokens, packId: pack.id, owner: { ownerType: "personal", ownerId: "u1" } })
    );
  });

  it("rejects a transaction that did not succeed", async () => {
    await expect(settleTransaction({ ...ok(), status: "failed" })).rejects.toMatchObject({ code: "NOT_SUCCESSFUL" });
    expect(creditPurchase).not.toHaveBeenCalled();
  });

  it("rejects an underpayment", async () => {
    await expect(settleTransaction({ ...ok(), amount: 100 })).rejects.toMatchObject({ code: "AMOUNT_MISMATCH" });
    expect(creditPurchase).not.toHaveBeenCalled();
  });

  it("rejects the wrong currency", async () => {
    await expect(settleTransaction({ ...ok(), currency: "USD" })).rejects.toMatchObject({ code: "BAD_CURRENCY" });
  });

  it("rejects an unknown pack or missing owner", async () => {
    await expect(settleTransaction({ ...ok(), metadata: { ...ok().metadata, packId: "pack_x" } })).rejects.toMatchObject({ code: "BAD_METADATA" });
    await expect(settleTransaction({ ...ok(), metadata: { packId: pack.id } })).rejects.toMatchObject({ code: "BAD_METADATA" });
  });
});

describe("ownerFromMetadata", () => {
  it("reads the current format and the older accountId format", () => {
    expect(ownerFromMetadata({ ownerType: "org", ownerId: "o1" })).toEqual({ ownerType: "org", ownerId: "o1" });
    expect(ownerFromMetadata({ accountId: "u9", accountType: "user" })).toEqual({ ownerType: "personal", ownerId: "u9" });
    expect(ownerFromMetadata({})).toBeNull();
  });
});
