import { Pairing } from "../types";

interface WhatsAppShareOptions {
  pairing: Pairing;
  shareUrl: string;
  isFormLink?: boolean;
}

/**
 * Builds a formatted WhatsApp message and opens the WhatsApp web/app share interface.
 */
export const shareToWhatsApp = ({
  pairing,
  shareUrl,
  isFormLink = true,
}: WhatsAppShareOptions) => {
  const title = pairing.title || pairing.groupingPurpose || "PairForm Event";
  let message = "";

  if (isFormLink) {
    if (pairing.type === "secret-santa") {
      const isSecretSanta = pairing.config?.allowWishlist !== false;
      if (isSecretSanta) {
        message = `🎅 *Secret Santa Event: ${title}*\n\nYou're invited to join our Secret Santa! Enter your details and wishlist using the link below:\n\n👉 ${shareUrl}`;
      } else {
        message = `🎁 *Pairing Event: ${title}*\n\nJoin our pairing event and pick your spot:\n\n👉 ${shareUrl}`;
      }
    } else if (pairing.type === "random-positioning") {
      message = `🎲 *Random Positioning Event: ${title}*\n\nPick your position number for our event here:\n\n👉 ${shareUrl}`;
    } else {
      message = `👥 *Group Event: ${title}*\n\nSelect your role and claim your group spot using the link below:\n\n👉 ${shareUrl}`;
    }
  } else {
    message = `📊 *Event Results: ${title}*\n\nCheck out the latest group assignments and pairings for our event:\n\n👉 ${shareUrl}`;
  }

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
};
