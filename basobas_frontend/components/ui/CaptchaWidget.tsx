"use client";

import { useEffect, useRef } from "react";

// Cloudflare Turnstile widget. Renders only when a site key is configured via
// NEXT_PUBLIC_TURNSTILE_SITE_KEY, so local dev works without keys (the backend
// CAPTCHA check is likewise dormant until CAPTCHA_SECRET is set). When enabled,
// it hands the solved token up via onVerify; the form sends it as `captchaToken`.

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** True when a site key is present — forms use this to require a token. */
export function isCaptchaEnabled(): boolean {
  return SITE_KEY.length > 0;
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
      reset: (id?: string) => void;
    };
  }
}

function loadScript(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve();
    if (window.turnstile) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.addEventListener("load", () => resolve(), { once: true });
    document.head.appendChild(s);
  });
}

export default function CaptchaWidget({
  onVerify,
}: {
  onVerify: (token: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!isCaptchaEnabled()) return; // no key -> nothing to render
    let cancelled = false;

    loadScript().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      widgetId.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => onVerify(token),
        "expired-callback": () => onVerify(""),
        "error-callback": () => onVerify(""),
      });
    });

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* widget already gone */
        }
      }
    };
  }, [onVerify]);

  if (!isCaptchaEnabled()) return null;
  return <div ref={containerRef} style={{ margin: "8px 0" }} />;
}
