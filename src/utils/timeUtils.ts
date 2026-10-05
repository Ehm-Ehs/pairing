/** A Firestore Timestamp, epoch milliseconds, or an ISO date string. */
export type TimeLike = { seconds: number } | number | string | null | undefined;

/** Converts any stored time value to a Date, or null if it cannot be read. */
export function toDate(value: TimeLike): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date =
    typeof value === "object" ? new Date(value.seconds * 1000) : new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

const plural = (count: number, unit: string) => `${count} ${unit}${count !== 1 ? "s" : ""}`;

/** Short relative time, e.g. "5m ago". */
export function formatTimeAgo(value: TimeLike): string {
  const date = toDate(value);
  if (!date) return "Recent";
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Long relative time, e.g. "2 hours ago". */
export function formatRelativeLong(value: TimeLike): string {
  const date = toDate(value);
  if (!date) return "Recently";
  const minutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${plural(minutes, "minute")} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${plural(hours, "hour")} ago`;
  return `${plural(Math.floor(hours / 24), "day")} ago`;
}

/** Calendar date for headers, e.g. "Oct 4, 2026". */
export function formatEventDate(value: TimeLike): string {
  const date = toDate(value);
  if (!date) return "Recent Event";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
