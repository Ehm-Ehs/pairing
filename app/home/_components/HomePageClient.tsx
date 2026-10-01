"use client";

import NextProtectedRoute from "../../../src/components/routes/NextProtectedRoute";
import Home from "./home";

export default function HomePageClient() {
  return (
    <NextProtectedRoute>{(user) => <Home data={user} />}</NextProtectedRoute>
  );
}
