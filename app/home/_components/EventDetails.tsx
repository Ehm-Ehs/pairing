import { FaUsers } from "react-icons/fa";
import { Pairing } from "../../../src/types";

interface EventDetailsProps {
  event: Pairing;
}

export const EventDetails = ({ event }: EventDetailsProps) => {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <FaUsers className="w-4 h-4" />
        <span>
          {event.type === "secret-santa"
            ? event.config?.expectedParticipants
            : event.type === "random-positioning"
            ? event.participants?.length
            : event.numParticipants}{" "}
          people
        </span>
      </div>
      {event.type !== "secret-santa" && event.type !== "random-positioning" && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-4 h-4 bg-[#3A76F0]/10 rounded flex items-center justify-center">
            <span className="text-[10px] text-[#3A76F0]">
              {event.numGroups}
            </span>
          </div>
          <span>{event.numGroups} groups</span>
        </div>
      )}
      {event.type === "secret-santa" && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>
            {event.config?.allowWishlist ? "Wishlist Enabled" : "No Wishlist"}
          </span>
        </div>
      )}
      {event.type === "random-positioning" && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>No Limit</span>
        </div>
      )}
    </div>
  );
};
