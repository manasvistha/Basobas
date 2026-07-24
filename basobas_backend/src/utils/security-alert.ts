import { AuditService } from "../services/audit.service";
import { sendEmail } from "../config/email";

// Proactive security alerting. When a defence actually fires (an account gets
// locked, an IP gets auto-blocked), we don't just silently mitigate — we raise
// an alert so an operator can notice an attack in progress. Three channels,
// all best-effort and non-blocking:
//   1. console.warn        — always (visible in server logs / log aggregators)
//   2. audit log entry     — so the alert is queryable in the admin Audit Log
//   3. email to an admin   — only if ADMIN_ALERT_EMAIL + mail creds are set
const auditService = new AuditService();

export interface SecurityAlert {
  type: string;                       // e.g. "account_locked", "ip_blocked"
  message: string;                    // human-readable summary
  ip?: string;
  actorId?: string | null;
  actorEmail?: string;
  metadata?: Record<string, any>;
}

export function raiseSecurityAlert(alert: SecurityAlert): void {
  const line = `[SECURITY ALERT] ${alert.type}: ${alert.message}` +
    (alert.ip ? ` (ip=${alert.ip})` : "");
  console.warn(line);

  // Record in the audit trail (fire-and-forget; record() never throws).
  void auditService.record({
    actor: alert.actorId ?? null,
    actorEmail: alert.actorEmail,
    action: `security.alert.${alert.type}`,
    status: "failure",
    ip: alert.ip,
    metadata: alert.metadata,
  });

  // Optional email alert to the admin address.
  const to = process.env.ADMIN_ALERT_EMAIL;
  if (to && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    const html =
      `<h3>BasoBas security alert: ${alert.type}</h3>` +
      `<p>${alert.message}</p>` +
      (alert.ip ? `<p><b>IP:</b> ${alert.ip}</p>` : "") +
      (alert.actorEmail ? `<p><b>Account:</b> ${alert.actorEmail}</p>` : "") +
      `<p><b>Time:</b> ${new Date().toISOString()}</p>`;
    // Do not await — alerting must never block or fail the request path.
    void sendEmail(to, `[BasoBas] Security alert: ${alert.type}`, html).catch((e) =>
      console.error("Security alert email failed:", e?.message || e)
    );
  }
}
