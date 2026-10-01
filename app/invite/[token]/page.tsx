"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../../src/services/firebase";
import { OrgInvite } from "../../../src/types/orgTypes";
import { acceptOrgInvite } from "../../../src/services/orgService";
import { useWorkspace } from "../../../src/context/WorkspaceContext";
import { FaBuilding, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaArrowRight } from "react-icons/fa";
import Link from "next/link";

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;
  const router = useRouter();
  const { switchWorkspace, refreshWorkspaces } = useWorkspace();

  const [invite, setInvite] = useState<OrgInvite | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [accepting, setAccepting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvite() {
      try {
        setLoading(true);
        const q = query(
          collection(db, "OrgInvites"),
          where("token", "==", token),
          where("status", "==", "pending")
        );
        const snap = await getDocs(q);

        if (snap.empty) {
          setError("This invitation token is invalid, expired, or has already been used.");
          setInvite(null);
        } else {
          setInvite(snap.docs[0].data() as OrgInvite);
        }
      } catch (err: any) {
        console.error("Error loading invite:", err);
        setError("Failed to load invitation details.");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadInvite();
    }
  }, [token]);

  const handleAccept = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.push(`/login?inviteToken=${token}&email=${encodeURIComponent(invite?.email || "")}`);
      return;
    }

    setAccepting(true);
    setError(null);

    const res = await acceptOrgInvite(
      token,
      user.uid,
      user.email || invite?.email || "",
      user.displayName || ""
    );

    setAccepting(false);

    if (res.success && res.orgId && invite) {
      await refreshWorkspaces();
      switchWorkspace({
        id: res.orgId,
        name: invite.orgName,
        type: "organization",
        role: invite.role,
      });
      router.push("/home");
    } else {
      setError(res.error || "Failed to accept invitation.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-2xl border border-indigo-500/30">
          <FaBuilding />
        </div>

        {loading ? (
          <div className="py-8 flex flex-col items-center gap-3">
            <FaSpinner className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-400">Validating invitation...</p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="inline-flex p-3 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              <FaExclamationTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Invitation Unavailable</h2>
            <p className="text-sm text-slate-400 leading-relaxed">{error}</p>
            <Link
              href="/home"
              className="inline-block px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all"
            >
              Return to Home
            </Link>
          </div>
        ) : invite ? (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Organization Invitation</span>
              <h2 className="text-2xl font-bold text-white mt-1">Join {invite.orgName}</h2>
              <p className="text-sm text-slate-400 mt-2">
                You have been invited to join <strong>{invite.orgName}</strong> as a <strong>{invite.role}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Invited Email:</span>
                <span className="text-slate-200 font-medium">{invite.email}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Assigned Role:</span>
                <span className="text-indigo-400 font-bold capitalize">{invite.role}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {accepting ? (
                  <FaSpinner className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Accept & Join {invite.orgName}</span>
                    <FaArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-500">
                Accepting this invitation will add {invite.orgName} to your PairForm workspaces while leaving your personal account untouched.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
