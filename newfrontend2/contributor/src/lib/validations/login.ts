import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Please enter your email address")
    .email("Please enter a valid email address (e.g. name@company.com)"),
  password: z
    .string()
    .min(1, "Please enter your password")
    .min(6, "Password must contain at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
