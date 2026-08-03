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
  pairIndex?: number;
  positionLetter?: "A" | "B";
}

export type EventType = "role-based" | "secret-santa" | "random-positioning";

export interface BasePairing {
  id: string;
  createdAt: number;
  type: EventType;
  title: string; // Was groupingPurpose. Using title as the main display name.
  groupingPurpose: string; // Kept for backward compatibility, same as title.
  status?: "open" | "locked";
  imageUrl?: string;
  visibilityMode?: "public" | "restricted";
  notificationChannel?: "email" | "whatsapp" | "both";
}

export interface RoleBasedPairing extends BasePairing {
  type: "role-based";
  characteristics: { count: number; name: string }[];
  characteristicsLabel?: string;
  numGroups: number;
  numParticipants: number;
  groups?: { [key: string]: Participant[] };
}

export interface RandomParticipant {
  id: string;
  name: string;
  email?: string;
  assignedNumber?: number;
  joinedAt: number;
}

export interface RandomPositioningPairing extends BasePairing {
  type: "random-positioning";
  description?: string;
  deadline?: string;
  hideNames: boolean;
  assignmentMode?: "participants-pick" | "fcfs" | "random";
  participants: RandomParticipant[];
  status: "open" | "locked";
  expectedParticipants?: number;
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

export type Pairing =
  | RoleBasedPairing
  | SecretSantaPairing
  | RandomPositioningPairing;

export interface GroupingsPageProps {
  uid?: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  pairings: Pairing[];
  isAnonymous?: boolean;
}

export interface HomeProps {
  data: GroupingsPageProps;
}
