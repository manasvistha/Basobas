"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BackPillLink from "@/components/ui/BackPillLink";
import { useRouter } from "next/navigation";
import { getMyBookings, Booking, cancelBooking } from "@/lib/api/booking";
import { getCurrentUser } from "@/lib/utils/auth-utils";
import InlineProperty from "@/components/property/InlineProperty";
import PropertyModal from "@/components/property/PropertyModal";
import { getProperty } from "@/lib/api/property";

const getStatusStyle = (status: Booking["status"]) => {
  if (status === "approved") return { background: "#dcfce7", color: "#166534" };
  if (status === "rejected") return { background: "#fee2e2", color: "#991b1b" };
  if (status === "cancelled") return { background: "#e2e8f0", color: "#334155" };
  return { background: "#fef3c7", color: "#92400e" };
};

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const load = async () => {
      try {
        const data = await getMyBookings();
        setBookings(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err?.response?.data?.error || err?.message || "Failed to load your bookings");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [router]);

  const handleCancel = async (bookingId: string) => {
    setActioningId(bookingId);
    try {
      const updated = await cancelBooking(bookingId);
      setBookings((prev) => prev.map((booking) => (booking._id === bookingId ? updated : booking)));
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.message || "Failed to cancel booking");
    } finally {
      setActioningId(null);
    }
  };

  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [loadingProperty, setLoadingProperty] = useState(false);

  const handleViewProperty = async (propertyId: string) => {
    setLoadingProperty(true);
    setShowPropertyModal(true);
    try {
      const propertyData = await getProperty(propertyId);
      setSelectedProperty(propertyData);
    } catch (err: any) {
      console.error("Failed to load property details", err);
      setShowPropertyModal(false);
    } finally {
      setLoadingProperty(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", padding: "32px 20px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, background: "linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(239, 250, 247, 0.65))", border: "1px solid rgba(170, 205, 196, 0.5)", borderRadius: 24, boxShadow: "0 22px 55px -30px rgba(8, 53, 49, 0.35)", padding: "18px 20px" }}>
          <div>
            <BackPillLink href="/dashboard" label="Back to dashboard" />
            <h1 style={{ margin: "8px 0 0", color: "#0f172a" }}>My Bookings</h1>
          </div>
        </div>

        {loading && <div style={{ background: "#fff", padding: 20, borderRadius: 12 }}>Loading bookings...</div>}
        {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 14, borderRadius: 10 }}>{error}</div>}

        {!loading && !error && (
          <div style={{ background: "rgba(255, 255, 255, 0.9)", border: "1px solid rgba(191, 213, 208, 0.55)", borderRadius: 18, overflow: "hidden", boxShadow: "0 18px 42px -34px rgba(9, 36, 40, 0.6)", backdropFilter: "blur(6px)" }}>
            {bookings.length === 0 ? (
              <div style={{ padding: 24, color: "#64748b" }}>No booking requests yet.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ textAlign: "left", padding: 12 }}>Property</th>
                    <th style={{ textAlign: "left", padding: 12 }}>Status</th>
                    <th style={{ textAlign: "left", padding: 12 }}>Requested</th>
                    <th style={{ textAlign: "left", padding: 12 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => {
                    const property = booking.property; // may be an id (string) or populated object
                    const badge = getStatusStyle(booking.status);
                    const isPending = booking.status === "pending";
                    // if the property reference is explicitly null (deleted), skip this booking row
                    if (property === null) return null;
                    return (
                      <tr key={booking._id} style={{ borderTop: "1px solid #f1f5f9" }}>
                        <td style={{ padding: 12 }}>
                          <InlineProperty property={property} onClick={(id) => handleViewProperty(id)} />
                        </td>
                        <td style={{ padding: 12 }}>
                          <span style={{ ...badge, borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>
                            {booking.status}
                          </span>
                        </td>
                        <td style={{ padding: 12 }}>{new Date(booking.createdAt).toLocaleString()}</td>
                        <td style={{ padding: 12, display: "flex", gap: 8, alignItems: "center" }}>
                          <Link
                            href={`/my-bookings/${booking._id}`}
                            style={{
                              textDecoration: "none",
                              color: "#4f46e5",
                              fontWeight: 600,
                              fontSize: 13,
                            }}
                          >
                            Details & Chat
                          </Link>
                          <button
                            disabled={!isPending || actioningId === booking._id}
                            onClick={() => handleCancel(booking._id)}
                            style={{
                              border: "none",
                              background: isPending ? "#dc2626" : "#9ca3af",
                              color: "#fff",
                              borderRadius: 8,
                              padding: "6px 10px",
                              cursor: isPending ? "pointer" : "not-allowed",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
        {showPropertyModal && (
          <PropertyModal property={selectedProperty} onClose={() => setShowPropertyModal(false)} />
        )}
      </div>
    </div>
  );
}
