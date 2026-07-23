# BasoBas — Security Mechanisms & Key Management

This document explains the encryption, hashing, and key-management choices in the
BasoBas backend, plus the logging/alerting design. It is the written companion to
the code in `src/utils/crypto.ts`, `src/config/session.ts`, and the audit/alert
utilities.

## 1. Password hashing

- **Algorithm:** bcrypt (`bcryptjs`), **cost factor 12** (`BCRYPT_ROUNDS`, default 12).
- **Why:** bcrypt is a deliberately slow, salted, one-way KDF designed for
  passwords. Each hash embeds a unique per-password salt, so identical passwords
  produce different hashes and precomputed-rainbow-table attacks don't apply.
- **Keyless by design:** passwords are **never** decrypted — we only `bcrypt.compare`.
  There is therefore no password key to manage.
- **Reuse / expiry:** recent password hashes are kept (`passwordHistory`) to block
  reuse, and `passwordChangedAt` drives expiry + session revocation.
- Code: `src/utils/crypto.ts` → `hashPassword`; policy in `src/utils/password-policy.ts`.

## 2. Encryption at rest (sensitive data)

- **Algorithm:** **AES-256-GCM** (authenticated encryption).
- **What is encrypted:** the TOTP/MFA secret stored on the user document. (Passwords
  are hashed, not encrypted — see above.)
- **Why AES-256-GCM:** GCM provides confidentiality **and** integrity — any tampering
  with the ciphertext is detected on decrypt (auth tag). A fresh random 96-bit IV is
  generated per operation, so encrypting the same plaintext twice yields different
  ciphertext.
- **Self-describing, versioned format:** `enc:v1:<iv>:<tag>:<ciphertext>` (base64).
  The `enc:v1:` prefix lets us rotate algorithms/keys later while still recognising
  and decrypting old values. Values without the prefix are treated as legacy
  plaintext (backward compatible).
- Code: `src/utils/crypto.ts` → `encrypt` / `decrypt`.

## 3. Key management (choices & rationale)

| Key | Purpose | Source | Notes |
|-----|---------|--------|-------|
| `ENCRYPTION_KEY` | AES-256-GCM data-at-rest key | Environment variable | 256-bit. A 64-char hex string is used directly as 32 bytes; any other string is stretched to 32 bytes via SHA-256. |
| `JWT_SECRET` | Signs/verifies session JWTs | Environment variable | Distinct from the encryption key. |
| bcrypt salt | Per-password salt | Generated per hash by bcrypt | Not a managed secret. |

**Principles applied:**

1. **Keys live in the environment, never in code or the database.** Secrets are read
   from `process.env` and are excluded from version control (`.env` is gitignored).
2. **Separation of keys.** The data-encryption key (`ENCRYPTION_KEY`) is separate
   from the token-signing key (`JWT_SECRET`), so compromising one does not
   automatically compromise the other.
3. **Rotation is designed-in.** The `enc:v1:` version prefix means a future
   `ENCRYPTION_KEY` rotation can be rolled out by decrypting-with-old / re-encrypting
   -with-new during a migration, without breaking existing records.
4. **Safe dev fallback, explicit prod guidance.** If `ENCRYPTION_KEY` is unset, a key
   is derived from `JWT_SECRET` **for local development only** — this is documented as
   NOT production-safe. In production, `ENCRYPTION_KEY` must be set to a strong random
   value, ideally injected from a secrets manager (e.g. AWS Secrets Manager, GCP
   Secret Manager, HashiCorp Vault) rather than a plain `.env` file.

**Generating a production key:**

```bash
# 32 random bytes as hex (used directly as the AES-256 key)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set it as `ENCRYPTION_KEY` in the environment / secrets manager.

## 4. Session management

- JWT stored in an **HttpOnly, SameSite=Lax** cookie; **Secure** in production
  (`src/config/session.ts`). HttpOnly blocks XSS token theft; SameSite mitigates CSRF.
- Sessions **expire** (`SESSION_TTL`, default 7d) and can be cleared via logout.
- **Session-hijack protection:** the token is bound to a hash of the client
  User-Agent, and every protected request is re-validated against the database
  (zero-trust): the account must still exist, not be locked, and the token must not
  predate the last password change (revocation on credential change).

## 5. Logging, monitoring & alerting

- **Audit log** (`src/models/audit-log.model.ts`): security-relevant actions —
  logins (success/failure), logout, register, MFA verify, role changes, profile
  edits, property moderation, data export/import — with actor, IP, user-agent, and
  timestamp. Viewable by admins at `/admin/audit-logs`.
- **No sensitive data in logs:** passwords and card data are never logged; the audit
  log stores only non-sensitive context (e.g. a failure reason string).
- **Proactive alerts** (`src/utils/security-alert.ts`): when a defence actually fires
  — an **account is locked** or an **IP is auto-blocked** — an alert is raised on
  three channels: a `console.warn` (server logs), a `security.alert.*` audit entry
  (queryable in the admin UI), and, if `ADMIN_ALERT_EMAIL` (+ mail creds) is set, an
  email to the administrator. Alerting is best-effort and never blocks the request.

## 6. Relevant environment variables

```
# Secrets (set in every real environment; keep out of source control)
JWT_SECRET=<random string>
ENCRYPTION_KEY=<64-char hex, or any strong string>
BCRYPT_ROUNDS=12

# Email (enables password-reset mail and security-alert emails)
EMAIL_USER=<smtp user>
EMAIL_PASSWORD=<smtp app password>
ADMIN_ALERT_EMAIL=<where security alerts are sent>

# CAPTCHA (enables brute-force CAPTCHA on auth endpoints)
CAPTCHA_PROVIDER=turnstile
CAPTCHA_SECRET=<provider secret>

# Tunables
AUTH_RATE_MAX=10
ACCOUNT_LOCK_MAX_ATTEMPTS=5
FAILED_LOGIN_MAX=8
IP_ALLOWLIST=<comma-separated trusted IPs>
```
