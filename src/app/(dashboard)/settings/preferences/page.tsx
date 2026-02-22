import { redirect } from "next/navigation";

import { PreferencesForm } from "@/features/settings/components/PreferencesForm";
import { auth } from "@/features/settings/lib/auth";
import { prisma } from "@/features/settings/lib/prisma";
import { preferencesSchema } from "@/features/settings/types/schemas";

export default async function SettingsPreferencesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const preferences = await prisma.userPreferences.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
    },
    update: {},
    select: {
      marketingEmails: true,
      securityAlerts: true,
      theme: true,
    },
  });

  const parsedPreferences = preferencesSchema.safeParse({
    marketingEmails: preferences.marketingEmails,
    securityAlerts: preferences.securityAlerts,
    theme: preferences.theme,
  });

  const initialPreferences = parsedPreferences.success
    ? parsedPreferences.data
    : {
        marketingEmails: preferences.marketingEmails,
        securityAlerts: preferences.securityAlerts,
        theme: "system" as const,
      };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Preferences</h1>
        <p className="text-sm text-slate-500">
          Manage how you receive product and account notifications.
        </p>
      </header>

      <PreferencesForm initialPreferences={initialPreferences} />
    </section>
  );
}
