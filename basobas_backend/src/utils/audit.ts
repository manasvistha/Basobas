import { Request } from "express";
import { AuditService } from "../services/audit.service";
import { getClientIp } from "../middlewears/ip-guard.middlewears";

// Canonical action names — keep them stable; the admin UI filters by prefix
// (e.g. "auth.") so grouping stays consistent.
export const AUDIT = {
  LOGIN_SUCCESS: "auth.login.success",
  LOGIN_FAILURE: "auth.login.failure",
  LOGOUT: "auth.logout",
  REGISTER: "auth.register",
  MFA_VERIFY_SUCCESS: "auth.mfa.verify.success",
  MFA_VERIFY_FAILURE: "auth.mfa.verify.failure",
  PASSWORD_RESET_REQUEST: "auth.password.reset_request",
  PASSWORD_CHANGED: "auth.password.changed",
  PROFILE_UPDATED: "profile.updated",
  ROLE_CHANGED: "user.role_changed",
  USER_DELETED: "user.deleted",
  PROPERTY_DELETED: "property.deleted",
  PROPERTY_MODERATED: "property.moderated",
  DATA_EXPORTED: "data.exported",
  DATA_IMPORTED: "data.imported",
} as const;

const auditService = new AuditService();

interface AuditDetails {
  status?: "success" | "failure";
  actorId?: string;        // override (e.g. failed login where req.user is absent)
  actorEmail?: string;
  actorRole?: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
}

/**
 * Record an audit entry for the current request. Fire-and-forget: call as
 * `void recordAudit(req, AUDIT.LOGIN_SUCCESS, { ... })` — it never throws and
 * never blocks the response.
 */
export function recordAudit(req: Request, action: string, details: AuditDetails = {}): void {
  const user = (req as any).user;
  void auditService.record({
    actor: details.actorId ?? user?.id ?? null,
    actorEmail: details.actorEmail,
    actorRole: details.actorRole ?? user?.role,
    action,
    status: details.status ?? "success",
    targetType: details.targetType,
    targetId: details.targetId,
    ip: getClientIp(req),
    userAgent: req.headers["user-agent"],
    metadata: details.metadata,
  });
}
