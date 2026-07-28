/**
 * Capitalizes the first letter of each word in a string.
 * @example capitalizeWords("john doe") => "John Doe"
 */
export const capitalizeWords = (str: string): string => {
  if (!str) return "";
  return str
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Safely formats any group key (e.g., "group_1", "group_0", "0", "Group 1", "Team Alpha") into a clean display name.
 * Prevents "Group NaN" errors when parsing non-numeric group keys.
 */
export const formatGroupName = (groupKey?: string | null, fallbackIndex?: number): string => {
  if (!groupKey) {
    return fallbackIndex !== undefined ? `Group ${fallbackIndex + 1}` : "Group 1";
  }

  const str = String(groupKey).trim();

  // If it's already a formatted group label like "Group 1" or custom name like "Team A"
  if (/^group\s+\d+$/i.test(str)) {
    return capitalizeWords(str);
  }

  // Handle keys starting with "group_" or "group"
  if (/^group[_\s]?\d+$/i.test(str)) {
    const digits = str.replace(/\D+/g, "");
    if (digits) {
      const num = parseInt(digits, 10);
      // If 0-indexed "group_0", convert to 1-indexed "Group 1"
      if (str.toLowerCase().startsWith("group_0") || str.toLowerCase() === "group0") {
        return `Group ${num + 1}`;
      }
      return `Group ${num}`;
    }
  }

  // Handle plain numbers e.g. "0" or "1"
  if (!isNaN(Number(str))) {
    const num = parseInt(str, 10);
    // If 0, convert to 1-indexed Group 1
    return num === 0 ? "Group 1" : `Group ${num}`;
  }

  // Non-numeric custom group key (e.g., "Engineering Team")
  return capitalizeWords(str);
};
