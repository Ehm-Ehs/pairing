export type AccountTier = "free" | "pro" | "growth" | "enterprise" | "super_admin";

export interface TokenAccount {
  tokenBalance: number;
  freeTokensGranted: number;
  paidTokensPurchased: number;
  tier: AccountTier;
  hasEverPaid: boolean;
}

export interface TokenLedger {
  id: string; // "ledger_user_{userId}" or "ledger_org_{orgId}"
  ownerType: "personal" | "org";
  ownerId: string; // userId or orgId
  balance: number;
  freeGrantAmount: number;
  freeGrantUsed: boolean;
  hasEverPaid: boolean;
  tier: "free" | "paid";
  createdAt: number;
  updatedAt: number;
}

export type LedgerEntryType = "free_grant" | "pack_purchase" | "participant_join" | "round_notification";

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
    priceNGN: 2500,
    ratePerToken: 50,
  },
  {
    id: "pack_200",
    name: "200 Tokens",
    tokens: 200,
    priceNGN: 9000,
    ratePerToken: 45,
    popular: true,
  },
  {
    id: "pack_700",
    name: "700 Tokens",
    tokens: 700,
    priceNGN: 28000,
    ratePerToken: 40,
  },
];
