import { Card, CardContent } from "../../../src/components/ui/card";
import { FaCalendarAlt, FaChartLine } from "react-icons/fa";

interface DashboardStatsProps {
  totalEvents: number;
  totalSlots: number;
  totalFilledSlots: number;
}

const DashboardStats = ({
  totalEvents,
  totalSlots,
  totalFilledSlots,
}: DashboardStatsProps) => {
  if (totalEvents === 0) return null;

  return (
    <div className="grid md:grid-cols-4 gap-6 mb-12">
      <Card className="bg-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Events</p>
              <p className="text-3xl mt-2">{totalEvents}</p>
            </div>
            <div className="w-12 h-12 bg-[#3A76F0]/10 rounded-xl flex items-center justify-center">
              <FaCalendarAlt className="w-6 h-6 text-[#3A76F0]" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Fill Rate</p>
              <p className="text-3xl mt-2">
                {totalSlots > 0
                  ? Math.round((totalFilledSlots / totalSlots) * 100)
                  : 0}
                %
              </p>
            </div>
            <div className="w-12 h-12 bg-[#FFC857]/10 rounded-xl flex items-center justify-center">
              <FaChartLine className="w-6 h-6 text-[#FFC857]" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
