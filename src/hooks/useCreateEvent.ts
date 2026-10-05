import { logger } from "@/utils/logger";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { addPairing } from "../services/endpoints";
import { fetchTokenLedger, canSpend } from "../services/tokenLedgerService";
import { useWorkspace } from "../context/WorkspaceContext";
import {
  BasePairing,
  EventType,
  Pairing,
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

export interface FormValues extends SharedFormOptions {
  numParticipants: string;
  numGroups: string;
  groupingPurpose: string;
  characteristicsLabel: string;
  characteristics: Characteristic[];
  isRandom?: boolean;
}

/** Options every event form can set, whatever the event type. */
interface SharedFormOptions {
  imageUrl?: string;
  isSpeedNetworking?: boolean;
  speedNetworkingRounds?: number;
}

export interface SecretSantaFormValues extends SharedFormOptions {
  title: string;
  allowWishlist: boolean;
  expectedParticipants: number | string;
}

export interface RandomPositioningFormValues extends SharedFormOptions {
  title: string;
  description?: string;
  deadline?: string;
  hideNames: boolean;
  assignmentMode?: "participants-pick" | "fcfs" | "random";
}

/** An event the user started creating; kept across the sign-in redirect. */
interface EventDraft {
  eventType: EventType;
  formValues: (FormValues | SecretSantaFormValues | RandomPositioningFormValues) & SharedFormOptions;
  groups?: RoleBasedPairing["groups"];
}

type CommonEventFields = Pick<
  BasePairing,
  "id" | "createdAt" | "imageUrl" | "visibilityMode" | "notificationChannel" | "isSpeedNetworking" | "speedNetworkingRounds"
>;

const DRAFT_KEY = "pending_event_draft";
const DRAFT_MAX_AGE_MS = 60 * 60 * 1000;
const DEFAULT_POSITION_SLOTS = 10;
const EVENT_TYPES: EventType[] = ["role-based", "secret-santa", "random-positioning"];
const toEventType = (value: string | null | undefined): EventType | null =>
  EVENT_TYPES.includes(value as EventType) ? (value as EventType) : null;

interface ModalState {
  isOpen: boolean;
  title: string;
  description: string;
  pendingValues: FormValues | null;
}

export const useCreateEvent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryType = searchParams?.get("type");
  const { activeWorkspace } = useWorkspace();

  const [eventType, setEventType] = useState<EventType | null>(() => toEventType(queryType));

  useEffect(() => {
    const next = toEventType(queryType);
    if (next) setEventType(next);
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

  const [groups, setGroups] = useState<RoleBasedPairing["groups"] | null>(null);

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

  // After signing in, finish creating the event the visitor had started while signed out.
  useEffect(() => {
    let cancelled = false;

    // Firebase restores the session asynchronously, so wait for it before deciding nobody is signed in.
    auth.authStateReady().then(() => {
      if (cancelled || !auth.currentUser) return;
      const draftStr = sessionStorage.getItem(DRAFT_KEY);
      if (!draftStr) return;
      sessionStorage.removeItem(DRAFT_KEY);

      try {
        const draft = JSON.parse(draftStr);
        if (!draft.formValues || Date.now() - (draft.timestamp || 0) >= DRAFT_MAX_AGE_MS) return;
        toast.info("Saving your event...", { position: "top-center" });

        if (draft.eventType === "role-based") handleSubmitRoleBased(draft.formValues, draft.groups);
        else if (draft.eventType === "secret-santa") handleSubmitSecretSanta(draft.formValues);
        else if (draft.eventType === "random-positioning") handleSubmitRandomPositioning(draft.formValues);
      } catch (e) {
        logger.error("Error auto-resuming event draft:", e);
      }
    });

    return () => {
      cancelled = true;
    };
    // Runs once on mount: it resumes a draft saved before the sign-in redirect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  /**
   * The steps every event type shares before it is saved: require sign-in (stashing the
   * draft so it resumes after login), warn early if the workspace is out of tokens, and
   * read the organizer's default settings. Returns null when creation should stop.
   *
   * The token check is only a hint; the server enforces the balance when participants join.
   */
  const beginCreate = async (draft: EventDraft) => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, timestamp: Date.now() }));
      } catch (e) {
        logger.warn("Could not stash pending draft:", e);
      }
      setShowAuthModal(true);
      return null;
    }

    setLoading(true);
    const defaults = {
      visibilityMode: "public" as "public" | "restricted",
      notificationChannel: "both" as "email" | "whatsapp" | "both",
    };

    try {
      const isOrg = activeWorkspace.type === "organization";
      const userData = (await getDoc(doc(db, "Users", userId))).data();
      if (userData?.settings?.defaults?.visibilityMode) defaults.visibilityMode = userData.settings.defaults.visibilityMode;
      if (userData?.settings?.defaults?.notificationChannel) {
        defaults.notificationChannel = userData.settings.defaults.notificationChannel;
      }

      const isSuperAdmin = !isOrg && (userData?.role === "super_admin" || userData?.isSuperAdmin === true);
      if (!isSuperAdmin) {
        const ledger = await fetchTokenLedger(isOrg ? "org" : "personal", isOrg ? activeWorkspace.id : userId);
        if (ledger && !canSpend(ledger, 1)) {
          toast.error(
            "You are out of tokens. Please buy a token pack to keep creating events.",
            { position: "top-center" }
          );
          setLoading(false);
          return null;
        }
      }
    } catch (err) {
      logger.warn("Could not check token balance or default settings:", err);
    }

    return { userId, defaults };
  };

  /** Saves a new event built from the shared fields plus the type-specific ones. */
  const createEvent = async <T extends Pairing>(
    draft: EventDraft,
    build: (common: CommonEventFields) => T,
    onCreated?: () => void
  ) => {
    const context = await beginCreate(draft);
    if (!context) return;

    const values = draft.formValues;
    const pairing = build({
      id: uuidv4(),
      createdAt: Date.now(),
      imageUrl: values.imageUrl || "",
      visibilityMode: context.defaults.visibilityMode,
      notificationChannel: context.defaults.notificationChannel,
      isSpeedNetworking: values.isSpeedNetworking || false,
      speedNetworkingRounds: values.speedNetworkingRounds || 3,
    });

    try {
      await addPairing(context.userId, pairing, activeWorkspace);
      onCreated?.();
      router.push(`/your-pairing?id=${pairing.id}`);
    } catch (error) {
      logger.error("Error creating event:", error);
      toast.error(getFriendlyFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRoleBased = (values: FormValues, groups: RoleBasedPairing["groups"]) =>
    createEvent<RoleBasedPairing>({ eventType: "role-based", formValues: values, groups }, (common) => ({
      ...common,
      type: "role-based",
      title: values.groupingPurpose,
      groupingPurpose: values.groupingPurpose,
      numParticipants: parseInt(values.numParticipants, 10),
      numGroups: parseInt(values.numGroups, 10),
      characteristics: values.characteristics.map((c) => ({ name: c.name.trim(), count: parseInt(c.count, 10) })),
      characteristicsLabel: values.characteristics?.length > 0 ? values.characteristicsLabel : "",
      groups,
    }));

  const handleSubmitSecretSanta = (values: SecretSantaFormValues) =>
    createEvent<SecretSantaPairing>({ eventType: "secret-santa", formValues: values }, (common) => ({
      ...common,
      type: "secret-santa",
      title: values.title,
      groupingPurpose: values.title,
      status: "open",
      participants: [],
      config: {
        allowWishlist: values.allowWishlist,
        budget: "",
        exchangeDate: "",
        expectedParticipants: parseInt(String(values.expectedParticipants), 10),
      },
    }));

  const handleSubmitRandomPositioning = (values: RandomPositioningFormValues) =>
    createEvent<RandomPositioningPairing>(
      { eventType: "random-positioning", formValues: values },
      (common) => ({
        ...common,
        type: "random-positioning",
        title: values.title,
        groupingPurpose: values.title,
        description: values.description,
        deadline: values.deadline,
        hideNames: values.hideNames,
        assignmentMode: values.assignmentMode || "participants-pick",
        status: "open",
        participants: [],
        expectedParticipants: DEFAULT_POSITION_SLOTS,
      }),
      () => {
        toast.success("Event created successfully!");
        toast.info(
          `This event has a default limit of ${DEFAULT_POSITION_SLOTS} slots. Increasing slot capacity is a feature coming soon!`,
          { autoClose: 8000 }
        );
      }
    );

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
