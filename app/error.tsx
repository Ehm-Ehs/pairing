"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FaRotateLeft, FaHouse, FaWandMagicSparkles } from "react-icons/fa6";
import { StatusPage, STATUS_PRIMARY_ACTION, STATUS_SECONDARY_ACTION } from "@/components/layout/StatusPage";
import { logger } from "@/utils/logger";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.error("App Error Boundary Caught:", error);
  }, [error]);

  return (
    <StatusPage
      icon={<FaWandMagicSparkles size={28} />}
      badge="Application Error"
      title="Something went wrong!"
      message="We encountered an unexpected glitch loading this page. Don't worry, your data and events remain completely safe."
    >
      <button type="button" onClick={() => reset()} className={STATUS_PRIMARY_ACTION}>
        <FaRotateLeft size={14} />
        <span>Try Again</span>
      </button>
      <Link href="/" className={STATUS_SECONDARY_ACTION}>
        <FaHouse size={14} className="text-slate-500" />
        <span>Back to Home</span>
      </Link>
    </StatusPage>
  );
}
