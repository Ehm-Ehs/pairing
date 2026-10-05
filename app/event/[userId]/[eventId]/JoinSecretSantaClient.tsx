"use client";

import { roleBasedFormPath } from "@/utils/eventLinks";
import { logger } from "@/utils/logger";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import JoinSecretSanta from "../../_components/JoinSecretSanta";
import JoinRandomPositioning from "../../_components/JoinRandomPositioning";
import { Loading } from "@/components/ui/loading";
import { Pairing } from "@/types";
import { fetchPublicEvent } from "@/services/endpoints";

/** Opens the right join screen for an event link, whatever the event type. */
export default function SmartJoinEventClient() {
  const { userId, eventId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pairing, setPairing] = useState<Pairing | null>(null);

  const validUserId = Array.isArray(userId) ? userId[0] : userId;
  const validEventId = Array.isArray(eventId) ? eventId[0] : eventId;

  useEffect(() => {
    const fetchEventAndRoute = async () => {
      if (!validUserId || !validEventId) return;

      try {
        const { event } = await fetchPublicEvent({ ownerId: validUserId, eventId: validEventId });
        setPairing(event);

        if (event.type === "role-based") {
          router.replace(roleBasedFormPath(event, validUserId));
          return;
        }
      } catch (err) {
        logger.error("Error routing join event:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndRoute();
  }, [validUserId, validEventId, router]);

  if (loading) {
    return <Loading message="Loading event registration..." />;
  }

  if (pairing?.type === "random-positioning") {
    return <JoinRandomPositioning />;
  }

  return <JoinSecretSanta />;
}
