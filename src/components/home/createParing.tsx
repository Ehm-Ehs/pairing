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
  characteristicsLabel: string;
}

import { Modal } from "../common/modal";

const CreateParing: React.FC = () => {
  const [formValues, setFormValues] = useState<FormValues>({
    numParticipants: "",
    numGroups: "",
    groupingPurpose: "",
    characteristicsLabel: "",
    characteristics: [{ name: "", count: "" }],
  });

  const [groups, setGroups] = useState<{
    [key: number]: { id: string; number: number; role: string }[];
  } | null>(null);

  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    description: "",
    pendingValues: null as FormValues | null,
  });

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

  const generateAndSubmit = (
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
      [key: number]: { id: string; number: number; role: string }[];
    } = {};
    for (let i = 0; i < numGroups; i++) {
      groups[i + 1] = [];
    }

    if (useCharacteristics) {
      const characteristicPools: {
        [key: string]: { id: string; number: number; role: string }[];
      } = {};

      finalCharacteristics.forEach((char) => {
        const participants = Array.from(
          { length: parseInt(char.count, 10) * numGroups },
          (_, i) => ({
            id: uuidv4(),
            number: i + 1,
            role: char.name,
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
        groups[groupNumber] = participantsPerGroup[groupNumber];
      });
    }

    setGroups(groups);

    // Update form values with potentially cleared characteristics if ignored
    const submissionValues = {
      ...values,
      characteristics: finalCharacteristics,
    };

    handleSubmitPairings(submissionValues, groups);
  };

  const handleFormSubmit = (values: FormValues) => {
    setFormValues(values);

    const numParticipants = parseInt(values.numParticipants, 10);
    const numGroups = parseInt(values.numGroups, 10);

    // Validation: Check if characteristics count matches participants per group
    const participantsPerGroup = numParticipants / numGroups;
    const totalCharacteristicsCountPerGroup = values.characteristics.reduce(
      (sum, char) => sum + (parseInt(char.count, 10) || 0),
      0
    );

    if (totalCharacteristicsCountPerGroup !== participantsPerGroup) {
      let message = "";
      if (totalCharacteristicsCountPerGroup === 0) {
        message =
          "No characteristics have been added. Do you want to continue? If you continue, groups will be created empty.";
      } else {
        message = `The characteristics count per group (${totalCharacteristicsCountPerGroup}) does not match the participants per group (${participantsPerGroup}).\n\nTotal participants required: ${
          totalCharacteristicsCountPerGroup * numGroups
        }\nTotal participants available: ${numParticipants}\n\nDo you want to continue? If you continue, characteristics will be ignored and groups will be created empty.`;
      }

      setModalState({
        isOpen: true,
        title: "Validation Warning",
        description: message,
        pendingValues: values,
      });
      return;
    }

    generateAndSubmit(values, true);
  };

  const handleModalConfirm = () => {
    if (modalState.pendingValues) {
      generateAndSubmit(modalState.pendingValues, false);
    }
    setModalState({ ...modalState, isOpen: false, pendingValues: null });
  };

  const handleModalClose = () => {
    setModalState({ ...modalState, isOpen: false, pendingValues: null });
  };

  const [loading, setLoading] = useState(false);

  // ... existing code

  const handleSubmitPairings = async (formValues: FormValues, groups: any) => {
    console.log({ formValues, groups });
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user.uid;

    if (!userId) {
      console.error("User ID not found in local storage.");
      return;
    }

    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row justify-center gap-8 md:gap-20 md:py-16 md:px-8 p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="flex flex-col justify-center items-center ">
        <div className="flex flex-col p-6 md:p-10 border rounded shadow-lg bg-white w-full">
          <FormComponent
            initialValues={formValues}
            validationSchema={validationSchema}
            onSubmit={handleFormSubmit}
            loading={loading}
          />
        </div>
      </div>
      <PairingResults formValues={formValues} groups={groups} />
      <Modal
        isOpen={modalState.isOpen}
        title={modalState.title}
        description={modalState.description}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        confirmText="Continue Anyway"
        cancelText="Edit"
      />
    </div>
  );
};

export default CreateParing;
