import { readFileSync } from "fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

/**
 * Behavioural tests for firestore.rules, run against the Firestore emulator:
 *   npm run test:rules
 *
 * Each test proves that a specific kind of access is allowed or denied.
 */
let env: RulesTestEnvironment;

const alice = () => env.authenticatedContext("alice").firestore();
const bob = () => env.authenticatedContext("bob").firestore();
const mallory = () => env.authenticatedContext("mallory").firestore();
const anon = () => env.unauthenticatedContext().firestore();

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "pairform-rules-test",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  // Seed with rules disabled, the way the server (Admin SDK) writes.
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "Users/alice"), { email: "alice@example.com", firstName: "Alice" });
    await setDoc(doc(db, "Users/bob"), { email: "bob@example.com", firstName: "Bob" });

    // Org "acme": alice is the creator and admin, bob is a member.
    await setDoc(doc(db, "Organizations/acme"), { id: "acme", name: "Acme", createdBy: "alice", status: "active" });
    await setDoc(doc(db, "OrgMembers/acme_alice"), { id: "acme_alice", orgId: "acme", userId: "alice", role: "admin" });
    await setDoc(doc(db, "OrgMembers/acme_bob"), { id: "acme_bob", orgId: "acme", userId: "bob", role: "member" });
    await setDoc(doc(db, "OrgInvites/inv1"), { id: "inv1", orgId: "acme", token: "secret-token", status: "pending" });

    await setDoc(doc(db, "Pairings/personal1"), {
      id: "personal1", ownerType: "personal", ownerId: "alice", createdBy: "alice", status: "open", participants: [],
    });
    await setDoc(doc(db, "Pairings/org1"), {
      id: "org1", ownerType: "org", ownerId: "acme", createdBy: "bob", status: "open", participants: [],
    });
    await setDoc(doc(db, "Pairings/org2"), {
      id: "org2", ownerType: "org", ownerId: "acme", createdBy: "alice", status: "open", participants: [],
    });

    await setDoc(doc(db, "TokenLedgers/ledger_user_alice"), { ownerType: "personal", ownerId: "alice", balance: 50 });
    await setDoc(doc(db, "TokenLedgers/ledger_org_acme"), { ownerType: "org", ownerId: "acme", balance: 75 });
    await setDoc(doc(db, "TokenLedgerEntries/e1"), { accountId: "alice", accountType: "user", amount: 50 });
    await setDoc(doc(db, "Notifications/n1"), { userId: "alice", message: "hi", read: false });
    await setDoc(doc(db, "Payments/ref1"), { reference: "ref1", tokens: 50 });
    await setDoc(doc(db, "push_subscriptions/s1"), { endpoint: "https://push.example" });
  });
});

describe("Users", () => {
  it("lets a user read and edit their own profile", async () => {
    await assertSucceeds(getDoc(doc(alice(), "Users/alice")));
    await assertSucceeds(updateDoc(doc(alice(), "Users/alice"), { firstName: "Al", settings: { defaults: {} } }));
  });

  it("hides profiles from other users and from the public", async () => {
    await assertFails(getDoc(doc(bob(), "Users/alice")));
    await assertFails(getDoc(doc(anon(), "Users/alice")));
  });

  it("stops a user making themselves super admin or changing their balance", async () => {
    await assertFails(updateDoc(doc(alice(), "Users/alice"), { isSuperAdmin: true }));
    await assertFails(updateDoc(doc(alice(), "Users/alice"), { role: "super_admin" }));
    await assertFails(updateDoc(doc(alice(), "Users/alice"), { tokenBalance: 999999 }));
  });

  it("does not let the browser create profiles or edit someone else's", async () => {
    await assertFails(setDoc(doc(mallory(), "Users/mallory"), { isSuperAdmin: true }));
    await assertFails(updateDoc(doc(mallory(), "Users/alice"), { firstName: "Hacked" }));
    await assertFails(setDoc(doc(anon(), "Users/x"), { firstName: "x" }));
  });
});

