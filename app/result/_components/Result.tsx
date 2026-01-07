import { useSearchParams } from "next/navigation";
import { GroupingsPageProps } from "../../../src/types";
import ResultHeader from "./ResultHeader";
import ShareCard from "../../../src/utils/ShareCard";
import EventStats from "./EventStats";
import SecretSantaList from "./SecretSantaList";
import RoleBasedList from "./RoleBasedList";
import RandomPositioningResult from "./RandomPositioningResult";
import { useResultActions } from "../../../src/hooks/useResultActions";

interface ResultProps {
  data: GroupingsPageProps | null;
}

const Result = ({ data }: ResultProps) => {
  const searchParams = useSearchParams();

  // Get index or ID from query params
  const indexParam = searchParams.get("index");
  const idParam = searchParams.get("id");

  let selectedIndex = indexParam ? parseInt(indexParam) : null;

  if (selectedIndex === null && idParam && data) {
    const foundIndex = data.pairings.findIndex((p) => p.id === idParam);
    if (foundIndex !== -1) {
      selectedIndex = foundIndex;
    }
  }

  const {
    copiedLink,
    copiedFormUrl,
    isShortened,
    setIsShortened,
    isLoadingLink,
    isLoadingForm,
    handleShare,
    handleFormRedirect,
  } = useResultActions(data, selectedIndex);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.uid; // Still needed for passed props if any (SecretSantaList uses it)

  if (!data) {
    return <div>No data available</div>;
  }

  if (idParam && selectedIndex === null && data) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading event details...
      </div>
    );
  }

  const pairingsToRender =
    selectedIndex !== null ? [data.pairings[selectedIndex]] : data.pairings;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <ResultHeader data={data} selectedIndex={selectedIndex} />

        <div className="space-y-12">
          {pairingsToRender.map((pairing, index) => {
            const originalIndex =
              selectedIndex !== null ? selectedIndex : index;

            let totalSlots = 0;
            let filledSlots = 0;

            if (pairing.type === "random-positioning") {
              totalSlots = pairing.participants.length;
              filledSlots = pairing.participants.length;
            } else if (pairing.type === "secret-santa") {
              totalSlots = pairing.config?.expectedParticipants || 0;
              filledSlots = pairing.participants
                ? pairing.participants.length
                : 0;
            } else {
              totalSlots = parseInt(pairing.numParticipants.toString());
              Object.values(pairing.groups).forEach((group) => {
                filledSlots += group.filter((p: any) => p.name).length;
              });
            }

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

                <ShareCard
                  index={index}
                  originalIndex={originalIndex}
                  isShortened={isShortened}
                  setIsShortened={setIsShortened}
                  handleShare={handleShare}
                  handleFormRedirect={handleFormRedirect}
                  isLoadingLink={isLoadingLink}
                  isLoadingForm={isLoadingForm}
                  copiedLink={copiedLink}
                  copiedFormUrl={copiedFormUrl}
                />

                <EventStats
                  pairing={pairing}
                  filledSlots={filledSlots}
                  totalSlots={totalSlots}
                  fillPercentage={fillPercentage}
                />

                {pairing.type === "random-positioning" ? (
                  <RandomPositioningResult data={pairing} />
                ) : pairing.type === "secret-santa" ? (
                  <SecretSantaList pairing={pairing} userId={userId} />
                ) : (
                  <RoleBasedList pairing={pairing} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Result;
