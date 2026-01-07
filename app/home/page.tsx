"use client";

import NextProtectedRoute from "../../src/components/routes/NextProtectedRoute";
import Home from "./_components/home";

export default function HomePage() {
  return (
    <NextProtectedRoute>{(user) => <Home data={user} />}</NextProtectedRoute>
  );
}