describe("Token ledgers and payments", () => {
  it("lets the owner and org members read their ledger", async () => {
    await assertSucceeds(getDoc(doc(alice(), "TokenLedgers/ledger_user_alice")));
    await assertSucceeds(getDoc(doc(bob(), "TokenLedgers/ledger_org_acme")));
  });

  it("hides ledgers from everyone else", async () => {
    await assertFails(getDoc(doc(bob(), "TokenLedgers/ledger_user_alice")));
    await assertFails(getDoc(doc(mallory(), "TokenLedgers/ledger_org_acme")));
  });

  it("never lets the browser change a balance or write ledger entries", async () => {
    await assertFails(updateDoc(doc(alice(), "TokenLedgers/ledger_user_alice"), { balance: 100000 }));
    await assertFails(setDoc(doc(alice(), "TokenLedgers/ledger_user_alice"), { balance: 100000 }));
    await assertFails(setDoc(doc(alice(), "TokenLedgerEntries/fake"), { accountId: "alice", amount: 1000 }));
    await assertFails(deleteDoc(doc(alice(), "TokenLedgerEntries/e1")));
  });

  it("lets a user list only their own ledger entries", async () => {
    await assertSucceeds(getDocs(query(collection(alice(), "TokenLedgerEntries"), where("accountId", "==", "alice"))));
    await assertFails(getDocs(query(collection(mallory(), "TokenLedgerEntries"), where("accountId", "==", "alice"))));
  });

  it("keeps server-only collections closed", async () => {
    await assertFails(getDoc(doc(alice(), "Payments/ref1")));
    await assertFails(setDoc(doc(alice(), "Payments/ref2"), { tokens: 700 }));
    await assertFails(getDoc(doc(anon(), "push_subscriptions/s1")));
    await assertFails(setDoc(doc(alice(), "RateLimits/x"), { count: 0 }));
    await assertFails(setDoc(doc(anon(), "mail/x"), { to: "victim@example.com" }));
  });
});

describe("Organizations", () => {
  it("lets members read the org and its roster", async () => {
    await assertSucceeds(getDoc(doc(bob(), "Organizations/acme")));
    await assertSucceeds(getDocs(query(collection(bob(), "OrgMembers"), where("orgId", "==", "acme"))));
    await assertSucceeds(getDocs(query(collection(bob(), "OrgMembers"), where("userId", "==", "bob"))));
  });

  it("hides the org from non-members", async () => {
    await assertFails(getDoc(doc(mallory(), "Organizations/acme")));
    await assertFails(getDocs(query(collection(mallory(), "OrgMembers"), where("orgId", "==", "acme"))));
  });

  it("stops anyone adding themselves to an org or promoting themselves", async () => {
    await assertFails(setDoc(doc(mallory(), "OrgMembers/acme_mallory"), { orgId: "acme", userId: "mallory", role: "admin" }));
    await assertFails(updateDoc(doc(bob(), "OrgMembers/acme_bob"), { role: "admin" }));
    await assertFails(updateDoc(doc(alice(), "Organizations/acme"), { name: "Renamed in browser" }));
  });

  it("only shows invites to org admins", async () => {
    const pending = (db: ReturnType<typeof alice>) =>
      getDocs(query(collection(db, "OrgInvites"), where("orgId", "==", "acme"), where("status", "==", "pending")));
    await assertSucceeds(pending(alice()));
    await assertFails(pending(bob()));
    await assertFails(getDocs(query(collection(anon(), "OrgInvites"), where("token", "==", "secret-token"))));
    await assertFails(updateDoc(doc(mallory(), "OrgInvites/inv1"), { status: "accepted" }));
  });
});

