import { Pairing } from "../../../src/types";

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
  if (pairing.type === "secret-santa") {
    const expected = pairing.config?.expectedParticipants || 0;
    const registered = pairing.participants?.length || 0;
    const withWishlist = pairing.participants?.filter(p => p.wishlist && p.wishlist.trim() !== "").length || 0;
    const unpaired = pairing.status === "locked" ? 0 : registered;
    const spotsLeft = Math.max(0, expected - registered);

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Registered */}
        <div className="bg-[#E0F2FE] text-[#0369A1] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm border border-[#BAE6FD]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0284C7]/80 mb-1">
            Registered
          </span>
          <span className="text-3xl font-extrabold font-heading">
            {registered}
          </span>
          <span className="text-[10px] font-semibold text-[#0284C7]/70 mt-0.5">
            of {expected} total
          </span>
        </div>

        {/* With Wishlist */}
        <div className="bg-[#E0E7FF] text-[#3730A3] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm border border-[#C7D2FE]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5]/80 mb-1">
            With Wishlist
          </span>
          <span className="text-3xl font-extrabold font-heading">
            {withWishlist}
          </span>
          <span className="text-[10px] font-semibold text-[#4F46E5]/70 mt-0.5">
            out of {registered}
          </span>
        </div>

        {/* Unpaired */}
        <div className="bg-[#FEF3C7] text-[#B45309] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm border border-[#FDE68A]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D97706]/80 mb-1">
            Unpaired
          </span>
          <span className="text-3xl font-extrabold font-heading">
            {unpaired}
          </span>
          <span className="text-[10px] font-semibold text-[#D97706]/70 mt-0.5">
            {pairing.status === "locked" ? "all matched" : "awaiting match"}
          </span>
        </div>

        {/* Spots Left */}
        <div className="bg-[#FCE7F3] text-[#BE185D] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm border border-[#FBCFE8]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#DB2777]/80 mb-1">
            Spots Left
          </span>
          <span className="text-3xl font-extrabold font-heading">
            {spotsLeft}
          </span>
          <span className="text-[10px] font-semibold text-[#DB2777]/70 mt-0.5">
            Available spots
          </span>
        </div>
      </div>
    );
  }

  if (pairing.type === "random-positioning") {
    const registered = pairing.participants?.length || 0;
    const isLocked = pairing.status === "locked";

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Registered */}
        <div className="bg-[#E0F2FE] text-[#0369A1] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm border border-[#BAE6FD]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0284C7]/80 mb-1">
            Registered
          </span>
          <span className="text-3xl font-extrabold font-heading">
            {registered}
          </span>
          <span className="text-[10px] font-semibold text-[#0284C7]/70 mt-0.5">
            participants joined
          </span>
        </div>

        {/* Status */}
        <div className="bg-[#E0E7FF] text-[#3730A3] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm border border-[#C7D2FE]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5]/80 mb-1">
            Shuffled Status
          </span>
          <span className="text-2xl font-extrabold font-heading py-1">
            {isLocked ? "Assigned" : "Open"}
          </span>
          <span className="text-[10px] font-semibold text-[#4F46E5]/70 mt-0.5">
            {isLocked ? "positions locked" : "accepting entries"}
          </span>
        </div>

        {/* Names Visibility */}
        <div className="bg-[#FEF3C7] text-[#B45309] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm border border-[#FDE68A]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D97706]/80 mb-1">
            Visibility
          </span>
          <span className="text-2xl font-extrabold font-heading py-1">
            {pairing.hideNames ? "Hidden" : "Public"}
          </span>
          <span className="text-[10px] font-semibold text-[#D97706]/70 mt-0.5">
            names during join
          </span>
        </div>

        {/* Spots Left */}
        <div className="bg-[#FCE7F3] text-[#BE185D] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm border border-[#FBCFE8]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#DB2777]/80 mb-1">
            Spots Left
          </span>
          <span className="text-3xl font-extrabold font-heading">
            Open
          </span>
          <span className="text-[10px] font-semibold text-[#DB2777]/70 mt-0.5">
            Unlimited spots
          </span>
        </div>
      </div>
    );
  }

  const availableSlots = Math.max(0, totalSlots - filledSlots);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {/* Total Slots */}
      <div className="bg-[#E0F2FE] text-[#0369A1] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm border border-[#BAE6FD]">
        <span className="text-xs font-bold uppercase tracking-wider text-[#0284C7]/80 mb-1">
          Total Slots
        </span>
        <span className="text-3xl font-extrabold font-heading">
          {totalSlots}
        </span>
      </div>

      {/* Filled Slots */}
      <div className="bg-[#EFF6FF] text-[#1D4ED8] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm border border-[#DBEAFE]">
        <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]/80 mb-1">
          Filled Slots
        </span>
        <span className="text-3xl font-extrabold font-heading">
          {filledSlots}
        </span>
      </div>

      {/* Available Slots */}
      <div className="bg-[#FEF3C7] text-[#B45309] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm border border-[#FDE68A]">
        <span className="text-xs font-bold uppercase tracking-wider text-[#D97706]/80 mb-1">
          Available Slots
        </span>
        <span className="text-3xl font-extrabold font-heading">
          {availableSlots}
        </span>
      </div>

      {/* Progress */}
      <div className="bg-[#FCE7F3] text-[#BE185D] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm border border-[#FBCFE8]">
        <span className="text-xs font-bold uppercase tracking-wider text-[#DB2777]/80 mb-1">
          Progress
        </span>
        <span className="text-3xl font-extrabold font-heading">
          {fillPercentage}%
        </span>
      </div>
    </div>
  );
};

export default EventStats;
