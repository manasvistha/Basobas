"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, getPropertyImageUrl } from "@/lib/utils/auth-utils";
import { getProperty, Property } from "@/lib/api/property";
import { createBooking, getMyBookings } from "@/lib/api/booking";
import BookingFormModal from "@/components/booking/BookingFormModal";
import { createConversation } from "@/lib/api/conversation";
import { checkIfFavorite, addFavorite, removeFavorite } from "@/lib/api/favorite";
import PropertyLocationMap from "@/components/location/PropertyLocationMap";
import {
  getOpenStreetMapDirectionsUrl,
  getOpenStreetMapUrl,
  isValidCoordinates,
  type PropertyCoordinates,
} from "@/lib/utils/location";
import Link from "next/link";
import BackPillLink from "@/components/ui/BackPillLink";

const IconMapPin = ({ color = "currentColor", size = 12 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconBed = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12h18M3 6h18M5 12v6M19 12v6M3 6v6M21 6v6"/>
  </svg>
);
const IconBath = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 13h18a2 2 0 0 1-2 2v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3a2 2 0 0 1-2-2z"/>
    <path d="M5 13V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v8"/>
  </svg>
);
const IconArrowLeft = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);
const IconHeart = ({ size = 14, filled = false }: { size?: number; filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const IconShare = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
  </svg>
);

const sectionCard: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #eff6ff",
  borderRadius: 10,
  padding: "12px 14px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  marginBottom: 10,
};

