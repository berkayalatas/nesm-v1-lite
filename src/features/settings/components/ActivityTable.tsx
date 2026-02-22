"use client";

import { useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User,
  type LucideIcon,
} from "lucide-react";

import {
  activityActionFilterOptions,
  activityCategoryFilterOptions,
  activityActionRegistry,
  type ActivityActionType,
  type ActivityLogsResult,
} from "@/features/settings/types/activity";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

type ActivityTableProps = {
  data: ActivityLogsResult;
};

type MetadataMap = Record<string, unknown>;

function toTitleCase(value: string): string {
  return value
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseUserAgent(userAgent: string | null): { browser: string; device: string } {
  if (!userAgent) {
    return { browser: "Unknown Browser", device: "Unknown Device" };
  }

  const ua = userAgent.toLowerCase();

  let browser = "Unknown Browser";
  if (ua.includes("edg/")) browser = "Microsoft Edge";
  else if (ua.includes("chrome/")) browser = "Google Chrome";
  else if (ua.includes("safari/") && !ua.includes("chrome/")) browser = "Safari";
  else if (ua.includes("firefox/")) browser = "Firefox";

  let device = "Desktop";
  if (ua.includes("iphone") || ua.includes("android") || ua.includes("mobile")) {
    device = "Mobile";
  } else if (ua.includes("ipad") || ua.includes("tablet")) {
    device = "Tablet";
  }

  return { browser, device };
}

function asMetadataMap(value: unknown): MetadataMap | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as MetadataMap;
}

function formatActivityMetadata(action: string, metadata: unknown): string {
  const map = asMetadataMap(metadata);
  if (!map) return "No additional details.";

  if (action === "PROFILE_UPDATE") {
    const changedFields = Object.entries(map)
      .filter(([, value]) => value === true)
      .map(([key]) => toTitleCase(key.replace(/Changed$/, "")));
    if (changedFields.length === 0) {
      return "Profile details updated.";
    }
    return `Changed ${changedFields.join(", ")}.`;
  }

  if (action === "PREFERENCE_UPDATE") {
    const key = typeof map.key === "string" ? toTitleCase(map.key) : "Preference";
    const value = map.value;
    if (typeof value === "boolean") {
      return `${key} ${value ? "enabled" : "disabled"}.`;
    }
    return `${key} changed to ${String(value)}.`;
  }

  if (action === "SECURITY_PASSWORD_CHANGE") {
    return "Password was updated.";
  }

  if (action === "SECURITY_SESSION_REVOKE") {
    return "A single session was revoked.";
  }

  if (action === "SECURITY_SESSIONS_REVOKE_ALL") {
    const count = typeof map.revokedSessionCount === "number" ? map.revokedSessionCount : null;
    return count !== null
      ? `Logged out from ${count} other session${count === 1 ? "" : "s"}.`
      : "Logged out from all other sessions.";
  }

  const fallback = Object.entries(map)
    .slice(0, 2)
    .map(([key, value]) => `${toTitleCase(key)}: ${String(value)}`);

  return fallback.length > 0 ? fallback.join(" | ") : "No additional details.";
}

function getActionIcon(action: string): LucideIcon {
  if (action.startsWith("SECURITY_")) return ShieldCheck;
  if (action.startsWith("PROFILE_")) return User;
  if (action.startsWith("PREFERENCE_")) return Bell;
  return CalendarDays;
}

function buildQueryString(
  searchParams: URLSearchParams,
  updates: Record<string, string | null>
): string {
  const params = new URLSearchParams(searchParams.toString());

  Object.entries(updates).forEach(([key, value]) => {
    if (!value) {
      params.delete(key);
      return;
    }
    params.set(key, value);
  });

  const query = params.toString();
  return query ? `?${query}` : "";
}

