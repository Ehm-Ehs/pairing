import React from "react";
import { useLocation } from "react-router-dom";
import Header from "../nav/header";

const SharePage: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const groupingPurpose = searchParams.get("groupingPurpose");
  const numGroups = searchParams.get("numGroups");
  const numParticipants = searchParams.get("numParticipants");
  const pairings = searchParams.get("pairings");

  // Parse the serialized pairings back into an object
  const parsedPairings = pairings
    ? JSON.parse(decodeURIComponent(pairings))
    : {};

  if (!groupingPurpose || !numGroups || !numParticipants || !pairings) {
    return <p>Invalid pairing data</p>;
  }

  return (
    <div>
      <Header />
      <div className="flex flex-col justify-center items-center p-4">
        <h1 className="text-2xl font-semibold mb-4">Pairing Details</h1>
        <p className="text-lg mb-2">
          <strong>Purpose:</strong> {groupingPurpose}
        </p>
        <p className="text-lg mb-2">
          <strong>Number of Groups:</strong> {numGroups}
        </p>
        <p className="text-lg mb-2">
          <strong>Number of Participants:</strong> {numParticipants}
        </p>

        {/* Display the pairings */}
        <div className="flex flex-col">
          {Object.entries(parsedPairings).map(([groupNumber, participants]) => (
            <div key={groupNumber} className="mb-4">
              <p className="text-lg font-semibold mb-2">Group {groupNumber}:</p>
              <ul className="list-disc pl-5">
                {(participants as { id: string; number: number }[]).map(
                  (participant, i) => (
                    <li key={i} className="text-sm">
                      Participant {participant.number} (ID: {participant.id})
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SharePage;
