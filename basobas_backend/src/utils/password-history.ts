import bcrypt from "bcryptjs";
import { IUser } from "../models/user.model";

// Number of recent passwords (including the current one) that may not be reused.
export const PASSWORD_HISTORY_LIMIT = 5;

/**
 * True if `newPassword` matches the current password or any stored historical
 * password hash — i.e. it would be a reuse of a recent password.
 */
export async function isPasswordReused(user: IUser, newPassword: string): Promise<boolean> {
  const hashes = [user.password, ...(user.passwordHistory || [])].filter(Boolean) as string[];
  for (const hash of hashes) {
    if (await bcrypt.compare(newPassword, hash)) return true;
  }
  return false;
}

/**
 * Build the new passwordHistory array after adopting `newHash`, keeping the most
 * recent PASSWORD_HISTORY_LIMIT hashes (newest first, de-duplicated).
 */
export function nextPasswordHistory(
  currentHash: string | undefined,
  history: string[] | undefined,
  newHash: string
): string[] {
  const previous = [currentHash, ...(history || [])].filter(Boolean) as string[];
  const combined = [newHash, ...previous];
  const deduped = combined.filter((h, i) => combined.indexOf(h) === i);
  return deduped.slice(0, PASSWORD_HISTORY_LIMIT);
}
