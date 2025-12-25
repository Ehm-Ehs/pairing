export interface User {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Participant {
  id: string;
  number: number;
  role: string;
  name?: string;
  email?: string;
}

export interface SantaParticipant {
  id: string;
  name: string;
  email?: string;
  wishlist?: string;
  assignedToId?: string; // ID of the person they are buying for
}

export type EventType = "role-based" | "secret-santa";

export interface BasePairing {
  id: string;
  createdAt: number;
  type: EventType;
  title: string; // Was groupingPurpose. Using title as the main display name.
  groupingPurpose: string; // Kept for backward compatibility, same as title.
}

export interface RoleBasedPairing extends BasePairing {
  type: "role-based";
  characteristics: { count: number; name: string }[];
  characteristicsLabel?: string;
  numGroups: number;
  numParticipants: number;
  groups: { [key: number]: Participant[] };
}

export interface SecretSantaPairing extends BasePairing {
  type: "secret-santa";
  participants: SantaParticipant[];
  config: {
    budget?: string;
    exchangeDate?: string;
    allowWishlist: boolean;
    expectedParticipants: number;
  };
  pairs?: { santaId: string; receiverId: string }[];
  status: "open" | "locked";
}

export type Pairing = RoleBasedPairing | SecretSantaPairing;

export interface GroupingsPageProps {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  pairings: Pairing[];
}

export interface HomeProps {
  data: GroupingsPageProps;
}
