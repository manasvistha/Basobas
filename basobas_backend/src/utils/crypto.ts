import crypto from "crypto";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------------------------
// Password hashing (one-way, keyless, per-password salt) — bcrypt.
// Passwords are never decrypted; we only compare hashes. Cost factor is
// configurable and defaults to 12 (stronger than the previous 10).
// ---------------------------------------------------------------------------
export const SALT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

// ---------------------------------------------------------------------------
// Symmetric encryption for sensitive data at rest (reversible) — AES-256-GCM.
// GCM is authenticated encryption: it provides confidentiality AND integrity
// (tampering is detected on decrypt). A fresh random IV is used per operation.
//
// Key management: the 256-bit key comes from the ENCRYPTION_KEY environment
// variable (never hardcoded, never stored in the database). See the project
// notes for production guidance (secrets manager + rotation).
// ---------------------------------------------------------------------------
const ALGO = "aes-256-gcm";
const PREFIX = "enc:v1:"; // version tag enables future key/algorithm rotation

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY || "";
  if (!raw) {
    // Dev fallback only — derive a key from JWT_SECRET so the app still runs
    // without ENCRYPTION_KEY set. NOT suitable for production.
    return crypto.createHash("sha256").update(process.env.JWT_SECRET || "insecure-dev-key").digest();
  }
  // A 64-char hex string is used directly as 32 bytes; anything else is
  // stretched to 32 bytes with SHA-256.
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  return crypto.createHash("sha256").update(raw).digest();
}

/** Encrypt a UTF-8 string. Output is self-describing: enc:v1:iv:tag:ciphertext (base64). */
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12); // 96-bit nonce recommended for GCM
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return (
    PREFIX +
    [iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(":")
  );
}

/**
 * Decrypt a value produced by encrypt(). Values without the version prefix are
 * assumed to be legacy plaintext and returned unchanged (backward compatible).
 */
export function decrypt(value: string): string {
  if (!value || !value.startsWith(PREFIX)) return value;
  const [ivB64, tagB64, ctB64] = value.slice(PREFIX.length).split(":");
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
