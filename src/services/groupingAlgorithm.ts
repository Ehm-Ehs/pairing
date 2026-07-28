import { v4 as uuidv4 } from "uuid";

interface Characteristic {
  name: string;
  count: string;
}

interface FormValues {
  numParticipants: string;
  numGroups: string;
  characteristics: Characteristic[];
}

export const generateGroupings = (
  values: FormValues,
  useCharacteristics: boolean
) => {
  const numGroups = parseInt(values.numGroups, 10);

  let finalCharacteristics = values.characteristics;
  if (!useCharacteristics) {
    finalCharacteristics = [];
  }

  // Generate Pairings / Groups
  const groups: {
    [key: string]: { id: string; number: number; role: string }[];
  } = {};
  for (let i = 0; i < numGroups; i++) {
    groups[`group_${i + 1}`] = [];
  }

  if (useCharacteristics && finalCharacteristics.length > 0) {
    const characteristicPools: {
      [key: string]: { id: string; number: number; role: string }[];
    } = {};

    finalCharacteristics.forEach((char) => {
      const participants = Array.from(
        { length: parseInt(char.count, 10) * numGroups },
        (_, i) => ({
          id: uuidv4(),
          number: i + 1,
          role: char.name.trim(),
        })
      );
      characteristicPools[char.name] = participants;
    });

    // Flatten the pools into a single array
    const allParticipants = Object.values(characteristicPools).flat();

    // Shuffle participants to ensure random distribution
    const shuffledParticipants = allParticipants.sort(
      () => Math.random() - 0.5
    );

    // Ensure each group has at least one characteristic from each type
    const participantsPerGroup: {
      [key: number]: { id: string; number: number; role: string }[];
    } = {};
    finalCharacteristics.forEach((char) => {
      const chars = characteristicPools[char.name];
      for (let i = 0; i < numGroups; i++) {
        const groupNumber = i + 1;
        if (!participantsPerGroup[groupNumber]) {
          participantsPerGroup[groupNumber] = [];
        }
        const charParticipant = chars[i % chars.length];
        participantsPerGroup[groupNumber].push(charParticipant);
      }
    });

    // Distribute remaining participants evenly
    const remainingParticipants = shuffledParticipants.filter(
      (participant) =>
        !Object.values(participantsPerGroup)
          .flat()
          .some((p) => p.id === participant.id)
    );

    remainingParticipants.forEach((participant, index) => {
      const groupNumber = (index % numGroups) + 1;
      participantsPerGroup[groupNumber].push(participant);
    });

    // Convert participantsPerGroup to the format required
    Object.keys(participantsPerGroup).forEach((key) => {
      const groupNumber = parseInt(key, 10);
      groups[`group_${groupNumber}`] = participantsPerGroup[groupNumber];
    });
  } else {
    // Random Mode: Generate Generic Slots
    const totalParticipants = parseInt(values.numParticipants, 10);
    const participantsPerGroup = Math.floor(totalParticipants / numGroups);
    const remainder = totalParticipants % numGroups;

    for (let i = 0; i < numGroups; i++) {
      const count = participantsPerGroup + (i < remainder ? 1 : 0);
      groups[`group_${i + 1}`] = Array.from({ length: count }, (_, j) => ({
        id: uuidv4(),
        number: j + 1,
        role: "", // Empty role for random
      }));
    }
  }

  return { groups, finalCharacteristics };
};
