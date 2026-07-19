import { Request, Response } from "express";
import { PropertyService } from "../services/property.service";
import { CreatePropertySchema, CreatePropertyDto, UpdatePropertyDto } from "../dtos/property.dto";

export class PropertyController {
  private propertyService = new PropertyService();

  private parseCoordinates(body: any): { latitude: number; longitude: number } | undefined {
    const hasCoordinatesPayload =
      body?.coordinates !== undefined ||
      body?.latitude !== undefined ||
      body?.longitude !== undefined;

    if (!hasCoordinatesPayload) return undefined;

    // Allow explicit removal from update payload.
    if (body?.coordinates === "" || body?.coordinates === null || body?.coordinates === "null") {
      return undefined;
    }

    let parsedCoordinates: any = body?.coordinates;
    if (typeof parsedCoordinates === "string" && parsedCoordinates.trim().length > 0) {
      try {
        parsedCoordinates = JSON.parse(parsedCoordinates);
      } catch {
        throw new Error("Invalid coordinates payload");
      }
    }

    const rawLatitude = parsedCoordinates?.latitude ?? body?.latitude;
    const rawLongitude = parsedCoordinates?.longitude ?? body?.longitude;

    if (rawLatitude === undefined || rawLongitude === undefined || rawLatitude === "" || rawLongitude === "") {
      throw new Error("Both latitude and longitude are required when coordinates are provided");
    }

    const latitude = typeof rawLatitude === "number" ? rawLatitude : parseFloat(String(rawLatitude));
    const longitude = typeof rawLongitude === "number" ? rawLongitude : parseFloat(String(rawLongitude));

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error("Coordinates must be valid numbers");
    }

