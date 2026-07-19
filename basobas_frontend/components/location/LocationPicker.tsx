"use client";

import dynamic from "next/dynamic";
import type { LocationPickerMapProps } from "./LocationPickerMap";

const LocationPicker = dynamic<LocationPickerMapProps>(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        border: "1px solid #d1d5db",
        borderRadius: 10,
        padding: 12,
        backgroundColor: "#fff",
        color: "#64748b",
        fontSize: 13,
      }}
    >
      Loading map...
    </div>
  ),
});

export default LocationPicker;
