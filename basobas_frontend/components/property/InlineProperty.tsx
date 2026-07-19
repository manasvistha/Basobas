"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { getPropertyImageUrl } from "@/lib/utils/auth-utils";
import { getProperty } from "@/lib/api/property";

type Props = {
  property: any | string; // either the property object or its id
  onClick?: (id: string) => void;
};

function resolveImage(img: any) {
  if (!img) return null;
  if (typeof img === 'string') return getPropertyImageUrl(img);
  if (img.url) return getPropertyImageUrl(img.url);
  if (img.path) return getPropertyImageUrl(img.path);
  if (img.filename) return getPropertyImageUrl(img.filename);
  if (img.originalname) return getPropertyImageUrl(img.originalname);
  if (img.name) return getPropertyImageUrl(img.name);
  return null;
}

export default function InlineProperty({ property, onClick }: Props) {
  const [prop, setProp] = useState<any | null>(typeof property === 'string' ? null : property);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const shouldFetch = typeof property === 'string' || (property && (!property.images || property.images.length === 0));
    if (shouldFetch) {
      const id = typeof property === 'string' ? property : property?._id;
      if (!id) {
        setProp(property && typeof property === 'object' ? property : null);
        return () => { mounted = false; };
      }
      setLoading(true);
      getProperty(id)
        .then((p) => { if (mounted) setProp(p); })
        .catch((err) => {
          console.error('InlineProperty: failed to fetch property', err);
          if (mounted && typeof property === 'object') setProp(property);
        })
        .finally(() => { if (mounted) setLoading(false); });
    } else {
      setProp(property as any);
    }
    return () => { mounted = false; };
  }, [property]);

  if (!prop && !loading) return <span>Property</span>;

  const firstImage = prop && prop.images && prop.images.length ? prop.images[0] : null;
  const imgUrl = resolveImage(firstImage);
  console.log("InlineProperty: resolved image url ->", imgUrl, { firstImage, propertyId: prop?._id });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick && prop && prop._id) onClick(prop._id);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick ? handleClick : undefined}>
      <div style={{ width: 56, height: 56, borderRadius: 8, overflow: "hidden", background: "#f3f4f6", flex: "0 0 56px" }}>
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={prop?.title || "Property"}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={(e) => { 
              console.error("Failed to load property image:", imgUrl, e);
              (e.currentTarget as HTMLImageElement).style.display = "none"; 
            }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏠</div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <Link href={`/property/${prop?._id}`} style={{ color: "#0f172a", fontWeight: 700, textDecoration: "none" }}>
          {prop?.title || "Property"}
        </Link>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
          {prop?.location ? <span style={{ marginRight: 8 }}>{prop.location}</span> : null}
          {typeof prop?.price === "number" ? <span>Rs {Number(prop.price).toLocaleString()}/month</span> : null}
        </div>
      </div>
    </div>
  );
}
