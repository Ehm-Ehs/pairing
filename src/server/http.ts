import { ADMIN_SETUP_HINT, hasAdminCredentials } from "../services/firebaseAdmin";
import { logger } from "@/utils/logger";
import { NextResponse } from "next/server";

/** An error that maps to a specific HTTP status and is safe to show to the caller. */
export class HttpError extends Error {
  status: number;
  code?: string;
  extra?: Record<string, unknown>;

  constructor(status: number, message: string, code?: string, extra?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

type Handler<C> = (request: Request, context: C) => Promise<Response>;

/**
 * Wraps a route handler so failures are never reported as success.
 * HttpErrors become their status code; anything else is logged and returned as a generic 500.
 */
export function route<C = unknown>(name: string, handler: Handler<C>): Handler<C> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json(
          { error: err.message, code: err.code, ...(err.extra || {}) },
          { status: err.status }
        );
      }
      logger.error(`[api:${name}]`, err);
      if (!hasAdminCredentials) {
        // The route could not reach the database because the server is missing its credentials.
        // Say so plainly in development; in production keep the detail in the logs.
        const detail = process.env.NODE_ENV === "production" ? "The service is not available right now." : ADMIN_SETUP_HINT;
        return NextResponse.json({ error: detail, code: "SERVER_NOT_CONFIGURED" }, { status: 503 });
      }
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T> {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") throw new Error("not an object");
    return body as T;
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * The public address of this deployment, used to build links in emails and messages.
 * NEXT_PUBLIC_APP_URL is set for the production and develop sites. Where it is not set
 * (your machine, pull request previews) the address the request came in on is used.
 */
export function appOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
  const protocol =
    request.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export function str(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Reads an untrusted value as a plain object; anything else becomes an empty object. */
export function obj(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}
