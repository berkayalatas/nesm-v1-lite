import { redirect } from "next/navigation";

import { ProfileForm } from "@/features/settings/components/ProfileForm";
import { WelcomeBanner } from "@/features/settings/components/WelcomeBanner";
import { auth } from "@/features/settings/lib/auth";
import { prisma } from "@/features/settings/lib/prisma";
import { authRoutes } from "@/features/settings/lib/routes";

type SettingsProfilePageProps = {
  searchParams: Promise<{ welcome?: string | string[] | undefined }>;
};

export default async function SettingsProfilePage({ searchParams }: SettingsProfilePageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(authRoutes.signIn);
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
    redirect(authRoutes.signIn);
  }

  const resolvedParams = await searchParams;
  const welcomeParam = Array.isArray(resolvedParams.welcome)
    ? resolvedParams.welcome[0]
    : resolvedParams.welcome;
  const forceShowWelcome = welcomeParam === "true";

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500">Update your personal details and avatar.</p>
      </header>

      <WelcomeBanner forceShow={forceShowWelcome} />

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
