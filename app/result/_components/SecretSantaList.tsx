import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../../src/components/ui/card";
import { Button } from "../../../src/components/ui/button";
import { FaCopy, FaCheck, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import { SecretSantaPairing } from "../../../src/types";
import { removeParticipantFromSecretSanta } from "../../../src/services/endpoints";

interface SecretSantaListProps {
  pairing: SecretSantaPairing;
  userId: string;
}

const SecretSantaList = ({ pairing, userId }: SecretSantaListProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Participants ({pairing.participants?.length || 0})
              </CardTitle>
              <CardDescription>
                {pairing.status === "locked"
                  ? "Pairings are locked and cannot be modified"
                  : "Manage your Secret Santa participants"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {pairing.participants && pairing.participants.length > 0 ? (
            <div className="space-y-3">
              {pairing.participants.map((p, i) => {
                // Get avatar background color based on index or name
                const colors = [
                  "bg-purple-600",
                  "bg-pink-600",
                  "bg-orange-500",
                  "bg-teal-500",
                  "bg-blue-600",
                  "bg-indigo-600",
                ];
                const bgColor = colors[i % colors.length] || "bg-gray-600";

                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-[#23353C] rounded-xl shadow-sm border border-transparent"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium text-lg ${bgColor}`}
                      >
                        {p.name ? p.name.substring(0, 2).toUpperCase() : "??"}
                      </div>
                      <div>
                        <div className="font-semibold text-white text-base">
                          {p.name}
                        </div>
                        <div className="text-sm text-gray-400">{p.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {pairing.status === "locked" ? (
                        (() => {
                          const pair = pairing.pairs?.find(
                            (pair) => pair.santaId === p.id
                          );
                          const receiver =
                            pair &&
                            pairing.participants.find(
                              (r) => r.id === pair.receiverId
                            );
                          return (
                            <>
                              <span className="text-gray-400 text-sm flex items-center gap-2">
                                <div className="rotate-45">
                                  <FaCopy className="w-3 h-3" />{" "}
                                  {/* Using FaCopy as link icon proxy or need FaLink */}
                                </div>
                                Paired with
                              </span>
                              <div className="bg-[#2D6A4F]/20 text-[#60E1B1] border border-[#60E1B1]/30 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 min-w-[120px] justify-center">
                                <FaCheck className="w-3 h-3" />
                                {receiver?.name || "Unknown"}
                              </div>
                            </>
                          );
                        })()
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={async () => {
                            if (window.confirm(`Remove ${p.name}?`)) {
                              try {
                                await removeParticipantFromSecretSanta(
                                  userId,
                                  pairing.id,
                                  p.id
                                );
                                toast.success("Participant removed");
                              } catch (e) {
                                toast.error("Failed to remove participant");
                              }
                            }
                          }}
                          className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-white/10 transition-colors h-auto w-auto"
                        >
                          <FaTrash className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 italic">
              No participants yet. Share the link to invite people!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecretSantaList;
