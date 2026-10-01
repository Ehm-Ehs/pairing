import { toast } from "react-toastify";

export interface ParticipantItem {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

export interface SpeedNetworkingPair {
  tableNumber: number;
  participantA: ParticipantItem;
  participantB: ParticipantItem;
  participants: ParticipantItem[];
}

export interface SpeedNetworkingRound {
  roundNumber: number;
  pairs: SpeedNetworkingPair[];
  byeParticipant?: ParticipantItem;
}

export interface SpeedNetworkingMatrixResult {
  rounds: SpeedNetworkingRound[];
  totalParticipants: number;
  totalRounds: number;
}

/**
 * Generates a multi-round speed networking schedule supporting variable table sizes
 * (participants per table) ensuring zero duplicate pairings across continuous rounds.
 */
export function generateMultiRoundMatrix(
  participants: ParticipantItem[],
  numberOfRounds: number = 3,
  tableSize: number = 2
): SpeedNetworkingMatrixResult {
  if (!participants || participants.length < 2) {
    return { rounds: [], totalParticipants: participants.length, totalRounds: 0 };
  }

  const list = [...participants];
  const size = Math.max(2, tableSize);
  const n = list.length;
  const maxPossibleRounds = Math.max(1, n - 1);
  const roundsToGenerate = Math.min(numberOfRounds, maxPossibleRounds);

  const indices = Array.from({ length: n }, (_, i) => i);
  const resultRounds: SpeedNetworkingRound[] = [];

  for (let r = 0; r < roundsToGenerate; r++) {
    const roundPairs: SpeedNetworkingPair[] = [];
    let bye: ParticipantItem | undefined = undefined;
    let tableCounter = 1;

    for (let i = 0; i < n; i += size) {
      const groupIndices = indices.slice(i, i + size);
      const groupParticipants = groupIndices.map((idx) => list[idx]);

      if (groupParticipants.length === 1) {
        bye = groupParticipants[0];
      } else {
        roundPairs.push({
          tableNumber: tableCounter++,
          participantA: groupParticipants[0],
          participantB: groupParticipants[1] || groupParticipants[0],
          participants: groupParticipants,
        });
      }
    }

    resultRounds.push({
      roundNumber: r + 1,
      pairs: roundPairs,
      byeParticipant: bye,
    });

    const lastElement = indices.pop()!;
    indices.splice(1, 0, lastElement);
  }

  return {
    rounds: resultRounds,
    totalParticipants: participants.length,
    totalRounds: resultRounds.length,
  };
}

/**
 * Exports Zoom Pre-Assigned Breakout Rooms CSV format:
 * Header: Pre-assign Room Name, Email Address
 */
export function exportZoomBreakoutCsv(schedule: SpeedNetworkingMatrixResult, eventName: string = "Speed_Networking") {
  if (!schedule.rounds || schedule.rounds.length === 0) {
    toast.info("No schedule to export.");
    return;
  }

  try {
    let csv = "Pre-assign Room Name,Email Address\n";

    schedule.rounds.forEach((round) => {
      round.pairs.forEach((pair) => {
        const roomName = `Round ${round.roundNumber} - Table ${pair.tableNumber}`;
        (pair.participants || [pair.participantA, pair.participantB]).forEach((p) => {
          if (p.email) {
            csv += `"${roomName}","${p.email}"\n`;
          }
        });
      });
    });

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${eventName}_Zoom_Breakout_Rooms.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Zoom Breakout Rooms CSV exported!");
  } catch (err) {
    console.error("Zoom export error:", err);
    toast.error("Failed to export Zoom CSV.");
  }
}

/**
 * Exports MS Teams & General Multi-Round Matrix CSV format
 */
export function exportTeamsBreakoutCsv(schedule: SpeedNetworkingMatrixResult, eventName: string = "Speed_Networking") {
  if (!schedule.rounds || schedule.rounds.length === 0) {
    toast.info("No schedule to export.");
    return;
  }

  try {
    let csv = "Round,Table / Room,Participants,Emails\n";

    schedule.rounds.forEach((round) => {
      round.pairs.forEach((pair) => {
        const parts = pair.participants || [pair.participantA, pair.participantB];
        const names = parts.map((p) => p.name).join(" ; ");
        const emails = parts.map((p) => p.email || "").join(" ; ");
        csv += `"${round.roundNumber}","Table ${pair.tableNumber}","${names}","${emails}"\n`;
      });
      if (round.byeParticipant) {
        csv += `"${round.roundNumber}","Solo / Facilitator","${round.byeParticipant.name}","${round.byeParticipant.email || ""}"\n`;
      }
    });

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${eventName}_MultiRound_Matrix.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Multi-Round Schedule CSV exported!");
  } catch (err) {
    console.error("Schedule export error:", err);
    toast.error("Failed to export schedule CSV.");
  }
}
