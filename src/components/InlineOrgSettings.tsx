"use client";

import React, { useEffect, useState } from "react";
import { useWorkspace } from "../context/WorkspaceContext";
import { OrgMember, OrgInvite, Organization } from "../types/orgTypes";
import {
  fetchOrgMembers,
  fetchOrgInvites,
  inviteMemberToOrg,
  cancelOrgInvite,
  removeMemberFromOrg,
  updateMemberRole,
  updateOrgSettings,
  deleteOrganization,
} from "../services/orgService";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import {
  FaBuilding,
  FaUsers,
  FaUserPlus,
  FaTrash,
  FaWhatsapp,
  FaExclamationTriangle,
  FaSpinner,
  FaEnvelope,
  FaSave,
  FaFileCsv,
} from "react-icons/fa";

export const InlineOrgSettings: React.FC = () => {
  const { activeWorkspace, switchWorkspace, refreshWorkspaces } = useWorkspace();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"members" | "integrations" | "danger">("members");

  // State for members and invites
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);

  // Org settings form
  const [orgName, setOrgName] = useState("");
  const [orgCreatedBy, setOrgCreatedBy] = useState("");
  const [whatsappToken, setWhatsappToken] = useState("");
  const [whatsappPhoneId, setWhatsappPhoneId] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  // Danger zone deletion
  const [confirmOrgName, setConfirmOrgName] = useState("");
  const [deleting, setDeleting] = useState(false);

  const currentMember = members.find((m) => m.userId === auth.currentUser?.uid);
  const isOrgAdmin =
    currentMember?.role === "admin" ||
    (!!orgCreatedBy && auth.currentUser?.uid === orgCreatedBy) ||
    (activeWorkspace.type === "organization" && activeWorkspace.role === "admin");
  const orgId = activeWorkspace.id;

  const loadOrgData = async () => {
    if (activeWorkspace.type !== "organization") return;
    setLoadingData(true);
    try {
      const [mList, iList, orgSnap] = await Promise.all([
        fetchOrgMembers(orgId),
        fetchOrgInvites(orgId),
        getDoc(doc(db, "Organizations", orgId)),
      ]);
      setMembers(mList);
      setInvites(iList);

      if (orgSnap.exists()) {
        const data = orgSnap.data() as Organization;
        setOrgName(data.name || "");
        setOrgCreatedBy(data.createdBy || "");
        setWhatsappToken(data.integrations?.whatsappApiToken || "");
        setWhatsappPhoneId(data.integrations?.whatsappPhoneNumberId || "");
      }
    } catch (err) {
      console.error("Error loading org data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (activeWorkspace.type === "organization") {
      loadOrgData();
    }
  }, [activeWorkspace.id]);

  if (activeWorkspace.type !== "organization") return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !auth.currentUser) return;
    setInviting(true);
    setInviteSuccessMsg(null);

    const res = await inviteMemberToOrg(
      orgId,
      activeWorkspace.name,
      auth.currentUser.uid,
      inviteEmail.trim(),
      inviteRole
    );

    setInviting(false);

    if (res.success) {
      setInviteEmail("");
      setInviteSuccessMsg(`Invitation sent to ${inviteEmail}`);
      loadOrgData();
    } else {
      alert(res.error || "Failed to send invitation.");
    }
  };

  const handleBulkCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setInviting(true);
    setInviteSuccessMsg(null);
    try {
      const { parseParticipantsCsv } = await import("../utils/csvImport");
      const parsed = await parseParticipantsCsv(file);
      if (parsed.length === 0) {
        alert("No valid emails found in the uploaded CSV file.");
        setInviting(false);
        return;
      }

      let count = 0;
      for (const p of parsed) {
        if (p.email && p.email.includes("@")) {
          await inviteMemberToOrg(
            orgId,
            activeWorkspace.name,
            auth.currentUser.uid,
            p.email.trim(),
            "member"
          );
          count++;
        }
      }

      setInviteSuccessMsg(`Bulk upload success! Sent ${count} organization invitations.`);
      loadOrgData();
    } catch (err: any) {
      alert("Failed to parse CSV: " + err.message);
    } finally {
      setInviting(false);
      e.target.value = "";
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    await cancelOrgInvite(inviteId);
    loadOrgData();
  };

  const handleRoleChange = async (targetUserId: string, newRole: "admin" | "member") => {
    const res = await updateMemberRole(orgId, targetUserId, newRole, auth.currentUser?.uid);
    if (res.success) {
      loadOrgData();
    } else {
      alert(res.error || "Failed to update role.");
    }
  };

  const handleRemoveMember = async (targetUserId: string, targetEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${targetEmail} from ${activeWorkspace.name}?`)) return;

    const res = await removeMemberFromOrg(orgId, targetUserId);
    if (res.success) {
      loadOrgData();
      refreshWorkspaces();
    } else {
      alert(res.error || "Failed to remove member.");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg(null);

    const res = await updateOrgSettings(orgId, {
      name: orgName.trim(),
      integrations: {
        whatsappApiToken: whatsappToken.trim(),
        whatsappPhoneNumberId: whatsappPhoneId.trim(),
      },
    });

    setSavingSettings(false);
    if (res.success) {
      setSettingsMsg("Settings saved successfully!");
      refreshWorkspaces();
    } else {
      alert(res.error || "Failed to save settings.");
    }
  };

  const handleDeleteOrg = async () => {
    if (confirmOrgName.trim().toLowerCase() !== activeWorkspace.name.trim().toLowerCase()) {
      alert("Organization name does not match confirmation input.");
      return;
    }

    setDeleting(true);
    const res = await deleteOrganization(orgId, confirmOrgName);
    setDeleting(false);

    if (res.success) {
      await refreshWorkspaces();
      switchWorkspace({ id: "personal", name: "Personal Space", type: "personal" });
    } else {
      alert(res.error || "Failed to delete organization.");
    }
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === "members" ? "bg-[#1449b2] text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <FaUsers className="w-3.5 h-3.5" />
          <span>Members ({members.length})</span>
        </button>

        {isOrgAdmin && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab("integrations")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "integrations" ? "bg-[#1449b2] text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <FaWhatsapp className="w-3.5 h-3.5" />
              <span>Settings & Integrations</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("danger")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "danger" ? "bg-red-600 text-white shadow-sm" : "bg-red-50 text-red-600 hover:bg-red-100"
              }`}
            >
              <FaExclamationTriangle className="w-3.5 h-3.5" />
              <span>Danger Zone</span>
            </button>
          </>
        )}
      </div>

      {/* Tab 1: Members */}
      {activeTab === "members" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Invite Member Form */}
          {isOrgAdmin && (
            <div className="p-5 bg-gray-50 border border-gray-200/80 rounded-2xl space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <FaUserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Invite Team Member</h4>
                  <p className="text-xs text-gray-500 font-medium">Send an email invitation to add a user to this organization</p>
                </div>
              </div>

              {inviteSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                  {inviteSuccessMsg}
                </div>
              )}

              <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1449b2] font-medium"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#1449b2]"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1449b2] hover:bg-[#0f3d99] text-white rounded-full text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  {inviting ? <FaSpinner className="w-3.5 h-3.5 animate-spin" /> : <FaEnvelope className="w-3.5 h-3.5" />}
                  <span>Send Invite</span>
                </button>

                <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-xs">
                  <FaFileCsv className="w-3.5 h-3.5" />
                  <span>Bulk CSV Upload</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleBulkCsvUpload}
                    className="hidden"
                  />
                </label>
              </form>
            </div>
          )}

          {/* Pending Invites */}
          {invites.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Pending Invites ({invites.length})</span>
              <div className="border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden bg-white">
                {invites.map((inv) => (
                  <div key={inv.id} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-gray-900">{inv.email}</span>
                      <span className="ml-2 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold uppercase text-[10px]">
                        {inv.role}
                      </span>
                    </div>
                    {isOrgAdmin && (
                      <button
                        type="button"
                        onClick={() => handleCancelInvite(inv.id)}
                        className="px-3 py-1 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Cancel Invite
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Members */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Active Members ({members.length})</span>
            <div className="border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden bg-white">
              {members.map((m) => {
                const isSelf = auth.currentUser?.uid === m.userId;
                const isCreator = m.userId === orgCreatedBy;
                const isCurrentCreator = auth.currentUser?.uid === orgCreatedBy;
                const canDemote = isCurrentCreator && !isCreator && !isSelf;

                return (
                  <div key={m.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold uppercase">
                        {m.userName ? m.userName[0] : m.userEmail[0]}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          <span>{m.userName || m.userEmail}</span>
                          {isSelf && <span className="text-[10px] text-gray-400 font-normal">(You)</span>}
                          {isCreator && <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-md border border-purple-200">Creator</span>}
                        </div>
                        <span className="text-gray-500 text-[11px]">{m.userEmail}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          m.role === "admin"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                        }`}
                      >
                        {m.role}
                      </span>

                      {isOrgAdmin && !isSelf && (
                        <div className="flex items-center gap-2">
                          {m.role === "member" ? (
                            <button
                              type="button"
                              onClick={() => handleRoleChange(m.userId, "admin")}
                              className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Promote to Admin
                            </button>
                          ) : canDemote ? (
                            <button
                              type="button"
                              onClick={() => handleRoleChange(m.userId, "member")}
                              className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Demote to Member
                            </button>
                          ) : null}

                          {(!isCreator || isCurrentCreator) && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m.userId, m.userEmail)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Remove Member"
                            >
                              <FaTrash className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Settings & Integrations */}
      {activeTab === "integrations" && isOrgAdmin && (
        <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl animate-in fade-in duration-200 text-left">
          {settingsMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              {settingsMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Organization Name
            </label>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1449b2] font-medium"
            />
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200/80 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-gray-900 flex items-center gap-2">
              <FaWhatsapp className="text-emerald-600 w-4 h-4" />
              <span>Dedicated WhatsApp Integration</span>
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              Configure your Meta WhatsApp Cloud API credentials to send event notifications from your brand's WhatsApp Business number.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  WhatsApp Phone Number ID
                </label>
                <input
                  type="text"
                  value={whatsappPhoneId}
                  onChange={(e) => setWhatsappPhoneId(e.target.value)}
                  placeholder="e.g. 100582938210"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  WhatsApp API Permanent Token
                </label>
                <input
                  type="password"
                  value={whatsappToken}
                  onChange={(e) => setWhatsappToken(e.target.value)}
                  placeholder="EAAG..."
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#1449b2] hover:bg-[#0f3d99] text-white rounded-full text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
          >
            {savingSettings ? <FaSpinner className="w-3.5 h-3.5 animate-spin" /> : <FaSave className="w-3.5 h-3.5" />}
            <span>Save Settings</span>
          </button>
        </form>
      )}

      {/* Tab 3: Danger Zone */}
      {activeTab === "danger" && isOrgAdmin && (
        <div className="p-5 bg-red-50 border border-red-200 rounded-2xl space-y-3 max-w-xl animate-in fade-in duration-200 text-left">
          <div className="flex items-center gap-2 text-red-700">
            <FaExclamationTriangle className="w-5 h-5" />
            <h4 className="text-sm font-bold">Delete Organization</h4>
          </div>

          <p className="text-xs text-red-600 leading-relaxed font-medium">
            Permanently delete this organization, member assignments, and pending invites. This action cannot be undone.
          </p>

          <div className="space-y-3 pt-1">
            <label className="block text-xs font-bold text-gray-600">
              Type <strong>{activeWorkspace.name}</strong> to confirm deletion:
            </label>
            <input
              type="text"
              value={confirmOrgName}
              onChange={(e) => setConfirmOrgName(e.target.value)}
              placeholder={activeWorkspace.name}
              className="w-full px-4 py-2.5 bg-white border border-red-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
            />

            <button
              type="button"
              onClick={handleDeleteOrg}
              disabled={deleting || confirmOrgName.trim().toLowerCase() !== activeWorkspace.name.trim().toLowerCase()}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-full text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              {deleting && <FaSpinner className="w-3.5 h-3.5 animate-spin" />}
              <span>Delete Organization Permanently</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
