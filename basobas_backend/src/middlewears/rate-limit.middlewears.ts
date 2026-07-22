import rateLimit from "express-rate-limit";

// Tiered rate limiters for brute-force defence. Limits are env-configurable so
// they can be tuned per environment without code changes.

// Strict limiter for authentication endpoints (login, register, password reset,
// MFA verify, expired-password change) — the main brute-force surface.
export const authLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: Number(process.env.AUTH_RATE_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts from this device. Please try again later.",
  },
});

// Moderate limiter for other sensitive write endpoints (bookings, listings,
// messages, profile changes, data export).
export const sensitiveLimiter = rateLimit({
  windowMs: Number(process.env.SENSITIVE_RATE_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.SENSITIVE_RATE_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please slow down and try again shortly.",
  },
});