function ActivityTableLoadingOverlay() {
  return (
    <div className="absolute inset-0 z-10 rounded-lg bg-white/85 p-4 backdrop-blur-sm">
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export function ActivityTable({ data }: ActivityTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentActionFilter = data.filters.action;
  const currentCategoryFilter = data.filters.category;
  const currentStartDate = data.filters.startDate;
  const currentEndDate = data.filters.endDate;

  const totalRangeLabel = useMemo(() => {
    if (data.totalCount === 0) return "No activity found.";
    const start = (data.currentPage - 1) * data.pageSize + 1;
    const end = Math.min(start + data.pageSize - 1, data.totalCount);
    return `Showing ${start}-${end} of ${data.totalCount} activities`;
  }, [data.currentPage, data.pageSize, data.totalCount]);

  const navigateWithUpdates = (updates: Record<string, string | null>) => {
    const query = buildQueryString(searchParams, updates);
    startTransition(() => {
      router.replace(`${pathname}${query}`, { scroll: false });
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {activityCategoryFilterOptions.map((chip) => {
          const isActive = currentCategoryFilter === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() =>
                navigateWithUpdates({
                  category: chip.value === "ALL" ? null : chip.value,
                  action: null,
                  page: "1",
                })
              }
              aria-pressed={isActive}
              aria-label={`Filter by ${chip.label}`}
            >
              <Badge
                variant={isActive ? "default" : "outline"}
                className="cursor-pointer rounded-full px-3 py-1 text-xs"
              >
                {chip.label}
              </Badge>
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="md:col-span-2">
          <Select
            value={currentActionFilter}
            onValueChange={(value) =>
              navigateWithUpdates({
                category: null,
                action: value === "ALL" ? null : value,
                page: "1",
              })
            }
          >
            <SelectTrigger aria-label="Filter activity by action">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              {activityActionFilterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Input
          type="date"
          aria-label="Filter activity start date"
          value={currentStartDate}
          onChange={(event) =>
            navigateWithUpdates({
              startDate: event.target.value || null,
              page: "1",
            })
          }
        />
        <Input
          type="date"
          aria-label="Filter activity end date"
          value={currentEndDate}
          onChange={(event) =>
            navigateWithUpdates({
              endDate: event.target.value || null,
              page: "1",
            })
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{totalRangeLabel}</p>
      </div>

      <div className="relative rounded-lg border border-slate-200">
        {isPending ? <ActivityTableLoadingOverlay /> : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Activity</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Device / Network</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-slate-500">
                  No activity matches the current filters.
                </TableCell>
              </TableRow>
            ) : (
              data.rows.map((row) => {
                const config = activityActionRegistry[row.action as ActivityActionType];
                const label = config?.label ?? toTitleCase(row.action);
                const Icon = getActionIcon(row.action);
                const details = formatActivityMetadata(row.action, row.metadata);
                const ua = parseUserAgent(row.userAgent);

                return (
                  <TableRow key={row.id}>
                    <TableCell className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-slate-500" />
                        <span className="font-medium text-slate-900">{label}</span>
                      </div>
                      <Badge variant="outline" className="text-[11px]">
                        {row.entity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{details}</TableCell>
                    <TableCell className="space-y-1 text-sm">
                      <p className="text-slate-700">
                        {ua.browser} on {ua.device}
                      </p>
                      <p className="text-slate-500">IP: {row.ipAddress ?? "Unknown"}</p>
                    </TableCell>
                    <TableCell className="text-right text-sm text-slate-600">
                      {new Date(row.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous page"
              disabled={data.currentPage <= 1}
              onClick={() =>
                navigateWithUpdates({
                  page: String(Math.max(1, data.currentPage - 1)),
                })
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </PaginationItem>

          <PaginationItem>
            <PaginationLink isActive>{data.currentPage}</PaginationLink>
          </PaginationItem>

          <PaginationItem>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next page"
              disabled={data.currentPage >= data.totalPages}
              onClick={() =>
                navigateWithUpdates({
                  page: String(Math.min(data.totalPages, data.currentPage + 1)),
                })
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
