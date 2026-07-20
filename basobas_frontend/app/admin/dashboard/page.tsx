"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getCurrentUser, getImageUrl } from "@/lib/utils/auth-utils";
import { getProfile } from "@/lib/api/auth";
import { getUsers, getAllProperties } from "@/lib/api/admin";
import { getNotifications, markNotificationRead, markAllNotificationsRead, NotificationItem } from "@/lib/api/notification";
import Link from "next/link";

type DashboardUser = {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  username?: string;
  role?: string;
  profilePicture?: string;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifPage, setNotifPage] = useState(1);
  const [notifTotal, setNotifTotal] = useState(0);
  const [notifPages, setNotifPages] = useState(1);
  const notifLimit = 20;
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalProperties, setTotalProperties] = useState<number | null>(null);

  useEffect(() => {
    const hydrate = async () => {
      const cookieUser = getCurrentUser();
      if (!cookieUser || cookieUser.role !== "admin") {
        router.push("/login");
        return;
      }

      try {
        const profileRes = await getProfile();
        const payload = profileRes?.data || profileRes?.user || profileRes;
        setUser(payload || cookieUser);

        // load platform stats: total users and total properties
        try {
          const usersRes = await getUsers(1, 1);
          const usersTotal = usersRes?.pagination?.total ?? usersRes?.total ?? (Array.isArray(usersRes?.data) ? usersRes.data.length : undefined) ?? null;
          setTotalUsers(typeof usersTotal === 'number' ? usersTotal : null);
        } catch (err) {
          console.error('Failed to load total users', err);
          setTotalUsers(null);
        }

        try {
          const propsRes = await getAllProperties();
          const propsList = propsRes?.data ?? (Array.isArray(propsRes) ? propsRes : undefined);
          const propsTotal = Array.isArray(propsList) ? propsList.length : null;
          setTotalProperties(typeof propsTotal === 'number' ? propsTotal : null);
        } catch (err) {
          console.error('Failed to load total properties', err);
          setTotalProperties(null);
        }

        // load notifications
        try {
          const notRes = await getNotifications(1, notifLimit);
          setNotifications(notRes?.data || []);
          setNotifTotal(notRes?.total || 0);
          setNotifPages(notRes?.pages || 1);
          setNotifPage(notRes?.page || 1);
        } catch (err) {
          // ignore
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load user");
        setUser(cookieUser);
      } finally {
        setIsLoading(false);
      }
    };

    void hydrate();
  }, [router]);

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

  const handleNotifPage = async (page: number) => {
    try {
      const notRes = await getNotifications(page, notifLimit);
      setNotifications(notRes?.data || []);
      setNotifTotal(notRes?.total || 0);
      setNotifPages(notRes?.pages || 1);
      setNotifPage(notRes?.page || 1);
    } catch {}
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "3rem",
              height: "3rem",
              border: "3px solid #e2e8f0",
              borderTopColor: "#4f46e5",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 1rem",
            }}
          />
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Loading...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const name = user?.name || user?.username || "Admin";
  const email = user?.email || "";
  const role = user?.role || "admin";
  const avatar =
    getImageUrl(user?.profilePicture) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=fff`;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <header
        style={{
          backgroundColor: "#fff",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "4rem",
          }}
        >
          {/* Logo */}
          <Link
            href="/admin/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              textDecoration: "none",
            }}
          >
            <img
              src="/basobas.png"
              alt="BasoBas"
              style={{ height: "2.5rem", width: "auto" }}
            />
            <span
              style={{ fontSize: "1.25rem", fontWeight: "700", color: "#4f46e5" }}
            >
              Rentora Admin
            </span>
          </Link>

          {/* Notification & Profile */}
          <div style={{ position: "relative", display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Notification Bell - LEFT of profile */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowNotifications((s) => !s); }}
              style={{
                position: 'relative',
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '1px solid #e2e8f0',
                background: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
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

            {/* Profile Button */}
            <button
              onClick={() => setShowProfileMenu((p) => !p)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                padding: "0.375rem 0.75rem 0.375rem 0.375rem",
                borderRadius: "9999px",
                border: "1px solid #e2e8f0",
                backgroundColor: "#fff",
                cursor: "pointer",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c7d2fe"; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <img
                src={avatar}
                alt={name}
                crossOrigin="anonymous"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  objectFit: 'cover',
                }}
              />
              <span style={{ fontSize: "0.8125rem", fontWeight: "600", color: "#111827" }}>
                {name.split(" ")[0]}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.15s", transform: showProfileMenu ? "rotate(180deg)" : "none" }}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {showNotifications && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 340, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.12)', zIndex: 1000, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>Notifications</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {notifications.filter(n => !n.isRead).length > 0 && (
                      <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4f46e5', fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 6 }} onMouseEnter={e => e.currentTarget.style.background = '#f0f0ff'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
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
                    <div key={n._id} style={{ padding: '12px 16px', borderBottom: '1px solid #f8fafc', background: n.isRead ? '#fff' : '#fafbff', cursor: 'pointer', transition: 'background 0.15s' }} onClick={async () => { try { await handleMarkRead(n._id); } catch (err) { console.error(err); } }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = n.isRead ? '#fff' : '#fafbff'}>
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
            )}

            {showProfileMenu && (
              <>
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 40,
                  }}
                  onClick={() => setShowProfileMenu(false)}
                />
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 0.5rem)",
                    width: "14rem",
                    backgroundColor: "#fff",
                    borderRadius: "0.75rem",
                    border: "1px solid #e2e8f0",
                    boxShadow:
                      "0 10px 25px -5px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
                    zIndex: 50,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "0.875rem 1rem",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <p
                      style={{
                        fontWeight: "600",
                        fontSize: "0.875rem",
                        color: "#1e293b",
                      }}
                    >
                      {name}
                    </p>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "#94a3b8",
                        marginTop: "0.125rem",
                      }}
                    >
                      {email}
                    </p>
                    <div
                      style={{
                        marginTop: "0.5rem",
                        display: "inline-block",
                        padding: "0.25rem 0.5rem",
                        backgroundColor: "#4f46e5",
                        color: "#fff",
                        fontSize: "0.75rem",
                        fontWeight: "500",
                        borderRadius: "0.25rem",
                        textTransform: "capitalize",
                      }}
                    >
                      {role}
                    </div>
                  </div>
                  <div style={{ padding: "0.375rem" }}>
                    <Link
                      href="/user/profile"
                      onClick={() => setShowProfileMenu(false)}
                      style={{
                        display: "block",
                        padding: "0.5rem 0.75rem",
                        fontSize: "0.8125rem",
                        color: "#334155",
                        textDecoration: "none",
                        borderRadius: "0.375rem",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f1f5f9")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8, verticalAlign: 'middle' }} xmlns="http://www.w3.org/2000/svg"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4 0-8 2-8 4v2h16v-2c0-2-4-4-8-4z" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      My Profile
                    </Link>
                    <Link
                      href="/admin/users"
                      onClick={() => setShowProfileMenu(false)}
                      style={{
                        display: "block",
                        padding: "0.5rem 0.75rem",
                        fontSize: "0.8125rem",
                        color: "#334155",
                        textDecoration: "none",
                        borderRadius: "0.375rem",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f1f5f9")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8, verticalAlign: 'middle' }} xmlns="http://www.w3.org/2000/svg"><path d="M17 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="7" r="4" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Manage Users
                    </Link>
                    <button
                      onClick={onLogout}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "0.5rem 0.75rem",
                        fontSize: "0.8125rem",
                        color: "#ef4444",
                        backgroundColor: "transparent",
                        border: "none",
                        cursor: "pointer",
                        borderRadius: "0.375rem",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#fef2f2")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8, verticalAlign: 'middle' }} xmlns="http://www.w3.org/2000/svg"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 17l5-5-5-5" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12H9" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Navigation Bar ── */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "1rem 1.5rem 0",
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "1rem",
            border: "1px solid #e2e8f0",
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          <nav style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
            <Link
              href="/admin/dashboard"
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                backgroundColor: "#4f46e5",
                color: "#fff",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: "600",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#4338ca")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#4f46e5")
              }
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }} xmlns="http://www.w3.org/2000/svg"><path d="M3 13h4v-6H3v6zM9 21h4v-14H9v14zM15 7h4v10h-4V7z" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Dashboard
            </Link>
            <Link
              href="/admin/users"
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                color: "#64748b",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: "600",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#4f46e5")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }} xmlns="http://www.w3.org/2000/svg"><path d="M17 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="7" r="4" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Users
            </Link>
            <Link
              href="/admin/properties"
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                color: "#64748b",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: "600",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#4f46e5")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }} xmlns="http://www.w3.org/2000/svg"><path d="M3 11l9-7 9 7v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8z" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Properties
            </Link>
          </nav>
        </div>
      </div>

      {/* ── Page Content ── */}
      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "1.5rem 1.5rem 4rem",
        }}
      >
        {error && (
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "0.75rem 1rem",
              backgroundColor: "#fefce8",
              border: "1px solid #fde68a",
              borderRadius: "0.75rem",
              color: "#854d0e",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* ── Welcome Banner (clean admin) ── */}
        <div
          style={{
            padding: "1.5rem",
            borderRadius: "0.75rem",
            backgroundColor: "#fff",
            color: "#111827",
            marginBottom: "2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            boxShadow: "0 6px 18px rgba(16,24,40,0.04)",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
              Welcome back, {name.split(" ")[0]}
            </h1>
            <p style={{ color: '#6b7280', marginTop: 6, fontSize: 13 }}>Overview of platform activity</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ padding: '0.6rem 0.9rem', borderRadius: 10, border: '1px solid #eef2ff', background: '#fbfbff', display: 'flex', gap: 10, alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 20c4.418 0 8-1.79 8-4v-4" stroke="#4f46e5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 12c0 2.21 3.582 4 8 4s8-1.79 8-4" stroke="#4f46e5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div><div style={{ fontWeight: 700 }}>{totalUsers !== null ? totalUsers.toLocaleString() : '—'}</div><div style={{ fontSize: 12, color: '#6b7280' }}>Total Users</div></div>
            </div>
            <div style={{ padding: '0.6rem 0.9rem', borderRadius: 10, border: '1px solid #eef2ff', background: '#fbfbff', display: 'flex', gap: 10, alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 11h18v10H3zM7 7l5-4 5 4" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div><div style={{ fontWeight: 700 }}>{totalProperties !== null ? totalProperties.toLocaleString() : '—'}</div><div style={{ fontSize: 12, color: '#6b7280' }}>Properties</div></div>
            </div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <section style={{ marginBottom: "3rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "700",
                  color: "#1e293b",
                }}
              >
                Quick Actions
              </h2>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "#64748b",
                  marginTop: "0.125rem",
                }}
              >
                Manage your platform efficiently
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.25rem",
            }}
          >
            <Link
              href="/admin/users"
              style={{
                backgroundColor: "#fff",
                borderRadius: "1rem",
                padding: "2rem",
                border: "1px solid #e2e8f0",
                textDecoration: "none",
                transition: "all 0.2s ease",
                display: "block",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 24px -4px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div
                  style={{
                    width: "3rem",
                    height: "3rem",
                    borderRadius: "0.75rem",
                    backgroundColor: "#4f46e5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="7" r="4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: "600",
                      color: "#1e293b",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Manage Users
                  </h3>
                  <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
                    View, edit, and manage user accounts
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/properties"
              style={{
                backgroundColor: "#fff",
                borderRadius: "1rem",
                padding: "2rem",
                border: "1px solid #e2e8f0",
                textDecoration: "none",
                transition: "all 0.2s ease",
                display: "block",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 24px -4px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div
                  style={{
                    width: "3rem",
                    height: "3rem",
                    borderRadius: "0.75rem",
                    backgroundColor: "#10b981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 11l9-7 9 7v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8z" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: "600",
                      color: "#1e293b",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Manage Properties
                  </h3>
                  <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
                    Oversee property listings and approvals
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/bookings"
              style={{
                backgroundColor: "#fff",
                borderRadius: "1rem",
                padding: "2rem",
                border: "1px solid #e2e8f0",
                textDecoration: "none",
                transition: "all 0.2s ease",
                display: "block",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 24px -4px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div
                  style={{
                    width: "3rem",
                    height: "3rem",
                    borderRadius: "0.75rem",
                    backgroundColor: "#f59e0b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 13h4v-6H3v6zM9 21h4v-14H9v14zM15 7h4v10h-4V7z" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: "600",
                      color: "#1e293b",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Monitor Bookings
                  </h3>
                  <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
                    Read-only view of all booking requests
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* ── Recent Activity ── */}
        <section style={{ marginBottom: "3rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "700",
                  color: "#1e293b",
                }}
              >
                Recent Activity
              </h2>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "#64748b",
                  marginTop: "0.125rem",
                }}
              >
                Latest platform updates
              </p>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "1rem",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem 0",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <div
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "9999px",
                    backgroundColor: "#4f46e5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1rem",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4 0-8 2-8 4v2h16v-2c0-2-4-4-8-4z" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "0.875rem", color: "#1e293b", fontWeight: "500" }}>
                    New user registered: John Doe
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "#64748b" }}>2 minutes ago</p>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem 0",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <div
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "9999px",
                    backgroundColor: "#10b981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1rem",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 11l9-7 9 7v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8z" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "0.875rem", color: "#1e293b", fontWeight: "500" }}>
                    New property listed: Downtown Apartment
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "#64748b" }}>15 minutes ago</p>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem 0",
                }}
              >
                <div
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "9999px",
                    backgroundColor: "#f59e0b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1rem",
                  }}
                >
                  ⚙️
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "0.875rem", color: "#1e293b", fontWeight: "500" }}>
                    System maintenance completed
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "#64748b" }}>1 hour ago</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}