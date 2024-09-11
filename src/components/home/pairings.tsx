import React from "react";

interface PairingResultsProps {
  groups: {
    [key: number]: { id: string; number: number; role: string }[];
  } | null;
  formValues: {
    numParticipants: string;
    numGroups: string;
    groupingPurpose: string;
  } | null;
}

const PairingResults: React.FC<PairingResultsProps> = ({
  groups,
  formValues,
}) => {
  if (!groups || Object.keys(groups).length === 0 || !formValues) return null;

  return (
    <div className="bg-gray-100 p-4 rounded shadow-md">
      <h3 className="text-lg font-semibold">Pairings:</h3>
      <div className="flex flex-col justify-center items-center">
        <div className="p-4">
          <div className="gap-4">
            <h1 className="text-2xl font-semibold mb-4">
              {formValues.groupingPurpose}
            </h1>
            <p className="text-lg mb-2">
              <strong>Number of Participants:</strong>{" "}
              {formValues.numParticipants}
            </p>
            <p className="text-lg mb-4">
              <strong>Number of Groups:</strong> {formValues.numGroups}
            </p>
            <div className="flex gap-5">
              {Object.entries(groups).map(([group, members]) => (
                <div key={group} className="mb-2">
                  <p className="text-lg font-semibold">Group {group}:</p>
                  <ul>
                    {members.map((member) => (
                      <li key={member.id}>
                        {member.number}: {member.role}
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
