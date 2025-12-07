import { Button } from "../common/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../common/card";
import {
  FaPlus,
  FaExternalLinkAlt,
  FaLink,
  FaUsers,
  FaClock,
  FaChartLine,
  FaCalendarAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { GroupingsPageProps, Pairing } from "../types";
import { useNavigate } from "react-router-dom";

interface HomeProps {
  data: GroupingsPageProps | null;
}

export default function Home({ data }: HomeProps) {
  const navigate = useNavigate();
  const events = data?.pairings || [];
  const organizerName = data?.firstName || "Organizer";
  console.log({ events, organizerName });
  // Calculate overall stats
  const totalEvents = events.length;

  let totalFilledSlots = 0;
  let totalSlots = 0;

  events.forEach((event) => {
    totalSlots += parseInt(event.numParticipants.toString());

    let currentEventFilled = 0;
    Object.values(event.groups).forEach((group) => {
      // Only count participants that have a name (not placeholders)
      currentEventFilled += group.filter((p: any) => p.name).length;
    });
    totalFilledSlots += currentEventFilled;
  });

  const copyJoinLink = (eventId: string) => {
    // Logic for join link might need adjustment based on how sharing works in this app
    // For now, let's assume a similar pattern or just copy a share link
    const url = `${window.location.origin}/share?eventId=${eventId}`; // Placeholder logic
    navigator.clipboard.writeText(url);
    toast.success("Join link copied to clipboard!");
  };

  const getEventStats = (event: Pairing) => {
    const totalSlots = parseInt(event.numParticipants.toString());
    let filledSlots = 0;
    Object.values(event.groups).forEach((group) => {
      // Only count participants that have a name
      filledSlots += group.filter((p: any) => p.name).length;
    });

    const fillPercentage =
      totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

    return { totalSlots, filledSlots, fillPercentage };
  };

  const handleCreateNew = () => {
    navigate("/create-event");
  };

  const handleViewEvent = (index: number) => {
    navigate(`/your-pairing?index=${index}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl">Welcome back, {organizerName}!</h1>
              <p className="text-muted-foreground mt-1">
                Manage your events and track participant progress
              </p>
            </div>
            <div
              onClick={handleCreateNew}
              className="bg-[#3A76F0] hover:bg-[#2f5fc7] p-2 rounded-lg flex items-center cursor-pointer"
            >
              <FaPlus className="w-5 h-5 mr-2" />
              <p className="hidden sm:block text-sm font-medium">
                Create New Event
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Overview */}
        {totalEvents > 0 && (
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Events
                    </p>
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
        )}

        {/* Events List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2>Your Events</h2>
            {totalEvents > 0 && (
              <p className="text-sm text-muted-foreground">
                {totalEvents} event{totalEvents !== 1 ? "s" : ""} created
              </p>
            )}
          </div>

          {events.length === 0 ? (
            <Card className="bg-white">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 bg-[#3A76F0]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FaPlus className="w-8 h-8 text-[#3A76F0]" />
                </div>
                <h3 className="mb-2">No events yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create your first Secret Santa or team formation event to get
                  started
                </p>
                <Button
                  onClick={handleCreateNew}
                  size="lg"
                  className="bg-[#3A76F0] hover:bg-[#2f5fc7]"
                >
                  <FaPlus className="w-5 h-5 mr-2" />
                  Create Your First Event
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, index) => {
                const stats = getEventStats(event);
                const isComplete = stats.filledSlots === stats.totalSlots;

                return (
                  <Card
                    key={index}
                    className="bg-white hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">
                            {event.groupingPurpose}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 text-xs">
                            <FaClock className="w-3 h-3" />
                            {/* Date is not in Pairing type, so we might skip or use a placeholder if needed */}
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
                      {/* Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">
                            Progress
                          </span>
                          <span
                            className={
                              stats.fillPercentage === 100
                                ? "text-[#60E1B1]"
                                : "text-foreground"
                            }
                          >
                            {stats.filledSlots}/{stats.totalSlots} filled (
                            {stats.fillPercentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              stats.fillPercentage === 100
                                ? "bg-[#60E1B1]"
                                : stats.fillPercentage > 50
                                ? "bg-[#3A76F0]"
                                : "bg-[#FFC857]"
                            }`}
                            style={{ width: `${stats.fillPercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FaUsers className="w-4 h-4" />
                          <span>{event.numParticipants} people</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <div className="w-4 h-4 bg-[#3A76F0]/10 rounded flex items-center justify-center">
                            <span className="text-[10px] text-[#3A76F0]">
                              {event.numGroups}
                            </span>
                          </div>
                          <span>{event.numGroups} groups</span>
                        </div>
                      </div>

                      {/* Roles */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Characteristics:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {event.characteristics.map((char, idx) => (
                            <div
                              key={idx}
                              className="bg-slate-100 text-xs px-2 py-1 rounded"
                            >
                              {char.name} ({char.count})
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => handleViewEvent(index)}
                          className="flex-1 bg-[#3A76F0] hover:bg-[#2f5fc7] text-white"
                          size="sm"
                        >
                          <FaExternalLinkAlt className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <div
                          onClick={() => copyJoinLink(event.groupingPurpose)}
                          className="flex items-center justify-center bg-slate-100 text-xs px-2 py-1 rounded"
                        >
                          <FaLink className="w-4 h-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
