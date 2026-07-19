import z from "zod";

const CoordinatesSchema = z.object({
  latitude: z.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90"),
  longitude: z.number().min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180")
});

export const CreatePropertySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
  coordinates: CoordinatesSchema.optional(),
  price: z.number().positive("Price must be positive"),
  bedrooms: z.number().int().nonnegative("Bedrooms must be non-negative").optional(),
  bathrooms: z.number().int().nonnegative("Bathrooms must be non-negative").optional(),
  area: z.number().positive("Area must be positive").optional(),
  propertyType: z.enum(['room', 'house', 'apartment', 'studio', 'other']).optional(),
  furnished: z.boolean().optional(),
  floor: z.number().int().optional(),
  parking: z.boolean().optional(),
  petPolicy: z.enum(['allowed', 'not-allowed', 'on-request']).optional(),
  amenities: z.array(z.string()).optional(),
  availability: z.array(z.object({
    startDate: z.string().transform(str => new Date(str)),
    endDate: z.string().transform(str => new Date(str))
  })).min(1, "At least one availability period is required"),
  images: z.array(z.string()).optional()
});

export const UpdatePropertySchema = CreatePropertySchema.partial();

export type CreatePropertyDto = z.infer<typeof CreatePropertySchema>;
export type UpdatePropertyDto = z.infer<typeof UpdatePropertySchema>;
