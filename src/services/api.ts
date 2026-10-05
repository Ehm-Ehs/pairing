import { auth } from "./firebase";

/** Error returned by our own API routes, carrying the HTTP status and error code. */
export class ApiError extends Error {
  status: number;
  code?: string;
  data: Record<string, unknown>;

  constructor(status: number, message: string, data: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.code = typeof data.code === "string" ? data.code : undefined;
    this.data = data;
  }
}

interface ApiOptions {
  method?: "GET" | "POST";
  body?: unknown;
  /** "required" waits for Firebase auth and fails if nobody is signed in. Default sends a token when one exists. */
  auth?: "optional" | "required";
}

/**
 * Calls one of our API routes, attaching the current user's Firebase ID token.
 * The token is read fresh from Firebase each time; it is never stored by the app.
 */
export async function apiFetch<T = Record<string, unknown>>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = options.body !== undefined ? "POST" : "GET", body, auth: mode = "optional" } = options;

  if (mode === "required") await auth.authStateReady();
  const user = auth.currentUser;
  if (mode === "required" && !user) {
    throw new ApiError(401, "Please sign in to continue.", { code: "UNAUTHENTICATED" });
  }

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;

  const response = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: Record<string, unknown> = {};
  try {
    data = await response.json();
  } catch {
    // Non-JSON response; fall through with an empty object.
  }
  if (!response.ok) {
    const message = typeof data.error === "string" ? data.error : "Something went wrong. Please try again.";
    throw new ApiError(response.status, message, data);
  }
  return data as T;
}
