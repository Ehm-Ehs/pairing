"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Organization, Workspace } from "../types/orgTypes";
import { fetchUserOrganizations, fetchOrgMembers } from "../services/orgService";
import Auth from "../services/auth.module";
import { auth } from "../services/firebase";

interface WorkspaceContextType {
  activeWorkspace: Workspace;
  userOrganizations: Organization[];
  switchWorkspace: (workspace: Workspace) => void;
  refreshWorkspaces: () => Promise<void>;
  isLoadingWorkspaces: boolean;
}

const DEFAULT_PERSONAL_WORKSPACE: Workspace = {
  id: "personal",
  name: "Personal Space",
  type: "personal",
};

const WorkspaceContext = createContext<WorkspaceContextType>({
  activeWorkspace: DEFAULT_PERSONAL_WORKSPACE,
  userOrganizations: [],
  switchWorkspace: () => {},
  refreshWorkspaces: async () => {},
  isLoadingWorkspaces: true,
});

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>(DEFAULT_PERSONAL_WORKSPACE);
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState<boolean>(true);

  const loadWorkspaces = async () => {
    setIsLoadingWorkspaces(true);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setActiveWorkspace(DEFAULT_PERSONAL_WORKSPACE);
      setUserOrganizations([]);
      setIsLoadingWorkspaces(false);
      return;
    }

    try {
      const orgs = await fetchUserOrganizations(currentUser.uid);
      setUserOrganizations(orgs);

      // Check saved preference in localStorage
      const savedWorkspaceId = typeof window !== "undefined" ? localStorage.getItem("pairform_active_workspace_id") : null;

      if (savedWorkspaceId && savedWorkspaceId !== "personal") {
        const matchedOrg = orgs.find((o) => o.id === savedWorkspaceId);
        if (matchedOrg) {
          const members = await fetchOrgMembers(matchedOrg.id);
          const currentMember = members.find((m) => m.userId === currentUser.uid);
          setActiveWorkspace({
            id: matchedOrg.id,
            name: matchedOrg.name,
            type: "organization",
            role: currentMember?.role || "member",
            branding: matchedOrg.branding,
          });
          setIsLoadingWorkspaces(false);
          return;
        }
      }

      // Default back to personal
      setActiveWorkspace(DEFAULT_PERSONAL_WORKSPACE);
    } catch (err) {
      console.error("Error loading workspaces:", err);
      setActiveWorkspace(DEFAULT_PERSONAL_WORKSPACE);
    } finally {
      setIsLoadingWorkspaces(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadWorkspaces();
      } else {
        setActiveWorkspace(DEFAULT_PERSONAL_WORKSPACE);
        setUserOrganizations([]);
        setIsLoadingWorkspaces(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const switchWorkspace = async (workspace: Workspace) => {
    let targetWorkspace = { ...workspace };
    const currentUser = auth.currentUser;

    if (workspace.type === "organization" && currentUser) {
      const matchedOrg = userOrganizations.find((o) => o.id === workspace.id);
      let role = workspace.role || matchedOrg?.userRole;

      if (!role) {
        if (matchedOrg?.createdBy === currentUser.uid) {
          role = "admin";
        } else {
          try {
            const members = await fetchOrgMembers(workspace.id);
            const currentMember = members.find((m) => m.userId === currentUser.uid);
            role = currentMember?.role || (matchedOrg?.createdBy === currentUser.uid ? "admin" : "member");
          } catch (e) {
            role = matchedOrg?.createdBy === currentUser.uid ? "admin" : "member";
          }
        }
      }
      targetWorkspace.role = role;
    }

    setActiveWorkspace(targetWorkspace);
    if (typeof window !== "undefined") {
      localStorage.setItem("pairform_active_workspace_id", workspace.id);
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspace,
        userOrganizations,
        switchWorkspace,
        refreshWorkspaces: loadWorkspaces,
        isLoadingWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
