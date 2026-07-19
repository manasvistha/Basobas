"use client";

import Link from "next/link";
import BackPillLink from "@/components/ui/BackPillLink";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Booking,
  cancelBooking,
  getBookingById,
  updateBookingStatus,
} from "@/lib/api/booking";
import {
  Conversation,
  getBookingConversation,
  sendBookingMessage,
} from "@/lib/api/conversation";
import { getCurrentUser } from "@/lib/utils/auth-utils";

type BookingDetailsViewProps = {
  bookingId: string;
  mode: "user" | "owner";
};

const getStatusStyle = (status: Booking["status"]) => {
  if (status === "approved") return { background: "#dcfce7", color: "#166534" };
  if (status === "rejected") return { background: "#fee2e2", color: "#991b1b" };
  if (status === "cancelled") return { background: "#e2e8f0", color: "#334155" };
  return { background: "#fef3c7", color: "#92400e" };
};

const toId = (value: any): string | null => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if (value._id) return String(value._id);
    if (value.id) return String(value.id);
    if (typeof value.toString === "function") {
      const asString = value.toString();
      if (asString && asString !== "[object Object]") return asString;
    }
  }
  return null;
};

export default function BookingDetailsView({ bookingId, mode }: BookingDetailsViewProps) {
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [actioning, setActioning] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const currentUser = useMemo(() => getCurrentUser(), []);
  const currentUserId = useMemo(() => toId(currentUser), [currentUser]);
  const backHref = mode === "owner" ? "/booking-requests" : "/my-bookings";

  useEffect(() => {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    let active = true;

    const load = async (silent = false) => {
      try {
        const [bookingData, conversationData] = await Promise.all([
          getBookingById(bookingId),
          getBookingConversation(bookingId),
        ]);
        if (!active) return;
        setBooking(bookingData);
        setConversation(conversationData);
        if (!silent) {
          setError(null);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      } catch (err: any) {
        if (!active || silent) return;
        setError(err?.response?.data?.error || err?.message || "Failed to load booking details");
      } finally {
        if (!silent && active) {
          setLoading(false);
        }
      }
    };

    void load();

    const intervalId = window.setInterval(() => {
      void load(true);
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [bookingId, currentUser, router]);

  const handleOwnerDecision = async (status: "approved" | "rejected") => {
    if (!booking) return;
    setActioning(true);
    try {
      const updated = await updateBookingStatus(booking._id, status);
      setBooking(updated);
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.message || "Failed to update booking status");
    } finally {
      setActioning(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    setActioning(true);
    try {
      const updated = await cancelBooking(booking._id);
      setBooking(updated);
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.message || "Failed to cancel booking");
    } finally {
      setActioning(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      const updatedConversation = await sendBookingMessage(bookingId, message.trim());
      setConversation(updatedConversation);
      setMessage("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const property = booking && typeof booking.property !== "string" ? booking.property : null;
  const tenant = booking && typeof booking.user !== "string" ? booking.user : null;
  const owner = booking && booking.owner && typeof booking.owner !== "string" ? booking.owner : null;
  const badge = booking ? getStatusStyle(booking.status) : null;
  const isPending = booking?.status === "pending";

  return (
    <div style={{ minHeight: "100vh", padding: "32px 20px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, background: "linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(239, 250, 247, 0.65))", border: "1px solid rgba(170, 205, 196, 0.5)", borderRadius: 24, boxShadow: "0 22px 55px -30px rgba(8, 53, 49, 0.35)", padding: "18px 20px" }}>
          <div>
            <BackPillLink href={backHref} label={mode === 'owner' ? 'Back to requests' : 'Back to dashboard'} />
            <h1 style={{ margin: "8px 0 0", color: "#0f172a" }}>Booking Details</h1>
          </div>
        </div>

        {loading && <div style={{ background: "#fff", padding: 20, borderRadius: 12 }}>Loading details...</div>}
        {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 14, borderRadius: 10 }}>{error}</div>}

        {!loading && !error && booking && (
          <div style={{ background: "rgba(255, 255, 255, 0.9)", border: "1px solid rgba(191, 213, 208, 0.55)", borderRadius: 18, overflow: "hidden", boxShadow: "0 18px 42px -34px rgba(9, 36, 40, 0.6)", backdropFilter: "blur(6px)", display: "grid", gap: 16, padding: 18 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "grid", gap: 10 }}>
                <div>
                  <div style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>Property</div>
                  <div style={{ color: "#0f172a", fontWeight: 700 }}>{property?.title || "Property"}</div>
                  <div style={{ color: "#64748b", fontSize: 13 }}>{property?.location || "-"}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                  <div>
                    <div style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>Tenant</div>
                    <div style={{ color: "#0f172a", fontWeight: 600 }}>{tenant?.name || tenant?.email || "User"}</div>
                  </div>
                  <div>
                    <div style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>Owner</div>
                    <div style={{ color: "#0f172a", fontWeight: 600 }}>{owner?.name || owner?.email || "Owner"}</div>
                  </div>
                  <div>
                    <div style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>Status</div>
                    <span
                      style={{
                        ...(badge || {}),
                        borderRadius: 999,
                        padding: "4px 10px",
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: "capitalize",
                        display: "inline-block",
                      }}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <div>
                    <div style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>Requested On</div>
                    <div style={{ color: "#0f172a", fontWeight: 600 }}>{new Date(booking.createdAt).toLocaleString()}</div>
                  </div>
                </div>

                {booking.message && (
                  <div>
                    <div style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>Booking Message</div>
                    <div style={{ color: "#0f172a", fontSize: 14 }}>{booking.message}</div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {mode === "owner" && (
                    <>
                      <button
                        disabled={!isPending || actioning}
                        onClick={() => handleOwnerDecision("approved")}
                        style={{
                          border: "none",
                          background: isPending ? "#16a34a" : "#9ca3af",
                          color: "#fff",
                          borderRadius: 8,
                          padding: "8px 12px",
                          cursor: isPending ? "pointer" : "not-allowed",
                          fontWeight: 600,
                        }}
                      >
                        Approve
                      </button>
                      <button
                        disabled={!isPending || actioning}
                        onClick={() => handleOwnerDecision("rejected")}
                        style={{
                          border: "none",
                          background: isPending ? "#dc2626" : "#9ca3af",
                          color: "#fff",
                          borderRadius: 8,
                          padding: "8px 12px",
                          cursor: isPending ? "pointer" : "not-allowed",
                          fontWeight: 600,
                        }}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {mode === "user" && (
                    <button
                      disabled={!isPending || actioning}
                      onClick={handleCancelBooking}
                      style={{
                        border: "none",
                        background: isPending ? "#dc2626" : "#9ca3af",
                        color: "#fff",
                        borderRadius: 8,
                        padding: "8px 12px",
                        cursor: isPending ? "pointer" : "not-allowed",
                        fontWeight: 600,
                      }}
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                height: "60vh",
              }}
            >
              <h2 style={{ margin: "4px 6px 10px", color: "#0f172a", fontSize: 18 }}>Booking Chat</h2>
              <div style={{ margin: "0 6px 10px", color: "#64748b", fontSize: 12 }}>
                Messages refresh automatically every 5 seconds.
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
                {conversation?.messages?.length ? (
                  conversation.messages.map((chatMessage, index) => {
                    const mine = toId(chatMessage.sender) === currentUserId;
                    return (
                      <div
                        key={`${chatMessage.timestamp}-${index}`}
                        style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 8 }}
                      >
                        <div
                          style={{
                            maxWidth: "72%",
                            background: mine ? "#4f46e5" : "#f1f5f9",
                            color: mine ? "#fff" : "#0f172a",
                            padding: "8px 12px",
                            borderRadius: 10,
                          }}
                        >
                          <div style={{ fontSize: 14 }}>{chatMessage.content}</div>
                          <div
                            style={{
                              fontSize: 11,
                              color: mine ? "rgba(255,255,255,0.75)" : "#64748b",
                              marginTop: 6,
                            }}
                          >
                            {new Date(chatMessage.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ color: "#64748b", fontSize: 14 }}>No messages yet.</div>
                )}
                <div ref={bottomRef} />
              </div>

              <div style={{ borderTop: "1px solid #e2e8f0", padding: 8, display: "flex", gap: 8 }}>
                <input
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Type a message..."
                  style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #dbeafe" }}
                />
                <button
                  disabled={sending}
                  onClick={handleSendMessage}
                  style={{
                    border: "none",
                    background: "#4f46e5",
                    color: "#fff",
                    borderRadius: 8,
                    padding: "10px 14px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
