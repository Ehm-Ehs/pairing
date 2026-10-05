import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { fetchPublicEvent } from "@/services/endpoints";
import { EventType, Pairing } from "@/types";
import { logger } from "@/utils/logger";

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/**
 * Loads the public view of the event named in the URL (/event/[userId]/[eventId]).
 * Returns null for `event` when the link is wrong or the event is not of the expected type.
 */
export function usePublicEvent<T extends Pairing>(expectedType: EventType) {
  const params = useParams();
  const ownerId = first(params.userId);
  const eventId = first(params.eventId);

  const [event, setEvent] = useState<T | null>(null);
  const [messages, setMessages] = useState({ closed: "", full: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId || !eventId) return;
    let cancelled = false;

    fetchPublicEvent({ ownerId, eventId })
      .then((res) => {
        if (cancelled) return;
        setMessages(res.messages);
        if (res.event.type === expectedType) setEvent(res.event as T);
        else toast.error("Event not found");
      })
      .catch((error) => {
        if (cancelled) return;
        logger.error("Error fetching event:", error);
        toast.error(error?.status === 404 ? "Event not found" : "Failed to load event");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ownerId, eventId, expectedType]);

  return { event, messages, loading, ownerId, eventId };
}
