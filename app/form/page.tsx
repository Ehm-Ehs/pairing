"use client";

import { Suspense } from "react";
import ParticipantForm from "../user/page";

export default function FormPage() {
  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <ParticipantForm />
    </Suspense>
  );
}
