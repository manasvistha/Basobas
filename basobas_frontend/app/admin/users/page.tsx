"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/api/auth";
import { getUsers, deleteUser, promoteUser } from "@/lib/api/admin";
import { getCurrentUser } from "@/lib/utils/auth-utils";
import { API } from "@/lib/api/endpoints";
import BackPillLink from "@/components/ui/BackPillLink";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  username?: string;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageSize] = useState(10);

  const fetchUsers = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUsers(page, pageSize);
      const data = res?.data || res?.users || res || [];
      const pagination = res?.pagination || {};
      const normalized: UserRow[] = (data as any[]).map((u) => ({
        id: u.id || u._id,
        name: u.name || "",
        email: u.email || "",
        role: u.role || "user",
        username: u.username,
      }));
      setUsers(normalized);
      setTotalPages(pagination.totalPages || 1);
      setTotalUsers(pagination.total || 0);
      setCurrentPage(pagination.page || 1);
    } catch (err: any) {
      console.error("Failed to load users", err);
      setError(err?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    
    void fetchUsers(currentPage);
  }, [currentPage]);

  const onLogout = async () => {
    setShowProfileMenu(false);
    await logout(); // server clears the HttpOnly session cookie
    document.cookie = "user_data=; path=/; max-age=0";
    router.push("/login");
  };

  const handleDelete = async (id: string) => {
    const user = users.find((u) => u.id === id);
    const confirmDelete = window.confirm(
      `Delete ${user?.name || "this user"}? This cannot be undone.`
    );
    if (!confirmDelete) return;

    setDeletingId(id);
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      console.error("Failed to delete user", err);
      setError(err?.message || "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePromote = async (id: string) => {
    const user = users.find((u) => u.id === id);
    const confirmPromote = window.confirm(
      `Promote ${user?.name || "this user"} to admin?`
    );
    if (!confirmPromote) return;

    setPromotingId(id);
    try {
      await promoteUser(id);
      // Update the user's role in the local state
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: "admin" } : u))
      );
    } catch (err: any) {
      console.error("Failed to promote user", err);
      setError(err?.message || "Failed to promote user");
    } finally {
      setPromotingId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", padding: "80px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, background: "linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(239, 250, 247, 0.65))", border: "1px solid rgba(170, 205, 196, 0.5)", borderRadius: 24, boxShadow: "0 22px 55px -30px rgba(8, 53, 49, 0.35)", padding: "18px 20px" }}>
          <div>
            <BackPillLink href="/admin/dashboard" label="Back to dashboard" />
            <h1 style={{ fontSize: 30, color: "#0f3d3d", margin: "8px 0" }}>Admin - Users</h1>
          </div>

          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{
                padding: "8px 16px",
                background: "white",
                border: "1px solid #ddd",
                borderRadius: 8,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <span>{currentUser?.name || "Admin"}</span>
              <span>▼</span>
            </button>

            {showProfileMenu && (
              <div style={{
                position: "absolute",
                top: "100%",
                right: 0,
                background: "white",
                border: "1px solid #ddd",
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                zIndex: 1000,
                minWidth: 150
              }}>
                <button
                  onClick={onLogout}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "none",
                    background: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "#dc2626"
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ background: "rgba(255, 255, 255, 0.9)", border: "1px solid rgba(191, 213, 208, 0.55)", borderRadius: 18, overflow: "hidden", boxShadow: "0 18px 42px -34px rgba(9, 36, 40, 0.6)", backdropFilter: "blur(6px)" }}>
          <div style={{ padding: 24, borderBottom: "1px solid #eee" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, color: "#0f3d3d" }}>Users ({users.length})</h2>
                <p style={{ color: "#666", margin: "6px 0 0 0" }}>Manage users from a single place.</p>
              </div>
              <Link
                href="/admin/users/create"
                style={{
                  padding: "10px 16px",
                  background: "teal",
                  color: "white",
                  borderRadius: 8,
                  textDecoration: "none",
                }}
              >
                Create User
              </Link>
            </div>
          </div>

        {error && (
          <div style={{ marginBottom: 16, color: "#b00020" }}>{error}</div>
        )}

        <div
          style={{
            background: "white",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f0f5f5" }}>
              <tr>
                <th style={{ textAlign: "left", padding: 16 }}>User</th>
                <th style={{ textAlign: "left", padding: 16 }}>Email</th>
                <th style={{ textAlign: "left", padding: 16 }}>Role</th>
                <th style={{ textAlign: "left", padding: 16 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ padding: 16 }}>Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 16 }}>No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} style={{ borderTop: "1px solid #eee" }}>
                    <td style={{ padding: 16 }}>{user.name || user.username || user.email}</td>
                    <td style={{ padding: 16 }}>{user.email}</td>
                    <td style={{ padding: 16, textTransform: "capitalize" }}>{user.role}</td>
                    <td style={{ padding: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <Link
                        href={`/admin/users/${user.id}`}
                        style={{ color: "teal", textDecoration: "none" }}
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/users/${user.id}/edit`}
                        style={{ color: "#0f3d3d", textDecoration: "none" }}
                      >
                        Edit
                      </Link>
                      {user.role !== "admin" && (
                        <button
                          onClick={() => handlePromote(user.id)}
                          disabled={promotingId === user.id}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#2563eb",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          {promotingId === user.id ? "Promoting..." : "Promote"}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={deletingId === user.id}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#b00020",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        {deletingId === user.id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ marginTop: 24, display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                background: currentPage === 1 ? "#f3f4f6" : "white",
                color: currentPage === 1 ? "#9ca3af" : "#374151",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
              }}
            >
              Previous
            </button>
            
            <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>
              Page {currentPage} of {totalPages} ({totalUsers} total users)
            </span>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                background: currentPage === totalPages ? "#f3f4f6" : "white",
                color: currentPage === totalPages ? "#9ca3af" : "#374151",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
