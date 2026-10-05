import { logger } from "@/utils/logger";
import { doc, getDoc, collection, query, where, getDocs, limit, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { TokenLedger, TokenLedgerEntry } from "../types/tokenTypes";
import { canSpendFrom } from "../utils/tokens";

/**
 * Read-only access to token ledgers. Balances are only ever changed by the server
 * (src/server/ledger.ts); firestore.rules rejects ledger writes from the browser.
 */

function getLedgerDocId(ownerType: "personal" | "org", ownerId: string): string {
  return ownerType === "personal" ? `ledger_user_${ownerId}` : `ledger_org_${ownerId}`;
}

export async function fetchTokenLedger(
  ownerType: "personal" | "org",
  ownerId: string
): Promise<TokenLedger | null> {
  try {
    const snap = await getDoc(doc(db, "TokenLedgers", getLedgerDocId(ownerType, ownerId)));
    return snap.exists() ? (snap.data() as TokenLedger) : null;
  } catch (error) {
    logger.error("Error fetching TokenLedger:", error);
    return null;
  }
}

/** Live updates for a ledger. Calls back with null while the ledger does not exist yet. */
export function subscribeToTokenLedger(
  ownerType: "personal" | "org",
  ownerId: string,
  callback: (ledger: TokenLedger | null) => void
): () => void {
  return onSnapshot(
    doc(db, "TokenLedgers", getLedgerDocId(ownerType, ownerId)),
    (snap) => callback(snap.exists() ? (snap.data() as TokenLedger) : null),
    (error) => {
      logger.warn("Could not subscribe to token ledger:", error.message);
      callback(null);
    }
  );
}

export async function fetchLedgerEntries(ownerId: string, limitCount: number = 20): Promise<TokenLedgerEntry[]> {
  try {
    const q = query(collection(db, "TokenLedgerEntries"), where("accountId", "==", ownerId), limit(limitCount));
    const snap = await getDocs(q);
    const entries = snap.docs.map((d) => d.data() as TokenLedgerEntry);
    return entries.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (error) {
    logger.warn("Could not fetch token ledger entries:", error);
    return [];
  }
}

/**
 * Whether the account may spend `amount` more tokens. A hint only: the server decides.
 * A ledger that does not exist yet is treated as spendable, since it is created with a grant.
 */
export function canSpend(ledger: TokenLedger | null, amount = 1): boolean {
  return ledger === null || canSpendFrom(ledger, amount);
}
