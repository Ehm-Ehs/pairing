import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { addPairing } from "../services/endpoints";
import { useWorkspace } from "../context/WorkspaceContext";
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
  imageUrl?: string;
}

interface ModalState {
  isOpen: boolean;
  title: string;
  description: string;
  pendingValues: FormValues | null;
}

import { useSearchParams } from "next/navigation";

export const useCreateEvent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryType = searchParams?.get("type");
  const { activeWorkspace } = useWorkspace();

  const [eventType, setEventType] = useState<
    "role-based" | "secret-santa" | "random-positioning" | null
  >(() => {
    if (queryType === "role-based" || queryType === "secret-santa" || queryType === "random-positioning") {
      return queryType;
    }
    return null;
  });

  useEffect(() => {
    if (queryType === "role-based" || queryType === "secret-santa" || queryType === "random-positioning") {
      setEventType(queryType);
    }
  }, [queryType]);

  const [formValues, setFormValues] = useState<FormValues>({
    numParticipants: "",
    numGroups: "",
    groupingPurpose: "",
    characteristicsLabel: "",
    characteristics: [{ name: "", count: "" }],
    isRandom: false,
    imageUrl: "",
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

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to results when groups are generated
  useEffect(() => {
    if (groups && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [groups]);

  // Auto-resume pending draft when user logs in
  useEffect(() => {
    const handleAutoResumeDraft = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const draftStr = sessionStorage.getItem("pending_event_draft");
      if (!draftStr) return;

      try {
        const draft = JSON.parse(draftStr);
        if (Date.now() - (draft.timestamp || 0) < 3600000) {
          sessionStorage.removeItem("pending_event_draft");
          toast.info("Saving your event...", { position: "top-center" });

          if (draft.eventType === "role-based" && draft.formValues) {
            await handleSubmitRoleBased(draft.formValues, draft.groups);
          } else if (draft.eventType === "secret-santa" && draft.formValues) {
            await handleSubmitSecretSanta(draft.formValues);
          } else if (draft.eventType === "random-positioning" && draft.formValues) {
            await handleSubmitRandomPositioning(draft.formValues);
          }
        } else {
          sessionStorage.removeItem("pending_event_draft");
        }
      } catch (e) {
        console.error("Error auto-resuming event draft:", e);
        sessionStorage.removeItem("pending_event_draft");
      }
    };

    handleAutoResumeDraft();
  }, []);

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

  const checkGuestLimit = async (userId: string): Promise<boolean> => {
    try {
      const userDocRef = doc(db, "Users", userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();

        // Super Admin bypass
        if (userData.role === "super_admin" || userData.isSuperAdmin === true) {
          return false;
        }

        // Check Token Balance Rules
        const balance = typeof userData.tokenBalance === "number" ? userData.tokenBalance : 50;
        const isPaid = userData.hasEverPaid === true || (userData.tier && userData.tier !== "free");

        if (isPaid && balance < -20) {
          toast.error("Token buffer limit reached (-20 tokens)! Please top up your token balance to create new events.", {
            position: "top-center"
          });
          return true;
        }

        if (!isPaid && balance <= 0) {
          toast.error("Token balance depleted! Please purchase a token pack to continue creating events.", {
            position: "top-center"
          });
          return true;
        }
      }
    } catch (error) {
      console.error("Error checking token limit:", error);
    }
    return false;
  };

  const handleSubmitRoleBased = async (formValues: FormValues, groups: any) => {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      try {
        sessionStorage.setItem(
          "pending_event_draft",
          JSON.stringify({
            eventType: "role-based",
            formValues,
            groups,
            timestamp: Date.now(),
          })
        );
      } catch (e) {
        console.warn("Could not stash pending draft:", e);
      }
      setShowAuthModal(true);
      return;
    }

    setLoading(true);

    try {
      const limitReached = await checkGuestLimit(userId);
      if (limitReached) {
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Error during guest limit check:", err);
    }

    let userDefaults = { visibilityMode: "public" as "public" | "restricted", notificationChannel: "both" as "email" | "whatsapp" | "both" };
    try {
      const uSnap = await getDoc(doc(db, "Users", userId));
      if (uSnap.exists()) {
        const uData = uSnap.data();
        if (uData.settings?.defaults?.visibilityMode) userDefaults.visibilityMode = uData.settings.defaults.visibilityMode;
        if (uData.settings?.defaults?.notificationChannel) userDefaults.notificationChannel = uData.settings.defaults.notificationChannel;
      }
    } catch (err) {
      console.warn("Could not fetch user default settings:", err);
    }

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
      characteristicsLabel: formValues.characteristics && formValues.characteristics.length > 0 ? formValues.characteristicsLabel : "",
      groups: groups,
      imageUrl: (formValues as any).imageUrl || "",
      visibilityMode: userDefaults.visibilityMode,
      notificationChannel: userDefaults.notificationChannel,
      isSpeedNetworking: (formValues as any).isSpeedNetworking || false,
      speedNetworkingRounds: (formValues as any).speedNetworkingRounds || 3,
    };

    try {
      await addPairing(userId, newPairing, activeWorkspace);
      router.push(`/your-pairing?id=${newPairing.id}`);
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
      try {
        sessionStorage.setItem(
          "pending_event_draft",
          JSON.stringify({
            eventType: "secret-santa",
            formValues: values,
            timestamp: Date.now(),
          })
        );
      } catch (e) {
        console.warn("Could not stash pending draft:", e);
      }
      setShowAuthModal(true);
      return;
    }

    setLoading(true);

    try {
      const limitReached = await checkGuestLimit(userId);
      if (limitReached) {
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Error during guest limit check:", err);
    }

    let userDefaults = { visibilityMode: "public" as "public" | "restricted", notificationChannel: "both" as "email" | "whatsapp" | "both" };
    try {
      const uSnap = await getDoc(doc(db, "Users", userId));
      if (uSnap.exists()) {
        const uData = uSnap.data();
        if (uData.settings?.defaults?.visibilityMode) userDefaults.visibilityMode = uData.settings.defaults.visibilityMode;
        if (uData.settings?.defaults?.notificationChannel) userDefaults.notificationChannel = uData.settings.defaults.notificationChannel;
      }
    } catch (err) {
      console.warn("Could not fetch user default settings:", err);
    }

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
      imageUrl: values.imageUrl || "",
      visibilityMode: userDefaults.visibilityMode,
      notificationChannel: userDefaults.notificationChannel,
      isSpeedNetworking: values.isSpeedNetworking || false,
      speedNetworkingRounds: values.speedNetworkingRounds || 3,
    };

    try {
      await addPairing(userId, newPairing, activeWorkspace);
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
      try {
        sessionStorage.setItem(
          "pending_event_draft",
          JSON.stringify({
            eventType: "random-positioning",
            formValues: values,
            timestamp: Date.now(),
          })
        );
      } catch (e) {
        console.warn("Could not stash pending draft:", e);
      }
      setShowAuthModal(true);
      return;
    }

    setLoading(true);

    try {
      const limitReached = await checkGuestLimit(userId);
      if (limitReached) {
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Error during guest limit check:", err);
    }

    let userDefaults = { visibilityMode: "public" as "public" | "restricted", notificationChannel: "both" as "email" | "whatsapp" | "both" };
    try {
      const uSnap = await getDoc(doc(db, "Users", userId));
      if (uSnap.exists()) {
        const uData = uSnap.data();
        if (uData.settings?.defaults?.visibilityMode) userDefaults.visibilityMode = uData.settings.defaults.visibilityMode;
        if (uData.settings?.defaults?.notificationChannel) userDefaults.notificationChannel = uData.settings.defaults.notificationChannel;
      }
    } catch (err) {
      console.warn("Could not fetch user default settings:", err);
    }

    const newPairing: RandomPositioningPairing = {
      id: uuidv4(),
      createdAt: Date.now(),
      type: "random-positioning",
      title: values.title,
      groupingPurpose: values.title,
      description: values.description,
      deadline: values.deadline,
      hideNames: values.hideNames,
      assignmentMode: values.assignmentMode || "participants-pick",
      status: "open",
      participants: [],
      imageUrl: values.imageUrl || "",
      expectedParticipants: 10,
      visibilityMode: userDefaults.visibilityMode,
      notificationChannel: userDefaults.notificationChannel,
      isSpeedNetworking: values.isSpeedNetworking || false,
      speedNetworkingRounds: values.speedNetworkingRounds || 3,
    };

    try {
      await addPairing(userId, newPairing, activeWorkspace);
      toast.success("Event created successfully!");
      toast.info("This event has a default limit of 10 slots. Increasing slot capacity is a feature coming soon!", {
        autoClose: 8000,
      });
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
    showAuthModal,
    setShowAuthModal,
    handleFormSubmit,
    handleModalConfirm,
    handleModalClose,
    handleSubmitSecretSanta,
    handleSubmitRandomPositioning,
  };
};
