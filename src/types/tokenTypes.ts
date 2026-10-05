/** "paid" once the account has bought any pack. Older ledgers may hold legacy values, all treated as paid. */
export type LedgerTier = "free" | "paid";

export interface TokenLedger {
  id: string; // "ledger_user_{userId}" or "ledger_org_{orgId}"
  ownerType: "personal" | "org";
  ownerId: string; // userId or orgId
  balance: number;
  freeGrantAmount: number;
  freeGrantUsed: boolean;
  /** Total tokens bought through token packs. */
  purchasedTokens?: number;
  hasEverPaid: boolean;
  tier: LedgerTier;
  createdAt: number;
  updatedAt: number;
}

export type LedgerEntryType =
  | "free_grant"
  /** The balance an older account already had when its ledger was created. */
  | "balance_carried_over"
  | "pack_purchase"
  | "participant_join"
  | "round_notification";

export interface TokenLedgerEntry {
  id: string;
  accountId: string;
  accountType: "user" | "org";
  type: LedgerEntryType;
  amount: number; // positive for grants/purchases, negative for joins
  packName?: string;
  eventId?: string;
  participantId?: string;
  createdAt: number;
}

export interface TokenPack {
  id: string;
  name: string;
  tokens: number;
  priceNGN: number; // Price in Nigerian Naira
  ratePerToken: number;
  popular?: boolean;
}

export const TOKEN_PACKS: TokenPack[] = [
  {
    id: "pack_50",
    name: "50 Tokens",
    tokens: 50,
    priceNGN: 5000,
    ratePerToken: 100,
  },
  {
    id: "pack_200",
    name: "200 Tokens",
    tokens: 200,
    priceNGN: 18000,
    ratePerToken: 90,
    popular: true,
  },
  {
    id: "pack_700",
    name: "700 Tokens",
    tokens: 700,
    priceNGN: 59500,
    ratePerToken: 85,
  },
];
