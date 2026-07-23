import { AuditLogModel } from "../models/audit-log.model";

export interface AuditQuery {
  page?: number;
  limit?: number;
  action?: string;   // exact or prefix (e.g. "auth." matches all auth events)
  actor?: string;    // actor user id
  status?: "success" | "failure";
  from?: string;     // ISO date (inclusive)
  to?: string;       // ISO date (inclusive)
}

export class AuditService {
  // Persist a single audit entry. Never throws — auditing must not break the
  // action being audited.
  async record(entry: Record<string, any>): Promise<void> {
    try {
      await AuditLogModel.create(entry);
    } catch (err: any) {
      console.error("Audit write failed:", err?.message || err);
    }
  }

  // Admin listing: newest-first, paginated, with optional filters.
  async query(q: AuditQuery) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));

    const filter: Record<string, any> = {};
    if (q.action) filter.action = { $regex: `^${escapeRegex(q.action)}`, $options: "i" };
    if (q.actor) filter.actor = q.actor;
    if (q.status) filter.status = q.status;
    if (q.from || q.to) {
      filter.createdAt = {};
      if (q.from) filter.createdAt.$gte = new Date(q.from);
      if (q.to) filter.createdAt.$lte = new Date(q.to);
    }

    const [items, total] = await Promise.all([
      AuditLogModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("actor", "name email role")
        .lean(),
      AuditLogModel.countDocuments(filter),
    ]);

    return {
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
