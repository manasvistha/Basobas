"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { getUserById } from "@/lib/api/admin";
import { getImageUrl } from "@/lib/utils/auth-utils";
import BackPillLink from "@/components/ui/BackPillLink";

type User = {
  id: string;
  name?: string;
  email?: string;
  username?: string;
  role?: string;
  profilePicture?: string;
};

export default function AdminUserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getUserById(resolvedParams.id);
        const data = res?.data || res?.user || res;
        setUser({
          id: data?.id || data?._id || resolvedParams.id,
          name: data?.name,
          email: data?.email,
          username: data?.username,
          role: data?.role,
          profilePicture: data?.profilePicture,
        });
      } catch (err: any) {
        console.error("Failed to fetch user", err);
        setError(err?.message || "Failed to fetch user");
      } finally {
        setLoading(false);
      }
    };

    void loadUser();
  }, [resolvedParams.id]);

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
          <BackPillLink href="/admin/users" label="Back to users" />
          <h1 style={{ fontSize: 28, margin: 0, color: "#0f3d3d" }}>User Details</h1>
        </div>

        {loading && <p style={{ color: "#666" }}>Loading user...</p>}
        {error && <p style={{ color: "#b00020" }}>{error}</p>}

        {!loading && !error && user && (
          <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
            {/* Profile Photo */}
            {user.profilePicture && getImageUrl(user.profilePicture) && (
              <div style={{ textAlign: "center" }}>
                <img
                  src={getImageUrl(user.profilePicture) || ""}
                  alt={user.name}
                  crossOrigin="anonymous"
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid #1e3a8a",
                  }}
                  onError={(e) => {
                    const imageUrl = getImageUrl(user.profilePicture);
                    console.error("Failed to load image:", user.profilePicture, "Resolved URL:", imageUrl);
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
            <div>
              <strong>ID:</strong> {user.id}
            </div>
            <div>
              <strong>Name:</strong> {user.name || "-"}
            </div>
            <div>
              <strong>Email:</strong> {user.email || "-"}
            </div>
            <div>
              <strong>Username:</strong> {user.username || "-"}
            </div>
            <div>
              <strong>Role:</strong> {user.role || "-"}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            href={`/admin/users/${resolvedParams.id}/edit`}
            style={{
              padding: "10px 16px",
              background: "#1e3a8a",
              color: "white",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Edit User
          </Link>
          <Link
            href="/admin/users"
            style={{
              padding: "10px 16px",
              background: "#e6eeee",
              color: "#0f3d3d",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Back to Users
          </Link>
        </div>
      </div>
    </div>
  );
}
