"use client";
import React, { Suspense } from "react";
import Result from "./_components/Result";
import NextProtectedRoute from "../../src/components/routes/NextProtectedRoute";

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading result...</div>}>
      <NextProtectedRoute>
        {(user) => <Result data={user} />}
      </NextProtectedRoute>
    </Suspense>
  );
}
