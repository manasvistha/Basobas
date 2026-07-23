import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { getClientIp } from "./ip-guard.middlewears";

// CAPTCHA verification for the brute-force-exposed auth endpoints. This proves a
// human (or at least a browser solving a challenge) is behind the request, which
// blunts automated credential-stuffing that rate limits alone can't stop.
//
// Provider-agnostic: works with Cloudflare Turnstile, Google reCAPTCHA v2/v3, or
// hCaptcha — all expose a compatible siteverify endpoint. Select via env:
//   CAPTCHA_PROVIDER = turnstile | recaptcha | hcaptcha
//   CAPTCHA_SECRET   = <server-side secret from the provider>
//   CAPTCHA_MIN_SCORE= <optional, reCAPTCHA v3 score threshold, default 0.5>
//
// Zero-trust default: if a secret IS configured we ENFORCE. If it is not, the
// middleware no-ops so local dev and the Flutter client keep working — set the
// secret in any real/staging/prod environment to turn enforcement on.

const VERIFY_URLS: Record<string, string> = {
  turnstile: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
  recaptcha: "https://www.google.com/recaptcha/api/siteverify",
  hcaptcha: "https://hcaptcha.com/siteverify",
};

const PROVIDER = (process.env.CAPTCHA_PROVIDER || "turnstile").toLowerCase();
const SECRET = process.env.CAPTCHA_SECRET || "";
const MIN_SCORE = Number(process.env.CAPTCHA_MIN_SCORE) || 0.5;

/** Enforcement is on only when a secret is configured. */
export function captchaEnabled(): boolean {
  return SECRET.length > 0;
}

function readToken(req: Request): string {
  return (
    req.body?.captchaToken ||
    req.body?.["cf-turnstile-response"] ||
    req.body?.["g-recaptcha-response"] ||
    req.body?.["h-captcha-response"] ||
    (req.headers["x-captcha-token"] as string) ||
    ""
  );
}

export async function requireCaptcha(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!captchaEnabled()) return next(); // not configured -> skip (dev/mobile)

  const token = readToken(req);
  if (!token) {
    res.status(400).json({
      success: false,
      message: "CAPTCHA verification is required.",
    });
    return;
  }

  const url = VERIFY_URLS[PROVIDER] || VERIFY_URLS.turnstile;
  try {
    // Providers expect application/x-www-form-urlencoded.
    const params = new URLSearchParams();
    params.append("secret", SECRET);
    params.append("response", token);
    const ip = getClientIp(req);
    if (ip) params.append("remoteip", ip);

    const { data } = await axios.post(url, params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 5000,
    });

    // reCAPTCHA v3 returns a `score`; enforce a threshold when present.
    const scoreOk =
      typeof data?.score === "number" ? data.score >= MIN_SCORE : true;

    if (!data?.success || !scoreOk) {
      res.status(403).json({
        success: false,
        message: "CAPTCHA verification failed. Please try again.",
      });
      return;
    }

    next();
  } catch (err: any) {
    // Fail closed: if we cannot verify, do not let the request through — an
    // outage of the CAPTCHA provider must not open the brute-force door.
    console.error("CAPTCHA verification error:", err?.message || err);
    res.status(503).json({
      success: false,
      message: "Could not verify CAPTCHA right now. Please try again shortly.",
    });
    return;
  }
}
