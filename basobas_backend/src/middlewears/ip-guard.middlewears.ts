import { Request, Response, NextFunction } from "express";

// In-memory IP block store (process lifetime). For a multi-instance deployment
// this would move to a shared store like Redis; sufficient for single-instance.
const blockedIps = new Map<string, number>(); // ip -> unblock timestamp (ms)

const parseList = (value?: string) =>
  (value || "").split(",").map((s) => s.trim()).filter(Boolean);

// Trusted IPs that always bypass rate limits and blocks (e.g. office/CI IPs).
const allowList = new Set<string>(parseList(process.env.IP_ALLOWLIST));

export function normalizeIp(ip: string): string {
  if (!ip) return "";
  return ip.replace(/^::ffff:/, ""); // strip IPv6-mapped IPv4 prefix
}

export function getClientIp(req: Request): string {
  return normalizeIp((req.ip || (req.socket && req.socket.remoteAddress) || "") as string);
}

export function isAllowlisted(ip: string): boolean {
  return allowList.has(normalizeIp(ip));
}

export function blockIp(ip: string, durationMs: number): void {
  const clean = normalizeIp(ip);
  if (!clean || isAllowlisted(clean)) return;
  blockedIps.set(clean, Date.now() + durationMs);
}

export function unblockIp(ip: string): void {
  blockedIps.delete(normalizeIp(ip));
}

export function isBlocked(ip: string): boolean {
  const clean = normalizeIp(ip);
  const until = blockedIps.get(clean);
  if (!until) return false;
  if (Date.now() > until) {
    blockedIps.delete(clean); // expired -> auto-unblock
    return false;
  }
  return true;
}

// Global middleware: reject blocked IPs. Allow-listed IPs always pass.
export function ipGuard(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  if (isAllowlisted(ip)) return next();
  if (isBlocked(ip)) {
    return res.status(403).json({
      success: false,
      message: "Access temporarily blocked due to suspicious activity.",
    });
  }
  next();
}
