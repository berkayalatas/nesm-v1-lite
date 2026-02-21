export type ThemePreference = "light" | "dark" | "system";

export interface SettingsProfile {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: string;
}
