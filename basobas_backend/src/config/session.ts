import crypto from "crypto";
import type { SignOptions } from "jsonwebtoken";

// Session / auth-cookie configuration.
export const AUTH_COOKIE = "auth_token";

// How long a session lasts. JWT expiry and cookie maxAge are kept in sync.
// Typed to jwt's expiresIn so a plain env string is accepted.
export const SESSION_TTL = (process.env.SESSION_TTL || "7d") as SignOptions["expiresIn"];
export const SESSION_TTL_MS =
  Number(process.env.SESSION_TTL_MS) || 7 * 24 * 60 * 60 * 1000; // 7 days

const isProd = process.env.NODE_ENV === "production";

/**
 * Secure cookie options for the auth token:
 * - httpOnly: not readable by JavaScript -> resists XSS token theft
 * - secure:   HTTPS-only in production
 * - sameSite: 'lax' -> not sent on cross-site requests -> resists CSRF
 */
export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    maxAge: SESSION_TTL_MS,
    path: "/",
  };
}

// Options used when clearing the cookie must match (minus maxAge).
export function clearCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
  };
}

// Short fingerprint of the client's User-Agent, bound into the token to detect
// a stolen token being replayed from a different client (session hijacking).
export function hashUserAgent(userAgent?: string): string {
  return crypto
    .createHash("sha256")
    .update(userAgent || "")
    .digest("hex")
    .slice(0, 32);
}
