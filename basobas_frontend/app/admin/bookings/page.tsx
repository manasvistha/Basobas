"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BackPillLink from "@/components/ui/BackPillLink";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/utils/auth-utils";
import { getAllBookings } from "@/lib/api/admin";

type BookingRow = {
  _id: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
  user?: { name?: string; email?: string };
  owner?: { name?: string; email?: string };
  property?: { title?: string; location?: string; price?: number };
};

const getStatusStyle = (status: BookingRow["status"]) => {
  if (status === "approved") return { background: "#dcfce7", color: "#166534" };
  if (status === "rejected") return { background: "#fee2e2", color: "#991b1b" };
  if (status === "cancelled") return { background: "#e2e8f0", color: "#334155" };
  return { background: "#fef3c7", color: "#92400e" };
};

export default function AdminBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      router.push("/login");
      return;
    }

    const load = async () => {
      try {
        const res = await getAllBookings();
        setBookings(Array.isArray(res?.data) ? res.data : []);
      } catch (err: any) {
        setError(err?.message || "Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", padding: "32px 20px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 20, background: "linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(239, 250, 247, 0.65))", border: "1px solid rgba(226, 232, 240, 0.5)", borderRadius: 24, boxShadow: "0 22px 55px -30px rgba(8, 53, 49, 0.35)", padding: "18px 20px" }}>
          <BackPillLink href="/admin/dashboard" label="Back to admin dashboard" />
          <h1 style={{ margin: "8px 0 0", color: "#0f172a" }}>All Bookings (Read Only)</h1>
        </div>

        {loading && <div style={{ background: "#fff", padding: 20, borderRadius: 12 }}>Loading bookings...</div>}
        {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 14, borderRadius: 10 }}>{error}</div>}

        {!loading && !error && (
          <div style={{ background: "rgba(255, 255, 255, 0.9)", border: "1px solid rgba(191, 213, 208, 0.55)", borderRadius: 18, overflow: "hidden", boxShadow: "0 18px 42px -34px rgba(9, 36, 40, 0.6)", backdropFilter: "blur(6px)" }}>
            {bookings.length === 0 ? (
              <div style={{ padding: 24, color: "#64748b" }}>No bookings found.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ textAlign: "left", padding: 12 }}>Property</th>
                    <th style={{ textAlign: "left", padding: 12 }}>Tenant</th>
                    <th style={{ textAlign: "left", padding: 12 }}>Owner</th>
                    <th style={{ textAlign: "left", padding: 12 }}>Status</th>
                    <th style={{ textAlign: "left", padding: 12 }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => {
                    const badge = getStatusStyle(booking.status);
                    return (
                      <tr key={booking._id} style={{ borderTop: "1px solid #f1f5f9" }}>
                        <td style={{ padding: 12 }}>{booking.property?.title || "Property"}</td>
                        <td style={{ padding: 12 }}>{booking.user?.name || booking.user?.email || "User"}</td>
                        <td style={{ padding: 12 }}>{booking.owner?.name || booking.owner?.email || "Owner"}</td>
                        <td style={{ padding: 12 }}>
                          <span style={{ ...badge, borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>
                            {booking.status}
                          </span>
                        </td>
                        <td style={{ padding: 12 }}>{new Date(booking.createdAt).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
