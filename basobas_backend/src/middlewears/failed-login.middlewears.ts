import { Request } from "express";
import { blockIp, getClientIp, isAllowlisted } from "./ip-guard.middlewears";
import { raiseSecurityAlert } from "../utils/security-alert";

// Track failed authentication attempts per IP and auto-block after too many
// within a rolling window — the active side of brute-force defence.
const WINDOW_MS = Number(process.env.FAILED_LOGIN_WINDOW_MS) || 15 * 60 * 1000;
const MAX_FAILS = Number(process.env.FAILED_LOGIN_MAX) || 8;
const BLOCK_MS = Number(process.env.FAILED_LOGIN_BLOCK_MS) || 30 * 60 * 1000;

type Entry = { count: number; first: number };
const attempts = new Map<string, Entry>();

/** Record one failed auth attempt; block the IP once it crosses the threshold. */
export function recordFailedLogin(req: Request): void {
  const ip = getClientIp(req);
  if (!ip || isAllowlisted(ip)) return;

  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now - entry.first > WINDOW_MS) {
    attempts.set(ip, { count: 1, first: now });
    return;
  }

  entry.count += 1;
  if (entry.count >= MAX_FAILS) {
    blockIp(ip, BLOCK_MS);
    attempts.delete(ip); // the IP is now blocked; reset the counter
    // Proactive alert: an IP just got auto-blocked for repeated failures.
    raiseSecurityAlert({
      type: "ip_blocked",
      message: `IP auto-blocked after ${MAX_FAILS} failed auth attempts.`,
      ip,
      metadata: { blockMs: BLOCK_MS },
    });
  }
}

/** Clear the failure counter for an IP after a successful authentication. */
export function clearFailedLogins(req: Request): void {
  attempts.delete(getClientIp(req));
}
