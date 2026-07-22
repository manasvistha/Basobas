import { z } from "zod";

// Client-side mirror of the backend strong-password policy.
export const PASSWORD_MIN_LENGTH = 8;

export type PasswordRule = { label: string; test: (p: string) => boolean };

export const passwordRules: PasswordRule[] = [
  { label: `At least ${PASSWORD_MIN_LENGTH} characters`, test: (p) => p.length >= PASSWORD_MIN_LENGTH },
  { label: "An uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "A lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "A number", test: (p) => /[0-9]/.test(p) },
  { label: "A special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

/** Requirements the password does not yet meet. */
export function passwordIssues(password: string): string[] {
  return passwordRules.filter((r) => !r.test(password)).map((r) => r.label);
}

export function isStrongPassword(password: string): boolean {
  return passwordIssues(password).length === 0;
}

export const strongPasswordSchema = z.string().refine((p) => isStrongPassword(p), {
  message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters and include an uppercase letter, a lowercase letter, a number, and a special character`,
});
