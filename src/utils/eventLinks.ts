import type { Pairing, RoleBasedPairing } from "../types";

/**
 * The single place share links are built.
 * `organizerId` is the uid of the organizer; older links identify events by it.
 */

/** Join links carry the organizer id in Base64 for the role-based form. */
const encodeOrganizerId = (uid: string): string => btoa(uid);
export const decodeOrganizerId = (encoded: string): string => atob(encoded);

/** Path of the role-based registration form, optionally limited to one group. */
export function roleBasedFormPath(event: RoleBasedPairing, organizerId: string, groupKey?: string): string {
  const groups = event.groups || {};
  const shown = groupKey ? { [groupKey]: groups[groupKey] || [] } : groups;
  const params = new URLSearchParams({
    groupingPurpose: event.groupingPurpose || event.title,
    numGroups: String(groupKey ? 1 : event.numGroups),
    numParticipants: String(groupKey ? shown[groupKey].length : event.numParticipants),
    characteristicsLabel: event.characteristicsLabel || "",
    pairings: JSON.stringify(shown),
    userId: encodeOrganizerId(organizerId),
    eventId: event.id,
  });
  if (groupKey) params.set("group", groupKey);
  return `/form?${params.toString()}`;
}

/** Path participants use to join an event. */
export function joinPath(event: Pairing, organizerId: string): string {
  if (event.type === "secret-santa") return `/event/${organizerId}/${event.id}`;
  if (event.type === "random-positioning") return `/event/rp/${organizerId}/${event.id}`;
  return roleBasedFormPath(event, organizerId);
}

/** Path of the public, read-only results page. */
export function resultsPath(event: Pairing, organizerId: string): string {
  return `/event/results/${organizerId}/${event.id}`;
}

export const absoluteUrl = (path: string): string => `${window.location.origin}${path}`;
