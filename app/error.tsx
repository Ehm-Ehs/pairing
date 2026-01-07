"use client";

import { useEffect } from "react";
import { Button } from "../src/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-gray-50">
      <h2 className="text-2xl font-bold text-gray-900">
        Something went wrong!
      </h2>
      <p className="text-gray-500">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        Try again
      </Button>
    </div>
  );
}
