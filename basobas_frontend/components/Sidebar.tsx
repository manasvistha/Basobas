"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/properties", label: "Properties", icon: "🏘️" },
  { href: "/property/create", label: "List Property", icon: "➕" },
  { href: "/conversations", label: "Messages", icon: "💬" },
  { href: "/user/profile", label: "My Account", icon: "👤" },
];

// My Listings sidebar sections
const myListingsSections = [
  { href: "/my-listings", label: "All Listings", icon: "📋" },
  { href: "/my-listings/approved", label: "Approved", icon: "✅" },
  { href: "/my-listings/pending", label: "Pending", icon: "⏳" },
  { href: "/my-listings/booked", label: "Booked", icon: "📅" },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <nav
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        padding: "0.75rem 0.375rem",
        backgroundColor: "#ffffff",
        borderRadius: "0.75rem",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        minWidth: 180,
      }}
    >
      {/* Main nav */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.625rem 1rem",
                borderRadius: "0.5rem",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: isActive ? "600" : "500",
                color: isActive ? "#ffffff" : "#475569",
                backgroundColor: isActive ? "#4f46e5" : "transparent",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "#f1f5f9";
                  e.currentTarget.style.color = "#4f46e5";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#475569";
                }
              }}
            >
              <span style={{ fontSize: "1rem" }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
      {/* Divider */}
      <div style={{ height: 1, background: "#e2e8f0", margin: "0.5rem 0" }} />
      {/* My Listings sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, padding: "0.25rem 1rem 0.25rem 1rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          My Listings
        </div>
        {myListingsSections.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.625rem 1rem",
                borderRadius: "0.5rem",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: isActive ? "600" : "500",
                color: isActive ? "#ffffff" : "#475569",
                backgroundColor: isActive ? "#4f46e5" : "transparent",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "#f1f5f9";
                  e.currentTarget.style.color = "#4f46e5";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#475569";
                }
              }}
            >
              <span style={{ fontSize: "1rem" }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Sidebar;