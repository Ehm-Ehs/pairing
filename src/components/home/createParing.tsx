import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import * as Yup from "yup";
import { addPairing } from "../api/endpoints";
import FormComponent from "./form";
import PairingResults from "./pairings";
import { ModeSelection } from "./ModeSelection";
import SecretSantaForm from "./SecretSantaForm";
import { Pairing, RoleBasedPairing, SecretSantaPairing } from "../../types";

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
  const [eventType, setEventType] = useState<
    "role-based" | "secret-santa" | null
  >(null);

  const [formValues, setFormValues] = useState<FormValues>({
    numParticipants: "",
    numGroups: "",
    groupingPurpose: "",
    characteristicsLabel: "",
    characteristics: [{ name: "", count: "" }], // Start with one empty char
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

    handleSubmitRoleBased(submissionValues, groups);
  };

  const handleFormSubmit = (values: FormValues) => {
    setFormValues(values);

    const numParticipants = parseInt(values.numParticipants, 10);
    const numGroups = parseInt(values.numGroups, 10);

    // Validation: Check if characteristics count matches participants per group
    // (Only if characteristics are present)
    const hasCharacteristics =
      values.characteristics.length > 0 &&
      values.characteristics.some((c) => c.name && parseInt(c.count, 10) > 0);

    if (!hasCharacteristics) {
      // Logic for no characteristics (simple division) goes here or we just warn?
      // For now, if no characteristics, we treat as 0 sum.
    }

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

  const handleSubmitRoleBased = async (formValues: FormValues, groups: any) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user.uid;
    if (!userId) return;

    setLoading(true);

    const newPairing: RoleBasedPairing = {
      id: uuidv4(),
      createdAt: Date.now(),
      type: "role-based",
      title: formValues.groupingPurpose,
      groupingPurpose: formValues.groupingPurpose,
      numParticipants: parseInt(formValues.numParticipants, 10),
      numGroups: parseInt(formValues.numGroups, 10),
      characteristics: formValues.characteristics.map((c) => ({
        name: c.name,
        count: parseInt(c.count, 10),
      })),
      characteristicsLabel: formValues.characteristicsLabel,
      groups: groups,
    };

    try {
      await addPairing(userId, newPairing);
    } catch (error) {
      console.error("Error during submission:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSecretSanta = async (values: any) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user.uid;
    if (!userId) return;

    setLoading(true);

    const newPairing: SecretSantaPairing = {
      id: uuidv4(),
      createdAt: Date.now(),
      type: "secret-santa",
      title: values.title,
      groupingPurpose: values.title,
      status: "open",
      participants: [],
      config: {
        allowWishlist: values.allowWishlist,
        budget: "",
        exchangeDate: "",
        expectedParticipants: parseInt(values.expectedParticipants, 10),
      },
      // We set dummy/default values for base pairing props if needed or just use the union type
    };

    try {
      await addPairing(userId, newPairing);

      // Get the latest user data to find the index of the new pairing
      // Since addPairing uses arrayUnion, it should be the last one
      // However, we don't have the updated user object here instantly unless we refetch or trust it's last.
      // A safer bet is to redirect to home or find it by ID if possible, but /your-pairing uses index.
      // Let's redirect to home for now, or fetch user and redirect.
      // Actually, standard flow is usually redirect to dashboard.
      // User requested "move to show the empty participant spots".
      // Let's look at how we can get the index.
      // We can't easily get the new index without refetching.
      // But we can redirect to /home, and from there user sees it.
      // Wait, user explicitly asked to "move to show...".
      // "show the empty participant spots" is likely the Result page.
      // Let's rely on it being the last one?
      // Or we can navigate to /home first.
      // Let's try navigating to /your-pairing with "index=latest" (need to support that) or just reload.

      // For now, let's redirect to /home. The user said "move to show...".
      // Maybe they mean immediately?
      // If `addPairing` was successful, the data is in Firestore.
      // If we navigation to `/your-pairing`, `App` subscribes to user doc.
      // It should get the update.
      // So if we pass `?index=${existingLength}`, it works.

      // Redirect to the result page using the new ID
      // We use window.location.href or just navigate?
      // navigate allows react-router to handle it without reload,
      // but we need to ensure the new data is fetched.
      // Since App.tsx has a listener on the user doc, it should update automatically.
      window.location.href = `/your-pairing?id=${newPairing.id}`;
      // navigate("/home");

      // Actually, let's try to be smart.
      // We can just go to /home. The user will click "View".
      // But the user asked to "move to show...".
      // Let's redirect to /your-pairing but we need the index.
      // We don't have it.

      // Let's redirect to `/your-pairing` and maybe implement "latest" handling or search by ID?
      // The `Result` component accepts `data`. `data` comes from `App`.
      // If we add `?eventId=...`, `Result` can pick it up.

      // Let's do that. Update Result to support eventId query param?
      // Existing Result logic: `const indexParam = queryParams.get("index");`

      // Modification Plan:
      // 1. Update Result.tsx to support `?id=` param.
      // 2. Here, navigate to `/your-pairing?id=${newPairing.id}`

      // But for this step, let's just create the redirection logic here first.
    } catch (error) {
      console.error("Error creating Secret Santa:", error);
    } finally {
      setLoading(false);
    }
  };

  // Render logic
  if (!eventType) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <ModeSelection onSelect={setEventType} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row justify-center gap-8 md:gap-20 md:py-16 md:px-8 p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="flex flex-col justify-center items-center w-full max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="w-full flex justify-start mb-4">
          <button
            onClick={() => setEventType(null)}
            className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
          >
            &larr; Back to Event Type
          </button>
        </div>

        {eventType === "role-based" ? (
          <>
            <div className="flex flex-col p-6 md:p-10 border rounded shadow-lg bg-white w-full">
              <FormComponent
                initialValues={formValues}
                validationSchema={validationSchema}
                onSubmit={handleFormSubmit}
                loading={loading}
              />
            </div>
            <PairingResults formValues={formValues} groups={groups} />
          </>
        ) : (
          <div className="flex flex-col p-6 md:p-10 border rounded shadow-lg bg-white w-full">
            <SecretSantaForm
              initialValues={{
                title: "",
                expectedParticipants: "10",
                allowWishlist: true,
              }}
              onSubmit={handleSubmitSecretSanta}
              loading={loading}
            />
          </div>
        )}
      </div>

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
