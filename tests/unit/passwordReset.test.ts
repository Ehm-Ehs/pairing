import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeFirestore } from "../helpers/fakeFirestore";

const holder = vi.hoisted(() => ({ db: null as any, users: new Map<string, any>(), updated: [] as any[], revoked: [] as string[] }));
vi.mock("../../src/services/firebaseAdmin", () => ({
  get adminDb() {
    return holder.db;
  },
  adminAuth: {
    getUserByEmail: async (email: string) => {
      const user = holder.users.get(email);
      if (!user) throw Object.assign(new Error("not found"), { code: "auth/user-not-found" });
      return user;
    },
    updateUser: async (uid: string, change: object) => void holder.updated.push({ uid, ...change }),
    revokeRefreshTokens: async (uid: string) => void holder.revoked.push(uid),
  },
}));

import { createResetCode, resetPasswordWithCode, verifyResetCode } from "../../src/server/passwordReset";

const EMAIL = "ada@example.com";
const stored = () => [...holder.db.store.entries()].find(([k]: [string]) => k.startsWith("PasswordResets/"))?.[1];
const wrong = (code: string) => (code === "000000" ? "111111" : "000000");

beforeEach(() => {
  holder.db = createFakeFirestore();
  holder.users = new Map([[EMAIL, { uid: "u1", displayName: "Ada Lovelace" }]]);
  holder.updated = [];
  holder.revoked = [];
});

describe("password reset codes", () => {
  it("creates a 6-digit code and stores only its hash", async () => {
    const result = await createResetCode("  Ada@Example.com ");
    expect(result?.code).toMatch(/^\d{6}$/);
    expect(result?.name).toBe("Ada");
    expect(JSON.stringify(stored())).not.toContain(result!.code);
  });

  it("creates nothing for an email with no account", async () => {
    expect(await createResetCode("nobody@example.com")).toBeNull();
    expect(stored()).toBeUndefined();
  });

  it("accepts the right code and rejects a wrong one", async () => {
    const { code } = (await createResetCode(EMAIL))!;
    await expect(verifyResetCode(EMAIL, wrong(code))).rejects.toMatchObject({ code: "INVALID_CODE" });
    await expect(verifyResetCode(EMAIL, code)).resolves.toBeUndefined();
  });

  it("cancels the code after too many wrong guesses, even for the right code", async () => {
    const { code } = (await createResetCode(EMAIL))!;
    for (let i = 0; i < 5; i++) await verifyResetCode(EMAIL, wrong(code)).catch(() => {});
    await expect(verifyResetCode(EMAIL, code)).rejects.toMatchObject({ code: "CODE_LOCKED" });
  });

  it("rejects an expired code", async () => {
    const { code } = (await createResetCode(EMAIL))!;
    stored().expiresAt = Date.now() - 1;
    await expect(verifyResetCode(EMAIL, code)).rejects.toMatchObject({ code: "INVALID_CODE" });
  });

  it("sets the password once, signs out other sessions and uses the code up", async () => {
    const { code } = (await createResetCode(EMAIL))!;
    await resetPasswordWithCode(EMAIL, code, "new-password");
    expect(holder.updated).toEqual([{ uid: "u1", password: "new-password" }]);
    expect(holder.revoked).toEqual(["u1"]);
    await expect(resetPasswordWithCode(EMAIL, code, "again")).rejects.toMatchObject({ code: "INVALID_CODE" });
  });

  it("a new request replaces the earlier code", async () => {
    const first = (await createResetCode(EMAIL))!;
    let second = (await createResetCode(EMAIL))!;
    while (second.code === first.code) second = (await createResetCode(EMAIL))!;
    await expect(verifyResetCode(EMAIL, first.code)).rejects.toMatchObject({ code: "INVALID_CODE" });
  });
});
