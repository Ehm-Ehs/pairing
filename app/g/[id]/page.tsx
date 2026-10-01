"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";

export default function GroupRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  useEffect(() => {
    const rawId = resolvedParams.id;
    if (!rawId) {
      router.push("/");
      return;
    }

    try {
      let decoded = rawId;
      try {
        decoded = atob(rawId);
      } catch {
        decoded = decodeURIComponent(rawId);
      }

      // Check if formatted as eventName___groupKey or eventName_groupKey
      const parts = decoded.split("___");
      if (parts.length >= 2) {
        const eventName = parts[0];
        const groupKey = parts.slice(1).join("___");
        router.push(`/form?groupingPurpose=${encodeURIComponent(eventName)}&group=${encodeURIComponent(groupKey)}`);
      } else {
        const underscoreParts = decoded.split("_Group");
        if (underscoreParts.length >= 2) {
          const eventName = underscoreParts[0].replace(/_/g, " ");
          const groupKey = `Group ${underscoreParts[1]}`;
          router.push(`/form?groupingPurpose=${encodeURIComponent(eventName)}&group=${encodeURIComponent(groupKey)}`);
        } else {
          router.push(`/form?groupingPurpose=${encodeURIComponent(decoded.replace(/_/g, " "))}`);
        }
      }
    } catch {
      router.push("/");
    }
  }, [resolvedParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600 font-semibold text-sm">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p>Loading your assigned group...</p>
      </div>
    </div>
  );
}
