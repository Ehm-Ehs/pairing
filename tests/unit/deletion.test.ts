import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeFirestore } from "../helpers/fakeFirestore";

const holder = vi.hoisted(() => ({ db: null as any, deletedAuthUsers: [] as string[] }));
vi.mock("../../src/services/firebaseAdmin", () => ({
  get adminDb() {
    return holder.db;
  },
  adminAuth: {
    deleteUser: async (uid: string) => void holder.deletedAuthUsers.push(uid),
  },
}));

import { deleteAccount, leaveOrganization, purgeOrganization, scheduleOrgDeletion } from "../../src/server/deletion";
import { lastActivity, purgeDueOrganizations, purgeInactiveEvents, retentionCutoff } from "../../src/server/retention";
import { addWorkingDays } from "../../src/utils/workingDays";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-10-12T10:00:00Z").getTime(); // a Monday
const has = (path: string) => holder.db.store.has(path);
const get = (path: string) => holder.db.store.get(path);

const member = (orgId: string, userId: string, role: string, joinedAt: number) => ({
  [`OrgMembers/${orgId}_${userId}`]: { id: `${orgId}_${userId}`, orgId, userId, role, joinedAt },
});

beforeEach(() => {
  holder.deletedAuthUsers = [];
  holder.db = createFakeFirestore();
});

describe("addWorkingDays", () => {
  it("skips weekends", () => {
    expect(addWorkingDays(NOW, 1).getDay()).toBe(2); // Tuesday
    expect(addWorkingDays(NOW, 5).getTime() - NOW).toBe(7 * DAY); // next Monday
    expect(addWorkingDays(NOW, 21).getTime() - NOW).toBe(29 * DAY);
  });

  it("starts counting from Monday when asked on a Saturday", () => {
    const saturday = new Date("2026-10-10T10:00:00Z").getTime();
    expect(addWorkingDays(saturday, 1).getDay()).toBe(1);
  });
});

describe("deleteAccount", () => {
  beforeEach(() => {
    holder.db = createFakeFirestore({
      "Users/u1": { email: "a@x.com" },
      "Users/u2": { email: "b@x.com" },
      "Pairings/mine": { id: "mine", ownerType: "personal", ownerId: "u1", createdBy: "u1" },
      "Pairings/theirs": { id: "theirs", ownerType: "personal", ownerId: "u2", createdBy: "u2" },
      "Pairings/orgEvent": { id: "orgEvent", ownerType: "org", ownerId: "o1", createdBy: "u1" },
      "Notifications/n1": { userId: "u1" },
      "Notifications/n2": { userId: "u2" },
      "push_subscriptions/p1": { userId: "u1" },
      "OrgInvites/i1": { orgId: "o9", email: "a@x.com", status: "pending" },
      "Organizations/o1": { name: "Acme", status: "active", createdBy: "u1" },
      ...member("o1", "u1", "admin", 1),
      ...member("o1", "u2", "member", 2),
      "TokenLedgers/ledger_user_u1": { balance: 12 },
      "TokenLedgerEntries/e1": { accountId: "u1", amount: 50 },
      "Payments/ref1": { accountId: "u1" },
    });
  });

  it("deletes the profile, personal events, notifications and sign-in", async () => {
    await deleteAccount("u1", "A@x.com");
    for (const path of ["Users/u1", "Pairings/mine", "Notifications/n1", "push_subscriptions/p1", "OrgInvites/i1"]) {
      expect(has(path), path).toBe(false);
    }
    expect(holder.deletedAuthUsers).toEqual(["u1"]);
  });

  it("keeps token and payment records", async () => {
    await deleteAccount("u1", "a@x.com");
    expect(get("TokenLedgers/ledger_user_u1")).toEqual({ balance: 12 });
    expect(has("TokenLedgerEntries/e1")).toBe(true);
    expect(has("Payments/ref1")).toBe(true);
  });

  it("leaves other people's data alone", async () => {
    await deleteAccount("u1", "a@x.com");
    expect(has("Users/u2")).toBe(true);
    expect(has("Pairings/theirs")).toBe(true);
    expect(has("Notifications/n2")).toBe(true);
  });

  it("hands organization events and the organization to the next admin", async () => {
    await deleteAccount("u1", "a@x.com");
    expect(has("OrgMembers/o1_u1")).toBe(false);
    expect(get("OrgMembers/o1_u2").role).toBe("admin");
    expect(get("Organizations/o1")).toMatchObject({ status: "active", createdBy: "u2" });
    expect(get("Pairings/orgEvent")).toMatchObject({ ownerId: "o1", createdBy: "u2" });
  });

  it("schedules an organization for deletion when its only member deletes their account", async () => {
    holder.db.store.delete("OrgMembers/o1_u2");
    await deleteAccount("u1", "a@x.com");
    const org = get("Organizations/o1");
    expect(org.status).toBe("archived");
    expect(org.deletionScheduledFor).toBeGreaterThan(Date.now() + 28 * DAY);
    expect(has("Pairings/orgEvent")).toBe(true); // removed later, by the cleanup
  });
});

