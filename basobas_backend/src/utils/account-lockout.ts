import type { IUser } from "../models/user.model";

// Per-account lockout — the account-scoped complement to the per-IP failed-login
// block in failed-login.middlewears.ts. IP blocking stops one machine spraying
// many accounts; account lockout stops many machines (a botnet / credential-
// stuffing pool) hammering ONE account. Zero-trust: a valid-looking request
// stream is throttled the moment it starts failing, regardless of source.
const MAX_ATTEMPTS = Number(process.env.ACCOUNT_LOCK_MAX_ATTEMPTS) || 5;
const LOCK_MS = Number(process.env.ACCOUNT_LOCK_MS) || 15 * 60 * 1000; // 15 min

/** True while the account is inside an active lock window. */
export function isAccountLocked(user: Pick<IUser, "lockUntil">): boolean {
  return !!user.lockUntil && user.lockUntil.getTime() > Date.now();
}

/** Milliseconds remaining on an active lock (0 if not locked). */
export function lockRemainingMs(user: Pick<IUser, "lockUntil">): number {
  if (!user.lockUntil) return 0;
  return Math.max(0, user.lockUntil.getTime() - Date.now());
}

/**
 * Record one failed password attempt against the account and lock it once the
 * threshold is crossed. Persisted so the lock survives a process restart and is
 * shared across instances (unlike the in-memory per-IP counter).
 */
export async function registerFailedAttempt(user: IUser): Promise<void> {
  const attempts = (user.failedLoginAttempts ?? 0) + 1;

  if (attempts >= MAX_ATTEMPTS) {
    user.failedLoginAttempts = 0; // fresh slate once the lock expires
    user.lockUntil = new Date(Date.now() + LOCK_MS);
  } else {
    user.failedLoginAttempts = attempts;
    user.lockUntil = undefined;
  }
  await user.save();
}

/** Clear all lockout state after a genuine, successful authentication. */
export async function resetFailedAttempts(user: IUser): Promise<void> {
  if (!user.failedLoginAttempts && !user.lockUntil) return; // nothing to persist
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();
}