    return { latitude, longitude };
  }

  async createProperty(req: Request, res: Response) {
    try {
      console.log('Create property request:', {
        body: req.body,
        files: req.files,
        user: (req as any).user
      });

      // Parse form data and validate - extract all fields including bedrooms, bathrooms, etc
      const rawData = {
        title: req.body.title,
        description: req.body.description,
        location: req.body.location,
        coordinates: this.parseCoordinates(req.body),
        price: req.body.price ? parseFloat(req.body.price) : 0,
        bedrooms: req.body.bedrooms ? parseInt(req.body.bedrooms) : undefined,
        bathrooms: req.body.bathrooms ? parseInt(req.body.bathrooms) : undefined,
        area: req.body.area ? parseFloat(req.body.area) : undefined,
        propertyType: req.body.propertyType || undefined,
        furnished: req.body.furnished === 'true' || req.body.furnished === true,
        floor: req.body.floor ? parseInt(req.body.floor) : undefined,
        parking: req.body.parking === 'true' || req.body.parking === true,
        petPolicy: req.body.petPolicy || undefined,
        amenities: req.body.amenities
          ? (Array.isArray(req.body.amenities)
              ? req.body.amenities
              : String(req.body.amenities)
                  .split(',')
                  .map((s: string) => s.trim())
                  .filter((s: string) => s.length > 0))
          : undefined,
        availability: req.body.availability ? JSON.parse(req.body.availability) : [],
        images: req.files ? (req.files as Express.Multer.File[]).map(file => file.filename) : []
      };

      console.log('Parsed data:', rawData);

      const data = CreatePropertySchema.parse(rawData);
      console.log('Validated data:', data);

      const ownerId = (req as any).user.id;
      console.log('Owner ID:', ownerId);

      // Handle uploaded images
      const images: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        images.push(...req.files.map((file: any) => `/public/property-images/${file.filename}`));
      }

      // Add images to data
      data.images = images;

      console.log('Parsed data:', data);

      const property = await this.propertyService.createProperty(data, ownerId);
      console.log('Property created successfully:', property);
      res.status(201).json(property);
    } catch (error: any) {
      console.error('Property creation error:', error);
      console.error('Error stack:', error.stack);
      res.status(400).json({ error: error.message });
    }
  }

  async getAllProperties(req: Request, res: Response) {
    try {
      const properties = await this.propertyService.getAllProperties();
      res.json(properties);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPropertyById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const property = await this.propertyService.getPropertyById(id);
      if (!property) return res.status(404).json({ error: "Property not found" });
      res.json(property);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getMyProperties(req: Request, res: Response) {
    try {
      const ownerId = (req as any).user.id;
      const properties = await this.propertyService.getPropertiesByOwner(ownerId);
      res.json(properties);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async searchByQuery(req: Request, res: Response) {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Query required" });
      }
      const properties = await this.propertyService.searchByQuery(query);
      res.json(properties);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async filterProperties(req: Request, res: Response) {
    try {
      const filters = {
        priceMin: req.query.priceMin ? parseInt(req.query.priceMin as string) : undefined,
        priceMax: req.query.priceMax ? parseInt(req.query.priceMax as string) : undefined,
        bedrooms: req.query.bedrooms ? parseInt(req.query.bedrooms as string) : undefined,
        bathrooms: req.query.bathrooms ? parseInt(req.query.bathrooms as string) : undefined,
        propertyType: req.query.propertyType as string | undefined,
        furnished: req.query.furnished === 'true',
        parking: req.query.parking === 'true',
        petPolicy: req.query.petPolicy as string | undefined,
        location: req.query.location as string | undefined,
        amenities: Array.isArray(req.query.amenities) ? req.query.amenities : req.query.amenities ? [req.query.amenities] : []
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if ((filters as any)[key] === undefined || (Array.isArray((filters as any)[key]) && (filters as any)[key].length === 0)) {
          delete (filters as any)[key];
        }
      });

      console.log('🔍 Filtering properties with:', filters);
      const properties = await this.propertyService.filterProperties(filters);
      res.json(properties);
    } catch (error: any) {
      console.error('Filter error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  async updateProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const ownerId = (req as any).user.id;

      // Load existing property to compute image changes
      const existingProperty = await this.propertyService.getPropertyById(id);
      if (!existingProperty) return res.status(404).json({ error: "Property not found" });

      // Build data object from form body (partial)
      const rawBody: any = req.body || {};

      const data: any = {};
      if (rawBody.title !== undefined) data.title = rawBody.title;
      if (rawBody.description !== undefined) data.description = rawBody.description;
      if (rawBody.location !== undefined) data.location = rawBody.location;
      if (rawBody.coordinates !== undefined || rawBody.latitude !== undefined || rawBody.longitude !== undefined) {
        data.coordinates = this.parseCoordinates(rawBody);
      }
      if (rawBody.price !== undefined) data.price = rawBody.price ? parseFloat(rawBody.price) : undefined;
      if (rawBody.bedrooms !== undefined) data.bedrooms = rawBody.bedrooms ? parseInt(rawBody.bedrooms) : undefined;
      if (rawBody.bathrooms !== undefined) data.bathrooms = rawBody.bathrooms ? parseInt(rawBody.bathrooms) : undefined;
      if (rawBody.area !== undefined) data.area = rawBody.area ? parseFloat(rawBody.area) : undefined;
      if (rawBody.propertyType !== undefined) data.propertyType = rawBody.propertyType;
      if (rawBody.furnished !== undefined) data.furnished = rawBody.furnished === 'true' || rawBody.furnished === true;
      if (rawBody.floor !== undefined) data.floor = rawBody.floor ? parseInt(rawBody.floor) : undefined;
      if (rawBody.parking !== undefined) data.parking = rawBody.parking === 'true' || rawBody.parking === true;
      if (rawBody.petPolicy !== undefined) data.petPolicy = rawBody.petPolicy;
      if (rawBody.amenities !== undefined) {
        data.amenities = rawBody.amenities ? (Array.isArray(rawBody.amenities) ? rawBody.amenities : String(rawBody.amenities).split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)) : [];
      }
      if (rawBody.availability !== undefined) {
        try {
          data.availability = JSON.parse(rawBody.availability);
        } catch (err) {
          // ignore parsing error
        }
      }

      // Handle removedImages list from the client (array of full URLs or paths)
      let removedList: string[] = [];
      if (rawBody.removedImages) {
        try {
          removedList = JSON.parse(rawBody.removedImages);
        } catch (err) {
          // if it's already an array
          if (Array.isArray(rawBody.removedImages)) removedList = rawBody.removedImages;
        }
      }

      // Normalize image values (full URL or path) to canonical stored path.
      const path = await import('path');
      const fs = await import('fs');
      const uploadsDir = path.join(process.cwd(), 'uploads', 'property-images');

      const toStoredImagePath = (img: string): string => {
        const filename = path.basename(String(img || ''));
        return filename ? `/public/property-images/${filename}` : '';
      };

      // getPropertyById may return full URLs; normalize before diffing/updating.
      const currentImages: string[] = (existingProperty.images || [])
        .map((img: string) => toStoredImagePath(img))
        .filter((img: string) => img.length > 0);

      // Build set of images to remove (match by filename/canonical path)

      const removedPathsSet = new Set<string>();
      removedList.forEach((img: string) => {
        const normalized = toStoredImagePath(img);
        if (normalized) removedPathsSet.add(normalized);
      });

      // Compute new images array: current minus removed
      let newImages = currentImages.filter(img => !removedPathsSet.has(img));

      // Add any newly uploaded files
      if (req.files && Array.isArray(req.files) && (req.files as Express.Multer.File[]).length > 0) {
        const uploaded = (req.files as Express.Multer.File[]).map(f => `/public/property-images/${f.filename}`);
        newImages = [...newImages, ...uploaded];
      }

      // Delete files from disk for removed images
      for (const rem of Array.from(removedPathsSet)) {
        try {
          const filename = path.basename(rem);
          const filePath = path.join(uploadsDir, filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error('Failed to delete removed image file', rem, err);
        }
      }

      // Attach updated images array
      data.images = newImages;

      const property = await this.propertyService.updateProperty(id, data as UpdatePropertyDto, ownerId);
      if (!property) return res.status(404).json({ error: "Property not found" });
      res.json(property);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const ownerId = (req as any).user.id;
      console.log('🗑️  Delete request - PropertyID:', id, 'OwnerID:', ownerId);
      const success = await this.propertyService.deleteProperty(id, ownerId);
      if (!success) return res.status(404).json({ error: "Property not found" });
      console.log('✅ Property deleted successfully:', id);
      res.status(204).send();
    } catch (error: any) {
      console.error('❌ Delete property error:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  async assignProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      const adminId = (req as any).user.id;
      if ((req as any).user.role !== 'admin') return res.status(403).json({ error: "Admin required" });
      const property = await this.propertyService.assignProperty(id, userId, adminId);
      if (!property) return res.status(404).json({ error: "Property not found" });
      res.json(property);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updatePropertyStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const adminId = (req as any).user.id;
      if ((req as any).user.role !== 'admin') return res.status(403).json({ error: "Admin required" });
      const property = await this.propertyService.updatePropertyStatus(id, status, adminId);
      if (!property) return res.status(404).json({ error: "Property not found" });
      res.json(property);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
