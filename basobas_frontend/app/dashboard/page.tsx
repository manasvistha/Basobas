"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, getImageUrl, getPropertyImageUrl } from "@/lib/utils/auth-utils";
import { getProfile } from "@/lib/api/auth";
import { getNotifications, markNotificationRead, markAllNotificationsRead, NotificationItem } from "@/lib/api/notification";
import { deleteProperty, getMyProperties, getProperties, Property } from "@/lib/api/property";
import { createBooking } from "@/lib/api/booking";
import { getUserFavorites, removeFavorite } from "@/lib/api/favorite";

import Link from "next/link";
import { getOpenStreetMapUrl, isValidCoordinates } from "@/lib/utils/location";

type DashboardUser = {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  username?: string;
  role?: string;
  profilePicture?: string;
};

type PropertyOwner = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
};

type PropertyWithOwner = Property & { owner?: PropertyOwner };

const IconBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const IconChevronDown = ({ open }: { open?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}>
    <path d="M6 9l6 6 6-6"/>
  </svg>
);
const IconMapPin = ({ color = "currentColor", size = 14 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconBuilding = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
  </svg>
);
const IconTrend = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
  </svg>
);
const IconSearch = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21l-4.35-4.35"/>
  </svg>
);
const IconPlus = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const IconUser = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
  </svg>
);
const IconLogout = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconHome = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l9-7 9 7v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8z"/>
  </svg>
);
const IconArrow = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);
const IconWarning = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconX = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconDot = ({ read }: { read: boolean }) => (
  <div style={{ width: 7, height: 7, borderRadius: "50%", background: read ? "#e2e8f0" : "#4f46e5", flexShrink: 0, marginTop: 2 }} />
);
const IconHeart = ({ size = 16, filled = false }: { size?: number; filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifLimit = 20;
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [propertiesFilter, setPropertiesFilter] = useState<'all' | 'available'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'properties' | 'my-listings' | 'create' | 'messages' | 'account' | 'favorites'>('dashboard');

  const [favoriteProperties, setFavoriteProperties] = useState<PropertyWithOwner[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      const cookieUser = getCurrentUser();
      if (!cookieUser) { router.push("/login"); return; }
      if (cookieUser.role === "admin") { router.push("/admin/dashboard"); return; }
      try {
        const profileRes = await getProfile();
        const payload = profileRes?.data || profileRes?.user || profileRes;
        setUser(payload || cookieUser);
        try {
          const notRes = await getNotifications(1, notifLimit);
          setNotifications(notRes?.data || []);
        } catch {}
        const [myProps, allProps] = await Promise.all([getMyProperties(), getProperties()]);
        setMyProperties(myProps?.data || myProps || []);
        setAllProperties(allProps?.data || allProps || []);
      } catch (err: any) {
        setError(err?.message || "Failed to load data");
        setUser(cookieUser);
      } finally {
        setIsLoading(false);
      }
    };
    void hydrate();
  }, [router]);

  useEffect(() => {
    if (activeTab === 'favorites') {
      const fetchFavorites = async () => {
        setLoadingFavorites(true);
        try {
          const favs = await getUserFavorites();
          const normalized = (favs || []).map((f: any) => {
            if (!f) return f;

            if (f.property && typeof f.property === 'object') {
              const prop = f.property;
              return {
                _id: String(prop._id || prop.id),
                title: prop.title || '',
                images: Array.isArray(prop.images) ? prop.images : [],
                price: typeof prop.price === 'number' ? prop.price : 0,
                location: prop.location || '',
              };
            }

            if (f.property && typeof f.property === 'string') {
              return {
                _id: String(f.property),
                title: f.title || '',
                images: Array.isArray(f.images) ? f.images : [],
                price: typeof f.price === 'number' ? f.price : 0,
                location: f.location || '',
              };
            }

          
            if (f._id && (f.title || f.price || f.location || Array.isArray(f.images))) {
              return {
                _id: String(f._id),
                title: f.title || '',
                images: Array.isArray(f.images) ? f.images : [],
                price: typeof f.price === 'number' ? f.price : 0,
                location: f.location || '',
              };
            }

            // Fallback: try to derive a property id from either `property` or favorite `_id`.
            return {
              _id: String(f.property || f._id),
              title: f.title || '',
              images: Array.isArray(f.images) ? f.images : [],
              price: typeof f.price === 'number' ? f.price : 0,
              location: f.location || '',
            };
          });
          
          const filtered = (normalized || []).filter((p: any) => {
            if (!p || !p._id) return false;
            const hasTitle = typeof p.title === 'string' && p.title.trim().length > 0;
            const hasImages = Array.isArray(p.images) && p.images.length > 0;
            const hasLocation = typeof p.location === 'string' && p.location.trim().length > 0;
            const hasPrice = typeof p.price === 'number' && p.price > 0;
            return hasTitle || hasImages || hasLocation || hasPrice;
          });

          setFavoriteProperties(filtered);
        } catch {
          setError("Failed to load favorites");
        } finally {
          setLoadingFavorites(false);
        }
      };
      fetchFavorites();
    }
  }, [activeTab]);



  useEffect(() => {
    const filtered = allProperties.filter(p => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMin = priceMin ? p.price >= parseFloat(priceMin) : true;
      const matchesMax = priceMax ? p.price <= parseFloat(priceMax) : true;
      return matchesSearch && matchesMin && matchesMax;
    });
    setFilteredProperties(filtered);
  }, [allProperties, searchTerm, priceMin, priceMax]);

  const onLogout = () => {
    setShowProfileMenu(false);
    // Clear auth cookies client-side (they were httpOnly:false anyway)
    document.cookie = "auth_token=; path=/; max-age=0";
    document.cookie = "user_data=; path=/; max-age=0";
    router.push("/login");
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const handleViewProperty = (propertyId: string) => {
    router.push(`/property/${propertyId}`);
  };

  const isOwnedByCurrentUser = (property?: PropertyWithOwner | null) => {
    if (!property?.owner || !user) return false;
    const ownerValue: any = property.owner;
    const ownerId = typeof ownerValue === "string" ? ownerValue : (ownerValue._id || ownerValue.id);
    const ownerEmail = typeof ownerValue === "string" ? undefined : ownerValue.email;
    const userId = user._id || user.id;
    const normalizedOwnerEmail = ownerEmail ? String(ownerEmail).toLowerCase() : undefined;
    const normalizedUserEmail = user.email ? String(user.email).toLowerCase() : undefined;
    return (!!userId && ownerId === userId) || (!!normalizedUserEmail && normalizedOwnerEmail === normalizedUserEmail);
  };

  const handleDeleteProperty = async (propertyId: string) => {
    try {
      await deleteProperty(propertyId);
      setMyProperties(prev => prev.filter(p => p._id !== propertyId));
      setAllProperties(prev => prev.filter(p => p._id !== propertyId));
      setFilteredProperties(prev => prev.filter(p => p._id !== propertyId));
      alert("Property deleted successfully");
    } catch (err: any) {
      alert("Error: " + (err?.response?.data?.error || err?.message || "Failed to delete"));
    }
  };

  const handleBookProperty = async (propertyId: string) => {
    try {
      setIsBooking(true);
      await createBooking({ propertyId });
      const updater = (items: Property[]) =>
        items.map(p => p._id === propertyId ? { ...p, status: 'booked' as const } : p);
      setAllProperties(prev => updater(prev));
      setMyProperties(prev => updater(prev));
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to book property");
    } finally {
      setIsBooking(false);
    }
  };

  const handleRemoveFavorite = async (propertyId: string) => {
    const previous = favoriteProperties;
    setFavoriteProperties(prev => prev.filter(p => p._id !== propertyId));
    try {
      await removeFavorite(propertyId);
    } catch (err: any) {
      setFavoriteProperties(previous);
      alert(err?.response?.data?.error || "Failed to remove from favorites");
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fafafa" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "36px", height: "36px", border: "2px solid #e2e8f0", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#94a3b8", fontSize: "0.8125rem", fontFamily: "'DM Sans', sans-serif" }}>Loading workspace…</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  const name = user?.name || user?.username || "User";
  const email = user?.email || "";
  const avatar = getImageUrl(user?.profilePicture) || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=fff&bold=true`;
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const PropertyCard = ({
    property, showStatus, onClick, showManagementActions, showRemoveFavorite
  }: {
    property: PropertyWithOwner;
    showStatus?: boolean;
    onClick?: () => void;
    showManagementActions?: boolean;
    showRemoveFavorite?: boolean;
  }) => {
    const imgUrl = property.images?.length ? getPropertyImageUrl(property.images[0]) : null;
    const [hovered, setHovered] = useState(false);
    const canEdit = isOwnedByCurrentUser(property);
    const osmUrl = isValidCoordinates(property.coordinates) ? getOpenStreetMapUrl(property.coordinates) : "";

    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onClick}
        style={{
          background: "#fff", borderRadius: "14px", overflow: "hidden",
          border: "1px solid", borderColor: hovered ? "#c7d2fe" : "#f0f0f0",
          cursor: onClick ? "pointer" : "default",
          transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
          transform: hovered ? "translateY(-3px)" : "none",
          boxShadow: hovered ? "0 16px 32px -8px rgba(79,70,229,0.12)" : "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ height: 188, background: "#f8f9fc", position: "relative", overflow: "hidden" }}>
          {imgUrl ? (
            <img src={imgUrl} alt={property.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s", transform: hovered ? "scale(1.04)" : "scale(1)" }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#c8d0e0" }}>
              <IconHome size={44} />
            </div>
          )}
          {showStatus && (
            <div style={{ position: "absolute", top: 12, left: 12 }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", padding: "4px 10px", borderRadius: "20px", background: property.status === "available" ? "#dcfce7" : "#fef3c7", color: property.status === "available" ? "#15803d" : "#92400e" }}>
                {property.status}
              </span>
            </div>
          )}
          {showRemoveFavorite && (
            <button
              onClick={e => { e.stopPropagation(); handleRemoveFavorite(property._id); }}
              style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.95)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#ef4444", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
              title="Remove from favorites"
            >
              <IconHeart size={15} filled />
            </button>
          )}
          <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(15,23,42,0.88)", backdropFilter: "blur(10px)", borderRadius: "10px", padding: "8px 14px" }}>
            <span style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>Rs {Number(property.price || 0).toLocaleString()}</span>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", marginLeft: 2 }}>/mo</span>
          </div>
        </div>
        <div style={{ padding: "16px 18px 18px" }}>
          <h4 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#0f172a", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {property.title}
          </h4>
          <p style={{ display: "flex", alignItems: "center", gap: 5, color: "#94a3b8", fontSize: "0.8125rem", margin: "0 0 12px" }}>
            <IconMapPin color="#ef4444" size={13} />{property.location}
          </p>
          {osmUrl ? (
            <a
              href={osmUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: "0.74rem",
                fontWeight: 600,
                color: "#4f46e5",
                textDecoration: "none",
                border: "1px solid #c7d2fe",
                borderRadius: 999,
                padding: "5px 10px",
                background: "#eef2ff",
                marginBottom: 10,
              }}
            >
              <IconMapPin color="#4f46e5" size={12} />
              Open Map
            </a>
          ) : null}
          {onClick && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #f4f4f5" }}>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8", textDecoration: "underline" }}>View details</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.8rem", fontWeight: 600, color: "#4f46e5", textDecoration: "underline" }}>
                Open <IconArrow size={13} />
              </span>
            </div>
          )}
          {showManagementActions && canEdit && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button type="button" onClick={e => { e.stopPropagation(); window.location.href = `/property/edit/${property._id}`; }}
                style={{ padding: "6px 14px", background: "#f3f4f6", color: "#4f46e5", border: "1px solid #c7d2fe", borderRadius: 7, fontWeight: 600, cursor: "pointer" }}>Edit</button>
              <button type="button" onClick={e => { e.stopPropagation(); if (window.confirm('Delete this property?')) handleDeleteProperty(property._id); }}
                style={{ padding: "6px 14px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 7, fontWeight: 600, cursor: "pointer" }}>Delete</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const StatCard = ({ label, value, icon, accent, onClick }: { label: string; value: number; icon: React.ReactNode; accent?: string; onClick?: () => void }) => (
    <div onClick={onClick} style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "14px", padding: "20px 22px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ width: 44, height: 44, borderRadius: "12px", background: accent || "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#4f46e5", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.5rem", fontWeight: 500, color: "#0f172a", lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 3, letterSpacing: "0.03em", textTransform: "uppercase" }}>{label}</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fc", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .notif-scroll::-webkit-scrollbar { width: 4px; }
        .notif-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
      `}</style>

      <header style={{ background: "linear-gradient(90deg, rgba(6,182,212,0.08) 0%, rgba(99,102,241,0.03) 40%, #ffffff 100%)", backdropFilter: "saturate(120%) blur(4px)", borderBottom: "1px solid rgba(99,102,241,0.06)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 62 }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
            <img src="/basobas.png" alt="BasoBas" style={{ height: 32, width: "auto" }} />
            <span style={{ fontSize: "1.0625rem", fontWeight: 700, letterSpacing: "-0.02em", background: "linear-gradient(90deg,#6366f1,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Rentora</span>
          </Link>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowNotifications(s => !s); setShowProfileMenu(false); }}
                style={{
                  position: 'relative',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                    border: '1px solid rgba(99,102,241,0.12)',
                  background: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#c7d2fe'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
                aria-label="Notifications"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 600, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 55 }} onClick={() => setShowNotifications(false)} />
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 340, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.12)', zIndex: 1000, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>Notifications</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {notifications.filter(n => !n.isRead).length > 0 && (
                          <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4f46e5', fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 6 }} onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#f0f0ff'} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}>
                            Mark all read
                          </button>
                        )}
                        {notifications.filter(n => !n.isRead).length > 0 && (
                          <span style={{ fontSize: 12, color: '#6b7280' }}>{notifications.filter(n => !n.isRead).length} unread</span>
                        )}
                        <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    </div>
                    <div style={{ maxHeight: 340, overflow: 'auto' }}>
                      {notifications.length === 0 && (
                        <div style={{ padding: 32, textAlign: 'center' }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 12px', opacity: 0.4 }} xmlns="http://www.w3.org/2000/svg"><path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <div style={{ color: '#6b7280', fontSize: 13 }}>No notifications yet</div>
                        </div>
                      )}
                      {notifications.map(n => (
                        <div key={n._id} style={{ padding: '12px 16px', borderBottom: '1px solid #f8fafc', background: n.isRead ? '#fff' : '#fafbff', cursor: 'pointer', transition: 'background 0.15s' }} onClick={async () => { try { await handleMarkRead(n._id); } catch (err) {} }} onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.background = '#f8fafc'} onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.background = n.isRead ? '#fff' : '#fafbff'}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.isRead ? 'transparent' : '#4f46e5', marginTop: 6, flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, color: '#111827', fontWeight: n.isRead ? 400 : 600, marginBottom: 4 }}>{n.message}</div>
                              <div style={{ fontSize: 12, color: '#9ca3af' }}>{new Date(n.createdAt).toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{ width: 1, height: 22, background: "rgba(99,102,241,0.06)" }} />

  
            <div style={{ position: "relative" }}>
              <button onClick={() => { setShowProfileMenu(p => !p); setShowNotifications(false); }}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 12px 5px 5px", borderRadius: "10px", border: "1px solid #ebebeb", background: "#fff", cursor: "pointer" }}>
                <img src={avatar} alt={name} style={{ width: 28, height: 28, borderRadius: "8px", objectFit: "cover" }} />
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#0f172a" }}>{name.split(" ")[0]}</span>
                <IconChevronDown open={showProfileMenu} />
              </button>
              {showProfileMenu && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 55 }} onClick={() => setShowProfileMenu(false)} />
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 220, background: "#fff", borderRadius: 14, border: "1px solid #ebebeb", boxShadow: "0 16px 40px -8px rgba(0,0,0,0.12)", zIndex: 60, overflow: "hidden", animation: "fadeIn 0.15s ease" }}>
                    <div style={{ padding: "14px 16px", borderBottom: "1px solid #f4f4f5", background: "#fafafa" }}>
                      <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0f172a", margin: "0 0 2px" }}>{name}</p>
                      <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>{email}</p>
                    </div>
                    <div style={{ padding: 6 }}>
                      <Link href="/user/profile" onClick={() => setShowProfileMenu(false)}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", fontSize: "0.8125rem", color: "#334155", textDecoration: "none", borderRadius: 8 }}>
                        <IconUser size={14} /> My Profile
                      </Link>
                      <button onClick={onLogout}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", fontSize: "0.8125rem", color: "#ef4444", background: "transparent", border: "none", cursor: "pointer", borderRadius: 8, textAlign: "left", fontFamily: "'DM Sans', sans-serif" }}>
                        <IconLogout size={14} /> Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>


      <div style={{ background: "#fff", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
          <nav style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 0", flexWrap: "wrap" }}>
            {([
              { key: 'dashboard', label: 'Dashboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
              { key: 'properties', label: 'Properties', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
              { key: 'my-listings', label: 'My Listings', icon: <IconBuilding size={15} /> },
              { key: 'create', label: 'List Property', icon: <IconPlus size={15} /> },
              { key: 'messages', label: 'Messages', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
              { key: 'favorites', label: 'My Favorites', icon: <IconHeart size={15} filled /> },
              { key: 'account', label: 'My Account', icon: <IconUser size={15} /> },
            ] as const).map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => tab.key === 'messages' ? router.push('/conversations') : setActiveTab(tab.key)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, border: "none", background: isActive ? (tab.key === 'favorites' ? "#fff0f3" : "#4f46e5") : "transparent", color: isActive ? (tab.key === 'favorites' ? "#e11d48" : "#fff") : "#64748b", fontSize: "0.875rem", fontWeight: isActive ? 600 : 500, cursor: "pointer", transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = tab.key === 'favorites' ? "#fff0f3" : "#f1f5f9"; e.currentTarget.style.color = tab.key === 'favorites' ? "#e11d48" : "#4f46e5"; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; } }}
                >
                  {tab.icon} {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 28px 80px" }}>

        {error && (
          <div style={{ marginBottom: 20, padding: "12px 16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, color: "#92400e", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: 10 }}>
            <IconWarning size={15} />{error}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, marginBottom: 32, alignItems: "start" }}>
              <div style={{ animation: "slideUp 0.4s ease both" }}>
                <p style={{ fontSize: "0.8125rem", color: "#94a3b8", margin: "0 0 4px", textTransform: "uppercase", fontWeight: 500 }}>{greeting}</p>
                <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#0f172a", margin: "0 0 6px", letterSpacing: "-0.04em" }}>{name.split(" ")[0]}</h1>
                <p style={{ fontSize: "0.9375rem", color: "#64748b", margin: 0 }}>Here's what's happening in your workspace today.</p>
              </div>

              <div style={{ display: "flex", gap: 10, paddingTop: 4, flexWrap: "wrap", animation: "slideUp 0.4s 0.1s ease both", opacity: 0, animationFillMode: "forwards" }}>
                <button onClick={() => setActiveTab('create')}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "#4f46e5", color: "#fff", borderRadius: 10, border: "none", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#4338ca"}
                  onMouseLeave={e => e.currentTarget.style.background = "#4f46e5"}>
                  <IconPlus size={15} /> New listing
                </button>
                <Link href="/my-bookings"
                  style={{ display: "inline-flex", alignItems: "center", padding: "10px 14px", background: "#fff", color: "#4f46e5", borderRadius: 10, border: "1px solid #c7d2fe", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
                  My Bookings
                </Link>
                <Link href="/booking-requests"
                  style={{ display: "inline-flex", alignItems: "center", padding: "10px 14px", background: "#fff", color: "#4f46e5", borderRadius: 10, border: "1px solid #c7d2fe", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
                  Booking Requests
                </Link>
               
                <button onClick={() => setActiveTab('favorites')}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 14px", background: "#fff0f3", color: "#e11d48", borderRadius: 10, border: "1px solid #fecdd3", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#ffe4e6"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fff0f3"}>
                  <IconHeart size={14} filled /> My Favorites
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 40 }}>
              <StatCard label="My listings" value={myProperties.length} icon={<IconBuilding size={19} />} onClick={() => setActiveTab('my-listings')} />
              <StatCard label="Available now" value={allProperties.filter(p => p.status === "available").length} icon={<IconTrend size={19} />} accent="#f0fdf4" onClick={() => { setPropertiesFilter('available'); setActiveTab('properties'); }} />
              <StatCard label="Total market" value={allProperties.length} icon={<IconSearch size={18} />} accent="#fff7ed" onClick={() => { setPropertiesFilter('all'); setActiveTab('properties'); }} />
            </div>

            <section>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", margin: "0 0 3px" }}>Explore Rentals</h2>
                  <p style={{ fontSize: "0.8125rem", color: "#94a3b8", margin: 0 }}>Browse all available properties on the platform</p>
                </div>
                {allProperties.length > 6 && (
                  <button onClick={() => { setPropertiesFilter('all'); setActiveTab('properties'); }}
                    style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#4f46e5", background: "transparent", border: "1px solid #c7d2fe", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 8, fontFamily: "'DM Sans', sans-serif" }}>
                    View all <IconArrow size={12} />
                  </button>
                )}
              </div>
              {allProperties.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(285px, 1fr))", gap: 16 }}>
                  {allProperties.slice(0, 6).map(p => (
                    <PropertyCard key={p._id} property={p as PropertyWithOwner} onClick={() => handleViewProperty(p._id)} />
                  ))}
                </div>
              ) : (
                <EmptyState icon={<IconSearch size={36} />} headline="No properties yet" sub="Listings will appear here when added." />
              )}
            </section>
          </>
        )}

        {activeTab === 'properties' && (
          <>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>All Properties</h1>
              <p style={{ fontSize: "0.9375rem", color: "#64748b", margin: 0 }}>Browse {(propertiesFilter === 'available' ? allProperties.filter(p => p.status === 'available') : filteredProperties).length} listings</p>
            </div>
            <div style={{ marginBottom: 24, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 240, position: "relative" }}>
                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}><IconSearch size={16} /></div>
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by title, location…" style={{ width: "100%", padding: "11px 14px 11px 42px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: "0.875rem", outline: "none", fontFamily: "'DM Sans', sans-serif", color: "#334155" }} />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="Min price" type="number" style={{ width: 100, padding: "11px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: "0.875rem", outline: "none", fontFamily: "'DM Sans', sans-serif", color: "#334155" }} />
                <span style={{ color: "#64748b" }}>to</span>
                <input value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="Max price" type="number" style={{ width: 100, padding: "11px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: "0.875rem", outline: "none", fontFamily: "'DM Sans', sans-serif", color: "#334155" }} />
              </div>
            </div>
            {(() => {
              const display = propertiesFilter === 'available' ? allProperties.filter(p => p.status === 'available') : filteredProperties;
              return display.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(285px, 1fr))", gap: 18 }}>
                  {display.map(p => <PropertyCard key={p._id} property={p as PropertyWithOwner} onClick={() => handleViewProperty(p._id)} />)}
                </div>
              ) : <EmptyState icon={<IconSearch size={36} />} headline="No properties found" sub="Try adjusting your search terms." />;
            })()}
          </>
        )}

        {activeTab === 'my-listings' && (
          <>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>My Listings</h1>
              <p style={{ fontSize: "0.9375rem", color: "#64748b", margin: 0 }}>Manage the properties you listed for rent</p>
            </div>
            {myProperties.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(285px, 1fr))", gap: 18 }}>
                {myProperties.map(p => <PropertyCard key={p._id} property={p as PropertyWithOwner} showStatus showManagementActions onClick={() => handleViewProperty(p._id)} />)}
              </div>
            ) : (
              <EmptyState icon={<IconHome size={36} />} headline="No listings yet" sub="List your first property to get started."
                action={<button onClick={() => setActiveTab('create')} style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 16, padding: "9px 18px", background: "#4f46e5", color: "#fff", borderRadius: 9, border: "none", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}><IconPlus size={14} /> Add property</button>}
              />
            )}
          </>
        )}

        {activeTab === 'create' && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>List a Property</h1>
              <p style={{ fontSize: "0.9375rem", color: "#64748b", margin: 0 }}>Add your property to the marketplace</p>
            </div>
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 32, maxWidth: 600 }}>
              <p style={{ fontSize: "0.9375rem", color: "#64748b", margin: "0 0 20px", lineHeight: 1.6 }}>To list a new property, you'll be redirected to the full property creation form.</p>
              <Link href="/property/create" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "#4f46e5", color: "#fff", borderRadius: 10, textDecoration: "none", fontSize: "0.9375rem", fontWeight: 600 }}>
                <IconPlus size={16} /> Create Property Listing
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div style={{ animation: "slideUp 0.35s ease" }}>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>My Favorites ❤️</h1>
              <p style={{ fontSize: "0.9375rem", color: "#64748b", margin: 0 }}>Properties you have saved</p>
            </div>
            {loadingFavorites ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ width: 36, height: 36, border: "2px solid #e2e8f0", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 14px" }} />
                <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Loading favorites...</p>
              </div>
            ) : favoriteProperties.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(285px, 1fr))", gap: 18 }}>
                {favoriteProperties.map(p => (
                  <PropertyCard key={p._id} property={p} showStatus showRemoveFavorite onClick={() => handleViewProperty(p._id)} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<IconHeart size={36} />}
                headline="No favorites yet"
                sub="Click the ❤️ heart on any property detail page to save it here."
                action={
                  <button onClick={() => setActiveTab('properties')}
                    style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 16, padding: "9px 18px", background: "#4f46e5", color: "#fff", borderRadius: 9, border: "none", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    Browse Properties
                  </button>
                }
              />
            )}
          </div>
        )}

        {activeTab === 'account' && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>My Account</h1>
              <p style={{ fontSize: "0.9375rem", color: "#64748b", margin: 0 }}>Manage your profile and settings</p>
            </div>
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", maxWidth: 480 }}>
              <div style={{ padding: 28, borderBottom: "1px solid #f4f4f5", display: "flex", alignItems: "center", gap: 18 }}>
                <img src={avatar} alt={name} style={{ width: 64, height: 64, borderRadius: 14, objectFit: "cover", border: "2px solid #e2e8f0" }} />
                <div>
                  <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>{name}</h2>
                  <p style={{ fontSize: "0.875rem", color: "#94a3b8", margin: 0 }}>{email}</p>
                </div>
              </div>
              <div style={{ padding: "20px 28px" }}>
                {[["Username", user?.username || "—"], ["Role", user?.role || "user"], ["Properties Listed", myProperties.length.toString()]].map(([k, v], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: i < 2 ? "1px solid #f4f4f5" : "none" }}>
                    <span style={{ fontSize: "0.875rem", color: "#64748b" }}>{k}</span>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0f172a", textTransform: "capitalize" }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: "16px 28px 24px", display: "flex", gap: 12 }}>
                <Link href="/user/profile" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 16px", background: "#4f46e5", color: "#fff", borderRadius: 10, textDecoration: "none", fontSize: "0.875rem", fontWeight: 600 }}>
                  <IconUser size={15} /> Edit Profile
                </Link>
                <button onClick={onLogout} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 16px", background: "#fef2f2", color: "#ef4444", borderRadius: 10, border: "1px solid #fecaca", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  <IconLogout size={15} /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState({ icon, headline, sub, action }: { icon: React.ReactNode; headline: string; sub: string; action?: React.ReactNode }) {
  return (
    <div style={{ border: "1.5px dashed #e2e8f0", borderRadius: 16, padding: "52px 24px", textAlign: "center", background: "#fafafa" }}>
      <div style={{ color: "#c8d0e0", marginBottom: 14, display: "flex", justifyContent: "center" }}>{icon}</div>
      <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#64748b", margin: "0 0 4px" }}>{headline}</p>
      <p style={{ fontSize: "0.8125rem", color: "#b0bcc8", margin: 0 }}>{sub}</p>
      {action}
    </div>
  );
}
