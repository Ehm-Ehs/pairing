import { errorMessage } from "@/utils/errors";
import { useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "@/services/api";
import { TokenPack } from "@/types/tokenTypes";
import { logger } from "@/utils/logger";

interface CheckoutAccount {
  /** False for guests: they are asked to log in instead of being sent to checkout. */
  canPurchase: boolean;
  accountType: "user" | "org";
  /** The organization id when buying for an org. Personal purchases use the signed-in user. */
  accountId?: string;
}

/**
 * Starts a Paystack checkout for a token pack and sends the browser to it.
 * Shared by the pricing page and the top-up modal.
 */
export function useTokenCheckout(account: CheckoutAccount) {
  const [loadingPackId, setLoadingPackId] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const buyPack = async (pack: TokenPack) => {
    if (!account.canPurchase) {
      setShowLoginPrompt(true);
      return;
    }

    setLoadingPackId(pack.id);
    try {
      const data = await apiFetch<{ authorizationUrl?: string }>("/api/payments/paystack/initialize", {
        auth: "required",
        body: { packId: pack.id, accountType: account.accountType, accountId: account.accountId },
      });
      if (!data.authorizationUrl) throw new Error("Failed to initialize checkout session");
      window.location.assign(data.authorizationUrl);
    } catch (error) {
      logger.error("Paystack Checkout Error:", error);
      toast.error(errorMessage(error) || "Could not launch checkout");
    } finally {
      setLoadingPackId(null);
    }
  };

  return { loadingPackId, buyPack, showLoginPrompt, closeLoginPrompt: () => setShowLoginPrompt(false) };
}