describe("Pairings (events)", () => {
  const newEvent = (id: string, overrides: Record<string, unknown> = {}) => ({
    id, ownerType: "personal", ownerId: "bob", createdBy: "bob", status: "open", participants: [], ...overrides,
  });

  it("is not readable by the public or by other users", async () => {
    await assertFails(getDoc(doc(anon(), "Pairings/personal1")));
    await assertFails(getDoc(doc(mallory(), "Pairings/personal1")));
    await assertFails(getDocs(query(collection(mallory(), "Pairings"), where("ownerId", "==", "alice"))));
  });

  it("lets an owner list their events and org members list org events", async () => {
    await assertSucceeds(getDocs(query(collection(alice(), "Pairings"), where("ownerId", "==", "alice"))));
    await assertSucceeds(getDocs(query(collection(bob(), "Pairings"), where("ownerId", "==", "acme"))));
    await assertFails(getDocs(query(collection(mallory(), "Pairings"), where("ownerId", "==", "acme"))));
  });

  it("lets a user create events in their own space or their org only", async () => {
    await assertSucceeds(setDoc(doc(bob(), "Pairings/new1"), newEvent("new1")));
    await assertSucceeds(setDoc(doc(bob(), "Pairings/new2"), newEvent("new2", { ownerType: "org", ownerId: "acme" })));
    await assertFails(setDoc(doc(bob(), "Pairings/new3"), newEvent("new3", { ownerId: "alice" })));
    await assertFails(setDoc(doc(mallory(), "Pairings/new4"), newEvent("new4", { ownerType: "org", ownerId: "acme", createdBy: "mallory" })));
    await assertFails(setDoc(doc(bob(), "Pairings/new5"), newEvent("new5", { pairs: [{ santaId: "a", receiverId: "b" }] })));
    await assertFails(setDoc(doc(anon(), "Pairings/new6"), newEvent("new6")));
  });

  it("lets organizers change settings but not participants, groups, draws or ownership", async () => {
    await assertSucceeds(updateDoc(doc(alice(), "Pairings/personal1"), { status: "locked", visibilityMode: "restricted" }));
    await assertFails(updateDoc(doc(alice(), "Pairings/personal1"), { participants: [{ id: "free", name: "No token charged" }] }));
    await assertFails(updateDoc(doc(alice(), "Pairings/personal1"), { pairs: [{ santaId: "a", receiverId: "b" }] }));
    await assertFails(updateDoc(doc(alice(), "Pairings/personal1"), { groups: {} }));
    await assertFails(updateDoc(doc(alice(), "Pairings/personal1"), { ownerId: "bob" }));
  });

  it("blocks anonymous and unrelated users from editing or deleting events", async () => {
    await assertFails(updateDoc(doc(anon(), "Pairings/personal1"), { status: "locked" }));
    await assertFails(updateDoc(doc(mallory(), "Pairings/personal1"), { status: "locked" }));
    await assertFails(deleteDoc(doc(mallory(), "Pairings/personal1")));
    await assertFails(deleteDoc(doc(anon(), "Pairings/personal1")));
  });

  it("lets org admins manage every org event and members only their own", async () => {
    await assertSucceeds(updateDoc(doc(alice(), "Pairings/org1"), { status: "locked" })); // admin, bob's event
    await assertSucceeds(updateDoc(doc(bob(), "Pairings/org1"), { status: "open" })); // member, own event
    await assertFails(updateDoc(doc(bob(), "Pairings/org2"), { status: "locked" })); // member, alice's event
    await assertFails(deleteDoc(doc(bob(), "Pairings/org2")));
    await assertSucceeds(deleteDoc(doc(alice(), "Pairings/org1")));
  });
});

describe("Notifications", () => {
  it("lets the recipient read and mark as read, and nothing else", async () => {
    await assertSucceeds(getDocs(query(collection(alice(), "Notifications"), where("userId", "==", "alice"))));
    await assertSucceeds(updateDoc(doc(alice(), "Notifications/n1"), { read: true, readAt: 1 }));
    await assertFails(updateDoc(doc(alice(), "Notifications/n1"), { message: "edited" }));
  });

  it("stops other users reading them and anyone creating them from the browser", async () => {
    await assertFails(getDoc(doc(bob(), "Notifications/n1")));
    await assertFails(setDoc(doc(mallory(), "Notifications/spam"), { userId: "alice", message: "phish", read: false }));
    await assertFails(setDoc(doc(anon(), "Notifications/spam"), { userId: "alice", message: "phish", read: false }));
  });
});
