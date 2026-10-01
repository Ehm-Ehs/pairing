import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { db } from "./firebase";
import { Organization, OrgMember, OrgInvite, OrgRole, OrganizationBranding, OrganizationIntegrations } from "../types/orgTypes";

/**
 * Checks if a user is already a member of any active organization.
 * Per Spec §3.5: "Once a user is a member of any org, they can no longer create their own org."
 */
export async function isUserInAnyOrg(userId: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, "OrgMembers"),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (error) {
    console.error("Error checking org membership:", error);
    return false;
  }
}

import { getOrCreateOrgLedger } from "./tokenLedgerService";

/**
 * Creates a new Organization and makes the founding user an Admin.
 * Per Spec §1: Creating an org never consumes/restricts Personal space or ability to create more orgs.
 */
export async function createOrganization(
  userId: string,
  userEmail: string,
  userName: string,
  orgName: string,
  branding?: OrganizationBranding
): Promise<{ success: boolean; org?: Organization; error?: string }> {
  try {
    const orgId = `org_${uuidv4().replace(/-/g, "").substring(0, 12)}`;
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const now = Date.now();

    const newOrg: any = {
      id: orgId,
      name: orgName.trim(),
      slug,
      branding: branding || {},
      integrations: {},
      status: "active",
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };

    // 1. Create Organization Document
    await setDoc(doc(db, "Organizations", orgId), newOrg);

    // 2. Create Founding Admin Member Document
    const memberId = `${orgId}_${userId}`;
    const foundingAdminDoc: OrgMember = {
      id: memberId,
      orgId,
      userId,
      userEmail,
      userName: userName || userEmail.split("@")[0],
      role: "admin",
      joinedAt: now,
    };
    await setDoc(doc(db, "OrgMembers", memberId), foundingAdminDoc);

    // 3. Initialize Org TokenLedger (handles per-creator free grant limits per Spec §7)
    await getOrCreateOrgLedger(orgId, userId);

    return { success: true, org: newOrg };
  } catch (error: any) {
    console.error("Error creating organization:", error);
    let errMsg = error.message || "Failed to create organization";
    if (error.code === "permission-denied" || errMsg.includes("permissions")) {
      errMsg = "Firebase Firestore Permission Error: Your Firebase Console rules need to be updated to allow access to the 'Organizations' and 'OrgMembers' collections.";
    }
    return { success: false, error: errMsg };
  }
}

/**
 * Fetches all organizations a user belongs to.
 */
export async function fetchUserOrganizations(userId: string): Promise<Organization[]> {
  try {
    const membersQuery = query(
      collection(db, "OrgMembers"),
      where("userId", "==", userId)
    );
    const membersSnap = await getDocs(membersQuery);

    if (membersSnap.empty) return [];

    const memberRoleMap = new Map<string, OrgRole>();
    membersSnap.docs.forEach((d) => {
      const mData = d.data() as OrgMember;
      memberRoleMap.set(mData.orgId, mData.role);
    });

    const orgs: Organization[] = [];

    for (const [orgId, role] of memberRoleMap.entries()) {
      const orgSnap = await getDoc(doc(db, "Organizations", orgId));
      if (orgSnap.exists()) {
        const orgData = orgSnap.data() as Organization;
        if (orgData.status === "active") {
          orgs.push({
            ...orgData,
            userRole: role || (orgData.createdBy === userId ? "admin" : "member"),
          });
        }
      }
    }

    return orgs;
  } catch (error) {
    console.error("Error fetching user organizations:", error);
    return [];
  }
}

/**
 * Fetches members of an organization.
 */
export async function fetchOrgMembers(orgId: string): Promise<OrgMember[]> {
  try {
    const q = query(
      collection(db, "OrgMembers"),
      where("orgId", "==", orgId)
    );
    const snap = await getDocs(q);
    const members: OrgMember[] = [];
    snap.forEach((docSnap) => members.push(docSnap.data() as OrgMember));
    return members.sort((a, b) => a.joinedAt - b.joinedAt);
  } catch (error) {
    console.error("Error fetching org members:", error);
    return [];
  }
}

/**
 * Invites a new member to an organization by email.
 */
