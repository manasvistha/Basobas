import mongoose, { Document, Schema } from "mongoose";

// Append-only audit trail of security-relevant actions. Records are written by
// the audit helper (fire-and-forget) and are only ever read by admins. An email
// snapshot is stored alongside the actor reference so the log stays meaningful
// even if the user is later deleted.
export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  actor?: mongoose.Types.ObjectId | null; // who did it (null if unauthenticated)
  actorEmail?: string;                     // snapshot for readability
  actorRole?: string;                      // snapshot of role at the time
  action: string;                          // e.g. "auth.login.success"
  status: "success" | "failure";
  targetType?: string;                     // "user" | "property" | ...
  targetId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;          // small, non-sensitive extra context
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema: Schema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", default: null },
    actorEmail: { type: String },
    actorRole: { type: String },
    action: { type: String, required: true },
    status: { type: String, enum: ["success", "failure"], default: "success" },
    targetType: { type: String },
    targetId: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Newest-first listing, plus filters by action and actor.
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ actor: 1, createdAt: -1 });

export const AuditLogModel = mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
