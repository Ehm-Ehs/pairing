import { adminDb } from "../services/firebaseAdmin";
import { HttpError, str } from "./http";
import { orgRole } from "./events";

export async function requireOrgAdmin(orgId: string, uid: string): Promise<void> {
  if ((await orgRole(orgId, uid)) !== "admin") {
    throw new HttpError(403, "Only organization admins can do this.", "FORBIDDEN");
  }
}

export async function findPendingInvite(token: string) {
  if (!token) return null;
  const snap = await adminDb
    .collection("OrgInvites")
    .where("token", "==", token)
    .where("status", "==", "pending")
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const data = doc.data();
  if (data.expiresAt && data.expiresAt < Date.now()) return null;
  return { ref: doc.ref, data };
}

/** Keeps only the known, non-empty branding fields from untrusted input. */
export function cleanBranding(input: unknown): { logoUrl?: string; primaryColor?: string } {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const logoUrl = str(raw.logoUrl, 2000);
  const primaryColor = str(raw.primaryColor, 30);
  return { ...(logoUrl ? { logoUrl } : {}), ...(primaryColor ? { primaryColor } : {}) };
}

/** Keeps only the known, non-empty integration fields from untrusted input. */
export function cleanIntegrations(input: unknown): Record<string, string> {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const limits: Record<string, number> = { whatsappApiToken: 1000, whatsappPhoneNumberId: 100, whatsappApiUrl: 500 };
  const out: Record<string, string> = {};
  for (const [key, max] of Object.entries(limits)) {
    const value = str(raw[key], max);
    if (value) out[key] = value;
  }
  return out;
}

/** The short random id used for organizations and invites. */
export const shortId = (prefix: string, uuid: string): string => `${prefix}_${uuid.replace(/-/g, "").substring(0, 12)}`;

/** The membership record for a user in an organization. Its id ties one user to one org. */
export function memberRecord(input: {
  orgId: string;
  uid: string;
  email: string;
  name?: string;
  role: "admin" | "member";
}) {
  return {
    id: `${input.orgId}_${input.uid}`,
    orgId: input.orgId,
    userId: input.uid,
    userEmail: input.email,
    userName: input.name || input.email.split("@")[0],
    role: input.role,
    joinedAt: Date.now(),
  };
}
