"use client";

import { Suspense } from "react";
import JoinSuccess from "../_components/JoinSuccess";

export default function JoinSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JoinSuccess />
    </Suspense>
  );
}
