import { useState } from "react";
import { GroupingsPageProps } from "../types";
import { shareToWhatsApp } from "../utils/whatsappUtils";

// Function to encrypt userId (Base64 encoding example)
const encryptData = (data: string): string => {
  return btoa(data); // Base64 encode
};

export const useResultActions = (
  data: GroupingsPageProps | null,
  selectedIndex: number | null
) => {
  const [copiedLink, setCopiedLink] = useState<number | null>(null);
  const [copiedFormUrl, setCopiedFormUrl] = useState<boolean>(false);
  const [isShortened, setIsShortened] = useState<boolean>(false);
  const [isLoadingLink, setIsLoadingLink] = useState<number | null>(null);
  const [isLoadingForm, setIsLoadingForm] = useState<number | null>(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.uid;

  const shortenUrl = async (url: string): Promise<string> => {
    try {
      const response = await fetch(
        `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
      );
      if (response.ok) {
        return await response.text();
      }
      throw new Error("Failed to shorten URL");
    } catch (error) {
      console.error("Error shortening URL:", error);
      return url; // Fallback to original URL
    }
  };

  const handleShare = async (pairingIndex: number) => {
    if (!data) return;

    const actualIndex = selectedIndex !== null ? selectedIndex : pairingIndex;
    const pairing = data.pairings[actualIndex];

    let shareableUrl = "";

    if (pairing.type === "secret-santa") {
      const config = {
        budget: pairing.config?.budget || "",
        exchangeDate: pairing.config?.exchangeDate || "",
        allowWishlist: pairing.config?.allowWishlist || false,
      };

      shareableUrl = `${
        window.location.origin
      }/share?type=secret-santa&groupingPurpose=${encodeURIComponent(
        pairing.title || "Secret Santa"
      )}&numParticipants=${
        pairing.participants?.length || 0
      }&config=${encodeURIComponent(JSON.stringify(config))}`;
    } else if (pairing.type === "random-positioning") {
      shareableUrl = `${window.location.origin}/event/rp/${userId}/${pairing.id}`;
    } else {
      // Use dynamic link for role-based events to ensure up-to-date results
      shareableUrl = `${window.location.origin}/event/results/${userId}/${pairing.id}`;
    }

    if (isShortened) {
      setIsLoadingLink(actualIndex);
      shareableUrl = await shortenUrl(shareableUrl);
      setIsLoadingLink(null);
    }

    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopiedLink(actualIndex);
      setTimeout(() => setCopiedLink(null), 3000);
    } catch (error) {
      console.error("Failed to copy the URL:", error);
      setIsLoadingLink(null);
    }
  };

  const handleFormRedirect = async (pairingIndex: number) => {
    if (!data) return;

    const actualIndex = selectedIndex !== null ? selectedIndex : pairingIndex;
    const pairing = data.pairings[actualIndex];

    let formUrl = `${window.location.origin}/event/${userId}/${pairing.id}`;

    if (isShortened) {
      setIsLoadingForm(actualIndex);
      formUrl = await shortenUrl(formUrl);
      setIsLoadingForm(null);
    }

    try {
      await navigator.clipboard.writeText(formUrl);
      setCopiedFormUrl(true);
      setTimeout(() => setCopiedFormUrl(false), 3000);
    } catch (error) {
      console.error("Failed to copy the form URL:", error);
      setIsLoadingForm(null);
    }
  };

  const handleWhatsAppShare = async (pairingIndex: number, isFormLink = true) => {
    if (!data) return;

    const actualIndex = selectedIndex !== null ? selectedIndex : pairingIndex;
    const pairing = data.pairings[actualIndex];
    if (!pairing) return;

    let targetUrl = isFormLink
      ? `${window.location.origin}/event/${userId}/${pairing.id}`
      : `${window.location.origin}/event/results/${userId}/${pairing.id}`;

    if (isShortened) {
      targetUrl = await shortenUrl(targetUrl);
    }

    shareToWhatsApp({
      pairing,
      shareUrl: targetUrl,
      isFormLink,
    });
  };

  return {
    copiedLink,
    copiedFormUrl,
    isShortened,
    setIsShortened,
    isLoadingLink,
    isLoadingForm,
    handleShare,
    handleFormRedirect,
    handleWhatsAppShare,
  };
};
