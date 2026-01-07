import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { FaClock, FaGift, FaExternalLinkAlt, FaLink } from "react-icons/fa";
import { Pairing } from "../types";
import {
  getEventStats,
  copyJoinLink,
} from "../../app/home/_components/homeUtils";
import { EventProgressBar } from "../../app/home/_components/EventProgressBar";
import { EventDetails } from "../../app/home/_components/EventDetails";

interface EventCardProps {
  event: Pairing;
  index: number;
  onGeneratePairs: (eventId: string, e: React.MouseEvent) => void;
  onViewDetails: (index: number) => void;
}

const EventCard = ({
  event,
  index,
  onGeneratePairs,
  onViewDetails,
}: EventCardProps) => {
  const stats = getEventStats(event);
  const isComplete = stats.filledSlots === stats.totalSlots;

  return (
    <Card className="bg-white hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">
              {event.groupingPurpose}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-xs">
              <FaClock className="w-3 h-3" />
              Recently
            </CardDescription>
          </div>
          {isComplete && (
            <div className="flex-shrink-0">
              <div className="bg-[#60E1B1]/10 text-[#60E1B1] px-2 py-1 rounded-md text-xs">
                Complete
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <EventProgressBar
          filledSlots={stats.filledSlots}
          totalSlots={stats.totalSlots}
          fillPercentage={stats.fillPercentage}
        />

        <EventDetails event={event} />

        {/* Roles */}
        {event.type !== "secret-santa" &&
          event.type !== "random-positioning" &&
          event.characteristics && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Characteristics:
              </p>
              <div className="flex flex-wrap gap-2">
                {event.characteristics.map((char: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-slate-100 text-xs px-2 py-1 rounded"
                  >
                    {char.name} ({char.count})
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {event.type === "secret-santa" && event.status === "open" && (
            <Button
              variant="secondary"
              onClick={(e) => onGeneratePairs(event.id, e)}
              className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
            >
              <FaGift className="w-4 h-4 mr-2" />
              Generate Pairs
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={() => onViewDetails(index)}
            className="flex-1 bg-slate-50 text-gray-700 hover:bg-slate-100 border-slate-200"
            size="sm"
          >
            <FaExternalLinkAlt className="w-4 h-4 mr-2" />
            View Details
          </Button>
          <div
            onClick={() => copyJoinLink(event)}
            className="flex items-center justify-center bg-slate-100 text-xs px-2 py-1 rounded"
          >
            <FaLink className="w-4 h-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;
