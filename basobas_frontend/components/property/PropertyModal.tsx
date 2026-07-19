"use client";

import React, { useState } from "react";
import { getPropertyImageUrl } from "@/lib/utils/auth-utils";

type Props = {
  property: any;
  onClose: () => void;
};

export default function PropertyModal({ property, onClose }: Props) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modalImageError, setModalImageError] = useState(false);

  if (!property) return null;

  const images = property.images || [];
  const imageUrl = (() => {
    if (!images || images.length === 0) return null;
    const img = images[currentImageIndex] || images[0];
    if (!img) return null;
    if (typeof img === 'string') return getPropertyImageUrl(img);
    if (img.url) return getPropertyImageUrl(img.url);
    if (img.path) return getPropertyImageUrl(img.path);
    if (img.filename) return getPropertyImageUrl(img.filename);
    if (img.originalname) return getPropertyImageUrl(img.originalname);
    if (img.name) return getPropertyImageUrl(img.name);
    return null;
  })();

  const handlePrevImage = () => setCurrentImageIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  const handleNextImage = () => setCurrentImageIndex((i) => (i < images.length - 1 ? i + 1 : 0));

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20
      }}
      onClick={onClose}
    >
      <div style={{ width: "100%", maxWidth: 900, background: "white", borderRadius: 12, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: 20, borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0 }}>{property.title}</h2>
            <div style={{ color: "#6b7280", fontSize: 13 }}>{property.location}</div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 24, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ padding: 24, maxHeight: '70vh', overflow: 'auto' }}>
          {imageUrl ? (
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <button onClick={handlePrevImage} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }}>‹</button>
              <img src={imageUrl || undefined} alt={property.title || 'Property image'} style={{ width: '100%', maxWidth: 400, height: 'auto', objectFit: 'contain', display: modalImageError ? 'none' : 'block', margin: '0 auto' }} onError={() => setModalImageError(true)} />
              {modalImageError && <div style={{ width: '100%', maxWidth: 400, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', borderRadius: 12, margin: '0 auto' }}>🏠</div>}
              <button onClick={handleNextImage} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>›</button>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center' }}>No images</div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
            <div>
              <h3 style={{ marginBottom: 8 }}>Property Information</h3>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Price</strong>
                  <span>Rs {Number(property.price || 0).toLocaleString()}/month</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <strong>Status</strong>
                  <span style={{ textTransform: 'capitalize' }}>{property.status}</span>
                </div>
                {property.owner && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <strong>Owner</strong>
                    <div style={{ textAlign: 'right' }}>
                      <div>{property.owner.name}</div>
                      <div style={{ color: '#6b7280' }}>{property.owner.email}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: 8 }}>Description</h3>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8 }}>{property.description || 'No description provided.'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
