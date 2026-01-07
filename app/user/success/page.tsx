"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../src/components/ui/card";
import { Button } from "../../../src/components/ui/button";
import { FaCheckCircle } from "react-icons/fa";

const SuccessContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const groupName = searchParams.get("groupName");
  const role = searchParams.get("role");
  const eventName = searchParams.get("eventName");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <FaCheckCircle className="text-green-500 text-5xl" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Registration Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            You have successfully joined{" "}
            <strong>{eventName || "the event"}</strong>.
          </p>

          <div className="bg-blue-50 p-4 rounded-lg space-y-2 border border-blue-100">
            {groupName && (
              <div className="flex justify-between">
                <span className="text-gray-500">Group:</span>
                <span className="font-semibold text-gray-900">{groupName}</span>
              </div>
            )}
            {role && (
              <div className="flex justify-between">
                <span className="text-gray-500">Role:</span>
                <span className="font-semibold text-gray-900">{role}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500">
            You will receive an email confirmation shortly.
          </p>

          <Button
            onClick={() => router.push("/")}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default function UserSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
