"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BackPillLink from "@/components/ui/BackPillLink";
import { useRouter } from "next/navigation";
import { getAllProperties, updatePropertyStatus, deleteProperty, approveProperty, rejectProperty } from "@/lib/api/admin";
import { getProperty } from "@/lib/api/property";
import { handleLogout } from "@/lib/actions/auth-actions";
import { getCurrentUser, getPropertyImageUrl } from "@/lib/utils/auth-utils";

type PropertyRow = {
  _id: string;
  title: string;
  location: string;
  price: number;
  status: string;
  images: string[];
  owner: {
    name: string;
    email: string;
  };
  createdAt: string;
};

export default function AdminPropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [loadingProperty, setLoadingProperty] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modalImageError, setModalImageError] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }
    setCurrentUser(user);

    fetchProperties();
  }, [router]);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllProperties();
      const data = res?.data || res || [];
      setProperties(data);
    } catch (err: any) {
      console.error("Failed to load properties", err);
      setError(err?.message || "Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (propertyId: string, newStatus: string) => {
    setUpdatingId(propertyId);
    try {
      if (newStatus === 'approved') {
        await approveProperty(propertyId);
      } else if (newStatus === 'rejected') {
        await rejectProperty(propertyId);
      } else {
        await updatePropertyStatus(propertyId, newStatus);
      }
      setProperties(prev =>
        prev.map(prop =>
          prop._id === propertyId ? { ...prop, status: newStatus } : prop
        )
      );
    } catch (err: any) {
      setError(err?.message || "Failed to update property status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (propertyId: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    setDeletingId(propertyId);
    try {
      await deleteProperty(propertyId);
      // Remove from local state
      setProperties(prev => prev.filter(prop => prop._id !== propertyId));
    } catch (err: any) {
      console.error("Failed to delete property", err);
      setError(err?.message || "Failed to delete property");
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewProperty = async (propertyId: string) => {
    console.log("handleViewProperty called with:", propertyId);
    setLoadingProperty(true);
    setShowPropertyModal(true);
    setCurrentImageIndex(0);
    setModalImageError(false);
    try {
      console.log("Fetching property data...");
      const propertyData = await getProperty(propertyId);
      console.log("Property data received:", propertyData);
      setSelectedProperty(propertyData);
      console.log("Modal should now be visible with data");
    } catch (err: any) {
      console.error("Failed to load property details", err);
      setError(err?.message || "Failed to load property details");
      setShowPropertyModal(false);
    } finally {
      setLoadingProperty(false);
    }
  };

  const handleLogoutClick = async () => {
    await handleLogout();
    router.push('/login');
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex: number) =>
      prevIndex > 0 ? prevIndex - 1 : selectedProperty?.images?.length - 1 || 0
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex: number) =>
      prevIndex < (selectedProperty?.images?.length || 0) - 1 ? prevIndex + 1 : 0
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f7f7", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <div>Loading properties...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "80px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, background: "linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(239, 250, 247, 0.65))", border: "1px solid rgba(170, 205, 196, 0.5)", borderRadius: 24, boxShadow: "0 22px 55px -30px rgba(8, 53, 49, 0.35)", padding: "18px 20px" }}>
          <div>
            <BackPillLink href="/admin/dashboard" label="Back to dashboard" />
            <h1 style={{ fontSize: 30, color: "#0f3d3d", margin: "8px 0" }}>
              Manage Properties
            </h1>
          </div>

          {/* Profile Menu */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{
                padding: "8px 16px",
                background: "white",
                border: "1px solid #ddd",
                borderRadius: 8,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <span>{currentUser?.name || "Admin"}</span>
              <span>▼</span>
            </button>

            {showProfileMenu && (
              <div style={{
                position: "absolute",
                top: "100%",
                right: 0,
                background: "white",
                border: "1px solid #ddd",
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                zIndex: 1000,
                minWidth: 150
              }}>
                <button
                  onClick={handleLogoutClick}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "none",
                    background: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "#dc2626"
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            padding: 16,
            borderRadius: 8,
            marginBottom: 24
          }}>
            {error}
            <button
              onClick={() => setError(null)}
              style={{ marginLeft: 16, color: "#dc2626", textDecoration: "underline" }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Properties Table */}
        <div style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
          <div style={{ padding: 24, borderBottom: "1px solid #eee" }}>
            <h2 style={{ margin: 0, color: "#0f3d3d" }}>All Properties ({properties.length})</h2>
          </div>

          {properties.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#666" }}>
              No properties found.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f9fa" }}>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#0f3d3d" }}>Images</th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#0f3d3d" }}>Title</th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#0f3d3d" }}>Location</th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#0f3d3d" }}>Price</th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#0f3d3d" }}>Owner</th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#0f3d3d" }}>Status</th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#0f3d3d" }}>Created</th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#0f3d3d" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((property) => {
                    const firstImage = property.images?.[0];
                    const firstImageUrl = firstImage ? getPropertyImageUrl(firstImage) : null;
                    const extraImagesCount = Math.max((property.images?.length || 0) - 1, 0);

                    return (
                    <tr 
                      key={property._id} 
                      style={{ borderBottom: "1px solid #eee", cursor: "pointer" }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("Row clicked for:", property._id);
                        handleViewProperty(property._id);
                      }}
                    >
                      <td style={{ padding: "16px" }}>
                        <div style={{ position: "relative", width: "44px", height: "44px" }}>
                          {firstImageUrl ? (
                            <img
                              src={firstImageUrl}
                              alt={`${property.title} cover`}
                              style={{
                                width: "44px",
                                height: "44px",
                                objectFit: "contain",
                                borderRadius: "4px",
                                border: "1px solid #ddd"
                              }}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div style={{
                              width: "44px",
                              height: "44px",
                              background: "#f3f4f6",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "16px",
                              color: "#9ca3af",
                              border: "1px solid #ddd"
                            }}>
                              🏠
                            </div>
                          )}
                          {extraImagesCount > 0 && (
                            <div style={{
                              position: "absolute",
                              right: "-8px",
                              bottom: "-8px",
                              minWidth: "20px",
                              height: "20px",
                              background: "#111827",
                              borderRadius: "999px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              color: "#fff",
                              fontWeight: 600,
                              padding: "0 6px",
                              border: "2px solid #fff"
                            }}>
                              +{extraImagesCount}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div 
                          style={{ fontWeight: 500 }}
                        >
                          {property.title}
                        </div>
                      </td>
                      <td style={{ padding: "16px" }}>{property.location}</td>
                      <td style={{ padding: "16px" }}>Rs {Number(property.price || 0).toLocaleString()}</td>
                      <td style={{ padding: "16px" }}>
                        <div>{property.owner?.name}</div>
                        <div style={{ fontSize: 12, color: "#666" }}>{property.owner?.email}</div>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <select
                          value={property.status}
                          onChange={(e) => handleStatusUpdate(property._id, e.target.value)}
                          disabled={updatingId === property._id}
                          style={{
                            padding: "4px 8px",
                            border: "1px solid #ddd",
                            borderRadius: 4,
                            background: updatingId === property._id ? "#f5f5f5" : "white"
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="available">Available</option>
                          <option value="assigned">Assigned</option>
                          <option value="booked">Booked</option>
                        </select>
                      </td>
                      <td style={{ padding: "16px" }}>
                        {new Date(property.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          {property.status === 'pending' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleStatusUpdate(property._id, 'approved');
                                }}
                                disabled={updatingId === property._id}
                                style={{
                                  padding: "6px 12px",
                                  background: "#059669",
                                  color: "white",
                                  border: "none",
                                  borderRadius: 4,
                                  cursor: updatingId === property._id ? "not-allowed" : "pointer",
                                  opacity: updatingId === property._id ? 0.6 : 1
                                }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleStatusUpdate(property._id, 'rejected');
                                }}
                                disabled={updatingId === property._id}
                                style={{
                                  padding: "6px 12px",
                                  background: "#dc2626",
                                  color: "white",
                                  border: "none",
                                  borderRadius: 4,
                                  cursor: updatingId === property._id ? "not-allowed" : "pointer",
                                  opacity: updatingId === property._id ? 0.6 : 1
                                }}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDelete(property._id);
                            }}
                            disabled={deletingId === property._id}
                            style={{
                              padding: "6px 12px",
                              background: "#dc2626",
                              color: "white",
                              border: "none",
                              borderRadius: 4,
                              cursor: deletingId === property._id ? "not-allowed" : "pointer",
                              opacity: deletingId === property._id ? 0.6 : 1
                            }}
                          >
                            {deletingId === property._id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Property Details Modal */}
      {showPropertyModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
            backdropFilter: "blur(4px)"
          }}
          onClick={() => setShowPropertyModal(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              maxWidth: "900px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "hidden",
              position: "relative",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "24px 32px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white"
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "600" }}>
                  {loadingProperty ? "Loading..." : selectedProperty?.title || "Property Details"}
                </h2>
                {!loadingProperty && selectedProperty && (
                  <p style={{ margin: "4px 0 0 0", opacity: 0.9, fontSize: "0.9rem" }}>
                    📍 {selectedProperty.location}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowPropertyModal(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "20px",
                  fontWeight: "bold",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)"}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ 
              padding: "32px", 
              overflow: "auto",
              flex: 1
            }}>
              {loadingProperty ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "60px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "16px"
                }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      border: "4px solid #e5e7eb",
                      borderTopColor: "#667eea",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <p style={{ color: "#6b7280", margin: 0 }}>Loading property details...</p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : selectedProperty ? (
                <div>
                  {/* Property Images Gallery */}
                  {selectedProperty.images && selectedProperty.images.length > 0 && (
                    <div style={{ position: "relative", textAlign: "center" }}>
                      <button
                        onClick={handlePrevImage}
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "10px",
                          transform: "translateY(-50%)",
                          background: "rgba(0, 0, 0, 0.5)",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "40px",
                          height: "40px",
                          cursor: "pointer",
                          zIndex: 10
                        }}
                      >
                        ‹
                      </button>
                      <img
                        src={getPropertyImageUrl(selectedProperty.images[currentImageIndex]) || undefined}
                        alt={`Property image ${currentImageIndex + 1}`}
                        style={{
                          width: "100%",
                          maxWidth: "400px",
                          height: "auto",
                          maxHeight: "300px",
                          objectFit: "contain",
                          display: modalImageError ? 'none' : 'block',
                          margin: "0 auto"
                        }}
                        onError={() => setModalImageError(true)}
                      />
                      {modalImageError && (
                        <div style={{
                          width: "100%",
                          maxWidth: "400px",
                          height: 200,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#f3f4f6",
                          borderRadius: "12px",
                          fontSize: "3rem",
                          margin: "0 auto"
                        }}>🏠</div>
                      )}
                      <button
                        onClick={handleNextImage}
                        style={{
                          position: "absolute",
                          top: "50%",
                          right: "10px",
                          transform: "translateY(-50%)",
                          background: "rgba(0, 0, 0, 0.5)",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "40px",
                          height: "40px",
                          cursor: "pointer",
                          zIndex: 10
                        }}
                      >
                        ›
                      </button>
                    </div>
                  )}

                  {/* Property Details Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                    {/* Left Column - Basic Info */}
                    <div>
                      <h3 style={{ 
                        marginBottom: "20px", 
                        color: "#1f2937", 
                        fontSize: "1.25rem",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}>
                        📋 Property Information
                      </h3>
                      <div style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "16px",
                        background: "#f8fafc",
                        padding: "20px",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: "500", color: "#6b7280" }}>Title:</span>
                          <span style={{ fontWeight: "600", color: "#1f2937" }}>{selectedProperty.title}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: "500", color: "#6b7280" }}>Location:</span>
                          <span style={{ fontWeight: "600", color: "#1f2937" }}>📍 {selectedProperty.location}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: "500", color: "#6b7280" }}>Price:</span>
                          <span style={{ fontWeight: "600", color: "#059669", fontSize: "1.1rem" }}>Rs {Number(selectedProperty.price || 0).toLocaleString()}/month</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: "500", color: "#6b7280" }}>Status:</span>
                          <span
                            style={{
                              padding: "6px 12px",
                              borderRadius: "20px",
                              fontSize: "0.8rem",
                              fontWeight: "600",
                              textTransform: "capitalize",
                              backgroundColor:
                                selectedProperty.status === "available"
                                  ? "#d1fae5"
                                  : selectedProperty.status === "booked"
                                  ? "#fee2e2"
                                  : "#fef3c7",
                              color:
                                selectedProperty.status === "available"
                                  ? "#065f46"
                                  : selectedProperty.status === "booked"
                                  ? "#991b1b"
                                  : "#92400e"
                            }}
                          >
                            {selectedProperty.status}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: "500", color: "#6b7280" }}>Created:</span>
                          <span style={{ fontWeight: "600", color: "#1f2937" }}>
                            {new Date(selectedProperty.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        {selectedProperty.owner && (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: "500", color: "#6b7280" }}>Owner:</span>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontWeight: "600", color: "#1f2937" }}>{selectedProperty.owner.name}</div>
                              <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{selectedProperty.owner.email}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column - Description & Availability */}
                    <div>
                      <h3 style={{ 
                        marginBottom: "20px", 
                        color: "#1f2937", 
                        fontSize: "1.25rem",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}>
                        📝 Description
                      </h3>
                      <div style={{ 
                        background: "#f8fafc",
                        padding: "20px",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        marginBottom: "24px",
                        lineHeight: "1.6",
                        color: "#374151"
                      }}>
                        {selectedProperty.description || "No description provided for this property."}
                      </div>

                      {selectedProperty.availability && selectedProperty.availability.length > 0 && (
                        <div>
                          <h3 style={{ 
                            marginBottom: "16px", 
                            color: "#1f2937", 
                            fontSize: "1.25rem",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                          }}>
                            📅 Availability
                          </h3>
                          <div style={{ 
                            background: "#f8fafc",
                            padding: "20px",
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0"
                          }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                              {selectedProperty.availability.map((avail: any, index: number) => (
                                <div key={index} style={{ 
                                  display: "flex", 
                                  alignItems: "center",
                                  gap: "12px",
                                  padding: "12px",
                                  background: "white",
                                  borderRadius: "8px",
                                  border: "1px solid #e2e8f0"
                                }}>
                                  <div style={{ 
                                    background: "#667eea",
                                    color: "white",
                                    borderRadius: "50%",
                                    width: "32px",
                                    height: "32px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.8rem",
                                    fontWeight: "600"
                                  }}>
                                    {index + 1}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: "600", color: "#1f2937" }}>
                                      {new Date(avail.startDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })} - {new Date(avail.endDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </div>
                                    <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                                      {Math.ceil((new Date(avail.endDate).getTime() - new Date(avail.startDate).getTime()) / (1000 * 60 * 60 * 24))} days available
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ 
                  textAlign: "center", 
                  padding: "60px 20px",
                  color: "#dc2626",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "16px"
                }}>
                  <div style={{ fontSize: "3rem" }}>❌</div>
                  <div>
                    <h3 style={{ margin: "0 0 8px 0", color: "#1f2937" }}>Failed to Load Property</h3>
                    <p style={{ margin: 0, color: "#6b7280" }}>Unable to load property details. Please try again.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ...existing code...
