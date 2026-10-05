"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import NextProtectedRoute from "@/components/routes/NextProtectedRoute";
import Result from "../result/_components/Result";
import RevealAssignment from "./_components/RevealAssignment";

/**
 * Two audiences share this URL:
 * - a participant opening their private link (?id=...&t=...) sees only their own assignment;
 * - a signed-in organizer (?id=...) sees the event dashboard.
 */
function YourPairing() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("id");
  const token = searchParams.get("t");

  if (eventId && token) {
    return <RevealAssignment eventId={eventId} token={token} />;
  }
  return <NextProtectedRoute>{(user) => <Result data={user} />}</NextProtectedRoute>;
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500 font-semibold animate-pulse">Loading event...</div>}>
      <YourPairing />
    </Suspense>
  );
}
