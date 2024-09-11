import { useState } from "react";
import { GroupingsPageProps } from "./types";

// Function to encrypt userId (Base64 encoding example)
const encryptData = (data: string): string => {
  return btoa(data); // Base64 encode
};

interface ResultProps {
  data: GroupingsPageProps | null;
}

const Result = ({ data }: ResultProps) => {
  const [copiedLink, setCopiedLink] = useState<number | null>(null);
  const [copiedFormUrl, setCopiedFormUrl] = useState<boolean>(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.uid;

  const handleShare = async (pairingIndex: number) => {
    if (!data) return;

    const pairing = data.pairings[pairingIndex];
    const serializedPairings = encodeURIComponent(
      JSON.stringify(pairing.groups)
    );

    const shareableUrl = `${
      window.location.origin
    }/share?groupingPurpose=${encodeURIComponent(
      pairing.groupingPurpose
    )}&numGroups=${pairing.numGroups}&numParticipants=${
      pairing.numParticipants
    }&groups=${serializedPairings}`;

    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopiedLink(pairingIndex);
      setTimeout(() => setCopiedLink(null), 3000);
    } catch (error) {
      console.error("Failed to copy the URL:", error);
    }
  };

  const handleFormRedirect = async (pairingIndex: number) => {
    if (!data) return;

    const pairing = data.pairings[pairingIndex];
    const serializedPairings = encodeURIComponent(
      JSON.stringify(pairing.groups)
    );
    console.log({ pairing });
    const encryptedUserId = encryptData(userId); // Encrypt userId

    const formUrl = `${
      window.location.origin
    }/form?groupingPurpose=${encodeURIComponent(
      pairing.groupingPurpose
    )}&numGroups=${pairing.numGroups}&numParticipants=${
      pairing.numParticipants
    }&pairings=${serializedPairings}&userId=${encryptedUserId}`;

    try {
      await navigator.clipboard.writeText(formUrl);
      setCopiedFormUrl(true);
      setTimeout(() => setCopiedFormUrl(false), 3000);
      console.log("Form URL copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy the form URL:", error);
    }
  };

  if (!data) {
    return <div>No data available</div>;
  }

  return (
    <div className="bg-gray-100 p-4 rounded shadow-md">
      <h3 className="text-lg font-semibold mb-4">
        Pairing Results for {data.firstName} {data.lastName}:
      </h3>
      <p className="text-sm mb-4">{data.email}</p>

      <div className="w-full max-w-4xl">
        {data.pairings.map((pairing, index) => (
          <div
            key={index}
            className="border-b p-4 mb-4 bg-white rounded shadow-sm"
          >
            <h1 className="text-2xl font-semibold mb-4">
              {pairing.groupingPurpose}
            </h1>
            <p className="text-lg mb-2">
              <strong>Number of Participants:</strong> {pairing.numParticipants}
            </p>
            <p className="text-lg mb-4">
              <strong>Number of Groups:</strong> {pairing.numGroups}
            </p>

            <h3 className="text-lg font-semibold mb-2">Characteristics:</h3>
            <ul className="list-disc pl-5 mb-4">
              {pairing.characteristics.map((char, i) => (
                <li key={i} className="text-sm">
                  {char.name} - {char.count} participants
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-4">
              {Object.entries(pairing.groups).map(
                ([groupKey, group], groupIndex) => (
                  <div key={groupKey} className="border p-2 bg-gray-50 rounded">
                    <p className="text-lg font-semibold mb-2">
                      Group {groupIndex + 1}:
                    </p>
                    <ul className="list-disc pl-5">
                      {group.map((participant, i) => (
                        <li key={i} className="text-sm">
                          Participant {participant.number} - {participant.role}{" "}
                          (ID: {participant.id})
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}
            </div>

            <div className="mt-4 flex gap-4">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => handleShare(index)}
              >
                {copiedLink === index ? "Link Copied!" : "Share This Pairing"}
              </button>

              <button
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                onClick={() => handleFormRedirect(index)}
              >
                {copiedFormUrl ? "Form URL Copied!" : "Copy Form URL"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Result;