const sectionTitle: React.CSSProperties = {
  fontSize: "0.82rem",
  fontWeight: 700,
  color: "#0f172a",
  margin: "0 0 10px",
};

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadedImages, setLoadedImages] = useState<boolean[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [userBookedThis, setUserBookedThis] = useState(false);
  const [currentUserBookingId, setCurrentUserBookingId] = useState<string | null>(null);
  const [isOpeningDirections, setIsOpeningDirections] = useState(false);
  const [isOpeningConversation, setIsOpeningConversation] = useState(false);

  const propertyId = params.id as string;

  const getImageSrc = (img: any) => {
    if (!img) return null;
    if (typeof img === 'string') return getPropertyImageUrl(img);
    if (typeof img === 'object') {
      if (img.url) return getPropertyImageUrl(img.url);
      if (img.path) return getPropertyImageUrl(img.path);
      if (img.filename) return getPropertyImageUrl(img.filename);
      if (img.originalname) return getPropertyImageUrl(img.originalname);
      if (img.name) return getPropertyImageUrl(img.name);
    }
    return null;
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { router.push("/login"); return; }
    const fetchProperty = async () => {
      try {
        const prop = await getProperty(propertyId);
        setProperty(prop);
        const isFav = await checkIfFavorite(propertyId);
        setIsFavorite(isFav);
      } catch {
        setError("Property not found");
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [propertyId, router]);

  useEffect(() => {
    if (property?.images?.length) {
      setLoadedImages(new Array(property.images.length).fill(false));
      setCurrentImageIndex(0);
    } else {
      setLoadedImages([]);
    }
  }, [property?.images]);

  useEffect(() => {
    if (!property?.images?.length) return;
    const len = property.images.length;
    [currentImageIndex, (currentImageIndex + 1) % len, (currentImageIndex - 1 + len) % len].forEach(i => {
      const url = getImageSrc(property.images[i]);
      if (url) {
        const img = new window.Image();
        img.onload = () => {
          setLoadedImages(prev => {
            try {
              const c = Array.isArray(prev) ? [...prev] : new Array(len).fill(false);
              c[i] = true;
              return c;
            } catch (_e) { return prev; }
          });
        };
        img.onerror = () => {
          setLoadedImages(prev => {
            try {
              const c = Array.isArray(prev) ? [...prev] : new Array(len).fill(false);
              c[i] = true;
              return c;
            } catch (_e) { return prev; }
          });
        };
        img.src = url;
      }
    });
  }, [currentImageIndex, property?.images]);

  const handleBookProperty = () => {
    if (!property) return;
    setShowBookingModal(true);
  };

  const onBookingSuccess = (booking: any) => {
    setBookingSuccess(true);
    setUserBookedThis(true);
    setCurrentUserBookingId(booking?._id || null);
    setTimeout(() => setBookingSuccess(false), 3000);
  };

  const extractId = (v: any) => {
    if (!v) return null;
    if (typeof v === 'string') return v;
    if (typeof v === 'object') return String(v._id || v.id || '');
    return null;
  };

  const handleOpenBookingChat = () => {
    if (!currentUserBookingId) {
      alert("Send a booking request first to start the booking chat");
      return;
    }
    router.push(`/my-bookings/${currentUserBookingId}`);
  };

  const handleMessageOwner = async () => {
    if (!currentUserId || !ownerId) {
      alert("Unable to start conversation right now.");
      return;
    }
    if (currentUserId === ownerId) {
      return;
    }

    setIsOpeningConversation(true);
    try {
      const conversation = await createConversation([currentUserId, ownerId]);
      router.push(`/conversation/${conversation._id}`);
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.message || "Failed to start conversation");
    } finally {
      setIsOpeningConversation(false);
    }
  };

  const handleOpenDirections = () => {
    if (!propertyCoordinates) return;
    if (!navigator.geolocation) {
      if (osmLocationUrl) window.open(osmLocationUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setIsOpeningDirections(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const from: PropertyCoordinates = {
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        };
        const url = getOpenStreetMapDirectionsUrl(from, propertyCoordinates);
        window.open(url, "_blank", "noopener,noreferrer");
        setIsOpeningDirections(false);
      },
      () => {
        if (osmLocationUrl) window.open(osmLocationUrl, "_blank", "noopener,noreferrer");
        setIsOpeningDirections(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const nextImage = () => {
    if (isTransitioning || !property?.images) return;
    setIsTransitioning(true);
    setCurrentImageIndex(prev => (prev + 1) % property.images.length);
    setTimeout(() => setIsTransitioning(false), 360);
  };

  const prevImage = () => {
    if (isTransitioning || !property?.images) return;
    setIsTransitioning(true);
    setCurrentImageIndex(prev => (prev - 1 + property.images.length) % property.images.length);
    setTimeout(() => setIsTransitioning(false), 360);
  };

  const handleToggleFavorite = async () => {
    try {
      if (isFavorite) { await removeFavorite(propertyId); setIsFavorite(false); }
      else { await addFavorite(propertyId); setIsFavorite(true); }
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to update favorite");
    }
  };

  const currentUser = getCurrentUser();
  const ownerId = extractId(property?.owner);
  const currentUserId = extractId(currentUser);
  const isOwner = Boolean(property && ownerId && currentUserId && ownerId === currentUserId);
  const canBook = Boolean(property && property.status !== "booked" && !isOwner);
  const propertyCoordinates = isValidCoordinates(property?.coordinates)
    ? (property.coordinates as PropertyCoordinates)
    : null;
  const osmLocationUrl = getOpenStreetMapUrl(propertyCoordinates);

  // Check if current user already has a pending/approved booking for this property
  useEffect(() => {
    const userId = extractId(currentUser);
    if (!propertyId || !userId) return;

    let mounted = true;
    (async () => {
      try {
        const res = await getMyBookings();
        const myBookings = Array.isArray((res as any)?.data) ? (res as any).data : (Array.isArray(res) ? res : []);
        if (!mounted) return;
        const myBooking = myBookings.find((b: any) => {
          const bid = typeof b.property === 'string' ? b.property : (b.property && (b.property._id || b.property.id));
          return String(bid) === String(propertyId);
        });
        setUserBookedThis(Boolean(myBooking));
        setCurrentUserBookingId(myBooking?._id || null);
      } catch (e) {
        console.error('Failed to fetch my bookings for property check:', e);
      }
    })();

    return () => { mounted = false; };
  }, [propertyId, currentUser, bookingSuccess]);

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fc", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #e2e8f0", borderTopColor: "#1e3a8a", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: "#64748b", fontSize: "0.8rem" }}>Loading property...</p>
      </div>
    </div>
  );

  if (error || !property) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fc", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#ef4444", marginBottom: 12, fontSize: "0.9rem" }}>{error || "Property not found"}</p>
        <BackPillLink href="/dashboard" label="Back to dashboard" />
      </div>
    </div>
  );

  const images = property.images || [];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fc", fontFamily: "var(--font-inter), sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .image-carousel {
          position: relative; width: 100%;
          aspect-ratio: 16/9; max-height: 220px;
          border-radius: 12px; overflow: hidden; background: #e5e7eb;
        }
        .image-stack {
          display: flex; height: 100%;
          transition: transform 0.5s cubic-bezier(.22,.9,.36,1);
          will-change: transform;
        }
        .image-slide {
          flex: 0 0 100%; min-width: 100%; height: 100%;
          position: relative; overflow: hidden; background: #e5e7eb;
        }
        .image-slide img {
          width: 100%; height: 100%;
          object-fit: contain; object-position: center;
          display: block; background: #e5e7eb;
        }
        .nav-btn {
          position: absolute; top: 50%; transform: translateY(-50%);
          background: rgba(255,255,255,0.95); border: none; border-radius: 50%;
          width: 32px; height: 32px; cursor: pointer; font-size: 16px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(15,23,42,0.12); z-index: 40; transition: all 0.18s;
        }
        .nav-btn:hover { background: #fff; }
        .nav-btn:active { transform: translateY(-50%) scale(0.96); }
        .dots {
          display: flex; gap: 6px; position: absolute;
          bottom: 8px; left: 50%; transform: translateX(-50%); z-index: 40;
        }
        .dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(255,255,255,0.6); cursor: pointer;
          border: 1px solid rgba(0,0,0,0.08); transition: all 0.2s;
        }
        .dot:hover { background: rgba(255,255,255,0.9); }
        .dot.active { background: #1e3a8a; width: 18px; border-radius: 3px; }

        .details-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
        }
        @media (max-width: 640px) {
          .details-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .detail-card {
          padding: 8px 10px; background: #f8fafc; border-radius: 8px;
          border: 1px solid #eff6ff; text-align: center;
        }
        .detail-label {
          font-size: 0.6rem; color: #64748b; text-transform: uppercase;
          letter-spacing: 0.6px; font-weight: 700; margin-bottom: 4px;
        }
        .detail-value { font-size: 0.9rem; color: #0f172a; font-weight: 700; }
      `}</style>

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #f0f0f0", padding: "10px 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: "#0f172a" }}>
            <IconArrowLeft size={14} />
            <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>Back</span>
          </Link>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleToggleFavorite} style={{ border: "none", background: "none", cursor: "pointer", color: isFavorite ? "#ef4444" : "#64748b" }}>
              <IconHeart size={16} filled={isFavorite} />
            </button>
            <button style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b" }}>
              <IconShare size={16} />
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 20px", paddingBottom: canBook ? 180 : 20 }}>

        {/* Carousel */}
        <div className="image-carousel">
          <div className="image-stack" style={{ transform: `translate3d(-${currentImageIndex * 100}%, 0, 0)` }}>
            {images.length > 0 ? images.map((img, index) => {
              const imageUrl = getImageSrc(img);
              return (
                <div key={index} className="image-slide">
                  {imageUrl ? (
                    <>
                      <img
                        src={imageUrl}
                        alt={`Property image ${index + 1}`}
                        loading="eager"
                        style={{ opacity: loadedImages[index] ? 1 : 0, transition: 'opacity 200ms linear' }}
                        onLoad={() => setLoadedImages(prev => { const c = [...prev]; c[index] = true; return c; })}
                        onError={e => {
                          // Hide broken image and mark as loaded to stop spinner
                          try {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          } catch (_) {}
                          setLoadedImages(prev => {
                            const c = Array.isArray(prev) ? [...prev] : [];
                            c[index] = true;
                            return c;
                          });
                          console.error('Failed to load property image', imageUrl);
                        }}
                      />
                      {!loadedImages[index] && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 28, height: 28, border: '2px solid #e8eaf0', borderTopColor: '#1e3a8a', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.8rem' }}>No image</div>
                  )}
                </div>
              );
            }) : (
              <div className="image-slide" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.8rem' }}>No images available</div>
            )}
          </div>
          {images.length > 1 && (
            <>
              <button aria-label="Previous image" className="nav-btn" style={{ left: 10 }} onClick={prevImage}>‹</button>
              <button aria-label="Next image" className="nav-btn" style={{ right: 10 }} onClick={nextImage}>›</button>
              <div className="dots">
                {images.map((_, index) => (
                  <div key={index}
                    className={`dot ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => { if (index === currentImageIndex) return; setIsTransitioning(true); setCurrentImageIndex(index); setTimeout(() => setIsTransitioning(false), 520); }}
                    role="button" aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div style={{ marginTop: 16 }}>

          {/* Title + Price */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>{property.title}</h1>
              <p style={{ display: "flex", alignItems: "center", gap: 4, color: "#64748b", fontSize: "0.8rem", margin: 0 }}>
                <IconMapPin color="#ef4444" size={12} /> {property.location}
              </p>
              {propertyCoordinates && (
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <a
                    href={osmLocationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: "0.74rem",
                      fontWeight: 600,
                      color: "#1e3a8a",
                      textDecoration: "none",
                      border: "1px solid #bfdbfe",
                      borderRadius: 8,
                      padding: "5px 10px",
                      background: "#eff6ff",
                    }}
                  >
                    Open in OSM
                  </a>
                  <button
                    type="button"
                    onClick={handleOpenDirections}
                    disabled={isOpeningDirections}
                    style={{
                      fontSize: "0.74rem",
                      fontWeight: 600,
                      color: "#0f172a",
                      border: "1px solid #d1d5db",
                      borderRadius: 8,
                      padding: "5px 10px",
                      background: "#f8fafc",
                      cursor: isOpeningDirections ? "not-allowed" : "pointer",
                    }}
                  >
                    {isOpeningDirections ? "Getting route..." : "Navigate"}
                  </button>
                </div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1e3a8a", margin: "0 0 2px", fontFamily: "var(--font-poppins), sans-serif" }}>Rs {Number(property.price || 0).toLocaleString()}</p>
              <p style={{ color: "#64748b", fontSize: "0.75rem", margin: 0 }}>/month</p>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <IconBed size={13} /><span style={{ fontWeight: 600, fontSize: "0.8rem" }}>{(property as any).bedrooms || 0} beds</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <IconBath size={13} /><span style={{ fontWeight: 600, fontSize: "0.8rem" }}>{(property as any).bathrooms || 0} baths</span>
            </div>
            <div style={{ padding: "3px 10px", background: property.status === "available" ? "#dcfce7" : "#fef3c7", borderRadius: 20, fontSize: "0.7rem", fontWeight: 600, color: property.status === "available" ? "#15803d" : "#92400e", textTransform: "capitalize" }}>
              {property.status}
            </div>
          </div>

          {/* Description Box */}
          <div style={sectionCard}>
            <h2 style={sectionTitle}>Description</h2>
            <p style={{ fontSize: "0.82rem", color: "#4b5563", lineHeight: 1.6, margin: 0 }}>
              {property.description || "No description provided."}
            </p>
          </div>

          {/* Map Box */}
          {propertyCoordinates && (
            <div style={sectionCard}>
              <h2 style={sectionTitle}>Map Location</h2>
              <PropertyLocationMap coordinates={propertyCoordinates} height={240} />
            </div>
          )}

          {/* Details Box */}
          <div style={sectionCard}>
            <h2 style={sectionTitle}>Details</h2>
            <div className="details-grid">
              <div className="detail-card">
                <div className="detail-label">Area</div>
                <div className="detail-value">{property.area ?? '—'} sqft</div>
              </div>
              <div className="detail-card">
                <div className="detail-label">Floor</div>
                <div className="detail-value">{property.floor ?? '—'}</div>
              </div>
              <div className="detail-card">
                <div className="detail-label">Furnished</div>
                <div className="detail-value">{property.furnished ? 'Yes' : 'No'}</div>
              </div>
              <div className="detail-card">
                <div className="detail-label">Parking</div>
                <div className="detail-value">{property.parking ? 'Yes' : 'No'}</div>
              </div>
              <div className="detail-card">
                <div className="detail-label">Property Type</div>
                <div className="detail-value">{(property.propertyType && property.propertyType !== '') ? property.propertyType : '—'}</div>
              </div>
              <div className="detail-card">
                <div className="detail-label">Pet Policy</div>
                <div className="detail-value">{(property.petPolicy && property.petPolicy !== '') ? property.petPolicy : '—'}</div>
              </div>
            </div>
          </div>

          {/* Amenities Box */}
          {property.amenities && Array.isArray(property.amenities) && property.amenities.length > 0 && (
            <div style={sectionCard}>
              <h2 style={sectionTitle}>Amenities</h2>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {property.amenities.map((a: string, i: number) => (
                  <span key={i} style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: 999, fontSize: 11, color: '#475569', fontWeight: 500 }}>
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Availability Box */}
          {property.availability && Array.isArray(property.availability) && property.availability.length > 0 && (
            <div style={sectionCard}>
              <h2 style={sectionTitle}>Availability</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {property.availability.map((av: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#f8fafc', borderRadius: 7, border: '1px solid #eff6ff' }}>
                    <span style={{ fontSize: 13 }}>📅</span>
                    <span style={{ color: '#475569', fontWeight: 500, fontSize: 12 }}>
                      {new Date(av.startDate).toLocaleDateString()} — {new Date(av.endDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Listed By Box */}
          {property.owner && (
            <div style={sectionCard}>
              <h2 style={sectionTitle}>Listed by</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#1e3a8a", fontSize: "0.95rem", flexShrink: 0 }}>
                  {property.owner.name?.charAt(0).toUpperCase() || "O"}
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: "#0f172a", margin: "0 0 2px", fontSize: "0.85rem" }}>{property.owner.name || "Owner"}</p>
                  <p style={{ color: "#64748b", margin: 0, fontSize: "0.75rem" }}>{property.owner.email || "—"}</p>
                </div>
              </div>
              {!isOwner && (
                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={handleMessageOwner}
                    disabled={isOpeningConversation}
                    style={{
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 12px",
                      background: "#1e3a8a",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: isOpeningConversation ? "not-allowed" : "pointer",
                    }}
                  >
                    {isOpeningConversation ? "Opening chat..." : "Message Owner"}
                  </button>
                </div>
              )}
            </div>
          )}

          {isOwner && property && (
            <div style={sectionCard}>
              <h2 style={sectionTitle}>Owner Actions</h2>
              <Link
                href={`/property/edit/${property._id}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid #bfdbfe",
                  background: "#eff6ff",
                  color: "#1e3a8a",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                }}
              >
                Edit This Property
              </Link>
            </div>
          )}

          {/* Booking Actions */}
          {canBook && (
            <>
              {bookingSuccess && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, animation: "fadeIn 0.3s ease" }}>
                  <div style={{ background: "#fff", borderRadius: 16, padding: "32px 24px", maxWidth: 360, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                    <div style={{ width: 64, height: 64, background: "linear-gradient(135deg, #16a34a, #22c55e)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "2rem" }}>✅</div>
                    <h2 style={{ margin: 0, color: "#0f172a", fontSize: "1.2rem", fontWeight: 700 }}>Booking Requested!</h2>
                  </div>
                </div>
              )}

              <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(15,23,42,0.98), rgba(15,23,42,0.85))", padding: "14px 20px", borderTop: "1px solid rgba(226,232,240,0.2)", display: "flex", justifyContent: "center", zIndex: 2000, backdropFilter: "blur(10px)" }}>
                <div style={{ maxWidth: 900, width: "100%" }}>
                  <button
                    onClick={handleBookProperty}
                    disabled={isBooking || userBookedThis}
                    style={{ width: "100%", padding: "11px 24px", borderRadius: 10, border: "none", background: userBookedThis ? "#93c5fd" : isBooking ? "linear-gradient(135deg, #60a5fa, #93c5fd)" : "linear-gradient(135deg, #1e3a8a, #2563eb)", color: "#fff", fontSize: "0.95rem", fontWeight: 700, cursor: userBookedThis || isBooking ? "not-allowed" : "pointer", boxShadow: userBookedThis ? "none" : "0 6px 20px rgba(30, 58, 138,0.4)", transition: "all 0.3s ease", textTransform: "uppercase" }}
                  >
                    {userBookedThis ? "Request Sent" : isBooking ? "Sending..." : "Book Property"}
                  </button>
                  <div style={{ height: 8 }} />
                  <button
                    onClick={handleOpenBookingChat}
                    disabled={!currentUserBookingId}
                    style={{
                      width: "100%",
                      padding: "9px",
                      borderRadius: 8,
                      border: "1px solid rgba(30, 58, 138,0.3)",
                      background: currentUserBookingId ? "rgba(30, 58, 138,0.05)" : "rgba(148,163,184,0.2)",
                      color: currentUserBookingId ? "#1e3a8a" : "#64748b",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      cursor: currentUserBookingId ? "pointer" : "not-allowed"
                    }}
                  >
                    {currentUserBookingId ? "Open Booking Chat" : "Send Request To Start Chat"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
          {canBook && <div style={{ height: 0 }} />}
          {showBookingModal && property && (
            <BookingFormModal
              property={{ _id: property._id, title: property.title, price: property.price }}
              onClose={() => setShowBookingModal(false)}
              onSuccess={(b: any) => { onBookingSuccess(b); }}
            />
          )}
      </div>
    </div>
  );
}
