import {
  Activity,
  Lock,
  Monitor,
  Settings,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { settingsRoutes } from "@/features/settings/lib/routes";

export type SettingsNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const settingsNavigation: SettingsNavItem[] = [
  {
    title: "Profile",
    href: settingsRoutes.profile,
    icon: Settings,
  },
  {
    title: "Security",
    href: settingsRoutes.security,
    icon: Shield,
  },
  {
    title: "Sessions",
    href: settingsRoutes.sessions,
    icon: Monitor,
  },
  {
    title: "Preferences",
    href: settingsRoutes.preferences,
    icon: Lock,
  },
  {
    title: "Activity",
    href: settingsRoutes.activity,
    icon: Activity,
  },
];
