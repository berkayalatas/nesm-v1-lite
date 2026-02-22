import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import {
  getActivityLogs,
} from "@/features/settings/actions/activity";
import { ActivityTable } from "@/features/settings/components/ActivityTable";
import { ActivityTableSkeleton } from "@/features/settings/components/ActivityTableSkeleton";
import { auth } from "@/features/settings/lib/auth";
import { authRoutes, settingsRoutes } from "@/features/settings/lib/routes";
import type { ActivityLogQueryParams } from "@/features/settings/types/activity";
import { Button } from "@/components/ui/button";

type SettingsActivityPageProps = {
  searchParams: Promise<ActivityLogQueryParams>;
};

async function ActivityTableContent({ searchParams }: { searchParams: ActivityLogQueryParams }) {
  const data = await getActivityLogs(searchParams);
  return <ActivityTable data={data} />;
}

function hasFilters(searchParams: ActivityLogQueryParams): boolean {
  const toString = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value) ?? "";
  return Boolean(
    toString(searchParams.category) ||
      toString(searchParams.action) ||
      toString(searchParams.startDate) ||
      toString(searchParams.endDate)
  );
}

export default async function SettingsActivityPage({ searchParams }: SettingsActivityPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(authRoutes.signIn);
  }

  const resolvedSearchParams = await searchParams;
  const showClearFilters = hasFilters(resolvedSearchParams);
  const suspenseKey = JSON.stringify(resolvedSearchParams);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">Activity Log</h1>
          <p className="text-sm text-slate-500">
            Track account updates, security events, and settings changes.
          </p>
        </div>

        {showClearFilters ? (
          <Button variant="outline" asChild>
            <Link href={settingsRoutes.activity}>Clear Filters</Link>
          </Button>
        ) : null}
      </header>

      <Suspense key={suspenseKey} fallback={<ActivityTableSkeleton />}>
        <ActivityTableContent searchParams={resolvedSearchParams} />
      </Suspense>
    </section>
  );
}
