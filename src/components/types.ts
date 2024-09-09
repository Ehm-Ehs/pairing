export interface User {
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
  } 
  export interface Participant {
    id: string;
    number: number;
  }
  
  export interface Pairing {
    groupingPurpose: string;
    numGroups: number;
    numParticipants: number;
    pairings: { [groupNumber: string]: Participant[] }; 
  }
  
  export interface GroupingsPageProps {
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
    pairings: Pairing[];
  }
 
 
  
export interface HomeProps {
    data: GroupingsPageProps | null;
}