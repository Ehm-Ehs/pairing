import type { Metadata } from "next";
import { Suspense } from "react";
import SharePageClient from "./_components/SharePageClient";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ groupingPurpose?: string }>;
}): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const title = resolvedParams.groupingPurpose
    ? `${resolvedParams.groupingPurpose} | PairForm`
    : "Shared Event | PairForm";

  return {
    title,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function SharePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SharePageClient />
    </Suspense>
  );
}
