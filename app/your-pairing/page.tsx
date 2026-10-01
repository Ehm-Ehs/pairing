"use client";

import React, { Suspense } from "react";
import NextProtectedRoute from "../../src/components/routes/NextProtectedRoute";
import Result from "../result/_components/Result";

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500 font-semibold animate-pulse">Loading event...</div>}>
      <NextProtectedRoute>{(user) => <Result data={user} />}</NextProtectedRoute>
    </Suspense>
  );
}
