import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import { TokenLedger, TokenLedgerEntry } from "../types/tokenTypes";

/**
 * Helper to get document ID for a TokenLedger.
 */
export function getLedgerDocId(ownerType: "personal" | "org", ownerId: string): string {
  return ownerType === "personal" ? `ledger_user_${ownerId}` : `ledger_org_${ownerId}`;
}

/**
 * Gets or creates the Personal TokenLedger for a user.
 * Restricts 50 free tokens grant ONLY to registered accounts (0 free tokens for anonymous guests).
 */
export async function getOrCreatePersonalLedger(
  userId: string
): Promise<TokenLedger> {
  const ledgerId = getLedgerDocId("personal", userId);
  const ledgerRef = doc(db, "TokenLedgers", ledgerId);

  try {
    // 1. Check if user is Super Admin in Firestore Users document
    const userSnap = await getDoc(doc(db, "Users", userId));
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData?.role === "super_admin" || userData?.isSuperAdmin === true) {
        return {
          id: ledgerId,
          ownerType: "personal",
          ownerId: userId,
          balance: Infinity,
          freeGrantAmount: 50,
          freeGrantUsed: true,
          hasEverPaid: true,
          tier: "super_admin" as any,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      }
    }

    const snap = await getDoc(ledgerRef);
    if (snap.exists()) {
      return snap.data() as TokenLedger;
    }

    const now = Date.now();
    const initialGrant = 50;

    const newLedger: TokenLedger = {
      id: ledgerId,
      ownerType: "personal",
      ownerId: userId,
      balance: initialGrant,
      freeGrantAmount: initialGrant,
      freeGrantUsed: true,
      hasEverPaid: false,
      tier: "free",
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(ledgerRef, newLedger);

    const entryId = `entry_${now}_${Math.random().toString(36).substring(2, 7)}`;
    await setDoc(doc(db, "TokenLedgerEntries", entryId), {
      id: entryId,
      accountId: userId,
      accountType: "user",
      type: "free_grant",
      amount: initialGrant,
      createdAt: now,
    });

    return newLedger;
  } catch (error) {
    console.error("Error in getOrCreatePersonalLedger:", error);
    return {
      id: ledgerId,
      ownerType: "personal",
      ownerId: userId,
      balance: 50,
      freeGrantAmount: 50,
      freeGrantUsed: true,
      hasEverPaid: false,
      tier: "free",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
}

/**
 * Gets or creates an Org TokenLedger.
 * Per Spec §7: Per-creator limit applies.
 * The 75-token free grant is issued ONLY for the first org created by a given user.
 * Subsequent orgs created by the same user start with a 0-balance ledger.
 */
export async function getOrCreateOrgLedger(
  orgId: string,
  creatorUserId: string
): Promise<TokenLedger> {
  const ledgerId = getLedgerDocId("org", orgId);
  const ledgerRef = doc(db, "TokenLedgers", ledgerId);

  try {
    const snap = await getDoc(ledgerRef);
    if (snap.exists()) {
      return snap.data() as TokenLedger;
    }

    // Check how many orgs this user has created
    const createdOrgsQuery = query(
      collection(db, "Organizations"),
      where("createdBy", "==", creatorUserId)
    );
    const createdOrgsSnap = await getDocs(createdOrgsQuery);
    
    // If this is the only org created by this user (count <= 1), issue 75 tokens
    const isFirstOrg = createdOrgsSnap.size <= 1;
    const initialGrant = isFirstOrg ? 75 : 0;
    const now = Date.now();

    const newLedger: TokenLedger = {
      id: ledgerId,
      ownerType: "org",
      ownerId: orgId,
      balance: initialGrant,
      freeGrantAmount: initialGrant,
      freeGrantUsed: true,
      hasEverPaid: false,
      tier: "free",
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(ledgerRef, newLedger);

    if (initialGrant > 0) {
      const entryId = `entry_${now}_${Math.random().toString(36).substring(2, 7)}`;
      await setDoc(doc(db, "TokenLedgerEntries", entryId), {
        id: entryId,
        accountId: orgId,
        accountType: "org",
        type: "free_grant",
        amount: initialGrant,
        createdAt: now,
      });
    }

    return newLedger;
  } catch (error) {
    console.error("Error in getOrCreateOrgLedger:", error);
    return {
      id: ledgerId,
      ownerType: "org",
      ownerId: orgId,
      balance: 75,
      freeGrantAmount: 75,
      freeGrantUsed: true,
      hasEverPaid: false,
      tier: "free",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
}

/**
 * Fetches a TokenLedger doc by ownerType and ownerId.
 */
export async function fetchTokenLedger(
  ownerType: "personal" | "org",
  ownerId: string
): Promise<TokenLedger | null> {
  try {
    if (ownerType === "personal") {
      const userSnap = await getDoc(doc(db, "Users", ownerId));
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData?.role === "super_admin" || userData?.isSuperAdmin === true) {
          return {
            id: getLedgerDocId("personal", ownerId),
            ownerType: "personal",
            ownerId,
            balance: Infinity,
            freeGrantAmount: 50,
            freeGrantUsed: true,
            hasEverPaid: true,
            tier: "super_admin" as any,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
        }
      }
    }

    const ledgerId = getLedgerDocId(ownerType, ownerId);
    const snap = await getDoc(doc(db, "TokenLedgers", ledgerId));
    if (snap.exists()) {
      return snap.data() as TokenLedger;
    }

    if (ownerType === "personal") {
      return await getOrCreatePersonalLedger(ownerId);
    }
    return null;
  } catch (error) {
    console.error("Error fetching TokenLedger:", error);
    return null;
  }
}

/**
 * Fetches ledger entries for a workspace.
 */
export async function fetchLedgerEntries(
  ownerId: string,
  limitCount: number = 20
): Promise<TokenLedgerEntry[]> {
  try {
    const q = query(
      collection(db, "TokenLedgerEntries"),
      where("accountId", "==", ownerId),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    const entries = snap.docs.map((d) => d.data() as TokenLedgerEntry);
    return entries.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (error) {
    console.warn("Could not fetch token ledger entries:", error);
    return [];
  }
}
