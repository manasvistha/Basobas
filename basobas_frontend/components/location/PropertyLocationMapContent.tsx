"use client";

import { useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import { isValidCoordinates, type PropertyCoordinates } from "@/lib/utils/location";

if (typeof window !== "undefined") {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

export type PropertyLocationMapContentProps = {
  coordinates?: PropertyCoordinates | null;
  height?: number;
};

export default function PropertyLocationMapContent({
  coordinates,
  height = 220,
}: PropertyLocationMapContentProps) {
  if (!isValidCoordinates(coordinates)) {
    return null;
  }

  const center = useMemo<[number, number]>(
    () => [coordinates.latitude, coordinates.longitude],
    [coordinates.latitude, coordinates.longitude]
  );

  return (
    <div style={{ height, borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }}>
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center} />
      </MapContainer>
    </div>
  );
}
