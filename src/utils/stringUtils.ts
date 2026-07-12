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
