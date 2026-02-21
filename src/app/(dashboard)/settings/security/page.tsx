import { redirect } from "next/navigation";

import { PasswordForm } from "@/features/settings/components/PasswordForm";
import { auth } from "@/features/settings/lib/auth";

export default async function SettingsSecurityPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Security</h1>
        <p className="text-sm text-slate-500">Manage password and account safety controls.</p>
      </header>

      <PasswordForm />
    </section>
  );
}
