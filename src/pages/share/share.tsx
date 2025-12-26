import React from "react";
import { useLocation } from "react-router-dom";
import Header from "../../components/layout/header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/Badge";
import { Participant } from "../../types";
import {
  FaUsers,
  FaGift,
  FaCalendarAlt,
  FaMoneyBillWave,
} from "react-icons/fa";

const SharePage: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const type = searchParams.get("type") || "role-based";
  const groupingPurpose = searchParams.get("groupingPurpose");
  const numParticipants = searchParams.get("numParticipants");

  if (!groupingPurpose) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Link
          </h1>
          <p className="text-gray-500">The event data could not be loaded.</p>
        </div>
      </div>
    );
  }

  // --- Secret Santa View ---
  if (type === "secret-santa") {
    const configParam = searchParams.get("config");
    const config = configParam
      ? JSON.parse(decodeURIComponent(configParam))
      : {};

    // Check if it's "Just Pair" mode
    const isSecretSanta = config.allowWishlist !== false; // Default to true if undefined, but logic usually sends explicit bool

    return (
      <div
        className={`min-h-screen bg-gradient-to-br ${
          isSecretSanta
            ? "from-red-50 to-green-50"
            : "from-blue-50 to-indigo-50"
        }`}
      >
        <Header />
        <div className="max-w-4xl mx-auto p-6 md:py-12">
          <div className="text-center mb-10">
            <div
              className={`inline-flex items-center justify-center w-20 h-20 ${
                isSecretSanta ? "bg-red-100" : "bg-blue-100"
              } rounded-full mb-6 shadow-sm`}
            >
              {isSecretSanta ? (
                <FaGift className="w-10 h-10 text-red-500" />
              ) : (
                <FaUsers className="w-10 h-10 text-blue-500" />
              )}
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
              {groupingPurpose}
            </h1>
            <Badge
              className={`${
                isSecretSanta ? "bg-green-500" : "bg-blue-500"
              } text-white border-0 text-md px-3 py-1`}
            >
              {isSecretSanta ? "Secret Santa Event" : "Pairing Event"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div
              className={`bg-white p-6 rounded-xl shadow-sm border ${
                isSecretSanta ? "border-red-100" : "border-blue-100"
              } flex items-start gap-4`}
            >
              <div
                className={`${
                  isSecretSanta ? "bg-red-50" : "bg-blue-50"
                } p-3 rounded-lg`}
              >
                <FaUsers
                  className={`w-6 h-6 ${
                    isSecretSanta ? "text-red-500" : "text-blue-500"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Participants
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {numParticipants} Joined
                </p>
              </div>
            </div>

            {config.exchangeDate && isSecretSanta && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 flex items-start gap-4">
                <div className="bg-red-50 p-3 rounded-lg">
                  <FaCalendarAlt className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Exchange Date
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {config.exchangeDate}
                  </p>
                </div>
              </div>
            )}

            {config.budget && isSecretSanta && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 flex items-start gap-4">
                <div className="bg-red-50 p-3 rounded-lg">
                  <FaMoneyBillWave className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {config.budget}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Card
            className={`border-t-4 ${
              isSecretSanta ? "border-red-500" : "border-blue-500"
            } shadow-md`}
          >
            <CardContent className="pt-8 pb-8 text-center">
              <p className="text-lg text-gray-600 mb-6">
                {isSecretSanta
                  ? "Ready to find out who you are gifting?"
                  : "Ready to find out your pair?"}
              </p>
              <p className="text-sm text-gray-500 italic max-w-md mx-auto">
                Contact the organizer specifically for your "Reveal Link" if you
                haven't received it yet. This page is for event details only.
                <br />
                (The organizer will generate the pairings once everyone has
                joined).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --- Role Based View ---
  const numGroups = searchParams.get("numGroups");
  const pairings = searchParams.get("pairings");
  const parsedPairings = pairings
    ? JSON.parse(decodeURIComponent(pairings))
    : {};

  if (!numGroups || !pairings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {groupingPurpose}
          </h1>
          <p className="text-muted-foreground">Shared Event Details</p>
        </div>

        {/* Stats Grid */}

        {/* Groups Grid */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-center  gap-4">
          {Object.entries(parsedPairings).map(
            ([groupKey, participants], groupIndex) => {
              const group = participants as Participant[];
              const groupFilled = group.length;

              return (
                <Card
                  key={groupKey}
                  className="hover:shadow-md transition-shadow flex-1 min-w-[300px]"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {isNaN(Number(groupKey))
                          ? groupKey
                          : `Group ${groupIndex + 1}`}
                      </CardTitle>
                      <Badge variant="secondary">{groupFilled} members</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {group.map((participant, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/80 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3A76F0] to-[#4650E5] flex items-center justify-center text-white text-xs font-bold shadow-sm mt-0.5">
                          {participant.name
                            ? participant.name.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {participant.name || "Available Slot"}
                            </p>
                            <span className="text-[10px] font-mono text-gray-400 bg-white px-1.5 py-0.5 rounded border">
                              #{participant.number}
                            </span>
                          </div>

                          {participant.email && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {participant.email}
                            </p>
                          )}

                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3A76F0]" />
                            <p className="text-xs font-medium text-[#3A76F0]">
                              {participant.role}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {group.length === 0 && (
                      <div className="text-sm text-muted-foreground text-center py-4 italic">
                        No participants yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
};

export default SharePage;
