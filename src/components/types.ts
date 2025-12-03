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
  
  export interface Pairing {
    characteristics: { count: number; name: string }[];
    groupingPurpose: string;
    numGroups: number;
    numParticipants: number;
    groups: { [key: number]: Participant[] };
  }
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