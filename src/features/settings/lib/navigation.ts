import {
  Activity,
  Lock,
  Monitor,
  Settings,
  Shield,
  type LucideIcon,
} from "lucide-react";

export type SettingsNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const settingsNavigation: SettingsNavItem[] = [
  {
    title: "Profile",
    href: "/settings",
    icon: Settings,
  },
  {
    title: "Security",
    href: "/settings/security",
    icon: Shield,
  },
  {
    title: "Sessions",
    href: "/settings/sessions",
    icon: Monitor,
  },
  {
    title: "Preferences",
    href: "/settings/preferences",
    icon: Lock,
  },
  {
    title: "Activity",
    href: "/settings/activity",
    icon: Activity,
  },
];
