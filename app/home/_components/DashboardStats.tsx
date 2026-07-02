import { FaLayerGroup, FaUsers } from "react-icons/fa";

interface DashboardStatsProps {
  totalEvents: number;
  liveEvents: number;
  totalParticipants: number;
}

const DashboardStats = ({
  totalEvents,
  liveEvents,
  totalParticipants,
}: DashboardStatsProps) => {
  if (totalEvents === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
      {/* Total Events */}
      <div className="bg-white rounded-3xl p-6 border border-gray-150/40 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Total Events
          </span>
          <p className="text-3xl font-extrabold text-gray-900 mt-1 font-heading">
            {totalEvents}
          </p>
          <span className="text-xs text-gray-400 mt-1 inline-block">
            All time
          </span>
        </div>
        <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shadow-sm">
          <FaLayerGroup className="w-5 h-5" />
        </div>
      </div>

      {/* Live Now */}
      <div className="bg-white rounded-3xl p-6 border border-gray-150/40 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Live Now
          </span>
          <p className="text-3xl font-extrabold text-gray-900 mt-1 font-heading">
            {liveEvents}
          </p>
          <span className="text-xs text-gray-400 mt-1 inline-block">
            Active events
          </span>
        </div>
        <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center shadow-sm">
          <FaLayerGroup className="w-5 h-5" />
        </div>
      </div>

      {/* Participants */}
      <div className="bg-white rounded-3xl p-6 border border-gray-150/40 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Participants
          </span>
          <p className="text-3xl font-extrabold text-gray-900 mt-1 font-heading">
            {totalParticipants}
          </p>
          <span className="text-xs text-gray-400 mt-1 inline-block">
            Total joined
          </span>
        </div>
        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shadow-sm">
          <FaUsers className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
