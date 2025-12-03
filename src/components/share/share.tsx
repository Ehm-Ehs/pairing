import React from "react";
import { useLocation } from "react-router-dom";
import Header from "../nav/header";
import { Card, CardHeader, CardTitle, CardContent } from "../common/card";
import { Badge } from "../common/Badge";
import { Participant } from "../types";
import { FaUsers, FaCheckCircle } from "react-icons/fa";

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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Link
          </h1>
          <p className="text-gray-500">The pairing data could not be loaded.</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Groups</p>
                  <p className="text-2xl font-bold">{numGroups}</p>
                </div>
                <div className="w-10 h-10 bg-[#3A76F0]/10 rounded-lg flex items-center justify-center">
                  <FaUsers className="w-5 h-5 text-[#3A76F0]" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Total Participants
                  </p>
                  <p className="text-2xl font-bold">{numParticipants}</p>
                </div>
                <div className="w-10 h-10 bg-[#60E1B1]/10 rounded-lg flex items-center justify-center">
                  <FaCheckCircle className="w-5 h-5 text-[#60E1B1]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(parsedPairings).map(
            ([groupKey, participants], groupIndex) => {
              const group = participants as Participant[];
              const groupFilled = group.length;

              return (
                <Card
                  key={groupKey}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Group {groupIndex + 1}
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
