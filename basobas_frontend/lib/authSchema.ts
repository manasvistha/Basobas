import { z } from "zod";
import { strongPasswordSchema } from "./passwordPolicy";

export const loginSchema = z.object({
  email: z.string().email("Email must include @"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Email must include @"),
  password: strongPasswordSchema,
  confirmPass: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPass, {
  message: "Passwords do not match",
  path: ["confirmPass"],
});

export type RegisterData = z.infer<typeof registerSchema>;
