"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUserById, updateUser } from "@/lib/api/admin";
import BackPillLink from "@/components/ui/BackPillLink";

export default function AdminUserEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const userId = resolvedParams.id;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getUserById(userId);
        const data = res?.data || res?.user || res;
        setName(data?.name || "");
        setEmail(data?.email || "");
        setUsername(data?.username || "");
        setRole(data?.role || "user");
      } catch (err: any) {
        console.error("Failed to load user", err);
        setError(err?.message || "Failed to load user");
      } finally {
        setLoading(false);
      }
    };

    void loadUser();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      if (name) formData.append("name", name);
      if (email) formData.append("email", email);
      if (username) formData.append("username", username);
      if (password) formData.append("password", password);
      if (role) formData.append("role", role);
      if (photo) formData.append("photo", photo);

      await updateUser(userId, formData);

      setMessage("User updated successfully");
      setPassword("");
      setPhoto(null);
    } catch (err: any) {
      console.error("Failed to update user", err);
      setError(err?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f7", padding: "80px 24px" }}>
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          background: "white",
          borderRadius: 12,
          padding: 32,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <BackPillLink href={`/admin/users/${userId}`} label="Back to user" />
          <h1 style={{ fontSize: 28, margin: 0, color: "#0f3d3d" }}>Edit User</h1>
        </div>
        <p style={{ marginBottom: 24, color: "#666" }}>
          Update user account information and role.
        </p>

        {loading && <div style={{ marginBottom: 16 }}>Loading user...</div>}
        {message && <div style={{ marginBottom: 16, color: "#0b7a3e" }}>{message}</div>}
        {error && <div style={{ marginBottom: 16, color: "#b00020" }}>{error}</div>}

        {!loading && (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <label>Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                required
                style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd" }}
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                type="email"
                required
                style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd" }}
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label>Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Optional username"
                style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd" }}
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label>New Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                type="password"
                style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd" }}
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label>Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd" }}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label>Profile Photo (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: 8,
                padding: "12px 20px",
                background: "#1e3a8a",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
