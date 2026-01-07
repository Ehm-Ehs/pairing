import React, { useState } from "react";
import { toast } from "react-toastify";
import { FaUserFriends } from "react-icons/fa";
import { RandomPositioningPairing } from "../../../src/types";
import {
  generateRandomPositions,
  removeParticipantFromRandomPositioning,
} from "../../../src/services/endpoints";
import { auth } from "../../../src/services/firebase";
import { Button } from "../../../src/components/ui/button";

interface RandomPositioningResultProps {
  data: RandomPositioningPairing;
}

const RandomPositioningResult: React.FC<RandomPositioningResultProps> = ({
  data,
}) => {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (data.participants.length < 1) {
      toast.error("Need at least 1 participant to shuffle!");
      return;
    }

    if (
      !window.confirm(
        "Are you sure? This will lock the event and assign positions."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const pairing = await generateRandomPositions(
        auth.currentUser!.uid,
        data.id
      );
      toast.success("Positions generated!");

      if (pairing && pairing.participants) {
        import("../../../src/services/email").then(({ sendEmail }) => {
          import("../../../src/services/emailTemplates").then(
            ({ getPairingEmail }) => {
              pairing.participants.forEach((p: any) => {
                if (p.email && p.assignedNumber) {
                  const emailContent = getPairingEmail(
                    pairing.title || "Random Positioning Event",
                    p.name,
                    `Position #${p.assignedNumber}`,
                    false // isSecretSanta
                  );

                  sendEmail({
                    to: p.email,
                    subject: emailContent.subject,
                    html: emailContent.html,
                  });
                }
              });
            }
          );
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate positions");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (participantId: string) => {
    if (!window.confirm("Remove this participant?")) return;
    try {
      await removeParticipantFromRandomPositioning(
        auth.currentUser!.uid,
        data.id,
        participantId
      );
      toast.success("Participant removed");
    } catch (err) {
      toast.error("Failed to remove participant");
    }
  };

  const sortedParticipants = [...data.participants].sort((a, b) => {
    if (a.assignedNumber && b.assignedNumber) {
      return a.assignedNumber - b.assignedNumber;
    }
    return 0; // Keep original order if not assigned? Or join time?
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Main Content */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <FaUserFriends className="text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">
              Participants ({data.participants.length})
            </h2>
          </div>
          <div>
            {data.status !== "locked" ? (
              <Button
                onClick={handleGenerate}
                disabled={loading || data.participants.length === 0}
                isLoading={loading}
                className={`px-6 py-2 rounded-lg text-white font-medium ${
                  loading || data.participants.length === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {loading ? "Shuffling..." : "Generate Positions"}
              </Button>
            ) : (
              <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-medium text-sm">
                Positions Assigned
              </span>
            )}
          </div>
        </div>

        {data.participants.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">
              No participants yet. Share the link to get started!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedParticipants.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      p.assignedNumber
                        ? "bg-purple-100 text-purple-600"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {p.assignedNumber || "?"}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(p.joinedAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {data.status !== "locked" && (
                  <Button
                    onClick={() => handleRemove(p.id)}
                    variant="ghost"
                    className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors h-auto w-auto"
                  >
                    <span className="text-sm">Remove</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RandomPositioningResult;
