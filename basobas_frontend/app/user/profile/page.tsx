"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import BackPillLink from "@/components/ui/BackPillLink";
import axios from "@/lib/api/axios";
import { API } from "@/lib/api/endpoints";
import { getProfile, updateProfile, exportMyData, importMyData, mfaSetup, mfaEnable, mfaDisable } from "@/lib/api/auth";
import { getCurrentUser, getImageUrl } from "@/lib/utils/auth-utils";
import { Button } from "@/components/ui";
import PasswordStrengthMeter from "@/components/ui/PasswordStrengthMeter";

type ProfileUser = {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  username?: string;
  role?: string;
  profilePicture?: string;
  mfaEnabled?: boolean;
};

export default function UserProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState<{ qrDataUrl: string; secret: string } | null>(null);
  const [mfaOtp, setMfaOtp] = useState("");
  const [mfaBusy, setMfaBusy] = useState(false);
  const [mfaMsg, setMfaMsg] = useState("");
  const [mfaError, setMfaError] = useState("");

  const fallbackAvatar = useMemo(() => {
    const displayName = user?.name || "User";
    const initials = displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=4f46e5&color=fff&size=128`;
  }, [user?.name]);

  useEffect(() => {
    const init = async () => {
      // seed from cookie immediately so the UI is not blank
      const cookieUser = getCurrentUser();
      if (cookieUser?.id) {
        setUserId(cookieUser.id);
        setName(cookieUser.name || "");
        setEmail(cookieUser.email || "");
        setUsername(cookieUser.username || "");
      }

      try {
        const profile = await getProfile();
        const user = profile?.data || profile?.user || profile;
        setUser(user);
        if (user?.id || user?._id) {
          const id = user.id || user._id;
          setUserId(id);
          setName(user.name || "");
          setEmail(user.email || "");
          setUsername(user.username || "");
          setCurrentPhoto(user.profilePicture || null);
          setMfaEnabled(!!user.mfaEnabled);
          document.cookie = `user_data=${encodeURIComponent(
            JSON.stringify({
              id,
              name: user.name,
              email: user.email,
              username: user.username,
              role: user.role,
              profilePicture: user.profilePicture,
            })
          )}; path=/;`;
        }
      } catch (err: any) {
        console.error("Failed to load profile", err);
        setError(
          err?.response?.data?.message || err?.message || "Failed to load profile"
        );
      }
    };

    void init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      if (name) formData.append("name", name);
      if (email) formData.append("email", email);
      if (username) formData.append("username", username);
      if (password) formData.append("password", password);
      if (photo) formData.append("photo", photo);

      const response = await updateProfile(userId, formData);

      const updatedUser = response?.data || response?.user;
      if (updatedUser) {
        setCurrentPhoto(updatedUser.profilePicture || currentPhoto);
        document.cookie = `user_data=${encodeURIComponent(
          JSON.stringify(updatedUser)
        )}; path=/;`;
      }

      setMessage("Profile updated successfully");
      setPassword("");
      setPhoto(null);
      setPhotoPreview(null);
    } catch (err: any) {
      setError(err?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    setError("");
    setMessage("");
    try {
      const blob = await exportMyData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `basobas-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage("Your data has been downloaded.");
    } catch (err: any) {
      setError(err?.message || "Failed to export your data");
    } finally {
      setExporting(false);
    }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    setImporting(true);
    setError("");
    setMessage("");
    try {
      const result = await importMyData(file);
      const s = result?.imported;
      setMessage(
        s
          ? `Import complete — profile ${s.profileUpdated ? "updated" : "unchanged"}, ${s.propertiesCreated} listing(s) added${s.propertiesSkipped ? `, ${s.propertiesSkipped} skipped` : ""}.`
          : "Import complete."
      );
      // Refresh the profile view with any imported changes.
      try {
        const profile = await getProfile();
        const u = profile?.data || profile?.user || profile;
        if (u) {
          setUser(u);
          setName(u.name || "");
          setUsername(u.username || "");
          setCurrentPhoto(u.profilePicture || null);
        }
      } catch {
        /* non-fatal: the import already succeeded */
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to import your data");
    } finally {
      setImporting(false);
    }
  };

  const handleStartMfaSetup = async () => {
    setMfaBusy(true);
    setMfaError("");
    setMfaMsg("");
    try {
      const data = await mfaSetup();
      setMfaSetupData({ qrDataUrl: data.qrDataUrl, secret: data.secret });
      setMfaOtp("");
    } catch (err: any) {
      setMfaError(err?.response?.data?.message || err?.message || "Failed to start setup");
    } finally {
      setMfaBusy(false);
    }
  };

  const handleConfirmMfa = async () => {
    setMfaBusy(true);
    setMfaError("");
    setMfaMsg("");
    try {
      await mfaEnable(mfaOtp.trim());
      setMfaEnabled(true);
      setMfaSetupData(null);
      setMfaOtp("");
      setMfaMsg("Two-factor authentication enabled.");
    } catch (err: any) {
      setMfaError(err?.response?.data?.message || err?.message || "Invalid authentication code");
    } finally {
      setMfaBusy(false);
    }
  };

  const handleDisableMfa = async () => {
    setMfaBusy(true);
    setMfaError("");
    setMfaMsg("");
    try {
      await mfaDisable(mfaOtp.trim());
      setMfaEnabled(false);
      setMfaOtp("");
      setMfaMsg("Two-factor authentication disabled.");
    } catch (err: any) {
      setMfaError(err?.response?.data?.message || err?.message || "Invalid authentication code");
    } finally {
      setMfaBusy(false);
    }
  };

  const displayName = user?.name || user?.username || "User";
  const displayEmail = user?.email || "";
  const displayRole = user?.role || "user";
  const avatar = getImageUrl(user?.profilePicture) || fallbackAvatar;

  return (
    <div style={{ minHeight: "100vh", padding: "80px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, background: "linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(239, 250, 247, 0.65))", border: "1px solid rgba(170, 205, 196, 0.5)", borderRadius: 24, boxShadow: "0 22px 55px -30px rgba(8, 53, 49, 0.35)", padding: "18px 20px" }}>
          <div>
            <BackPillLink href="/dashboard" label="Back to dashboard" />
            <h1 style={{ fontSize: 30, color: "#0f3d3d", margin: "8px 0" }}>My Profile</h1>
          </div>

          <div />
        </div>

        <main style={{ padding: "0 0 40px 0" }}>
        {error && (
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              backgroundColor: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: "0.5rem",
              color: "#dc2626",
              fontSize: "0.875rem",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Profile Display */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.875rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
           View and manage your account information
          </h2>
          {/* <p style={{ color: "#64748b" }}>View and manage your account information</p> */}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "0.5rem",
              padding: "1.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <img
                src={avatar}
                alt={displayName}
                crossOrigin="anonymous"
                onError={(e) => {
                  // Fallback to avatar if profile picture fails to load
                  const img = e.target as HTMLImageElement;
                  img.src = fallbackAvatar;
                }}
                style={{
                  width: "6rem",
                  height: "6rem",
                  borderRadius: "9999px",
                  border: "4px solid #4f46e5",
                }}
              />
              <div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                  {displayName}
                </h3>
                <p style={{ color: "#64748b" }}>{displayEmail}</p>
                <div
                  style={{
                    marginTop: "0.75rem",
                    display: "inline-block",
                    padding: "0.25rem 0.75rem",
                    backgroundColor: "#eef2ff",
                    color: "#4f46e5",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    borderRadius: "0.25rem",
                    textTransform: "capitalize",
                  }}
                >
                  {displayRole}
                </div>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "0.5rem",
              padding: "1rem",
            }}
          >
            <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "1rem" }}>
              Account Info
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.875rem" }}>
              <div>
                <p style={{ color: "#64748b" }}>Email</p>
                <p style={{ fontWeight: "500", marginTop: "0.25rem" }}>
                  {displayEmail}
                </p>
              </div>
              <div>
                <p style={{ color: "#64748b" }}>Username</p>
                <p style={{ fontWeight: "500", marginTop: "0.25rem" }}>
                  {user?.username || "—"}
                </p>
              </div>
              <div>
                <p style={{ color: "#94a3b8" }}>Member Since</p>
                <p style={{ fontWeight: "500", marginTop: "0.25rem" }}>
                  {user?.id ? new Date().toLocaleDateString() : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Section */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e6e9ef",
            borderRadius: "0.75rem",
            padding: "1.5rem",
            boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
          }}
        >
          <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "1rem" }}>
            Edit Profile
          </h3>
          <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
            Update your account details and profile photo.
          </p>

          {message && (
            <div
              style={{
                marginBottom: "1rem",
                padding: "0.75rem",
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "0.5rem",
                color: "#166534",
                fontSize: "0.875rem",
              }}
            >
              ✅ {message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          {/* Profile Photo Preview */}
          <div style={{ display: "grid", gap: 8, textAlign: "center" }}>
            <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  overflow: "hidden",
                  margin: "0 auto",
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "3px solid #6366f1",
                  boxShadow: "0 6px 18px rgba(15,23,42,0.08)",
                }}
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : currentPhoto && getImageUrl(currentPhoto) ? (
                <img
                  src={getImageUrl(currentPhoto)!}
                  alt="Current"
                  crossOrigin="anonymous"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    const imageUrl = getImageUrl(currentPhoto);
                    console.error("Failed to load image:", currentPhoto, "Resolved URL:", imageUrl);
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span style={{ color: "#6b7280", fontSize: 12 }}>No Photo</span>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ color: "#0f172a", fontWeight: "600" }}>Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              style={{
                padding: 10,
                borderRadius: 10,
                border: "1px solid #e6e9ef",
                backgroundColor: "#f8fafc",
                color: "#0f172a",
                fontSize: "0.875rem"
              }}
            />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ color: "#0f172a", fontWeight: "600" }}>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              type="email"
              style={{
                padding: 10,
                borderRadius: 10,
                border: "1px solid #e6e9ef",
                backgroundColor: "#f8fafc",
                color: "#0f172a",
                fontSize: "0.875rem"
              }}
            />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ color: "#0f172a", fontWeight: "600" }}>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter a username"
              style={{
                padding: 10,
                borderRadius: 10,
                border: "1px solid #e6e9ef",
                backgroundColor: "#f8fafc",
                color: "#0f172a",
                fontSize: "0.875rem"
              }}
            />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ color: "#0f172a", fontWeight: "600" }}>New Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              type="password"
              style={{
                padding: 10,
                borderRadius: 10,
                border: "1px solid #e6e9ef",
                backgroundColor: "#f8fafc",
                color: "#0f172a",
                fontSize: "0.875rem"
              }}
            />
            <PasswordStrengthMeter password={password} />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ color: "#0f172a", fontWeight: "600" }}>Profile Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setPhoto(file);
                  const reader = new FileReader();
                  reader.onloadend = () => setPhotoPreview(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
              style={{
                padding: 8,
                borderRadius: 10,
                border: "1px solid #e6e9ef",
                backgroundColor: "#ffffff",
                color: "#0f172a",
                fontSize: "0.875rem"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            style={{
              marginTop: 8,
              padding: "10px 14px",
              backgroundColor: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 15,
              fontWeight: "600",
              transition: "background-color 0.15s",
              width: "100%",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#4f46e5")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#6366f1")
            }
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </form>
        </div>

        {/* Privacy & Data */}
        <div
          style={{
            marginTop: "1.5rem",
            backgroundColor: "#ffffff",
            border: "1px solid #e6e9ef",
            borderRadius: "0.75rem",
            padding: "1.5rem",
            boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
          }}
        >
          <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.5rem" }}>
            Privacy &amp; Data
          </h3>
          <p style={{ color: "#64748b", marginBottom: "1rem" }}>
            Download a copy of your BasoBas data &mdash; your profile, properties, bookings,
            favorites, notifications, and conversations &mdash; as a JSON file. You can also
            re-import a previously downloaded file to restore your profile and listings.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Button variant="secondary" onClick={handleExportData} disabled={exporting}>
              {exporting ? "Preparing…" : "Download my data"}
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportData}
              style={{ display: "none" }}
            />
            <Button
              variant="secondary"
              onClick={() => importInputRef.current?.click()}
              disabled={importing}
            >
              {importing ? "Importing…" : "Import my data"}
            </Button>
          </div>
        </div>

        {/* Two-factor authentication */}
        <div
          style={{
            marginTop: "1.5rem",
            backgroundColor: "#ffffff",
            border: "1px solid #e6e9ef",
            borderRadius: "0.75rem",
            padding: "1.5rem",
            boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "600" }}>Two-factor authentication</h3>
              <p style={{ color: "#64748b", marginTop: 4, maxWidth: "48ch" }}>
                Add a second step at login using an authenticator app such as Google Authenticator or Authy.
              </p>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "5px 10px",
                borderRadius: 999,
                background: mfaEnabled ? "#e7f6ec" : "#f1f5f4",
                color: mfaEnabled ? "#15803d" : "#6b7b80",
                whiteSpace: "nowrap",
              }}
            >
              {mfaEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>

          {mfaMsg && <div style={{ marginTop: 12, color: "#166534", fontSize: 14 }}>✅ {mfaMsg}</div>}
          {mfaError && <div style={{ marginTop: 12, color: "#dc2626", fontSize: 14 }}>⚠️ {mfaError}</div>}

          {mfaEnabled ? (
            <div style={{ marginTop: 16, display: "grid", gap: 10, maxWidth: 320 }}>
              <p style={{ fontSize: 14, color: "#475569" }}>Enter a current code to turn it off.</p>
              <input
                value={mfaOtp}
                onChange={(e) => setMfaOtp(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                inputMode="numeric"
                placeholder="123456"
                style={{ padding: 10, borderRadius: 10, border: "1px solid #e6e9ef", backgroundColor: "#f8fafc", color: "#0f172a", fontSize: "0.875rem", maxWidth: 200 }}
              />
              <div>
                <Button variant="danger" onClick={handleDisableMfa} disabled={mfaBusy || mfaOtp.length < 6}>
                  {mfaBusy ? "Disabling…" : "Disable 2FA"}
                </Button>
              </div>
            </div>
          ) : mfaSetupData ? (
            <div style={{ marginTop: 16, display: "grid", gap: 12, maxWidth: 380 }}>
              <p style={{ fontSize: 14, color: "#475569" }}>1. Scan this QR code in your authenticator app:</p>
              <img
                src={mfaSetupData.qrDataUrl}
                alt="Two-factor authentication QR code"
                style={{ width: 180, height: 180, border: "1px solid #e5eae8", borderRadius: 12, background: "#fff" }}
              />
              <p style={{ fontSize: 13, color: "#6b7b80" }}>
                Or enter this key manually:{" "}
                <code style={{ background: "#f1f5f4", padding: "2px 6px", borderRadius: 6, wordBreak: "break-all" }}>{mfaSetupData.secret}</code>
              </p>
              <p style={{ fontSize: 14, color: "#475569" }}>2. Enter the 6-digit code to confirm:</p>
              <input
                value={mfaOtp}
                onChange={(e) => setMfaOtp(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                inputMode="numeric"
                placeholder="123456"
                style={{ padding: 10, borderRadius: 10, border: "1px solid #e6e9ef", backgroundColor: "#f8fafc", color: "#0f172a", fontSize: "0.875rem", maxWidth: 200 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="primary" onClick={handleConfirmMfa} disabled={mfaBusy || mfaOtp.length < 6}>
                  {mfaBusy ? "Verifying…" : "Verify & enable"}
                </Button>
                <Button variant="secondary" onClick={() => { setMfaSetupData(null); setMfaOtp(""); setMfaError(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 16 }}>
              <Button variant="primary" onClick={handleStartMfaSetup} disabled={mfaBusy}>
                {mfaBusy ? "Preparing…" : "Enable 2FA"}
              </Button>
            </div>
          )}
        </div>
      </main>
      </div>
    </div>
  );
}
