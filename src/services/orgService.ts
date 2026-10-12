import { logger } from "@/utils/logger";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { apiFetch, ApiError } from "./api";
import {
  Organization,
  OrgMember,
  OrgInvite,
  OrgRole,
  OrganizationBranding,
  OrganizationIntegrations,
} from "../types/orgTypes";

/**
 * Organization data access for the browser.
 * Reads go to Firestore (limited to members by firestore.rules).
 * Every change goes through /api/orgs, where permissions are checked on the server.
 */

type Result<T = object> = Promise<{ success: boolean; error?: string } & Partial<T>>;

async function call<T extends object>(path: string, body: Record<string, unknown>): Result<T> {
  try {
    const data = await apiFetch<T>(path, { body, auth: "required" });
    return { ...data, success: true };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
    return { success: false, error: message } as Awaited<Result<T>>;
  }
}

const manage = (body: Record<string, unknown>) => call("/api/orgs/manage", body);

/** Creates an organization and makes the caller its founding admin. */
export function createOrganization(
  _userId: string,
  _userEmail: string,
  userName: string,
  orgName: string,
  branding?: OrganizationBranding
): Result<{ org: Organization }> {
  return call<{ org: Organization }>("/api/orgs", { name: orgName, userName, branding });
}

export async function fetchUserOrganizations(userId: string): Promise<Organization[]> {
  try {
    const membersSnap = await getDocs(query(collection(db, "OrgMembers"), where("userId", "==", userId)));
    const orgs = await Promise.all(
      membersSnap.docs.map(async (d) => {
        const member = d.data() as OrgMember;
        const orgSnap = await getDoc(doc(db, "Organizations", member.orgId));
        if (!orgSnap.exists()) return null;
        const org = orgSnap.data() as Organization;
        if (org.status !== "active") return null;
        return { ...org, userRole: member.role || (org.createdBy === userId ? "admin" : "member") } as Organization;
      })
    );
    return orgs.filter((o): o is Organization => o !== null);
  } catch (error) {
    logger.error("Error fetching user organizations:", error);
    return [];
  }
}

export async function fetchOrgMembers(orgId: string): Promise<OrgMember[]> {
  try {
    const snap = await getDocs(query(collection(db, "OrgMembers"), where("orgId", "==", orgId)));
    return snap.docs.map((d) => d.data() as OrgMember).sort((a, b) => a.joinedAt - b.joinedAt);
  } catch (error) {
    logger.error("Error fetching org members:", error);
    return [];
  }
}

/** Invites someone by email. The server creates the invite and sends the email. */
export function inviteMemberToOrg(
  orgId: string,
  _orgName: string,
  _inviterUserId: string,
  email: string,
  role: OrgRole = "member"
): Result<{ invite: OrgInvite }> {
  return call<{ invite: OrgInvite }>("/api/orgs/manage", { action: "invite", orgId, email, role });
}

/** Pending invites for an organization. Only org admins can read these. */
export async function fetchOrgInvites(orgId: string): Promise<OrgInvite[]> {
  try {
    const snap = await getDocs(
      query(collection(db, "OrgInvites"), where("orgId", "==", orgId), where("status", "==", "pending"))
    );
    return snap.docs.map((d) => d.data() as OrgInvite).sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    logger.error("Error fetching org invites:", error);
    return [];
  }
}

export async function cancelOrgInvite(inviteId: string): Promise<boolean> {
  return (await manage({ action: "cancelInvite", inviteId })).success;
}

/** Looks up a pending invitation by its token, for the invite landing page. */
export async function fetchInviteByToken(token: string): Promise<OrgInvite | null> {
  try {
    const data = await apiFetch<{ invite: OrgInvite }>(`/api/orgs/invites/${encodeURIComponent(token)}`);
    return data.invite;
  } catch {
    return null;
  }
}

export function acceptOrgInvite(
  token: string,
  _userId?: string,
  _userEmail?: string,
  userName?: string
): Result<{ orgId: string }> {
  return call<{ orgId: string }>("/api/orgs/invites/accept", { token, userName });
}

/**
 * Removes a member. If the last admin leaves, the longest-tenured member becomes admin;
 * if nobody is left, the organization is archived.
 */
export function removeMemberFromOrg(orgId: string, targetUserId: string): Result {
  return manage({ action: "removeMember", orgId, targetUserId });
}

/** Only the org's creator can demote admins, and the creator cannot be demoted. */
export function updateMemberRole(orgId: string, targetUserId: string, newRole: OrgRole, _requestingUserId?: string): Result {
  return manage({ action: "updateRole", orgId, targetUserId, role: newRole });
}

export function updateOrgSettings(
  orgId: string,
  updates: { name?: string; branding?: OrganizationBranding; integrations?: OrganizationIntegrations }
): Result {
  return manage({ action: "updateSettings", orgId, updates });
}

/**
 * Asks for an organization to be deleted. Nothing is removed straight away: the server
 * deletes it after the waiting period, and an admin can cancel until then.
 */
export function deleteOrganization(orgId: string, orgNameConfirmation: string): Result<{ deletionScheduledFor: number }> {
  return call<{ deletionScheduledFor: number }>("/api/orgs/manage", {
    action: "delete",
    orgId,
    confirmName: orgNameConfirmation,
  });
}

export function cancelOrganizationDeletion(orgId: string): Result {
  return manage({ action: "cancelDelete", orgId });
}
