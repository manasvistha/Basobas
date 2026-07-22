import { z } from "zod";

// Central strong-password rules, shared by registration, reset, and change flows.
export const PASSWORD_MIN_LENGTH = 8;

/** Returns a list of unmet requirements (empty array = strong enough). */
export function validatePasswordStrength(password: string): string[] {
  const errors: string[] = [];
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`at least ${PASSWORD_MIN_LENGTH} characters`);
  }
  if (!/[A-Z]/.test(password)) errors.push("an uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("a lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("a number");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("a special character");
  return errors;
}

/** Throws a user-friendly error if the password does not meet the policy. */
export function assertStrongPassword(password: string): void {
  const errors = validatePasswordStrength(password);
  if (errors.length > 0) {
    throw new Error(`Password must contain ${errors.join(", ")}`);
  }
}

/** Zod schema for use in request DTOs. */
export const strongPasswordSchema = z
  .string()
  .refine((p) => validatePasswordStrength(p).length === 0, {
    message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters and include an uppercase letter, a lowercase letter, a number, and a special character`,
  });
