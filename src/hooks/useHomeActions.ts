import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { generateSecretSantaPairs } from "../services/endpoints";
import { getFriendlyFirebaseErrorMessage } from "../utils/firebaseErrorUtils";
import { GroupingsPageProps } from "../types";

export const useHomeActions = () => {
  const router = useRouter();

  const handleCreateNew = () => {
    router.push("/create-event");
  };

  const handleGeneratePairs = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.uid) {
      toast.error("User not found");
      return;
    }
    try {
      const pairing = await generateSecretSantaPairs(user.uid, eventId);
      toast.success("Pairs generated successfully!");

      // Send notifications to all participants via selected notification channel
      if (pairing && pairing.pairs) {
        Promise.all([
          import("../services/notificationDispatcher"),
          import("../services/emailTemplates"),
        ]).then(([{ dispatchNotification }, { getPairingEmail }]) => {
          const title = pairing.title || "Secret Santa Event";
          const channel = pairing.notificationChannel || "both";

          pairing.pairs.forEach((pair: any) => {
            const santa = pairing.participants.find((p: any) => p.id === pair.santaId);
            const receiver = pairing.participants.find((p: any) => p.id === pair.receiverId);
            if (santa && receiver) {
              const textMsg = `🎅 *Secret Santa Assignment: ${title}*\n\nHi ${santa.name}! Your Secret Santa pair has been drawn.\n\n🎁 *You are buying a gift for: ${receiver.name}*\n\nKeep it a secret and have fun!`;
              const emailTemplate = getPairingEmail(title, santa.name, receiver.name, true);

              dispatchNotification({
                recipient: { name: santa.name, email: santa.email, phone: santa.phone || santa.email },
                eventTitle: title,
                subject: emailTemplate.subject,
                textMessage: textMsg,
                htmlMessage: emailTemplate.html,
                channel: channel,
              });
            }
          });
        });
      }
    } catch (error: any) {
      console.error("Error generating pairs:", error);
      toast.error(getFriendlyFirebaseErrorMessage(error));
    }
  };

  const handleShare = (index: number) => {
    router.push(`/your-pairing?index=${index}`);
  };

  const calculateTotalStats = (events: GroupingsPageProps["pairings"]) => {
    // This logic was in Home.tsx
    let totalFilledSlots = 0;
    let totalSlots = 0;

    events.forEach((event) => {
      if (event.type === "secret-santa") {
        totalSlots += event.config?.expectedParticipants || 0;
        totalFilledSlots += event.participants?.length || 0;
      } else if (event.type === "random-positioning") {
        totalFilledSlots += event.participants?.length || 0;
        // As discussed in home.tsx logic
        totalSlots += event.participants?.length || 0;
      } else {
        totalSlots += parseInt(event.numParticipants.toString());

        let currentEventFilled = 0;
        Object.values(event.groups || {}).forEach((group) => {
          // Only count participants that have a name (not placeholders)
          currentEventFilled += group.filter((p: any) => p.name).length;
        });
        totalFilledSlots += currentEventFilled;
      }
    });

    return { totalSlots, totalFilledSlots };
  };

  return {
    handleCreateNew,
    handleGeneratePairs,
    handleShare,
    calculateTotalStats,
  };
};
