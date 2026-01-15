import { Button } from "../../../src/components/ui/button";
import { Card, CardContent } from "../../../src/components/ui/card";
import { FaPlus } from "react-icons/fa";
import { GroupingsPageProps } from "../../../src/types";
import DashboardStats from "./DashboardStats";
import EventCard from "../../../src/utils/EventCard";
import { useHomeActions } from "../../../src/hooks/useHomeActions";

interface HomeProps {
  data: GroupingsPageProps | null;
}

import { useSearchParams } from "next/navigation";

export default function Home({ data }: HomeProps) {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");

  const allEvents = data?.pairings || [];
  const events = filter
    ? allEvents.filter((e) => e.type === filter)
    : allEvents;
  const organizerName = data?.firstName || "Organizer";
  const {
    handleCreateNew,
    handleGeneratePairs,
    handleShare,
    calculateTotalStats,
  } = useHomeActions();

  // Calculate overall stats
  const totalEvents = events.length;
  const { totalSlots, totalFilledSlots } = calculateTotalStats(events);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl capitalize">
                Welcome back, {organizerName}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your events and track participant progress
              </p>
            </div>
            <div
              onClick={handleCreateNew}
              className="bg-[#3A76F0] hover:bg-[#2f5fc7] p-2 rounded-lg flex items-center cursor-pointer text-white"
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
        <DashboardStats
          totalEvents={totalEvents}
          totalSlots={totalSlots}
          totalFilledSlots={totalFilledSlots}
        />

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
                <h3 className="mb-2 font-heading text-xl">No events yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {filter === "secret-santa"
                    ? "Create your first Secret Santa event to get started"
                    : filter === "role-based"
                    ? "Create your first Team Formation event to get started"
                    : filter === "random-positioning"
                    ? "Create your first Random Positioning event to get started"
                    : "Create your first Secret Santa or team formation event to get started"}
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
              {events.map((event, index) => (
                <EventCard
                  key={index}
                  event={event}
                  index={index}
                  onGeneratePairs={handleGeneratePairs}
                  onViewDetails={handleShare}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
