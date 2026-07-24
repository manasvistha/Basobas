"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LeafletMouseEvent } from "leaflet";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import {
  formatCoordinates,
  isValidCoordinates,
  type PropertyCoordinates,
} from "@/lib/utils/location";

if (typeof window !== "undefined") {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

export type LocationPickerMapProps = {
  coordinates?: PropertyCoordinates | null;
  onCoordinatesChange: (coordinates: PropertyCoordinates | null) => void;
  onLocationTextChange?: (location: string) => void;
};

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];
const DEFAULT_ZOOM = 13;

function ViewSync({ coordinates }: { coordinates?: PropertyCoordinates | null }) {
  const map = useMap();

  useEffect(() => {
    if (!isValidCoordinates(coordinates)) return;
    const target = [coordinates.latitude, coordinates.longitude] as [number, number];
    const current = map.getCenter();
    const sameTarget =
      Math.abs(current.lat - target[0]) < 0.000001 &&
      Math.abs(current.lng - target[1]) < 0.000001;

    if (!sameTarget) {
      map.setView(target, Math.max(map.getZoom(), DEFAULT_ZOOM), { animate: true });
    }
  }, [coordinates, map]);

  return null;
}

function ClickToPick({
  onPick,
}: {
  onPick: (coordinates: PropertyCoordinates) => void;
}) {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      onPick({
        latitude: Number(event.latlng.lat.toFixed(6)),
        longitude: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });

  return null;
}

export default function LocationPickerMap({
  coordinates,
  onCoordinatesChange,
  onLocationTextChange,
}: LocationPickerMapProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const center = useMemo<[number, number]>(() => {
    if (isValidCoordinates(coordinates)) {
      return [coordinates.latitude, coordinates.longitude];
    }
    return DEFAULT_CENTER;
  }, [coordinates]);

  const reverseLookup = useCallback(
    async (target: PropertyCoordinates) => {
      if (!onLocationTextChange) return;
      setResolvingAddress(true);
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${target.latitude}&lon=${target.longitude}`;
        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
          },
        });
        if (!response.ok) throw new Error("Unable to resolve selected location");
        const payload = await response.json();
        if (payload?.display_name) {
          onLocationTextChange(payload.display_name);
        }
      } catch {
        // Keep manual location text if reverse lookup fails.
      } finally {
        setResolvingAddress(false);
      }
    },
    [onLocationTextChange]
  );

  const handlePick = useCallback(
    async (target: PropertyCoordinates) => {
      setError(null);
      onCoordinatesChange(target);
      await reverseLookup(target);
    },
    [onCoordinatesChange, reverseLookup]
  );

  const handleUseCurrentLocation = async () => {
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const target = {
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        };
        await handlePick(target);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("Unable to fetch your current location. Please allow location access.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) {
      setError("Enter a location to search.");
      return;
    }

    setError(null);
    setSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        query
      )}&limit=1`;
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error("Search failed");
      const payload = await response.json();
      if (!Array.isArray(payload) || payload.length === 0) {
        setError("No matching location found.");
        return;
      }

      const topResult = payload[0];
      const latitude = Number(topResult?.lat);
      const longitude = Number(topResult?.lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        setError("Selected search result does not have valid coordinates.");
        return;
      }

      const target = {
        latitude: Number(latitude.toFixed(6)),
        longitude: Number(longitude.toFixed(6)),
      };
      onCoordinatesChange(target);
      if (topResult?.display_name && onLocationTextChange) {
        onLocationTextChange(topResult.display_name);
      } else {
        await reverseLookup(target);
      }
    } catch {
      setError("Unable to search OSM right now.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #d1d5db",
        borderRadius: 10,
        padding: 12,
        backgroundColor: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={locating}
          style={{
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            background: "#f8fafc",
            color: "#0f172a",
            cursor: locating ? "not-allowed" : "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {locating ? "Locating..." : "Use Current Location"}
        </button>
        <div
          style={{
            display: "flex",
            flex: 1,
            minWidth: 220,
            gap: 8,
          }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleSearch();
              }
            }}
            placeholder="Search area in OSM"
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 13,
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={() => void handleSearch()}
            disabled={searching}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #1e3a8a",
              background: "#1e3a8a",
              color: "#fff",
              cursor: searching ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 8, color: "#475569", fontSize: 12 }}>
        Click anywhere on the map to drop a pin.
      </div>

      <div style={{ height: 280, borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0" }}>
        <MapContainer center={center} zoom={DEFAULT_ZOOM} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ViewSync coordinates={coordinates} />
          <ClickToPick onPick={(target) => void handlePick(target)} />
          {isValidCoordinates(coordinates) ? (
            <Marker position={[coordinates.latitude, coordinates.longitude]} />
          ) : null}
        </MapContainer>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "#334155" }}>
        {isValidCoordinates(coordinates)
          ? `Pinned: ${formatCoordinates(coordinates)}`
          : "No pinned location yet"}
        {resolvingAddress ? " (resolving address...)" : ""}
      </div>

      {error ? (
        <div
          style={{
            marginTop: 8,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: "8px 10px",
            color: "#b91c1c",
            fontSize: 12,
          }}
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
