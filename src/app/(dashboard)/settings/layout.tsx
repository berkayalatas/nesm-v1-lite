import { SettingsLayout } from "@/features/settings/components/SettingsLayout";

type DashboardSettingsLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardSettingsLayout({
  children,
}: DashboardSettingsLayoutProps) {
  return <SettingsLayout>{children}</SettingsLayout>;
}
