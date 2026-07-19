"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUser } from "@/lib/api/admin";
import { getCurrentUser } from "@/lib/utils/auth-utils";
import BackPillLink from "@/components/ui/BackPillLink";

export default function AdminCreateUserPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Defer reading client-only user data until after mount to avoid hydration mismatch
  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      if (username) formData.append("username", username);
      if (role) formData.append("role", role);
      if (photo) formData.append("photo", photo);

      await createUser(formData);

      setMessage("User created successfully");
      setName("");
      setEmail("");
      setUsername("");
      setPassword("");
      setRole("user");
      setPhoto(null);
      setPhotoPreview(null);

      // Go back to list
      router.push("/admin/users");
    } catch (err: any) {
      setError(err?.message || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onLogout = () => {
    setShowProfileMenu(false);
    // Clear auth cookies client-side (they were httpOnly:false anyway)
    document.cookie = "auth_token=; path=/; max-age=0";
    document.cookie = "user_data=; path=/; max-age=0";
    router.push("/login");
  };
  return (
    <div style={{ minHeight: "100vh", padding: "80px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, background: "linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(239, 250, 247, 0.65))", border: "1px solid rgba(170, 205, 196, 0.5)", borderRadius: 24, boxShadow: "0 22px 55px -30px rgba(8, 53, 49, 0.35)", padding: "18px 20px" }}>
          <div>
            <BackPillLink href="/admin/users" label="Back to users" />
            <h1 style={{ fontSize: 30, color: "#0f3d3d", margin: "8px 0" }}>Create User</h1>
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
                <h2 style={{ margin: 0, color: "#0f3d3d" }}>Create User</h2>
                <p style={{ color: "#666", margin: "6px 0 0 0" }}>Add a new user account with optional profile photo.</p>
              </div>
            </div>
          </div>

          <div style={{ padding: 24 }}>
            <div style={{ maxWidth: 720, margin: "0 auto", background: "white", borderRadius: 12, padding: 32, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
        <p style={{ marginBottom: 24, color: "#666" }}>
          Add a new user account with optional profile photo.
        </p>

        {message && (
          <div style={{ marginBottom: 16, color: "#0b7a3e" }}>{message}</div>
        )}
        {error && (
          <div style={{ marginBottom: 16, color: "#b00020" }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <label>Profile Photo (optional)</label>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  overflow: "hidden",
                  background: "#f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#999",
                  fontSize: 12,
                }}
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  "No Image"
                )}
              </div>
              <input type="file" accept="image/*" onChange={handlePhotoChange} />
            </div>
          </div>

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
            <label>Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Set a password"
              type="password"
              required
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


          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: 8,
              padding: "12px 20px",
              background: "teal",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            {isSubmitting ? "Creating..." : "Create User"}
          </button>
        </form>
      </div>
      </div>
    </div>
    </div>
    </div>
  );
}
