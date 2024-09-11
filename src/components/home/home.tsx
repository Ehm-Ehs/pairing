import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import * as Yup from "yup";
import { addPairing } from "../api/endpoints";
import FormComponent from "./form";
import PairingResults from "./pairings";

// Define the types
interface Characteristic {
  name: string;
  count: string;
}

interface FormValues {
  numParticipants: string;
  numGroups: string;
  groupingPurpose: string;
  characteristics: Characteristic[];
}

const Home: React.FC = () => {
  const [formValues, setFormValues] = useState<FormValues>({
    numParticipants: "",
    numGroups: "",
    groupingPurpose: "",
    characteristics: [{ name: "", count: "" }],
  });

  const [groups, setGroups] = useState<{
    [key: number]: { id: string; number: number; role: string }[];
  } | null>(null);

  const validationSchema = Yup.object({
    numParticipants: Yup.number()
      .positive("Number of participants must be greater than zero")
      .integer("Number of participants must be an integer")
      .required("Number of participants is required"),
    numGroups: Yup.number()
      .positive("Number of groups must be greater than zero")
      .integer("Number of groups must be an integer")
      .required("Number of groups is required")
      .test(
        "divisible",
        "Number of participants must be divisible by number of groups",
        function (numGroups) {
          const { numParticipants } = this.parent;
          if (numGroups === 0) return false;
          return Number(numParticipants) % numGroups === 0;
        }
      ),
    groupingPurpose: Yup.string().required("Group purpose is required"),
    characteristics: Yup.array().of(
      Yup.object({
        name: Yup.string().required("Characteristic name is required"),
        count: Yup.number()
          .positive("Count must be greater than zero")
          .integer("Count must be an integer")
          .required("Count is required"),
      })
    ),
  });

  const handleFormSubmit = (values: FormValues) => {
    setFormValues(values);
  };

  const handleSubmitPairings = async (formValues: FormValues, groups: any) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user.uid;

    if (!userId) {
      console.error("User ID not found in local storage.");
      return;
    }

    const submissionData = {
      ...formValues,
      groups,
    };
    console.log({ submissionData });
    try {
      const response = await addPairing(userId, submissionData);
      console.log("Submission successful", response);
    } catch (error) {
      console.error("Error during submission:", error);
    }
  };

  const handleGetPairing = () => {
    const numParticipants = parseInt(formValues.numParticipants, 10);
    const numGroups = parseInt(formValues.numGroups, 10);

    if (
      isNaN(numParticipants) ||
      isNaN(numGroups) ||
      numParticipants <= 0 ||
      numGroups <= 0
    ) {
      console.error("Invalid number of participants or groups.");
      return;
    }

    const characteristicPools: {
      [key: string]: { id: string; number: number; role: string }[];
    } = {};

    formValues.characteristics.forEach((char) => {
      const participants = Array.from(
        { length: parseInt(char.count, 10) },
        (_, i) => ({
          id: uuidv4(),
          number: i + 1,
          role: char.name,
        })
      );
      characteristicPools[char.name] = participants;
    });

    const groups: {
      [key: number]: { id: string; number: number; role: string }[];
    } = {};
    for (let i = 0; i < numGroups; i++) {
      groups[i + 1] = [];
    }

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
    formValues.characteristics.forEach((char) => {
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
      groups[groupNumber] = participantsPerGroup[groupNumber];
    });

    setGroups(groups);
    handleSubmitPairings(formValues, groups);
  };

  return (
    <div className="flex flex-col justify-center items-center">
      <h1 className="text-2xl mb-6">Group Raffle</h1>
      <div className="flex flex-col pb-10 px-10 mt-5">
        <FormComponent
          initialValues={formValues}
          validationSchema={validationSchema}
          onSubmit={handleFormSubmit}
        />
        <button
          onClick={handleGetPairing}
          className="bg-blue-700 text-white p-2 rounded mt-4 hover:bg-blue-800"
        >
          Get Pairings
        </button>
      </div>
      <PairingResults formValues={formValues} groups={groups} />
    </div>
  );
};

export default Home;
