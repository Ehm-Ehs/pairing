import React from "react";
import { Pairing } from "../../../src/types";
import StatsCard from "./StatsCard";

interface EventStatsProps {
  pairing: Pairing;
  filledSlots: number;
  totalSlots: number;
  fillPercentage: number;
}

const EventStats = ({
  pairing,
  filledSlots,
  totalSlots,
  fillPercentage,
}: EventStatsProps) => {
  // Return null for random-positioning because it renders all 4 cards consolidated on a straight line
  if (pairing.type === "random-positioning") {
    return null;
  }

  if (pairing.type === "secret-santa") {
    const expected = pairing.config?.expectedParticipants || 0;
    const registered = pairing.participants?.length || 0;
    const withWishlist = pairing.participants?.filter(p => p.wishlist && p.wishlist.trim() !== "").length || 0;
    const unpaired = pairing.status === "locked" ? 0 : registered;
    const spotsLeft = Math.max(0, expected - registered);
    const hasWishlist = pairing.config?.allowWishlist;

    return (
      <div className={`grid grid-cols-2 ${hasWishlist ? "md:grid-cols-4" : "md:grid-cols-3"} gap-4 mb-8`}>
        {/* Registered */}
        <StatsCard
          title="Registered"
          value={registered}
          description={`of ${expected} total`}
          variant="blue"
        />

        {/* With Wishlist */}
        {hasWishlist && (
          <StatsCard
            title="With Wishlist"
            value={withWishlist}
            description={`out of ${registered}`}
            variant="indigo"
          />
        )}

        {/* Unpaired */}
        <StatsCard
          title="Unpaired"
          value={unpaired}
          description={pairing.status === "locked" ? "all matched" : "awaiting match"}
          variant="yellow"
        />

        {/* Spots Left */}
        <StatsCard
          title="Spots Left"
          value={spotsLeft}
          description="Available spots"
          variant="pink"
        />
      </div>
    );
  }

  const availableSlots = Math.max(0, totalSlots - filledSlots);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {/* Total Slots */}
      <StatsCard
        title="Total Slots"
        value={totalSlots}
        description="Capacity"
        variant="blue"
      />

      {/* Filled Slots */}
      <StatsCard
        title="Filled Slots"
        value={filledSlots}
        description="Booked slots"
        variant="indigo"
      />

      {/* Available Slots */}
      <StatsCard
        title="Available Slots"
        value={availableSlots}
        description="Open slots"
        variant="yellow"
      />

      {/* Progress */}
      <StatsCard
        title="Progress"
        value={`${fillPercentage}%`}
        description="Fill rate"
        variant="pink"
      />
    </div>
  );
};

export default EventStats;
