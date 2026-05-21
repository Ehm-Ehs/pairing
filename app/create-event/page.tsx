"use client";

import NextProtectedRoute from "../../src/components/routes/NextProtectedRoute";
import CreateParing from "../home/_components/createParing";

export default function CreateEventPage() {
  return (
    <NextProtectedRoute>
      {(user) => <CreateParing user={user} />}
    </NextProtectedRoute>
  );
}
