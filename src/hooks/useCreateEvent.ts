import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import { auth } from "../services/firebase";
import { addPairing } from "../services/endpoints";
import {
  RoleBasedPairing,
  SecretSantaPairing,
  RandomPositioningPairing,
} from "../types";
import { generateGroupings } from "../services/groupingAlgorithm";
import { getFriendlyFirebaseErrorMessage } from "../utils/firebaseErrorUtils";

interface Characteristic {
  name: string;
  count: string;
}

export interface FormValues {
  numParticipants: string;
  numGroups: string;
  groupingPurpose: string;
  characteristicsLabel: string;
  characteristics: Characteristic[];
  isRandom?: boolean;
}

interface ModalState {
  isOpen: boolean;
  title: string;
  description: string;
  pendingValues: FormValues | null;
}

export const useCreateEvent = () => {
  const router = useRouter();
  const [eventType, setEventType] = useState<
    "role-based" | "secret-santa" | "random-positioning" | null
  >(null);

  const [formValues, setFormValues] = useState<FormValues>({
    numParticipants: "",
    numGroups: "",
    groupingPurpose: "",
    characteristicsLabel: "",
    characteristics: [{ name: "", count: "" }],
    isRandom: false,
  });

  const [groups, setGroups] = useState<{
    [key: number]: { id: string; number: number; role: string }[];
  } | null>(null);

  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: "",
    description: "",
    pendingValues: null,
  });

  const [loading, setLoading] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to results when groups are generated
  useEffect(() => {
    if (groups && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [groups]);

  const generateAndSubmit = (
    values: FormValues,
    useCharacteristics: boolean
  ) => {
    // Call the extracted algorithm
    const { groups: generatedGroups, finalCharacteristics } = generateGroupings(
      values,
      useCharacteristics
    );

    setGroups(generatedGroups);

    const submissionValues = {
      ...values,
      characteristics: finalCharacteristics,
    };

    handleSubmitRoleBased(submissionValues, generatedGroups);
  };

  const handleFormSubmit = (values: FormValues) => {
    setFormValues(values);

    const numParticipants = parseInt(values.numParticipants, 10);
    const numGroups = parseInt(values.numGroups, 10);

    // Validation logic...
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

  const handleSubmitRoleBased = async (formValues: FormValues, groups: any) => {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      toast.error("You must be logged in to create a pairing");
      return;
    }

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
        name: c.name.trim(),
        count: parseInt(c.count, 10),
      })),
      characteristicsLabel: formValues.characteristicsLabel,
      groups: groups,
    };

    try {
      await addPairing(userId, newPairing);
    } catch (error) {
      console.error("Error during submission:", error);
      toast.error(getFriendlyFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSecretSanta = async (values: any) => {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      toast.error("You must be logged in to create a Secret Santa event");
      return;
    }

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
    };

    try {
      await addPairing(userId, newPairing);
      router.push(`/your-pairing?id=${newPairing.id}`);
    } catch (error) {
      console.error("Error creating Secret Santa:", error);
      toast.error(getFriendlyFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRandomPositioning = async (values: any) => {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      toast.error("You must be logged in to create an event");
      return;
    }

    setLoading(true);

    const newPairing: RandomPositioningPairing = {
      id: uuidv4(),
      createdAt: Date.now(),
      type: "random-positioning",
      title: values.title,
      groupingPurpose: values.title,
      description: values.description,
      deadline: values.deadline,
      hideNames: values.hideNames,
      status: "open",
      participants: [],
    };

    try {
      await addPairing(userId, newPairing);
      router.push(`/your-pairing?id=${newPairing.id}`);
    } catch (error) {
      console.error("Error creating Random Positioning event:", error);
      toast.error(getFriendlyFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return {
    eventType,
    setEventType,
    formValues,
    groups,
    modalState,
    loading,
    resultsRef,
    handleFormSubmit,
    handleModalConfirm,
    handleModalClose,
    handleSubmitSecretSanta,
    handleSubmitRandomPositioning,
  };
};
