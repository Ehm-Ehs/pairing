"use client";

import NextProtectedRoute from "../../src/components/routes/NextProtectedRoute";
import Result from "../result/_components/Result";

export default function ResultPage() {
  return (
    <NextProtectedRoute>{(user) => <Result data={user} />}</NextProtectedRoute>
  );
}