export async function inviteMemberToOrg(
  orgId: string,
  orgName: string,
  inviterUserId: string,
  email: string,
  role: OrgRole = "member"
): Promise<{ success: boolean; invite?: OrgInvite; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const token = uuidv4();
    const inviteId = `inv_${uuidv4().replace(/-/g, "").substring(0, 12)}`;
    const now = Date.now();

    const inviteData: OrgInvite = {
      id: inviteId,
      orgId,
      orgName,
      email: cleanEmail,
      role,
      token,
      status: "pending",
      invitedBy: inviterUserId,
      createdAt: now,
    };

    await setDoc(doc(db, "OrgInvites", inviteId), inviteData);

    // Send Invite Email via Resend endpoint
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const inviteLink = `${origin}/invite/${token}`;

    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: cleanEmail,
          subject: `You've been invited to join ${orgName} on PairForm`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 8px;">
              <h2 style="color: #1e293b;">Organization Invitation</h2>
              <p>You have been invited to join <strong>${orgName}</strong> on PairForm as a <strong>${role}</strong>.</p>
              <p style="margin: 24px 0;">
                <a href="${inviteLink}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accept Invitation</a>
              </p>
              <p style="color: #64748b; font-size: 14px;">If you do not have an account, clicking the link will let you sign up with this email.</p>
            </div>
          `,
        }),
      });
    } catch (emailErr) {
      console.warn("Could not dispatch invite email via server route:", emailErr);
    }

    return { success: true, invite: inviteData };
  } catch (error: any) {
    console.error("Error inviting member:", error);
    return { success: false, error: error.message || "Failed to send invitation" };
  }
}

/**
 * Fetches all pending invites for an organization.
 */
export async function fetchOrgInvites(orgId: string): Promise<OrgInvite[]> {
  try {
    const q = query(
      collection(db, "OrgInvites"),
      where("orgId", "==", orgId),
      where("status", "==", "pending")
    );
    const snap = await getDocs(q);
    const invites: OrgInvite[] = [];
    snap.forEach((docSnap) => invites.push(docSnap.data() as OrgInvite));
    return invites.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching org invites:", error);
    return [];
  }
}

/**
 * Cancels a pending invite.
 */
export async function cancelOrgInvite(inviteId: string): Promise<boolean> {
  try {
    await updateDoc(doc(db, "OrgInvites", inviteId), { status: "cancelled" });
    return true;
  } catch (error) {
    console.error("Error cancelling invite:", error);
    return false;
  }
}

/**
 * Accepts an invitation token.
 */
export async function acceptOrgInvite(
  token: string,
  userId: string,
  userEmail: string,
  userName?: string
): Promise<{ success: boolean; orgId?: string; error?: string }> {
  try {
    const q = query(
      collection(db, "OrgInvites"),
      where("token", "==", token),
      where("status", "==", "pending")
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      return { success: false, error: "Invalid or expired invitation token." };
    }

    const inviteDoc = snap.docs[0].data() as OrgInvite;

    const now = Date.now();
    const memberId = `${inviteDoc.orgId}_${userId}`;
    const newMemberDoc: OrgMember = {
      id: memberId,
      orgId: inviteDoc.orgId,
      userId,
      userEmail: userEmail || inviteDoc.email,
      userName: userName || userEmail.split("@")[0],
      role: inviteDoc.role,
      joinedAt: now,
    };

    // 1. Create membership doc
    await setDoc(doc(db, "OrgMembers", memberId), newMemberDoc);

    // 2. Mark invite as accepted
    await updateDoc(doc(db, "OrgInvites", snap.docs[0].id), {
      status: "accepted",
    });

    return { success: true, orgId: inviteDoc.orgId };
  } catch (error: any) {
    console.error("Error accepting invite:", error);
    return { success: false, error: error.message || "Failed to accept invite" };
  }
}

/**
 * Removes a member from an organization.
 * Implements Admin Succession Rules (Spec §4):
 * - If removing an admin and other admins exist -> nothing changes.
 * - If no remaining admins exist but members remain -> auto-promote longest-tenured member.
 * - If 0 members remain -> org is set to 'archived'.
 */
export async function removeMemberFromOrg(
  orgId: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const memberDocRef = doc(db, "OrgMembers", `${orgId}_${targetUserId}`);
    const memberSnap = await getDoc(memberDocRef);

    if (!memberSnap.exists()) {
      return { success: false, error: "Member not found in organization." };
    }

    const memberData = memberSnap.data() as OrgMember;
    const wasAdmin = memberData.role === "admin";

    // 1. Delete target membership
    await deleteDoc(memberDocRef);

    // 2. Check remaining members & admin succession
    const remainingMembers = await fetchOrgMembers(orgId);

    if (remainingMembers.length === 0) {
      // 0 members remain -> Archive organization (Spec §4)
      await updateDoc(doc(db, "Organizations", orgId), { status: "archived" });
    } else if (wasAdmin) {
      const hasRemainingAdmin = remainingMembers.some((m) => m.role === "admin");
      if (!hasRemainingAdmin) {
        // Auto-promote longest-tenured remaining member (earliest joinedAt) to Admin
        const longestTenured = remainingMembers[0]; // Already sorted by joinedAt
        await updateDoc(doc(db, "OrgMembers", longestTenured.id), { role: "admin" });
        console.log(`Auto-promoted ${longestTenured.userEmail} to Admin for org ${orgId}`);
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error removing member from org:", error);
    return { success: false, error: error.message || "Failed to remove member" };
  }
}

/**
 * Promotes a member to Admin or demotes an Admin to Member.
 * Per Spec §5 (Admin Demotion Rule):
 * - Only the admin who created the org can demote other admins to member.
 * - The creating admin CANNOT demote themselves.
 */
export async function updateMemberRole(
  orgId: string,
  targetUserId: string,
  newRole: OrgRole,
  requestingUserId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const orgSnap = await getDoc(doc(db, "Organizations", orgId));
    if (!orgSnap.exists()) {
      return { success: false, error: "Organization not found." };
    }
    const orgData = orgSnap.data();

    if (newRole === "member") {
      // Demoting an admin to member rule check
      if (targetUserId === orgData.createdBy) {
        return {
          success: false,
          error: "The creator of the organization cannot demote themselves.",
        };
      }
      if (requestingUserId && requestingUserId !== orgData.createdBy) {
        return {
          success: false,
          error: "Only the creating admin of the organization can demote other admins.",
        };
      }
    }

    const memberDocRef = doc(db, "OrgMembers", `${orgId}_${targetUserId}`);
    await updateDoc(memberDocRef, { role: newRole });
    return { success: true };
  } catch (error: any) {
    console.error("Error updating member role:", error);
    return { success: false, error: error.message || "Failed to update member role" };
  }
}

/**
 * Updates Organization Settings (branding & integrations).
 */
export async function updateOrgSettings(
  orgId: string,
  updates: {
    name?: string;
    branding?: OrganizationBranding;
    integrations?: OrganizationIntegrations;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateDoc(doc(db, "Organizations", orgId), {
      ...updates,
      updatedAt: Date.now(),
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error updating org settings:", error);
    return { success: false, error: error.message || "Failed to update org settings" };
  }
}

/**
 * Deletes an Organization completely (Spec §6: Explicit confirmed Admin action).
 */
export async function deleteOrganization(
  orgId: string,
  orgNameConfirmation: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const orgSnap = await getDoc(doc(db, "Organizations", orgId));
    if (!orgSnap.exists()) {
      return { success: false, error: "Organization does not exist." };
    }

    const orgData = orgSnap.data() as Organization;
    if (orgData.name.trim().toLowerCase() !== orgNameConfirmation.trim().toLowerCase()) {
      return { success: false, error: "Organization name confirmation mismatch." };
    }

    // Delete members
    const members = await fetchOrgMembers(orgId);
    for (const member of members) {
      await deleteDoc(doc(db, "OrgMembers", member.id));
    }

    // Delete pending invites
    const invites = await fetchOrgInvites(orgId);
    for (const invite of invites) {
      await deleteDoc(doc(db, "OrgInvites", invite.id));
    }

    // Delete org doc
    await deleteDoc(doc(db, "Organizations", orgId));

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting organization:", error);
    return { success: false, error: error.message || "Failed to delete organization" };
  }
}
