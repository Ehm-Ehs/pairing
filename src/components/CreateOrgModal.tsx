"use client";

import React, { useState } from "react";
import { createOrganization } from "../services/orgService";
import { useWorkspace } from "../context/WorkspaceContext";
import { auth } from "../services/firebase";
import { FaBuilding, FaSpinner } from "react-icons/fa";

interface CreateOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateOrgModal: React.FC<CreateOrgModalProps> = ({ isOpen, onClose }) => {
  const { switchWorkspace, refreshWorkspaces } = useWorkspace();
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Esc") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    const user = auth.currentUser;
    if (!user) {
      setError("You must be logged in to create an organization.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await createOrganization(
      user.uid,
      user.email || "",
      user.displayName || user.email?.split("@")[0] || "User",
      orgName.trim()
    );

    setLoading(false);

    if (res.success && res.org) {
      await refreshWorkspaces();
      switchWorkspace({
        id: res.org.id,
        name: res.org.name,
        type: "organization",
        role: "admin",
        branding: res.org.branding,
      });
      setOrgName("");
      onClose();
    } else {
      setError(res.error || "Failed to create organization.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col items-center text-center my-auto animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Icon Header */}
        <div className="w-14 h-14 bg-[#3A76F0]/10 text-[#3A76F0] rounded-2xl flex items-center justify-center mb-4 shadow-sm">
          <FaBuilding className="w-6 h-6 text-[#1449b2]" />
        </div>

        {/* Title & Subtitle */}
        <h3 className="text-2xl font-bold text-gray-900 mb-1 font-heading tracking-tight">
          Create Organization
        </h3>
        <p className="text-xs text-gray-500 mb-6 font-medium leading-relaxed">
          Set up a shared team workspace for your organization.
        </p>

        {error && (
          <div className="w-full mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium text-left leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Organization Name
            </label>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Acme Corporation, ThriveAgric"
              className="w-full bg-white text-black border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1449b2] placeholder-gray-400 transition-colors font-medium"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-full text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !orgName.trim()}
              className="bg-[#1449b2] hover:bg-[#0f3d99] disabled:opacity-50 text-white px-6 py-3 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              {loading && <FaSpinner className="w-3.5 h-3.5 animate-spin" />}
              <span>Create Organization</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
