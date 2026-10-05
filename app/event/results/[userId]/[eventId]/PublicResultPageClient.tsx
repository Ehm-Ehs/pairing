"use client";

import { errorStatus } from "@/utils/errors";
import { logger } from "@/utils/logger";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GroupingsPageProps } from "@/types";
import { fetchPublicEvent } from "@/services/endpoints";
import Result from "../../../../result/_components/Result";
import { Loading } from "@/components/ui/loading";
import { toast } from "react-toastify";

export default function PublicResultPageClient() {
  const { userId, eventId } = useParams();
  const [data, setData] = useState<GroupingsPageProps | null>(null);
  const [loading, setLoading] = useState(true);

  const validUserId = Array.isArray(userId) ? userId[0] : userId;
  const validEventId = Array.isArray(eventId) ? eventId[0] : eventId;

  useEffect(() => {
    const fetchEvent = async () => {
      if (!validUserId || !validEventId) return;
      try {
        // The public view contains names and groups only; contact details stay private.
        const { event, organizer } = await fetchPublicEvent({ ownerId: validUserId, eventId: validEventId });
        setData({
          userId: validUserId,
          firstName: organizer.firstName,
          lastName: organizer.lastName,
          email: "",
          pairings: [event],
        });
      } catch (error) {
        logger.error("Error fetching event for public results:", error);
        toast.error(errorStatus(error) === 404 ? "Event not found" : "Failed to load event details");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [validUserId, validEventId]);

  if (loading) {
    return <Loading message="Loading public results..." />;
  }

  if (!data || !data.pairings || data.pairings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-bold mb-2 text-gray-800">Results Not Available</h1>
          <p className="text-gray-500 text-sm">
            The results for this event could not be loaded or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Result data={data} isPublicView={true} />
    </div>
  );
}
