"use client";

import { passwordRules } from "@/lib/passwordPolicy";

type PasswordStrengthMeterProps = {
  password: string;
};

/**
 * Live password-strength feedback: a colored strength bar plus a checklist of
 * the policy requirements, ticking off as they are met. Renders nothing when
 * the field is empty.
 */
export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const passed = passwordRules.filter((rule) => rule.test(password)).length;
  const ratio = passed / passwordRules.length;

  const level = ratio >= 1 ? "Strong" : ratio >= 0.8 ? "Good" : ratio >= 0.5 ? "Fair" : "Weak";
  const color = ratio >= 1 ? "#15803d" : ratio >= 0.8 ? "#2563eb" : ratio >= 0.5 ? "#b45309" : "#dc2626";

  return (
    <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{ flex: 1, height: 6, borderRadius: 999, background: "#e5eae8", overflow: "hidden" }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={passwordRules.length}
          aria-valuenow={passed}
          aria-label="Password strength"
        >
          <div
            style={{
              height: "100%",
              width: `${Math.max(ratio * 100, 8)}%`,
              background: color,
              borderRadius: 999,
              transition: "width 0.2s ease, background 0.2s ease",
            }}
          />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 42, textAlign: "right" }}>
          {level}
        </span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 3 }}>
        {passwordRules.map((rule) => {
          const ok = rule.test(password);
          return (
            <li
              key={rule.label}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: ok ? "#15803d" : "#6b7b80" }}
            >
              <span aria-hidden style={{ fontSize: 11 }}>{ok ? "✓" : "○"}</span>
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
