"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { getProperty, updateProperty } from "@/lib/api/property";
import { getCurrentUser } from "@/lib/utils/auth-utils";
import LocationPicker from "@/components/location/LocationPicker";
import { isValidCoordinates, type PropertyCoordinates } from "@/lib/utils/location";
import BackPillLink from "@/components/ui/BackPillLink";

interface Property {
  _id: string;
  title: string;
  description: string;
  location: string;
  coordinates?: PropertyCoordinates;
  price: number;
  availability: { startDate: string; endDate: string }[];
  images: string[];
  owner: string | { _id?: string; id?: string; name: string; email: string };
  status: string;
}

const getEntityId = (value: any): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id || value.id || "");
};

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    propertyType: "",
    furnished: "",
    floor: "",
    parking: "",
    petPolicy: "",
    amenities: "",
    availabilityStart: "",
    availabilityEnd: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState<PropertyCoordinates | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchProperty = async () => {
      try {
        const property: Property = await getProperty(propertyId);
        const ownerId = getEntityId(property.owner);
        const userId = String(user.id || user._id || "");
        const ownerEmail =
          typeof property.owner === "string"
            ? ""
            : String(property.owner.email || "").toLowerCase();
        const userEmail = String(user.email || "").toLowerCase();

        const isOwner = (ownerId && userId && ownerId === userId) || (ownerEmail && userEmail && ownerEmail === userEmail);

        if (!isOwner) {
          setError("You don't have permission to edit this property");
          return;
        }
        setFormData({
          title: property.title,
          description: property.description,
          location: property.location,
          price: property.price.toString(),
          bedrooms: (property as any).bedrooms ? String((property as any).bedrooms) : "",
          bathrooms: (property as any).bathrooms ? String((property as any).bathrooms) : "",
          area: (property as any).area ? String((property as any).area) : "",
          propertyType: (property as any).propertyType || "",
          furnished: (property as any).furnished ? "true" : "",
          floor: (property as any).floor ? String((property as any).floor) : "",
          parking: (property as any).parking ? "true" : "",
          petPolicy: (property as any).petPolicy || "",
          amenities: Array.isArray((property as any).amenities) ? (property as any).amenities.join(", ") : ((property as any).amenities || ""),
          availabilityStart: property.availability[0]?.startDate?.split("T")[0] || "",
          availabilityEnd: property.availability[0]?.endDate?.split("T")[0] || "",
        });
        setExistingImages(property.images);
        if (isValidCoordinates(property.coordinates)) {
          setCoordinates(property.coordinates);
        }
      } catch (err) {
        setError("Failed to load property");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(prev => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const handleRemoveExistingImage = async (img: string, index: number) => {
    setError("");
    try {
      // Send immediate request to remove the image from server
      const form = new FormData();
      form.append('removedImages', JSON.stringify([img]));
      setLoading(true);
      await updateProperty(propertyId, form);

      // On success remove from UI and track removed images
      setExistingImages(prev => prev.filter((_, i) => i !== index));
      setRemovedImages(prev => [...prev, img]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove image');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Prepare form data to allow adding/removing images
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("location", formData.location);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("bedrooms", formData.bedrooms || "0");
      formDataToSend.append("bathrooms", formData.bathrooms || "0");
      formDataToSend.append("area", formData.area || "0");
      formDataToSend.append("propertyType", formData.propertyType);
      formDataToSend.append("furnished", formData.furnished === "true" ? "true" : "false");
      formDataToSend.append("floor", formData.floor || "0");
      formDataToSend.append("parking", formData.parking === "true" ? "true" : "false");
      formDataToSend.append("petPolicy", formData.petPolicy);
      formDataToSend.append("amenities", formData.amenities ? formData.amenities.split(",").map((a: string) => a.trim()).filter((a: string) => a.length > 0).join(",") : "");
      formDataToSend.append("availability", JSON.stringify([{ startDate: formData.availabilityStart, endDate: formData.availabilityEnd }]));
      if (isValidCoordinates(coordinates)) {
        formDataToSend.append("coordinates", JSON.stringify(coordinates));
      }

      // Append new images
      if (images && images.length > 0) {
        images.forEach((img) => formDataToSend.append('images', img));
      }

      // Send list of images to remove (from existingImages)
      if (removedImages && removedImages.length > 0) {
        formDataToSend.append('removedImages', JSON.stringify(removedImages));
      }

      await updateProperty(propertyId, formDataToSend);
      router.push(`/property/${propertyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update property");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#64748b" }}>Loading property...</p>
        </div>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#ef4444", marginBottom: 16 }}>{error}</p>
          <BackPillLink href="/dashboard" label="Back to dashboard" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1e293b", marginBottom: "0.5rem" }}>
              Edit Property
            </h1>
            <p style={{ color: "#64748b" }}>
              Update the details of your property listing
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ backgroundColor: "#ffffff", padding: "2rem", borderRadius: "0.5rem", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}>
            {error && (
              <div style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.25rem", color: "#dc2626" }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                Property Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Cozy Room in Downtown"
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.25rem",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your property, amenities, rules, etc."
                rows={4}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.25rem",
                  fontSize: "0.875rem",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., New York, NY"
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.25rem",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                Pin Location (OSM)
              </label>
              <LocationPicker
                coordinates={coordinates}
                onCoordinatesChange={setCoordinates}
                onLocationTextChange={(location) => setFormData((prev) => ({ ...prev, location }))}
              />
              <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.5rem" }}>
                Update the exact pin using current location, search, or map click.
              </p>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                Monthly Rent (Rs)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="e.g., 1200"
                min="0"
                step="0.01"
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.25rem",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
              />
            </div>

            {/* Property Details Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Bedrooms
                </label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleInputChange}
                  min="0"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.25rem",
                    fontSize: "0.875rem",
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Bathrooms
                </label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleInputChange}
                  min="0"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.25rem",
                    fontSize: "0.875rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Area (sqft)
                </label>
                <input
                  type="number"
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  min="0"
                  step="0.1"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.25rem",
                    fontSize: "0.875rem",
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Property Type
                </label>
                <select
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={(e) => setFormData(prev => ({ ...prev, propertyType: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.25rem",
                    fontSize: "0.875rem",
                    outline: "none",
                  }}
                >
                  <option value="">Select type</option>
                  <option value="room">Room</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="studio">Studio</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Floor Number
                </label>
                <input
                  type="number"
                  name="floor"
                  value={formData.floor}
                  onChange={handleInputChange}
                  min="0"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.25rem",
                    fontSize: "0.875rem",
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Pet Policy
                </label>
                <select
                  name="petPolicy"
                  value={formData.petPolicy}
                  onChange={(e) => setFormData(prev => ({ ...prev, petPolicy: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.25rem",
                    fontSize: "0.875rem",
                    outline: "none",
                  }}
                >
                  <option value="">Select policy</option>
                  <option value="allowed">Pets Allowed</option>
                  <option value="not-allowed">No Pets</option>
                  <option value="on-request">On Request</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="furnished"
                  name="furnished"
                  checked={formData.furnished === "true"}
                  onChange={(e) => setFormData(prev => ({ ...prev, furnished: e.target.checked ? "true" : "" }))}
                  style={{ width: "1rem", height: "1rem", cursor: "pointer" }}
                />
                <label htmlFor="furnished" style={{ fontSize: "0.875rem", fontWeight: "500", color: "#374151", cursor: "pointer" }}>
                  Furnished
                </label>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="parking"
                  name="parking"
                  checked={formData.parking === "true"}
                  onChange={(e) => setFormData(prev => ({ ...prev, parking: e.target.checked ? "true" : "" }))}
                  style={{ width: "1rem", height: "1rem", cursor: "pointer" }}
                />
                <label htmlFor="parking" style={{ fontSize: "0.875rem", fontWeight: "500", color: "#374151", cursor: "pointer" }}>
                  Parking Available
                </label>
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                Amenities (comma-separated)
              </label>
              <input
                type="text"
                name="amenities"
                value={formData.amenities}
                onChange={handleInputChange}
                placeholder="e.g., WiFi, AC, Laundry, Kitchen"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.25rem",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Available From
                </label>
                <input
                  type="date"
                  name="availabilityStart"
                  value={formData.availabilityStart}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.25rem",
                    fontSize: "0.875rem",
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Available Until
                </label>
                <input
                  type="date"
                  name="availabilityEnd"
                  value={formData.availabilityEnd}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.25rem",
                    fontSize: "0.875rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Current Images
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
                  {existingImages.map((img, index) => (
                    <div key={index} style={{ position: "relative" }}>
                      <img src={img.startsWith('http') || img.startsWith('/') ? img : `/api/uploads/property-images/${img}`} alt={`Image ${index + 1}`} style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "0.5rem" }} />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(img, index)}
                        style={{
                          position: "absolute",
                          top: "0.25rem",
                          right: "0.25rem",
                          backgroundColor: "#dc2626",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "1.5rem",
                          height: "1.5rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          fontWeight: "bold"
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                Add / Replace Images
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.25rem",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
              />
              <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                You can add more images (JPG, PNG, max 5MB each). Removing an existing image will delete it from the listing.
              </p>

              {/* New Image Preview Section */}
              {images.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: "500", color: "#374151", marginBottom: "0.75rem" }}>
                    Image Preview ({images.length} selected)
                  </h3>
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
                    gap: "1rem",
                    maxHeight: "400px",
                    overflowY: "auto",
                    padding: "1rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                    backgroundColor: "#f8fafc"
                  }}>
                    {images.map((image, index) => (
                      <div key={index} style={{ position: "relative" }}>
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          style={{
                            width: "100%",
                            height: "120px",
                            objectFit: "cover",
                            borderRadius: "0.5rem",
                            border: "1px solid #e2e8f0"
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImages(images.filter((_, i) => i !== index));
                          }}
                          style={{
                            position: "absolute",
                            top: "0.25rem",
                            right: "0.25rem",
                            backgroundColor: "#dc2626",
                            color: "white",
                            border: "none",
                            borderRadius: "50%",
                            width: "1.5rem",
                            height: "1.5rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.75rem",
                            fontWeight: "bold"
                          }}
                        >
                          ×
                        </button>
                        <p style={{ 
                          fontSize: "0.75rem", 
                          color: "#6b7280", 
                          marginTop: "0.25rem",
                          textAlign: "center",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          {image.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                type="button"
                onClick={() => router.back()}
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.25rem",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  backgroundColor: loading ? "#9ca3af" : "#4f46e5",
                  color: "white",
                  border: "none",
                  borderRadius: "0.25rem",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Updating..." : "Update Property"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
