import { useState } from "react";
import { useLocation } from "react-router-dom";
import { GroupingsPageProps } from "./types";
import { Button } from "./common/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./common/card";
import {
  FaCheck,
  FaCopy,
  FaUsers,
  FaChartLine,
  FaCheckCircle,
} from "react-icons/fa";

// Function to encrypt userId (Base64 encoding example)
const encryptData = (data: string): string => {
  return btoa(data); // Base64 encode
};

interface ResultProps {
  data: GroupingsPageProps | null;
}

import { Badge } from "./common/Badge";

const Result = ({ data }: ResultProps) => {
  const [copiedLink, setCopiedLink] = useState<number | null>(null);
  const [copiedFormUrl, setCopiedFormUrl] = useState<boolean>(false);
  const [isShortened, setIsShortened] = useState<boolean>(false);
  const [isLoadingLink, setIsLoadingLink] = useState<number | null>(null);
  const [isLoadingForm, setIsLoadingForm] = useState<number | null>(null);
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.uid;

  // Get index from query params
  const queryParams = new URLSearchParams(location.search);
  const indexParam = queryParams.get("index");
  const selectedIndex = indexParam ? parseInt(indexParam) : null;

  const shortenUrl = async (url: string): Promise<string> => {
    try {
      const response = await fetch(
        `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
      );
      if (response.ok) {
        return await response.text();
      }
      throw new Error("Failed to shorten URL");
    } catch (error) {
      console.error("Error shortening URL:", error);
      return url; // Fallback to original URL
    }
  };

  const handleShare = async (pairingIndex: number) => {
    if (!data) return;

    const actualIndex = selectedIndex !== null ? selectedIndex : pairingIndex;
    const pairing = data.pairings[actualIndex];

    const serializedPairings = encodeURIComponent(
      JSON.stringify(pairing.groups)
    );

    let shareableUrl = `${
      window.location.origin
    }/share?groupingPurpose=${encodeURIComponent(
      pairing.groupingPurpose
    )}&numGroups=${pairing.numGroups}&numParticipants=${
      pairing.numParticipants
    }&characteristicsLabel=${encodeURIComponent(
      pairing.characteristicsLabel || ""
    )}&pairings=${serializedPairings}`;

    if (isShortened) {
      setIsLoadingLink(actualIndex);
      shareableUrl = await shortenUrl(shareableUrl);
      setIsLoadingLink(null);
    }

    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopiedLink(actualIndex);
      setTimeout(() => setCopiedLink(null), 3000);
    } catch (error) {
      console.error("Failed to copy the URL:", error);
      setIsLoadingLink(null);
    }
  };

  const handleFormRedirect = async (pairingIndex: number) => {
    if (!data) return;

    const actualIndex = selectedIndex !== null ? selectedIndex : pairingIndex;
    const pairing = data.pairings[actualIndex];

    const serializedPairings = encodeURIComponent(
      JSON.stringify(pairing.groups)
    );
    console.log({ pairing });
    const encryptedUserId = encryptData(userId); // Encrypt userId

    let formUrl = `${
      window.location.origin
    }/form?groupingPurpose=${encodeURIComponent(
      pairing.groupingPurpose
    )}&numGroups=${pairing.numGroups}&numParticipants=${
      pairing.numParticipants
    }&characteristicsLabel=${encodeURIComponent(
      pairing.characteristicsLabel || ""
    )}&pairings=${serializedPairings}&userId=${encryptedUserId}`;

    if (isShortened) {
      setIsLoadingForm(actualIndex);
      formUrl = await shortenUrl(formUrl);
      setIsLoadingForm(null);
    }

    try {
      await navigator.clipboard.writeText(formUrl);
      setCopiedFormUrl(true);
      setTimeout(() => setCopiedFormUrl(false), 3000);
      console.log("Form URL copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy the form URL:", error);
      setIsLoadingForm(null);
    }
  };

  if (!data) {
    return <div>No data available</div>;
  }

  // Filter pairings if index is selected
  const pairingsToRender =
    selectedIndex !== null ? [data.pairings[selectedIndex]] : data.pairings;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Pairing Results for {data.firstName} {data.lastName}
          </h1>
          <p className="text-muted-foreground mt-1">{data.email}</p>
          {selectedIndex !== null && (
            <div
              onClick={() => window.history.back()}
              className="mt-4 cursor-pointer"
            >
              Back to All Events
            </div>
          )}
        </div>

        <div className="space-y-12">
          {pairingsToRender.map((pairing, index) => {
            // If we are showing a single selected item, the index passed to handlers should be the original index
            // If showing all, index is the index.
            const originalIndex =
              selectedIndex !== null ? selectedIndex : index;

            // Calculate stats for this pairing
            const totalSlots = parseInt(pairing.numParticipants.toString());
            let filledSlots = 0;
            Object.values(pairing.groups).forEach((group) => {
              // Only count participants with names
              filledSlots += group.filter((p: any) => p.name).length;
            });
            const fillPercentage =
              totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {pairing.groupingPurpose}
                    </h2>
                    <p className="text-muted-foreground mt-1">Event Overview</p>
                  </div>
                </div>

                {/* Share Section */}
                <Card className="bg-gradient-to-br from-[#3A76F0] to-[#4650E5] text-white border-0 mb-8">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">
                          Share Links
                        </CardTitle>
                        <CardDescription className="text-white/80">
                          Share these links with participants
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                        <input
                          type="checkbox"
                          id={`shorten-${index}`}
                          checked={isShortened}
                          onChange={(e) => setIsShortened(e.target.checked)}
                          className="w-4 h-4 rounded border-white/30 text-[#3A76F0] focus:ring-offset-0 focus:ring-white/50 bg-transparent"
                        />
                        <label
                          htmlFor={`shorten-${index}`}
                          className="text-sm font-medium text-white cursor-pointer select-none"
                        >
                          Shorten Links
                        </label>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        onClick={() => handleShare(originalIndex)}
                        variant="secondary"
                        disabled={isLoadingLink === originalIndex}
                        className="bg-white text-[#3A76F0] hover:bg-white/90 flex-1"
                      >
                        {isLoadingLink === originalIndex ? (
                          <span className="animate-pulse">Shortening...</span>
                        ) : copiedLink === originalIndex ? (
                          <>
                            <FaCheck className="w-4 h-4 mr-2" />
                            Link Copied!
                          </>
                        ) : (
                          <>
                            <FaCopy className="w-4 h-4 mr-2" />
                            Copy Share Link
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={() => handleFormRedirect(originalIndex)}
                        variant="secondary"
                        disabled={isLoadingForm === originalIndex}
                        className="bg-white text-[#3A76F0] hover:bg-white/90 flex-1"
                      >
                        {isLoadingForm === originalIndex ? (
                          <span className="animate-pulse">Shortening...</span>
                        ) : copiedFormUrl ? (
                          <>
                            <FaCheck className="w-4 h-4 mr-2" />
                            Form URL Copied!
                          </>
                        ) : (
                          <>
                            <FaCopy className="w-4 h-4 mr-2" />
                            Copy Form URL
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Total Groups
                          </p>
                          <p className="text-2xl">{pairing.numGroups}</p>
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
                            Filled Slots
                          </p>
                          <p className="text-2xl">
                            {filledSlots} / {totalSlots}
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-[#60E1B1]/10 rounded-lg flex items-center justify-center">
                          <FaCheckCircle className="w-5 h-5 text-[#60E1B1]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Fill Rate
                          </p>
                          <p className="text-2xl">{fillPercentage}%</p>
                        </div>
                        <div className="w-10 h-10 bg-[#FFC857]/10 rounded-lg flex items-center justify-center">
                          <FaChartLine className="w-5 h-5 text-[#FFC857]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Characteristics */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-3">
                    Characteristics Distribution
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {pairing.characteristics.map((char, i) => (
                      <Badge key={i} variant="secondary">
                        {char.name}: {char.count}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Groups Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(pairing.groups).map(
                    ([groupKey, group], groupIndex) => {
                      const groupFilled = group.length;
                      // We don't have explicit group size limits in the data, so we assume it's "filled" if it has members?
                      // Or we can just show the count.
                      // Let's show count.

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
                              <Badge variant="secondary">
                                {groupFilled} members
                              </Badge>
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
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Result;
