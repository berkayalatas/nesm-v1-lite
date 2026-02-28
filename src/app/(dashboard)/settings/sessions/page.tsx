import { redirect } from "next/navigation";

import { SessionsList } from "@/features/settings/components/SessionsList";
import { auth } from "@/features/settings/lib/auth";
import { getSecurityAuthAdapter } from "@/features/settings/lib/auth-adapter";
import { prisma } from "@/features/settings/lib/prisma";
import { getSignInRoute, settingsRoutes } from "@/features/settings/lib/routes";
import { getCurrentSessionToken } from "@/features/settings/lib/session-token";

export default async function SettingsSessionsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(getSignInRoute(settingsRoutes.sessions));
  }

  const [sessions, currentSessionToken] = await Promise.all([
    getSecurityAuthAdapter().listSessions(session.user.id),
    getCurrentSessionToken(),
  ]);
  const latestActivity = await prisma.auditLog.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      ipAddress: true,
      userAgent: true,
      createdAt: true,
    },
  });

  const hasDatabaseSessions = sessions.length > 0;
  const sessionRows = hasDatabaseSessions
    ? sessions
    : [
        {
          sessionToken: currentSessionToken ?? "current-session",
          userAgent: latestActivity?.userAgent ?? null,
          ipAddress: latestActivity?.ipAddress ?? null,
          updatedAt: (latestActivity?.createdAt ?? new Date()).toISOString(),
        },
      ];

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Sessions</h1>
        <p className="text-sm text-slate-500">
          Monitor active devices and terminate sessions that are no longer trusted.
        </p>
      </header>

      <SessionsList
        currentSessionToken={currentSessionToken}
        sessions={sessionRows.map((item) => ({
          sessionToken: item.sessionToken,
          userAgent: item.userAgent,
          ipAddress: item.ipAddress,
          updatedAt:
            typeof item.updatedAt === "string" ? item.updatedAt : item.updatedAt.toISOString(),
        }))}
        isFallback={!hasDatabaseSessions}
      />
    </section>
  );
}
