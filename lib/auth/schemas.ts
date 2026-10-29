import { z } from "zod";

/** Auth form schemas, validated on the server inside the Server Actions. */

export const signInSchema = z.object({
  email: z.string().trim().min(1, "Email is required").pipe(z.email("Enter a valid email address")),
  password: z.string().min(1, "Password is required").max(72, "Password is too long"),
});

export const PASSWORD_MIN_LENGTH = 12;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
      .max(72, "Use 72 characters or fewer")
      .regex(/[a-z]/i, "Include at least one letter")
      .regex(/\d/, "Include at least one number"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] })
  .refine((v) => v.newPassword !== v.currentPassword, { message: "Choose a password you haven't used here", path: ["newPassword"] });

export type FieldErrors = Partial<Record<string, string[]>>;

export type AuthFormState = { error?: string; fieldErrors?: FieldErrors; email?: string } | undefined;
