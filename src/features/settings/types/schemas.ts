import { z } from "zod";

export const profileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required.")
      .min(2, "Name must be at least 2 characters.")
      .max(80, "Name must be 80 characters or less."),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Email is required.")
      .email("Please enter a valid email address.")
      .max(254, "Email must be 254 characters or less."),
  })
  .strict();

export type ProfileSchema = z.infer<typeof profileSchema>;

const passwordStrengthRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters.")
      .regex(
        passwordStrengthRegex,
        "New password must include uppercase, lowercase, and a number."
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Confirm password must match the new password.",
  });

export type PasswordChangeSchema = z.infer<typeof passwordChangeSchema>;

export type ProfileActionErrors = Partial<
  Record<keyof ProfileSchema | "avatar" | "form", string[]>
>;

export type ProfileActionState = {
  success: boolean;
  message: string;
  errors?: ProfileActionErrors;
  profile?: {
    name: string;
    email: string;
    avatarUrl: string | null;
    image: string | null;
  };
};

export const profileActionInitialState: ProfileActionState = {
  success: false,
  message: "",
};

export type SecurityActionErrors = Partial<
  Record<keyof PasswordChangeSchema | "form", string[]>
>;

export type SecurityActionState = {
  success: boolean;
  message: string;
  errors?: SecurityActionErrors;
};

export const securityActionInitialState: SecurityActionState = {
  success: false,
  message: "",
};

export type SessionActionState = {
  success: boolean;
  message: string;
};

export const sessionActionInitialState: SessionActionState = {
  success: false,
  message: "",
};

export const preferencesSchema = z
  .object({
    marketingEmails: z.boolean(),
    securityAlerts: z.boolean(),
    theme: z.enum(["light", "dark", "system"]),
  })
  .strict();

export type PreferencesSchema = z.infer<typeof preferencesSchema>;

export const preferenceKeySchema = z.enum([
  "marketingEmails",
  "securityAlerts",
  "theme",
]);

export type PreferenceKey = z.infer<typeof preferenceKeySchema>;

export const preferenceUpdateSchema = z.discriminatedUnion("key", [
  z
    .object({
      key: z.literal("marketingEmails"),
      value: z.boolean(),
    })
    .strict(),
  z
    .object({
      key: z.literal("securityAlerts"),
      value: z.boolean(),
    })
    .strict(),
  z
    .object({
      key: z.literal("theme"),
      value: z.enum(["light", "dark", "system"]),
    })
    .strict(),
]);

export type PreferenceUpdateInput = z.infer<typeof preferenceUpdateSchema>;

export type PreferenceActionState = {
  success: boolean;
  message: string;
  preferences?: PreferencesSchema;
};
