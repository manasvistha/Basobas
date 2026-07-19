import z from "zod";

export const CreateBookingSchema = z.object({
  propertyId: z.string(),
  message: z.string().optional(),
  tenantInfo: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    idNumber: z.string().optional()
  }).optional(),
  payment: z.object({
    method: z.string(),
    amount: z.number(),
    currency: z.string().optional(),
    status: z.enum(['pending', 'success', 'failed']).optional(),
    transactionId: z.string().optional(),
    meta: z.record(z.any()).optional()
  }).optional()
});

export type CreateBookingDto = z.infer<typeof CreateBookingSchema>;