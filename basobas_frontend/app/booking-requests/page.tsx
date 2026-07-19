"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BackPillLink from "@/components/ui/BackPillLink";
import { useRouter } from "next/navigation";
import { Booking, getOwnerBookingRequests, updateBookingStatus } from "@/lib/api/booking";
import { getProperty } from "@/lib/api/property";
import { getCurrentUser } from "@/lib/utils/auth-utils";
import InlineProperty from "@/components/property/InlineProperty";
import PropertyModal from "@/components/property/PropertyModal";

const getStatusStyle = (status: Booking["status"]) => {
  if (status === "approved") return { background: "#dcfce7", color: "#166534" };
  if (status === "rejected") return { background: "#fee2e2", color: "#991b1b" };
  if (status === "cancelled") return { background: "#e2e8f0", color: "#334155" };
  return { background: "#fef3c7", color: "#92400e" };
};

export default function BookingRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      const data = await getOwnerBookingRequests();
      const normalized = Array.isArray((data as any)?.data) ? (data as any).data : (Array.isArray(data) ? data : []);
      setRequests(normalized as Booking[]);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to load booking requests");
    } finally {
      setLoading(false);
    }
  };

  // After loading requests, if some bookings only contain a property id (string), fetch those properties
  useEffect(() => {
    if (!requests || requests.length === 0) return;

    const idsToFetch = Array.from(new Set(
      requests
        .filter(r => typeof r.property === 'string' && r.property)
        .map(r => r.property as string)
    ));

    if (idsToFetch.length === 0) return;

    let mounted = true;
    (async () => {
      try {
        const fetched = await Promise.all(idsToFetch.map(id => getProperty(id).catch(() => null)));
        if (!mounted) return;
        setRequests(prev => prev.map(b => {
          if (typeof b.property === 'string') {
            const idx = idsToFetch.indexOf(b.property);
            if (idx >= 0 && fetched[idx]) {
              return { ...b, property: fetched[idx] as any };
            }
          }
          return b;
        }));
      } catch (e) {
        // ignore individual property fetch errors
        console.error('Failed to fetch some properties for booking requests', e);
      }
    })();

    return () => { mounted = false; };
  }, [requests]);

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

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }
    void loadRequests();
  }, [router]);

  const handleStatus = async (bookingId: string, status: "approved" | "rejected") => {
    setActioningId(bookingId);
    try {
      const updated = await updateBookingStatus(bookingId, status);
      setRequests((prev) => prev.map((item) => (item._id === bookingId ? updated : item)));
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.message || "Failed to update booking status");
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", padding: "32px 20px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, background: "linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(239, 250, 247, 0.65))", border: "1px solid rgba(170, 205, 196, 0.5)", borderRadius: 24, boxShadow: "0 22px 55px -30px rgba(8, 53, 49, 0.35)", padding: "18px 20px" }}>
          <div>
            <BackPillLink href="/dashboard" label="Back to dashboard" />
            <h1 style={{ margin: "8px 0 0", color: "#0f172a" }}>Booking Requests</h1>
          </div>
        </div>

        {loading && <div style={{ background: "#fff", padding: 20, borderRadius: 12 }}>Loading requests...</div>}
        {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 14, borderRadius: 10 }}>{error}</div>}

        {!loading && !error && (
          <div style={{ background: "rgba(255, 255, 255, 0.9)", border: "1px solid rgba(191, 213, 208, 0.55)", borderRadius: 18, overflow: "hidden", boxShadow: "0 18px 42px -34px rgba(9, 36, 40, 0.6)", backdropFilter: "blur(6px)" }}>
            {requests.length === 0 ? (
              <div style={{ padding: 24, color: "#64748b" }}>No booking requests for your properties yet.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ textAlign: "left", padding: 16, fontSize: 15 }}>Property</th>
                    <th style={{ textAlign: "left", padding: 16, fontSize: 15, width: 180 }}>Tenant</th>
                    <th style={{ textAlign: "left", padding: 16, fontSize: 15, width: 120 }}>Status</th>
                    <th style={{ textAlign: "left", padding: 16, fontSize: 15, width: 180 }}>Requested</th>
                    <th style={{ textAlign: "left", padding: 16, fontSize: 15, width: 300 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((booking) => {
                    const property = typeof booking.property === "string" ? null : booking.property;
                    const tenant = typeof booking.user === "string" ? null : booking.user;
                    const badge = getStatusStyle(booking.status);
                    const pending = booking.status === "pending";
                    // if the property reference is null (deleted), skip rendering this booking
                    if (!property) return null;
                    return (
                      <tr key={booking._id} style={{ borderTop: "1px solid #f1f5f9" }}>
                        <td style={{ padding: 12 }}>
                          <InlineProperty property={property} onClick={(id) => handleViewProperty(id)} />
                        </td>
                        <td style={{ padding: 14, fontSize: 15, lineHeight: 1.3 }}>{tenant?.name || tenant?.email || "User"}</td>
                        <td style={{ padding: 14 }}>
                          <span style={{ ...badge, borderRadius: 999, padding: "6px 12px", fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>
                            {booking.status}
                          </span>
                        </td>
                        <td style={{ padding: 14, fontSize: 14 }}>{new Date(booking.createdAt).toLocaleString()}</td>
                        <td style={{ padding: 14, display: "flex", gap: 12, alignItems: "center", fontSize: 14, justifyContent: 'flex-start' }}>
                          <Link
                            href={`/booking-requests/${booking._id}`}
                            style={{ textDecoration: "none", color: "#4f46e5", fontWeight: 600, fontSize: 13 }}
                          >
                            Details & Chat
                          </Link>
                          <button
                            disabled={!pending || actioningId === booking._id}
                            onClick={() => handleStatus(booking._id, "approved")}
                            style={{
                              border: "none",
                              background: pending ? "#16a34a" : "#9ca3af",
                              color: "#fff",
                              borderRadius: 8,
                              padding: "8px 12px",
                              cursor: pending ? "pointer" : "not-allowed",
                              boxShadow: pending ? "0 6px 18px rgba(22,163,74,0.15)" : 'none'
                            }}
                          >
                            Approve
                          </button>
                          <button
                            disabled={!pending || actioningId === booking._id}
                            onClick={() => handleStatus(booking._id, "rejected")}
                            style={{
                              border: "none",
                              background: pending ? "#dc2626" : "#9ca3af",
                              color: "#fff",
                              borderRadius: 8,
                              padding: "8px 12px",
                              cursor: pending ? "pointer" : "not-allowed",
                              boxShadow: pending ? "0 6px 18px rgba(220,38,38,0.12)" : 'none'
                            }}
                          >
                            Reject
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
