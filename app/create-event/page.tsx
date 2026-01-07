"use client";

import NextProtectedRoute from "../../src/components/routes/NextProtectedRoute";
import CreateParing from "../home/_components/createParing";

export default function CreateEventPage() {
  return (
    <NextProtectedRoute>
      {/* CreateParing doesn't currently use the user prop directly, but it uses hooks that access auth */}
      {() => <CreateParing />}
    </NextProtectedRoute>
  );
}
