/**
 * Token balance rules shared by the server (which enforces them) and the browser
 * (which only uses them to show hints).
 */

/** Tokens granted once to new accounts. Only a creator's first organization gets the org grant. */
export const FREE_GRANT = { personal: 50, org: 75 } as const;

/** Accounts that have paid at least once may go this far below zero. */
export const PAID_OVERDRAFT = 20;

interface LedgerLike {
  hasEverPaid?: boolean;
  tier?: string;
}

/** An account counts as paid once it has bought any pack. Legacy tier names all count as paid. */
export function isPaidLedger(ledger: LedgerLike | null | undefined): boolean {
  if (!ledger) return false;
  return ledger.hasEverPaid === true || (typeof ledger.tier === "string" && ledger.tier !== "free");
}

/** The lowest balance the account may reach. */
export function balanceFloor(ledger: LedgerLike | null | undefined): number {
  return isPaidLedger(ledger) ? -PAID_OVERDRAFT : 0;
}

export function canSpendFrom(ledger: (LedgerLike & { balance?: number }) | null | undefined, amount: number): boolean {
  const balance = typeof ledger?.balance === "number" ? ledger.balance : 0;
  return balance - amount >= balanceFloor(ledger);
}
