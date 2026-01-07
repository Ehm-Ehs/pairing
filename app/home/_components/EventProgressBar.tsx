interface EventProgressBarProps {
  filledSlots: number;
  totalSlots: number;
  fillPercentage: number;
}

export const EventProgressBar = ({
  filledSlots,
  totalSlots,
  fillPercentage,
}: EventProgressBarProps) => {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-muted-foreground">Progress</span>
        <span
          className={
            fillPercentage === 100 ? "text-[#60E1B1]" : "text-foreground"
          }
        >
          {filledSlots}/{totalSlots} filled ({fillPercentage}%)
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            fillPercentage > 100
              ? "bg-red-500"
              : fillPercentage === 100
              ? "bg-[#60E1B1]"
              : fillPercentage > 50
              ? "bg-[#3A76F0]"
              : "bg-[#FFC857]"
          }`}
          style={{
            width: `${Math.min(fillPercentage, 100)}%`,
          }}
        />
      </div>
    </div>
  );
};
