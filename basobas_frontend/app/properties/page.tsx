"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProperties, Property, searchProperties, getProperty, filterProperties } from "@/lib/api/property";
import { getPropertyImageUrl } from "@/lib/utils/auth-utils";
import PropertyLocationMap from "@/components/location/PropertyLocationMap";
import { getOpenStreetMapUrl, isValidCoordinates } from "@/lib/utils/location";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loadingProperty, setLoadingProperty] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priceMin: "", priceMax: "", bedrooms: "", bathrooms: "",
    propertyType: "", furnished: false, parking: false, petPolicy: "",
  });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await getProperties();
        setProperties(data?.data || data || []);
      } catch (error) {
        console.error("Failed to fetch properties:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const handleApplyFilters = async () => {
    setLoading(true);
    try {
      const activeFilters: any = {};
      if (filters.priceMin) activeFilters.priceMin = parseInt(filters.priceMin);
      if (filters.priceMax) activeFilters.priceMax = parseInt(filters.priceMax);
      if (filters.bedrooms) activeFilters.bedrooms = parseInt(filters.bedrooms);
      if (filters.bathrooms) activeFilters.bathrooms = parseInt(filters.bathrooms);
      if (filters.propertyType) activeFilters.propertyType = filters.propertyType;
      if (filters.furnished) activeFilters.furnished = true;
      if (filters.parking) activeFilters.parking = true;
      if (filters.petPolicy) activeFilters.petPolicy = filters.petPolicy;
      const data = await filterProperties(activeFilters);
      setProperties(data?.data || data || []);
      setShowFilters(false);
    } catch (error) {
      console.error("Filter failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = async () => {
    setFilters({ priceMin: "", priceMax: "", bedrooms: "", bathrooms: "", propertyType: "", furnished: false, parking: false, petPolicy: "" });
    setLoading(true);
    try {
      const data = await getProperties();
      setProperties(data?.data || data || []);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const data = await searchProperties({ location: searchQuery });
      setProperties(data?.data || data || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0d0f14", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600&display=swap');
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        `}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 44, height: 44, border: "2px solid #1e293b", borderTopColor: "#c8a96e", borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#64748b", fontSize: "0.875rem", fontFamily: "'Outfit', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Loading properties</p>
        </div>
      </div>
    );
  }

  const statusColor = (status: string) => {
    if (status === "available") return { bg: "rgba(16,185,129,0.12)", color: "#34d399", border: "rgba(52,211,153,0.2)" };
    if (status === "booked") return { bg: "rgba(239,68,68,0.12)", color: "#f87171", border: "rgba(248,113,113,0.2)" };
    return { bg: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "rgba(251,191,36,0.2)" };
  };

  const selectedPropertyOsmUrl =
    isValidCoordinates(selectedProperty?.coordinates) && selectedProperty?.coordinates
      ? getOpenStreetMapUrl(selectedProperty.coordinates)
      : "";

  return (
    <div style={{ minHeight: "100vh", background: "#0d0f14", fontFamily: "'Outfit', sans-serif", color: "#e2e8f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .card {
          transition: transform 0.3s cubic-bezier(.22,.68,0,1.2), box-shadow 0.3s ease;
          animation: fadeUp 0.5s ease both;
        }
        .card:hover { transform: translateY(-6px); box-shadow: 0 32px 64px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(200,169,110,0.15) !important; }
        .card:hover .card-img { transform: scale(1.07); }
        .card-img { transition: transform 0.5s cubic-bezier(.22,.68,0,1.2); }
        .search-bar:focus { outline: none; border-color: rgba(200,169,110,0.5) !important; box-shadow: 0 0 0 3px rgba(200,169,110,0.08); }
        .btn-gold {
          background: linear-gradient(135deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%);
          background-size: 200% 200%;
          transition: background-position 0.4s ease, transform 0.2s ease, box-shadow 0.2s ease;
        }
        .btn-gold:hover { background-position: right center; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(200,169,110,0.3); }
        .modal-scroll::-webkit-scrollbar { width: 4px; }
        .modal-scroll::-webkit-scrollbar-track { background: #1a1d26; }
        .modal-scroll::-webkit-scrollbar-thumb { background: #2d3148; border-radius: 4px; }
        .filter-row input, .filter-row select {
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(170, 205, 196, 0.4);
          color: #0b5e58;
          border-radius: 8px;
          padding: 10px 13px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.875rem;
          width: 100%;
          outline: none;
          transition: border-color 0.2s;
        }
        .filter-row input:focus, .filter-row select:focus { border-color: rgba(15, 118, 110, 0.5); background: #ffffff; }
        .filter-row input::placeholder { color: rgba(11, 94, 88, 0.4); }
        .tab-btn { transition: all 0.2s ease; }
        .tab-btn:hover { color: #c8a96e !important; }
      `}</style>

      {/* ── Header with Glass Panel ── */}
      <header style={{ borderBottom: "1px solid rgba(170, 205, 196, 0.3)", position: "sticky", top: 0, zIndex: 40, background: "linear-gradient(145deg, rgba(13, 15, 20, 0.92), rgba(20, 28, 36, 0.88))", backdropFilter: "blur(20px)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#0b5e58", fontSize: "0.8125rem", fontFamily: "'Outfit', sans-serif", transition: "all 0.2s", padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(15, 118, 110, 0.2)" }}
              onMouseEnter={e => {
                e.currentTarget.style.color = "#0b5e58";
                e.currentTarget.style.borderColor = "rgba(15, 118, 110, 0.4)";
                e.currentTarget.style.background = "rgba(15, 118, 110, 0.08)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = "#0b5e58";
                e.currentTarget.style.borderColor = "rgba(15, 118, 110, 0.2)";
                e.currentTarget.style.background = "transparent";
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Dashboard
            </Link>
            <div style={{ width: 1, height: 18, background: "#1e293b" }} />
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "1rem", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.01em" }}>
              Properties
            </span>
            <div style={{ background: "rgba(200,169,110,0.12)", border: "1px solid rgba(200,169,110,0.2)", color: "#c8a96e", fontSize: "0.7rem", fontWeight: 700, padding: "3px 10px", borderRadius: 20, letterSpacing: "0.05em" }}>
              {properties.length} LISTINGS
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              className="tab-btn"
              onClick={() => setShowFilters(s => !s)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", background: showFilters ? "rgba(200,169,110,0.1)" : "transparent", border: "1px solid", borderColor: showFilters ? "rgba(200,169,110,0.3)" : "#232636", borderRadius: 8, cursor: "pointer", color: showFilters ? "#c8a96e" : "#94a3b8", fontSize: "0.8125rem", fontFamily: "'Outfit', sans-serif", fontWeight: 500 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              Filters
            </button>
            <Link href="/property/create"
              className="btn-gold"
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 9, textDecoration: "none", fontSize: "0.875rem", fontWeight: 600, color: "#0d0f14", fontFamily: "'Syne', sans-serif", border: "none", cursor: "pointer" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              List Property
            </Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 32px 80px" }}>

        {/* ── Search Bar ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#4a5568", pointerEvents: "none" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </div>
            <input
              className="search-bar"
              type="text"
              placeholder="Search by location, title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{ width: "100%", padding: "12px 16px 12px 44px", background: "#151821", border: "1px solid #232636", borderRadius: 10, fontSize: "0.9rem", color: "#e2e8f0", fontFamily: "'Outfit', sans-serif" }}
            />
          </div>
          <button onClick={handleSearch}
            className="btn-gold"
            style={{ padding: "12px 24px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, color: "#0d0f14", fontFamily: "'Syne', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            Search
          </button>
        </div>

        {/* ── Filters Panel with Glass Style ── */}
        {showFilters && (
          <div style={{ background: "linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(239, 250, 247, 0.65))", border: "1px solid rgba(170, 205, 196, 0.5)", borderRadius: 24, padding: 24, marginBottom: 24, animation: "fadeIn 0.2s ease", boxShadow: "0 22px 55px -30px rgba(8, 53, 49, 0.35)" }}>
            <p style={{ fontFamily: "'Syne', sans-serif", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#0b5e58", margin: "0 0 16px" }}>Filter Properties</p>
            <div className="filter-row" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Min Price", key: "priceMin", type: "number", placeholder: "Rs 0" },
                { label: "Max Price", key: "priceMax", type: "number", placeholder: "Rs 9,999" },
                { label: "Bedrooms", key: "bedrooms", type: "number", placeholder: "Any" },
                { label: "Bathrooms", key: "bathrooms", type: "number", placeholder: "Any" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={(filters as any)[f.key]}
                    onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Type</label>
                <select value={filters.propertyType} onChange={e => setFilters(prev => ({ ...prev, propertyType: e.target.value }))}
                  style={{ background: "#151821", border: "1px solid #232636", color: "#e2e8f0", borderRadius: 8, padding: "10px 13px", fontFamily: "'Outfit', sans-serif", fontSize: "0.875rem", width: "100%", outline: "none" }}>
                  <option value="">Any type</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="room">Room</option>
                  <option value="studio">Studio</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 20, marginBottom: 18 }}>
              {[{ label: "Furnished", key: "furnished" }, { label: "Parking", key: "parking" }].map(f => (
                <label key={f.key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.875rem", color: "#94a3b8", userSelect: "none" }}>
                  <div onClick={() => setFilters(prev => ({ ...prev, [f.key]: !(prev as any)[f.key] }))}
                    style={{ width: 18, height: 18, borderRadius: 5, border: "1px solid", borderColor: (filters as any)[f.key] ? "#c8a96e" : "#2d3148", background: (filters as any)[f.key] ? "rgba(200,169,110,0.2)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", cursor: "pointer" }}>
                    {(filters as any)[f.key] && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#c8a96e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  {f.label}
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleApplyFilters}
                style={{ padding: "9px 22px", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", fontFamily: "'Syne', sans-serif", color: "#ffffff", background: "linear-gradient(135deg, #0b5e58 0%, #0f7670 100%)", transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                Apply Filters
              </button>
              <button onClick={handleClearFilters}
                style={{ padding: "9px 22px", background: "transparent", color: "#0b5e58", border: "1px solid rgba(15, 118, 110, 0.3)", borderRadius: 8, cursor: "pointer", fontWeight: 500, fontSize: "0.875rem", fontFamily: "'Outfit', sans-serif", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(15, 118, 110, 0.6)"; e.currentTarget.style.background = "rgba(15, 118, 110, 0.05)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(15, 118, 110, 0.3)"; e.currentTarget.style.background = "transparent"; }}>
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* ── Properties Grid ── */}
        {properties.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 20 }}>
            {properties.map((property, idx) => {
              const imgUrl = property.images?.length ? getPropertyImageUrl(property.images[0]) : null;
              const sc = statusColor(property.status);
              const osmUrl = isValidCoordinates(property.coordinates) ? getOpenStreetMapUrl(property.coordinates) : "";
              return (
                <div
                  key={property._id}
                  className="card"
                  onClick={() => handleViewProperty(property._id)}
                  style={{
                    background: "#111318",
                    border: "1px solid #1a1d26",
                    borderRadius: 16,
                    overflow: "hidden",
                    cursor: "pointer",
                    animationDelay: `${idx * 0.04}s`,
                    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                  }}
                >
                  {/* Image */}
                  <div style={{ height: 210, background: "#0d0f14", overflow: "hidden", position: "relative" }}>
                    {imgUrl ? (
                      <img src={imgUrl} alt={property.title ?? "Property"} className="card-img"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2d3148" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-7 9 7v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8z"/></svg>
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(13,15,20,0.8) 0%, transparent 50%)" }} />

                    {/* Status */}
                    <div style={{ position: "absolute", top: 14, left: 14 }}>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontFamily: "'Outfit', sans-serif" }}>
                        {property.status}
                      </span>
                    </div>

                    {/* Price */}
                    <div style={{ position: "absolute", bottom: 14, right: 14 }}>
                      <div style={{ background: "rgba(13,15,20,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: 10, padding: "7px 14px" }}>
                        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "1rem", fontWeight: 700, color: "#c8a96e" }}>${(property.price ?? 0).toLocaleString()}</span>
                        <span style={{ fontSize: "0.7rem", color: "rgba(200,169,110,0.5)", marginLeft: 2 }}>/mo</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: "18px 20px" }}>
                    <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1rem", fontWeight: 700, color: "#f1f5f9", margin: "0 0 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>
                      {property.title ?? "Untitled Property"}
                    </h3>
                    <p style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b", fontSize: "0.8125rem", margin: "0 0 12px" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c8a96e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {property.location}
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
                          gap: 5,
                          fontSize: "0.72rem",
                          color: "#c8a96e",
                          border: "1px solid rgba(200,169,110,0.35)",
                          borderRadius: 999,
                          padding: "4px 9px",
                          textDecoration: "none",
                          marginBottom: 12,
                          background: "rgba(200,169,110,0.08)",
                          fontWeight: 700,
                          letterSpacing: "0.02em",
                        }}
                      >
                        Open Map
                      </a>
                    ) : null}
                    <p style={{ fontSize: "0.8125rem", color: "#475569", margin: "0 0 16px", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>
                      {property.description}
                    </p>
                    <div style={{ paddingTop: 14, borderTop: "1px solid #1a1d26", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.75rem", color: "#334155", letterSpacing: "0.03em" }}>
                        {new Date(property.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#c8a96e", fontFamily: "'Syne', sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
                        View details
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "100px 20px", border: "1px dashed #1e2130", borderRadius: 20, background: "#0d0f14" }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#2d3148" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 20px", display: "block" }}><path d="M3 11l9-7 9 7v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8z"/></svg>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#334155", margin: "0 0 8px" }}>No properties found</h3>
            <p style={{ fontSize: "0.875rem", color: "#475569", margin: 0 }}>Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* ── Property Modal ── */}
      {showPropertyModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24, animation: "fadeIn 0.2s ease" }}
          onClick={() => setShowPropertyModal(false)}
        >
          <div
            style={{ background: "#111318", border: "1px solid #1e2130", borderRadius: 20, maxWidth: 920, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 40px 80px -20px rgba(0,0,0,0.8)", overflow: "hidden", animation: "scaleIn 0.25s cubic-bezier(.22,.68,0,1.2)" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: "24px 28px", borderBottom: "1px solid #1a1d26", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, background: "#0d0f14" }}>
              <div>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c8a96e", margin: "0 0 6px" }}>Property Details</p>
                <h2 style={{ fontFamily: "'Syne', sans-serif", margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
                  {loadingProperty ? "Loading..." : selectedProperty?.title ?? "Property"}
                </h2>
                {!loadingProperty && selectedProperty && (
                  <div style={{ marginTop: 5 }}>
                    <p style={{ margin: "0 0 6px", fontSize: "0.8125rem", color: "#64748b", display: "flex", alignItems: "center", gap: 5 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#c8a96e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {selectedProperty.location}
                    </p>
                    {selectedPropertyOsmUrl ? (
                      <a
                        href={selectedPropertyOsmUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          color: "#c8a96e",
                          border: "1px solid rgba(200,169,110,0.35)",
                          borderRadius: 999,
                          padding: "4px 9px",
                          textDecoration: "none",
                          background: "rgba(200,169,110,0.08)",
                        }}
                      >
                        Open Map
                      </a>
                    ) : null}
                  </div>
                )}
              </div>
              <button onClick={() => setShowPropertyModal(false)}
                style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #232636", background: "#151821", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#c8a96e"; e.currentTarget.style.color = "#c8a96e"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#232636"; e.currentTarget.style.color = "#64748b"; }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-scroll" style={{ padding: 28, overflowY: "auto", flex: 1 }}>
              {loadingProperty ? (
                <div style={{ textAlign: "center", padding: "70px 20px" }}>
                  <div style={{ width: 40, height: 40, border: "2px solid #1e293b", borderTopColor: "#c8a96e", borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 16px" }} />
                  <p style={{ color: "#475569", fontFamily: "'Outfit', sans-serif" }}>Loading details...</p>
                </div>
              ) : selectedProperty ? (
                <div>
                  {/* Images */}
                  {selectedProperty.images?.length > 0 && (
                    <div style={{ marginBottom: 28 }}>
                      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: "0.7rem", fontWeight: 700, color: "#c8a96e", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px" }}>
                        Gallery · {selectedProperty.images.length} photos
                      </p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                        {selectedProperty.images.map((img: string, i: number) => {
                          const url = getPropertyImageUrl(img);
                          return url ? (
                            <div key={i} style={{ borderRadius: 12, overflow: "hidden", height: 190, position: "relative", background: "#0d0f14", border: "1px solid #1a1d26" }}>
                              <img src={url} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                              <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(13,15,20,0.85)", color: "#c8a96e", fontSize: "0.65rem", padding: "3px 9px", borderRadius: 20, fontFamily: "'Syne', sans-serif", fontWeight: 700, border: "1px solid rgba(200,169,110,0.2)" }}>{i + 1}</div>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Details Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    {/* Left */}
                    <div>
                      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: "0.7rem", fontWeight: 700, color: "#c8a96e", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Info</p>
                      <div style={{ background: "#0d0f14", borderRadius: 12, border: "1px solid #1a1d26", overflow: "hidden" }}>
                        {[
                          ["Price", <span style={{ fontFamily: "'Syne', sans-serif", color: "#c8a96e", fontWeight: 700 }}>${(selectedProperty.price ?? 0).toLocaleString()}/mo</span>],
                          ["Status", (() => { const sc = statusColor(selectedProperty.status); return <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, textTransform: "capitalize" }}>{selectedProperty.status}</span>; })()],
                          ["Location", selectedProperty.location],
                          ["Listed", new Date(selectedProperty.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })],
                        ].map(([k, v], i, arr) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 18px", borderBottom: i < arr.length - 1 ? "1px solid #1a1d26" : "none" }}>
                            <span style={{ fontSize: "0.8125rem", color: "#475569", fontWeight: 500 }}>{k as string}</span>
                            <span style={{ fontSize: "0.8125rem", color: "#94a3b8", fontWeight: 500, textAlign: "right", maxWidth: "55%" }}>{v as React.ReactNode}</span>
                          </div>
                        ))}
                      </div>

                      {/* Owner */}
                      {selectedProperty.owner && (
                        <div style={{ marginTop: 16 }}>
                          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: "0.7rem", fontWeight: 700, color: "#c8a96e", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>Listed by</p>
                          <div style={{ background: "#0d0f14", borderRadius: 12, border: "1px solid #1a1d26", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#c8a96e", fontSize: "1rem", flexShrink: 0 }}>
                              {(selectedProperty.owner.name || "O").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "0.875rem", color: "#f1f5f9", fontFamily: "'Syne', sans-serif" }}>{selectedProperty.owner.name}</p>
                              <p style={{ margin: 0, fontSize: "0.75rem", color: "#475569" }}>{selectedProperty.owner.email}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: "0.7rem", fontWeight: 700, color: "#c8a96e", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>Description</p>
                        <div style={{ background: "#0d0f14", borderRadius: 12, border: "1px solid #1a1d26", padding: "16px 18px", lineHeight: 1.7, color: "#64748b", fontSize: "0.875rem" }}>
                          {selectedProperty.description || "No description provided."}
                        </div>
                      </div>

                      {isValidCoordinates(selectedProperty.coordinates) ? (
                        <div>
                          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: "0.7rem", fontWeight: 700, color: "#c8a96e", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>
                            Map
                          </p>
                          <PropertyLocationMap coordinates={selectedProperty.coordinates} height={220} />
                        </div>
                      ) : null}

                      {selectedProperty.availability?.length > 0 && (
                        <div>
                          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: "0.7rem", fontWeight: 700, color: "#c8a96e", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>Availability</p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {selectedProperty.availability.map((av: any, i: number) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: "#0d0f14", borderRadius: 10, border: "1px solid #1a1d26" }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c8a96e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                </div>
                                <div>
                                  <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#94a3b8" }}>
                                    {new Date(av.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — {new Date(av.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </div>
                                  <div style={{ fontSize: "0.75rem", color: "#475569" }}>
                                    {Math.ceil((new Date(av.endDate).getTime() - new Date(av.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #1a1d26", display: "flex", justifyContent: "flex-end" }}>
                    <Link href={`/property/${selectedProperty._id}`}
                      className="btn-gold"
                      style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px", borderRadius: 10, textDecoration: "none", fontSize: "0.9rem", fontWeight: 700, color: "#0d0f14", fontFamily: "'Syne', sans-serif" }}>
                      Open Full Page →
                    </Link>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <p style={{ color: "#475569" }}>Failed to load property. Please try again.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
