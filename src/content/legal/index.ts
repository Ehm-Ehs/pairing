/**
 * Shared facts and types for the Privacy Policy and Terms of Service.
 * The retention and deletion numbers here are the ones the server enforces
 * (see src/server/deletion.ts and src/server/retention.ts), so the pages cannot drift from the code.
 */

export const COMPANY = {
  name: "Novel Ltd",
  location: "Abuja, Nigeria",
  email: "support@pair-form.com",
} as const;

export const LEGAL_EFFECTIVE_DATE = "February 2026";

/** Organizers must be at least this old. */
export const MINIMUM_AGE = 14;

/** Events with no activity for this long are deleted automatically. */
export const EVENT_RETENTION_MONTHS = 24;

/** An organization is deleted this many working days after an admin asks. */
export const ORG_DELETION_WORKING_DAYS = 21;

/** A paragraph, a bulleted list or a small sub-heading. Wrap text in **double stars** for bold. */
export type LegalBlock = string | { list: string[] } | { label: string };

export interface LegalSection {
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDocumentContent {
  title: string;
  intro?: string;
  sections: LegalSection[];
}
