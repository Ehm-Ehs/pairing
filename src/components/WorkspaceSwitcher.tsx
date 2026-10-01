"use client";

import React, { useState } from "react";
import { useWorkspace } from "../context/WorkspaceContext";
import { Workspace } from "../types/orgTypes";
import { FaUser, FaBuilding, FaChevronDown, FaPlus, FaCog, FaCheck } from "react-icons/fa";
import Link from "next/link";
import { auth } from "../services/firebase";

interface WorkspaceSwitcherProps {
  onOpenCreateOrgModal?: () => void;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({ onOpenCreateOrgModal }) => {
  const { activeWorkspace, userOrganizations, switchWorkspace, isLoadingWorkspaces } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);

  const isPersonal = activeWorkspace.type === "personal";

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoadingWorkspaces}
        className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-gray-100/90 hover:bg-gray-200/80 border border-gray-200 text-gray-800 text-xs font-bold transition-all shadow-2xs focus:outline-none cursor-pointer"
        title={`Active Workspace: ${activeWorkspace.name} (Click to switch)`}
      >
        <div className={`w-6 h-6 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[11px] sm:text-[10px] ${isPersonal ? "bg-blue-600 text-white" : "bg-amber-500 text-white"}`}>
          {isPersonal ? <FaUser className="w-3 h-3 sm:w-2.5 sm:h-2.5" /> : <FaBuilding className="w-3 h-3 sm:w-2.5 sm:h-2.5" />}
        </div>
        <div className="hidden sm:block text-left leading-tight max-w-[120px] truncate">
          <span className="block font-bold text-gray-900 truncate">{activeWorkspace.name}</span>
        </div>
        <FaChevronDown className={`hidden sm:block w-2.5 h-2.5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-64 rounded-2xl bg-white border border-gray-150 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-2 border-b border-gray-100">
              <span className="px-3 py-1 text-[10px] font-extrabold tracking-wider text-gray-400 uppercase">Workspaces</span>

              {/* Personal Option */}
              <button
                onClick={() => {
                  switchWorkspace({ id: "personal", name: "Personal Space", type: "personal" });
                  setIsOpen(false);
                }}
                className={`w-full mt-1 flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isPersonal ? "bg-blue-50 text-blue-700 border border-blue-200/60 font-bold" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <FaUser className="w-3 h-3" />
                  </div>
                  <span>Personal Space</span>
                </div>
                {isPersonal && <FaCheck className="w-3.5 h-3.5 text-blue-600" />}
              </button>
            </div>

            {/* Organizations List */}
            {userOrganizations.length > 0 && (
              <div className="p-2 border-b border-gray-100">
                <span className="px-3 py-1 text-[10px] font-extrabold tracking-wider text-gray-400 uppercase">Organizations</span>
                <div className="mt-1 space-y-1 max-h-48 overflow-y-auto">
                  {userOrganizations.map((org) => {
                    const isSelected = activeWorkspace.id === org.id;
                    return (
                      <button
                        key={org.id}
                        onClick={() => {
                          switchWorkspace({
                            id: org.id,
                            name: org.name,
                            type: "organization",
                            role: org.userRole || (auth.currentUser && org.createdBy === auth.currentUser.uid ? "admin" : "member"),
                            branding: org.branding,
                          });
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          isSelected ? "bg-amber-50 text-amber-900 border border-amber-200/60 font-bold" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                            <FaBuilding className="w-3 h-3" />
                          </div>
                          <span className="truncate max-w-[130px]">{org.name}</span>
                        </div>
                        {isSelected && <FaCheck className="w-3.5 h-3.5 text-amber-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="p-2 bg-gray-50/50 space-y-1">
              {!isPersonal && activeWorkspace.role === "admin" && (
                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <FaCog className="w-3.5 h-3.5 text-gray-400" />
                  <span>Organization Settings</span>
                </Link>
              )}

              {onOpenCreateOrgModal && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenCreateOrgModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <FaPlus className="w-3.5 h-3.5" />
                  <span>Create Organization</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
