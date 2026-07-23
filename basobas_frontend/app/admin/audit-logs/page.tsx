"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getAuditLogs } from "@/lib/api/admin";
import { getCurrentUser } from "@/lib/utils/auth-utils";
import BackPillLink from "@/components/ui/BackPillLink";

type AuditRow = {
  _id: string;
  action: string;
  status: "success" | "failure";
  actor?: { name?: string; email?: string; role?: string } | null;
  actorEmail?: string;
  actorRole?: string;
  targetType?: string;
  targetId?: string;
  ip?: string;
  metadata?: Record<string, any>;
  createdAt: string;
};

const ACTION_GROUPS = [
  { label: "All actions", value: "" },
  { label: "Authentication", value: "auth." },
  { label: "Profile changes", value: "profile." },
  { label: "Role changes", value: "user.role_changed" },
  { label: "User deletions", value: "user.deleted" },
  { label: "Property moderation", value: "property." },
  { label: "Data export/import", value: "data." },
];

export default function AdminAuditLogsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [action, setAction] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    const u = getCurrentUser();
    if (!u || u.role !== "admin") router.replace("/login");
  }, [router]);

  const fetchLogs = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAuditLogs({
          page: p,
          limit: 20,
          action: action || undefined,
          status: status || undefined,
          from: from || undefined,
          to: to ? `${to}T23:59:59.999Z` : undefined,
        });
        setRows(res?.data || []);
        const pg = res?.pagination || {};
        setPage(pg.page || 1);
        setTotalPages(pg.totalPages || 1);
        setTotal(pg.total || 0);
      } catch (err: any) {
        setError(err?.message || "Failed to load audit logs");
      } finally {
        setLoading(false);
      }
    },
    [action, status, from, to]
  );

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const badge = (s: string) => ({
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    color: s === "failure" ? "#991b1b" : "#065f46",
    background: s === "failure" ? "#fee2e2" : "#d1fae5",
  });

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      <BackPillLink href="/admin/dashboard" label="Back to dashboard" />

      <h1 style={{ fontSize: 26, fontWeight: 700, margin: "12px 0 4px", color: "#0b5e58" }}>
        Security Audit Log
      </h1>
      <p style={{ color: "#64748b", marginBottom: 16 }}>
        A record of security-relevant actions. {total} event{total === 1 ? "" : "s"}.
      </p>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16, alignItems: "flex-end" }}>
        <label style={{ display: "grid", gap: 4, fontSize: 13, color: "#475569" }}>
          Action
          <select value={action} onChange={(e) => setAction(e.target.value)} style={inputStyle}>
            {ACTION_GROUPS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: 13, color: "#475569" }}>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
            <option value="">All</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: 13, color: "#475569" }}>
          From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} />
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: 13, color: "#475569" }}>
          To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} />
        </label>
      </div>

      {error && (
        <div role="alert" style={{ color: "#991b1b", background: "#fee2e2", padding: "10px 14px", borderRadius: 8, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div style={{ overflowX: "auto", border: "1px solid #e6e9ef", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 820 }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left" }}>
              <th style={thStyle}>Time</th>
              <th style={thStyle}>Action</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actor</th>
              <th style={thStyle}>Target</th>
              <th style={thStyle}>IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "#64748b" }}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "#64748b" }}>No audit events found.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r._id} style={{ borderTop: "1px solid #eef1f5" }}>
                  <td style={tdStyle}>{new Date(r.createdAt).toLocaleString()}</td>
                  <td style={tdStyle}><code style={{ fontSize: 13 }}>{r.action}</code></td>
                  <td style={tdStyle}><span style={badge(r.status)}>{r.status}</span></td>
                  <td style={tdStyle}>
                    {r.actor?.email || r.actorEmail || <span style={{ color: "#94a3b8" }}>—</span>}
                    {(r.actor?.role || r.actorRole) && (
                      <span style={{ color: "#94a3b8", marginLeft: 6 }}>({r.actor?.role || r.actorRole})</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    {r.targetType ? `${r.targetType}${r.targetId ? ` · ${String(r.targetId).slice(-6)}` : ""}` : <span style={{ color: "#94a3b8" }}>—</span>}
                  </td>
                  <td style={tdStyle}>{r.ip || <span style={{ color: "#94a3b8" }}>—</span>}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
        <button disabled={page <= 1 || loading} onClick={() => fetchLogs(page - 1)} style={pageBtn(page <= 1 || loading)}>Previous</button>
        <span style={{ padding: "8px 12px", color: "#475569" }}>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages || loading} onClick={() => fetchLogs(page + 1)} style={pageBtn(page >= totalPages || loading)}>Next</button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  fontSize: 14,
  minWidth: 160,
};
const thStyle: React.CSSProperties = { padding: "10px 14px", fontWeight: 600, color: "#334155", whiteSpace: "nowrap" };
const tdStyle: React.CSSProperties = { padding: "10px 14px", color: "#1f2937", verticalAlign: "top" };
const pageBtn = (disabled: boolean): React.CSSProperties => ({
  padding: "8px 16px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: disabled ? "#f1f5f9" : "#fff",
  color: disabled ? "#94a3b8" : "#0b5e58",
  cursor: disabled ? "not-allowed" : "pointer",
});
