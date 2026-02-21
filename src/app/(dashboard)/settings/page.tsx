import { redirect } from "next/navigation";

import { ProfileForm } from "@/features/settings/components/ProfileForm";
import { auth } from "@/features/settings/lib/auth";
import { prisma } from "@/features/settings/lib/prisma";

export default async function SettingsProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      avatarUrl: true,
    },
  });

  if (!user?.email) {
    redirect("/api/auth/signin");
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500">Update your personal details and avatar.</p>
      </header>

      <ProfileForm
        initialData={{
          name: user.name ?? "",
          email: user.email,
          avatarUrl: user.avatarUrl,
        }}
      />
    </section>
  );
}
