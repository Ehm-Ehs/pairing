import { Card, CardContent } from "../../../src/components/ui/card";
import { FaUsers, FaCheckCircle, FaChartLine } from "react-icons/fa";
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
  if (
    pairing.type === "secret-santa" ||
    pairing.type === "random-positioning"
  ) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Groups</p>
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
              <p className="text-sm text-muted-foreground">Filled Slots</p>
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
              <p className="text-sm text-muted-foreground">Fill Rate</p>
              <p className="text-2xl">{fillPercentage}%</p>
            </div>
            <div className="w-10 h-10 bg-[#FFC857]/10 rounded-lg flex items-center justify-center">
              <FaChartLine className="w-5 h-5 text-[#FFC857]" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventStats;
