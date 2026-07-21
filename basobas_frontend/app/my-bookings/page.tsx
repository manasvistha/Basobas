"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMyBookings, Booking, cancelBooking } from "@/lib/api/booking";
import { getCurrentUser } from "@/lib/utils/auth-utils";
import InlineProperty from "@/components/property/InlineProperty";
import PropertyModal from "@/components/property/PropertyModal";
import { getProperty } from "@/lib/api/property";
import { Container, PageHeader, Card, Table, Badge, Button, BadgeTone } from "@/components/ui";

const statusTone = (status: Booking["status"]): BadgeTone => {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  if (status === "cancelled") return "neutral";
  return "warning";
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
    <div className="ui-page" style={{ padding: "32px 20px" }}>
      <Container size="lg">
        <PageHeader
          backHref="/dashboard"
          backLabel="Back to dashboard"
          title="My Bookings"
          description="Track the status of properties you've requested to book."
        />

        {loading && (
          <Card>
            <p style={{ margin: 0, color: "var(--color-text-muted)" }}>Loading bookings...</p>
          </Card>
        )}
        {error && (
          <Card style={{ background: "var(--color-error-soft)", borderColor: "var(--color-error)", color: "var(--color-error)" }}>
            {error}
          </Card>
        )}

        {!loading && !error && (
          bookings.length === 0 ? (
            <Card>
              <p style={{ margin: 0, color: "var(--color-text-muted)" }}>No booking requests yet.</p>
            </Card>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const property = booking.property; // may be an id (string) or populated object
                  const isPending = booking.status === "pending";
                  // if the property reference is explicitly null (deleted), skip this booking row
                  if (property === null) return null;
                  return (
                    <tr key={booking._id}>
                      <td>
                        <InlineProperty property={property} onClick={(id) => handleViewProperty(id)} />
                      </td>
                      <td>
                        <Badge tone={statusTone(booking.status)}>{booking.status}</Badge>
                      </td>
                      <td style={{ color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                        {new Date(booking.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <Link
                            href={`/my-bookings/${booking._id}`}
                            style={{
                              textDecoration: "none",
                              color: "var(--color-text)",
                              fontWeight: 600,
                              fontSize: 13,
                              whiteSpace: "nowrap",
                            }}
                          >
                            Details & Chat
                          </Link>
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={!isPending || actioningId === booking._id}
                            onClick={() => handleCancel(booking._id)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )
        )}
        {showPropertyModal && (
          <PropertyModal property={selectedProperty} onClose={() => setShowPropertyModal(false)} />
        )}
      </Container>
    </div>
  );
}
