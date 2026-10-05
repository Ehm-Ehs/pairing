import { useEffect, useState } from "react";
import { useWorkspace } from "../context/WorkspaceContext";
import { subscribeToTokenLedger } from "../services/tokenLedgerService";
import { TokenLedger } from "../types/tokenTypes";
import { isPaidLedger } from "../utils/tokens";

interface LedgerUser {
  uid?: string;
  userId?: string;
  role?: string;
  isSuperAdmin?: boolean;
}

export interface TokenLedgerState {
  loading: boolean;
  ledger: TokenLedger | null;
  balance: number;
  tier: string;
  hasEverPaid: boolean;
  isSuperAdmin: boolean;
  ownerType: "personal" | "org";
  ownerId: string;
}

/**
 * Live token balance for the active workspace (personal or organization).
 * The ledger document is the only source of truth for balances.
 */
export function useTokenLedger(user?: LedgerUser | null): TokenLedgerState {
  const { activeWorkspace } = useWorkspace();
  const uid = user?.uid || user?.userId || "";
  const isOrg = activeWorkspace.type === "organization";
  const ownerType: "personal" | "org" = isOrg ? "org" : "personal";
  const ownerId = isOrg ? activeWorkspace.id : uid;

  // The snapshot is stored with the ledger it belongs to, so switching workspace
  // shows "loading" instead of the previous workspace's balance.
  const key = ownerId ? `${ownerType}:${ownerId}` : "";
  const [snapshot, setSnapshot] = useState<{ key: string; ledger: TokenLedger | null }>({ key: "", ledger: null });

  useEffect(() => {
    if (!ownerId) return;
    return subscribeToTokenLedger(ownerType, ownerId, (next) => setSnapshot({ key, ledger: next }));
  }, [ownerType, ownerId, key]);

  const loading = key !== "" && snapshot.key !== key;
  const ledger = snapshot.key === key ? snapshot.ledger : null;

  const isSuperAdmin = !isOrg && (user?.role === "super_admin" || user?.isSuperAdmin === true);
  const hasEverPaid = isPaidLedger(ledger);

  return {
    loading,
    ledger,
    balance: isSuperAdmin ? Infinity : ledger?.balance ?? 0,
    tier: isSuperAdmin ? "super_admin" : hasEverPaid ? "paid" : "free",
    hasEverPaid,
    isSuperAdmin,
    ownerType,
    ownerId,
  };
}
