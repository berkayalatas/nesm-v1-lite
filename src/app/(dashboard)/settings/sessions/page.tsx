import { redirect } from "next/navigation";

import { SessionsList } from "@/features/settings/components/SessionsList";
import { auth } from "@/features/settings/lib/auth";
import { getSecurityAuthAdapter } from "@/features/settings/lib/auth-adapter";
import { getCurrentSessionToken } from "@/features/settings/lib/session-token";

export default async function SettingsSessionsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const [sessions, currentSessionToken] = await Promise.all([
    getSecurityAuthAdapter().listSessions(session.user.id),
    getCurrentSessionToken(),
  ]);

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
        sessions={sessions.map((item) => ({
          sessionToken: item.sessionToken,
          userAgent: item.userAgent,
          ipAddress: item.ipAddress,
          updatedAt: item.updatedAt.toISOString(),
        }))}
      />
    </section>
  );
}
