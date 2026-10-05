"use client";

import NextProtectedRoute from "@/components/routes/NextProtectedRoute";
import Home from "./home";

export default function HomePageClient() {
  return (
    <NextProtectedRoute>{(user) => <Home data={user} />}</NextProtectedRoute>
  );
}
