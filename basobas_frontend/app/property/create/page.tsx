"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProperty } from "@/lib/api/property";
import LocationPicker from "@/components/location/LocationPicker";
import { isValidCoordinates, type PropertyCoordinates } from "@/lib/utils/location";
import styles from "./page.module.css";

export default function CreatePropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
  });
  const [images, setImages] = useState<File[]>([]);
  const [coordinates, setCoordinates] = useState<PropertyCoordinates | null>(null);
  const [error, setError] = useState("");

  const handleBack = () => router.back();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log('Submitting property creation form...');

      // Prepare FormData
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
      if (isValidCoordinates(coordinates)) {
        formDataToSend.append("coordinates", JSON.stringify(coordinates));
      }

      // Append images (multer expects field name 'images')
      if (images && images.length > 0) {
        images.forEach((img) => formDataToSend.append('images', img));
      }

      const response = await createProperty(formDataToSend);
      const createdId = response?._id || response?.id;
      router.push(`/property/${createdId}`);
    } catch (err: any) {
      // Surface the backend's actual validation message (it returns { error })
      // instead of axios's generic "Request failed with status code 400".
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to create property");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.inner}>
          <div>
            <button type="button" onClick={handleBack} className={styles.backButton}>← Back</button>
            <h1 className={styles.headerTitle}>List Your Property</h1>
            <p className={styles.subtitle}>Fill in the details to list your room, house, or apartment for rent</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.card}>
            {error && (
              <div className={styles.error}>{error}</div>
            )}
            <div className={styles.field}>
              <label className={styles.label}>Property Title</label>
              <input className={`${styles.control} ${styles.input}`} type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g., Cozy Room in Downtown" required />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Description</label>
              <textarea className={`${styles.control} ${styles.textarea}`} name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe your property, amenities, rules, etc." rows={4} required />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Location</label>
              <input className={`${styles.control} ${styles.input}`} type="text" name="location" value={formData.location} onChange={handleInputChange} placeholder="e.g., New York, NY" required />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Pin Location (OSM)</label>
              <LocationPicker
                coordinates={coordinates}
                onCoordinatesChange={setCoordinates}
                onLocationTextChange={(location) => setFormData((prev) => ({ ...prev, location }))}
              />
              <p className={styles.amenitiesNote}>
                Use current location, search manually, or click the map to pin the property.
              </p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Monthly Rent (Rs)</label>
              <input className={`${styles.control} ${styles.input}`} type="number" name="price" value={formData.price} onChange={handleInputChange} placeholder="e.g., 1200" min="0" step="0.01" required />
            </div>

            {/* Property Details Grid */}
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Bedrooms</label>
                <input className={`${styles.control} ${styles.input}`} type="number" name="bedrooms" value={formData.bedrooms} onChange={handleInputChange} min="0" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Bathrooms</label>
                <input className={`${styles.control} ${styles.input}`} type="number" name="bathrooms" value={formData.bathrooms} onChange={handleInputChange} min="0" />
              </div>
            </div>

            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Area (sqft)</label>
                <input className={`${styles.control} ${styles.input}`} type="number" name="area" value={formData.area} onChange={handleInputChange} min="0" step="0.1" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Property Type</label>
                <select className={`${styles.control} ${styles.select}`} name="propertyType" value={formData.propertyType} onChange={(e) => setFormData(prev => ({ ...prev, propertyType: e.target.value }))}>
                  <option value="">Select type</option>
                  <option value="room">Room</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="studio">Studio</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Floor Number</label>
                <input className={`${styles.control} ${styles.input}`} type="number" name="floor" value={formData.floor} onChange={handleInputChange} min="0" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Pet Policy</label>
                <select className={`${styles.control} ${styles.select}`} name="petPolicy" value={formData.petPolicy} onChange={(e) => setFormData(prev => ({ ...prev, petPolicy: e.target.value }))}>
                  <option value="">Select policy</option>
                  <option value="allowed">Pets Allowed</option>
                  <option value="not-allowed">No Pets</option>
                  <option value="on-request">On Request</option>
                </select>
              </div>
            </div>

            <div className={styles.grid}>
              <div className={styles.tile}>
                <input type="checkbox" id="furnished" name="furnished" checked={formData.furnished === "true"} onChange={(e) => setFormData(prev => ({ ...prev, furnished: e.target.checked ? "true" : "" }))} style={{ width: "1rem", height: "1rem", cursor: "pointer" }} />
                <label htmlFor="furnished" style={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151", cursor: "pointer" }}>Furnished</label>
              </div>
              <div className={styles.tile}>
                <input type="checkbox" id="parking" name="parking" checked={formData.parking === "true"} onChange={(e) => setFormData(prev => ({ ...prev, parking: e.target.checked ? "true" : "" }))} style={{ width: "1rem", height: "1rem", cursor: "pointer" }} />
                <label htmlFor="parking" style={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151", cursor: "pointer" }}>Parking Available</label>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Amenities (comma-separated)</label>
              <input className={`${styles.control} ${styles.input}`} type="text" name="amenities" value={formData.amenities} onChange={handleInputChange} placeholder="e.g., WiFi, AC, Laundry, Kitchen" />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Property Images</label>
              <input className={`${styles.control} ${styles.input}`} type="file" multiple accept="image/*" onChange={handleImageChange} />
              <p className={styles.amenitiesNote}>Upload up to 10 images (JPG, PNG, max 5MB each)</p>

              {images.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 500, color: "#374151", marginBottom: ".75rem" }}>Image Preview ({images.length} selected)</h3>
                  <div className={styles.imagePreviewGrid}>
                    {images.map((image, index) => (
                      <div key={index} className={styles.imageCard}>
                        <img src={URL.createObjectURL(image)} alt={`Preview ${index + 1}`} className={styles.previewImg} />
                        <button type="button" onClick={() => setImages(images.filter((_, i) => i !== index))} className={styles.removeBtn}>×</button>
                        <p className={styles.imageName}>{image.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.actions}>
              <button type="button" onClick={handleBack} className={`${styles.btn} ${styles.btnSecondary}`}>Cancel</button>
              <button type="submit" disabled={loading} className={`${styles.btn} ${styles.btnPrimary}`}>{loading ? "Creating..." : "List Property"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
