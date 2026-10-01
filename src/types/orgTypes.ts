export type OrgRole = "admin" | "member";

export type OrgStatus = "active" | "archived";

export type InviteStatus = "pending" | "accepted" | "cancelled" | "expired";

export interface OrganizationBranding {
  logoUrl?: string;
  primaryColor?: string;
}

export interface OrganizationIntegrations {
  whatsappApiToken?: string;
  whatsappPhoneNumberId?: string;
  whatsappApiUrl?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  branding?: OrganizationBranding;
  integrations?: OrganizationIntegrations;
  status: OrgStatus;
  createdBy: string;
  createdAt: number;
  updatedAt?: number;
  userRole?: OrgRole;
}

export interface OrgMember {
  id: string; // `${orgId}_${userId}`
  orgId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  role: OrgRole;
  joinedAt: number;
}

export interface OrgInvite {
  id: string;
  orgId: string;
  orgName: string;
  email: string;
  role: OrgRole;
  token: string;
  status: InviteStatus;
  invitedBy: string;
  createdAt: number;
  expiresAt?: number;
}

export interface Workspace {
  id: string; // 'personal' OR orgId
  name: string;
  type: "personal" | "organization";
  role?: OrgRole;
  branding?: OrganizationBranding;
}
