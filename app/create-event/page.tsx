"use client";

import { Suspense } from "react";
import CreateParing from "../home/_components/createParing";
import Layout from "@/components/layout/layout";
import { useAuthListener } from "@/hooks/useAuthListener";

export default function CreateEventPage() {
  const { user } = useAuthListener();

  return (
    <Layout user={user}>
      <Suspense fallback={<div className="p-8 text-center text-gray-400 font-semibold">Loading Event Creator...</div>}>
        <CreateParing user={user || undefined} />
      </Suspense>
    </Layout>
  );
}
