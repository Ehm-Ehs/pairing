import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../src/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../../src/components/ui/card";
import { FaCheck, FaCopy } from "react-icons/fa";

const capitalizeWords = (str: string) => {
  if (!str) return "";
  return str
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

interface PairingResultsProps {
  groups: {
    [key: number]: { id: string; number: number; role: string }[];
  } | null;
  formValues: {
    numParticipants: string;
    numGroups: string;
    groupingPurpose: string;
    characteristicsLabel?: string;
  } | null;
}

// Function to encrypt userId (Base64 encoding example)
const encryptData = (data: string): string => {
  return btoa(data); // Base64 encode
};

const PairingResults: React.FC<PairingResultsProps> = ({
  groups,
  formValues,
}) => {
  const router = useRouter();
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedFormUrl, setCopiedFormUrl] = useState<boolean>(false);

  if (!groups || Object.keys(groups).length === 0 || !formValues) return null;

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.uid;

  const handleShareLink = async () => {
    const queryParams = new URLSearchParams({
      groupingPurpose: formValues.groupingPurpose,
      numGroups: formValues.numGroups,
      numParticipants: formValues.numParticipants,
      characteristicsLabel: formValues.characteristicsLabel || "",
      pairings: encodeURIComponent(JSON.stringify(groups)),
    }).toString();

    const shareableUrl = `${window.location.origin}/share?${queryParams}`;

    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopiedLink(true);
      setTimeout(() => {
        setCopiedLink(false);
        router.push("/home");
      }, 2000);
    } catch (error) {
      console.error("Failed to copy the URL:", error);
    }
  };

  const handleShareForm = async () => {
    if (!userId) {
      console.error("User ID not found");
      return;
    }

    const serializedPairings = encodeURIComponent(JSON.stringify(groups));
    const encryptedUserId = encryptData(userId);

    const formUrl = `${
      window.location.origin
    }/form?groupingPurpose=${encodeURIComponent(
      formValues.groupingPurpose
    )}&numGroups=${formValues.numGroups}&numParticipants=${
      formValues.numParticipants
    }&characteristicsLabel=${encodeURIComponent(
      formValues.characteristicsLabel || ""
    )}&pairings=${serializedPairings}&userId=${encryptedUserId}`;

    try {
      await navigator.clipboard.writeText(formUrl);
      setCopiedFormUrl(true);
      setTimeout(() => {
        setCopiedFormUrl(false);
        router.push("/home");
      }, 2000);
    } catch (error) {
      console.error("Failed to copy the form URL:", error);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow-md w-full max-w-4xl mt-8">
      <h3 className="text-lg font-semibold mb-4">Pairing Results</h3>

      {/* Share Section */}
      <Card className="bg-gradient-to-br from-[#3A76F0] to-[#4650E5] text-white border-0 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Share Links</CardTitle>
          <CardDescription className="text-white/80">
            Share these links with participants. You will be redirected to the
            dashboard after copying.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleShareLink}
              variant="secondary"
              className="bg-white text-[#3A76F0] hover:bg-white/90 flex-1"
            >
              {copiedLink ? (
                <FaCheck className="w-4 h-4 mr-2" />
              ) : (
                <FaCopy className="w-4 h-4 mr-2" />
              )}
              {copiedLink ? "Link Copied! Redirecting..." : "Copy Share Link"}
            </Button>

            <Button
              onClick={handleShareForm}
              variant="secondary"
              className="bg-white text-[#3A76F0] hover:bg-white/90 flex-1"
            >
              {copiedFormUrl ? (
                <FaCheck className="w-4 h-4 mr-2" />
              ) : (
                <FaCopy className="w-4 h-4 mr-2" />
              )}
              {copiedFormUrl
                ? "Form URL Copied! Redirecting..."
                : "Copy Form URL"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col justify-center items-center">
        <div className="p-4 w-full">
          <div className="gap-4">
            <h1 className="text-2xl font-semibold mb-4 capitalize">
              {capitalizeWords(formValues.groupingPurpose)}
            </h1>
            <p className="text-lg mb-2">
              <strong>Number of Participants:</strong>{" "}
              {formValues.numParticipants}
            </p>
            <p className="text-lg mb-4">
              <strong>Number of Groups:</strong> {formValues.numGroups}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Object.entries(groups).map(([group, members]) => (
                <div key={group} className="mb-2 border p-4 rounded bg-gray-50">
                  <p className="text-lg font-semibold mb-2">Group {group}:</p>
                  <ul className="list-disc pl-5">
                    {members.map((member) => (
                      <li key={member.id}>
                        {member.number}: <span className="capitalize">{capitalizeWords(member.role)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PairingResults;
