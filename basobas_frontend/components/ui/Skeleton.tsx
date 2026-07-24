"use client";

import type { CSSProperties } from "react";

/**
 * Elegant shimmer skeleton block. Presentational only — used to reserve layout
 * space while data loads so pages fade in without shifting.
 */
export function Skeleton({
  width = "100%",
  height = 16,
  radius = 8,
  style,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: CSSProperties;
}) {
  return (
    <span
      className="bb-skeleton"
      style={{ width, height, borderRadius: radius, display: "block", ...style }}
    />
  );
}

/** A card-shaped skeleton matching the property card grid. */
export function SkeletonCard() {
  return (
    <div style={{ background: "#fff", border: "1px solid #eef0f4", borderRadius: 14, overflow: "hidden" }}>
      <Skeleton height={188} radius={0} />
      <div style={{ padding: "16px 18px 18px" }}>
        <Skeleton width="70%" height={15} style={{ marginBottom: 10 }} />
        <Skeleton width="45%" height={12} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={1} style={{ marginBottom: 12, background: "#f1f5f9" }} />
        <Skeleton width="35%" height={12} />
      </div>
    </div>
  );
}

/** Shimmer keyframes — injected once. */
export function SkeletonStyles() {
  return (
    <style>{`
      .bb-skeleton {
        position: relative;
        overflow: hidden;
        background: #eef1f6;
      }
      .bb-skeleton::after {
        content: "";
        position: absolute;
        inset: 0;
        transform: translateX(-100%);
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.65), transparent);
        animation: bb-shimmer 1.4s infinite;
      }
      @keyframes bb-shimmer { 100% { transform: translateX(100%); } }
    `}</style>
  );
}
