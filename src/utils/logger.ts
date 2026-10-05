/**
 * Small logging wrapper used across the app.
 *
 * debug and info are silenced in production builds so diagnostic noise (and anything
 * a developer logged while debugging) never reaches users' consoles or server logs.
 * warn and error always go through.
 */
const verbose = process.env.NODE_ENV !== "production";

 
export const logger = {
  debug: (...args: unknown[]) => {
    if (verbose) console.debug(...args);
  },
  info: (...args: unknown[]) => {
    if (verbose) console.info(...args);
  },
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};
