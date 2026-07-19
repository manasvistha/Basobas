import { z } from "zod";

// 1. REGISTRATION DTO
// We use .omit() to exclude internal fields like id, role, and timestamps
export const registerDTO = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPass: z.string().min(6, "Confirm password is required").optional(),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
})
  .refine((data) => {
    // Only validate password match if confirmPass is provided
    if (data.confirmPass) {
      return data.password === data.confirmPass;
    }
    return true;
  }, {
    message: "Passwords do not match",
    path: ["confirmPass"],
  });

export type RegisterDTO = z.infer<typeof registerDTO>;

// 2. LOGIN DTO
export const loginDTO = z.object({
  // Use .string().email() for compatibility and better error messages
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginDTO = z.infer<typeof loginDTO>;