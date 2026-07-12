"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../../src/services/firebase";
import { Pairing, GroupingsPageProps } from "../../../../../src/types";
import Result from "../../../../result/_components/Result";
import { Loading } from "../../../../../src/components/ui/loading";
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
        const userDoc = await getDoc(doc(db, "Users", validUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const foundEvent = userData.pairings?.find(
            (p: Pairing) => p.id === validEventId
          );
          if (foundEvent) {
            setData({
              userId: validUserId,
              firstName: userData.firstName || "",
              lastName: userData.lastName || "",
              email: userData.email || "",
              pairings: [foundEvent],
            });
          } else {
            toast.error("Event not found");
          }
        } else {
          toast.error("Organizer not found");
        }
      } catch (error) {
        console.error("Error fetching event for public results:", error);
        toast.error("Failed to load event details");
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
