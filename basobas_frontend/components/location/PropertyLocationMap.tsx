"use client";

import dynamic from "next/dynamic";
import type { PropertyLocationMapContentProps } from "./PropertyLocationMapContent";

const PropertyLocationMap = dynamic<PropertyLocationMapContentProps>(() => import("./PropertyLocationMapContent"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 220,
        borderRadius: 12,
        border: "1px solid #e2e8f0",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#64748b",
        fontSize: 13,
      }}
    >
      Loading map...
    </div>
  ),
});

export default PropertyLocationMap;