describe("leaveOrganization", () => {
  it("does not hand events over when a member simply leaves", async () => {
    holder.db = createFakeFirestore({
      "Organizations/o1": { name: "Acme", status: "active", createdBy: "u9" },
      "Pairings/e1": { id: "e1", ownerType: "org", ownerId: "o1", createdBy: "u1" },
      ...member("o1", "u1", "admin", 1),
      ...member("o1", "u2", "member", 2),
    });
    await leaveOrganization("o1", "u1");
    expect(get("OrgMembers/o1_u2").role).toBe("admin");
    expect(get("Pairings/e1").createdBy).toBe("u1");
  });
});

describe("organization deletion", () => {
  beforeEach(() => {
    holder.db = createFakeFirestore({
      "Organizations/o1": { name: "Acme", status: "active", createdBy: "u1" },
      "Organizations/o2": { name: "Other", status: "active", createdBy: "u2" },
      "Pairings/a": { id: "a", ownerType: "org", ownerId: "o1" },
      "Pairings/b": { id: "b", ownerType: "org", ownerId: "o2" },
      "OrgInvites/i1": { orgId: "o1" },
      ...member("o1", "u1", "admin", 1),
      "TokenLedgers/ledger_org_o1": { balance: 75 },
    });
  });

  it("waits 21 working days and removes nothing until then", async () => {
    const when = await scheduleOrgDeletion("o1", "u1", NOW);
    expect(when).toBe(addWorkingDays(NOW, 21).getTime());
    expect(await purgeDueOrganizations(when - 1)).toBe(0);
    expect(has("Organizations/o1")).toBe(true);
    expect(has("Pairings/a")).toBe(true);
  });

  it("purges the organization once the date has passed, keeping its token ledger", async () => {
    const when = await scheduleOrgDeletion("o1", "u1", NOW);
    expect(await purgeDueOrganizations(when)).toBe(1);
    for (const path of ["Organizations/o1", "Pairings/a", "OrgInvites/i1", "OrgMembers/o1_u1"]) {
      expect(has(path), path).toBe(false);
    }
    expect(has("TokenLedgers/ledger_org_o1")).toBe(true);
    expect(has("Organizations/o2")).toBe(true);
    expect(has("Pairings/b")).toBe(true);
  });

  it("a dry run reports without deleting", async () => {
    const when = await scheduleOrgDeletion("o1", "u1", NOW);
    expect(await purgeDueOrganizations(when, true)).toBe(1);
    expect(has("Organizations/o1")).toBe(true);
  });

  it("purgeOrganization never touches another organization", async () => {
    await purgeOrganization("o1");
    expect(has("Pairings/b")).toBe(true);
  });
});

describe("24-month event cleanup", () => {
  const cutoff = retentionCutoff(NOW);
  const old = cutoff - 30 * DAY;

  beforeEach(() => {
    holder.db = createFakeFirestore({
      "Pairings/dormant": { id: "dormant", type: "secret-santa", createdAt: old, participants: [{ id: "p", joinedAt: old + DAY }] },
      "Pairings/joinedRecently": { id: "joinedRecently", type: "secret-santa", createdAt: old, participants: [{ id: "p", joinedAt: NOW - DAY }] },
      "Pairings/editedRecently": { id: "editedRecently", type: "random-positioning", createdAt: old, lastActivityAt: NOW - DAY },
      "Pairings/groupJoinedRecently": {
        id: "groupJoinedRecently",
        type: "role-based",
        createdAt: old,
        groups: { A: [{ id: "s", name: "Ada", joinedAt: NOW - DAY }] },
      },
      "Pairings/recent": { id: "recent", type: "secret-santa", createdAt: NOW - 30 * DAY, participants: [] },
      "Pairings/noDate": { id: "noDate", type: "secret-santa", participants: [] },
    });
  });

  it("the cutoff is 24 months back", () => {
    expect(new Date(cutoff).toISOString()).toBe("2024-10-12T10:00:00.000Z");
  });

  it("reads the latest of creation, edits and joins as last activity", () => {
    expect(lastActivity(get("Pairings/dormant"))).toBe(old + DAY);
    expect(lastActivity(get("Pairings/groupJoinedRecently"))).toBe(NOW - DAY);
  });

  it("deletes only events with no activity for 24 months", async () => {
    expect(await purgeInactiveEvents(NOW)).toBe(1);
    expect(has("Pairings/dormant")).toBe(false);
    for (const id of ["joinedRecently", "editedRecently", "groupJoinedRecently", "recent", "noDate"]) {
      expect(has(`Pairings/${id}`), id).toBe(true);
    }
  });

  it("a dry run reports without deleting", async () => {
    expect(await purgeInactiveEvents(NOW, true)).toBe(1);
    expect(has("Pairings/dormant")).toBe(true);
  });
});
