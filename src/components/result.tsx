import React, { useState } from "react";
import { GroupingsPageProps, Participant } from "./types";

interface ResultProps {
  data: GroupingsPageProps | null;
}

const Result: React.FC<ResultProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);

  if (!data) {
    return <p>No data available</p>;
  }

  const { pairings } = data;
  console.log({ pairings }, { data });

  const handleShare = async (pairingIndex: number) => {
    const pairing = pairings[pairingIndex];

    const serializedPairings = encodeURIComponent(
      JSON.stringify(pairing.pairings)
    );

    const shareableUrl = `${
      window.location.origin
    }/share?groupingPurpose=${encodeURIComponent(
      pairing.groupingPurpose
    )}&numGroups=${pairing.numGroups}&numParticipants=${
      pairing.numParticipants
    }&pairings=${serializedPairings}`;

    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      console.log("URL copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy the URL:", error);
    }
  };

  const handleFormRedirect = async (pairingIndex: number) => {
    const pairing = pairings[pairingIndex];

    const serializedPairings = encodeURIComponent(
      JSON.stringify(pairing.pairings)
    );

    const formUrl = `${
      window.location.origin
    }/form?groupingPurpose=${encodeURIComponent(
      pairing.groupingPurpose
    )}&numGroups=${pairing.numGroups}&numParticipants=${
      pairing.numParticipants
    }&pairings=${serializedPairings}`;

    try {
      await navigator.clipboard.writeText(formUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      console.log("Form URL copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy the form URL:", error);
    }
  };

  return (
    <div className="">
      <h3 className="text-lg font-semibold mb-4">Your Pairings:</h3>

      <div className="flex flex-col justify-center items-center">
        {pairings && (
          <div className="p-4">
            <div className="gap-4">
              {pairings.map((pairing, index) => (
                <div key={index} className="border-b p-4">
                  <h1 className="text-2xl font-semibold mb-4">
                    {pairing.groupingPurpose}
                  </h1>
                  <div>
                    <p className="text-lg mb-2">
                      <strong>Number of Participants:</strong>{" "}
                      {pairing.numParticipants}
                    </p>
                    <p className="text-lg mb-4">
                      <strong>Number of Groups:</strong> {pairing.numGroups}
                    </p>
                    <div className="flex gap-5">
                      {Object.entries(pairing.pairings).map(
                        ([groupNumber, participants]) => (
                          <div key={groupNumber} className="mb-4">
                            <p className="text-lg font-semibold mb-2">
                              Group {groupNumber}:
                            </p>
                            <ul className="list-disc pl-5">
                              {(participants as Participant[]).map(
                                (participant, i) => (
                                  <li key={i} className="text-sm">
                                    Participant {participant.number} (ID:{" "}
                                    {participant.id})
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  {/* Share Button */}
                  <button
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => handleShare(index)}
                  >
                    {copied ? "Link Copied!" : "Share This Pairing"}
                  </button>
                  <button
                    className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    onClick={() => handleFormRedirect(index)}
                  >
                    {copied ? "Form Link Copied!" : "Copy Form Link"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Result;
