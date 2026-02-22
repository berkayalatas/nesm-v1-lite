"use server";

import { auth } from "@/features/settings/lib/auth";
import { prisma } from "@/features/settings/lib/prisma";
import {
  activityActionRegistry,
  type ActivityCategoryType,
  type ActivityActionType,
  type ActivityLogQueryParams,
  type ActivityLogsResult,
} from "@/features/settings/types/activity";

const DEFAULT_PAGE = 1;
const PAGE_SIZE = 12;

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function normalizeDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "";
  }
  return value;
}

function normalizeAction(value: string): ActivityActionType | "ALL" {
  if (!value) return "ALL";
  if (value in activityActionRegistry) {
    return value as ActivityActionType;
  }
  return "ALL";
}

function normalizeCategory(value: string): ActivityCategoryType {
  if (!value) return "ALL";
  if (value === "ALL") return "ALL";

  const validCategories = new Set<string>(
    Object.values(activityActionRegistry).map((item) => item.category)
  );

  if (validCategories.has(value)) {
    return value as ActivityCategoryType;
  }

  return "ALL";
}

function normalizePage(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return DEFAULT_PAGE;
  }
  return parsed;
}

function dateRange(startDate: string, endDate: string) {
  const hasStart = Boolean(startDate);
  const hasEnd = Boolean(endDate);
  if (!hasStart && !hasEnd) return undefined;

  const createdAt: { gte?: Date; lt?: Date } = {};

  if (hasStart) {
    createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
  }

  if (hasEnd) {
    const dayEndExclusive = new Date(`${endDate}T00:00:00.000Z`);
    dayEndExclusive.setUTCDate(dayEndExclusive.getUTCDate() + 1);
    createdAt.lt = dayEndExclusive;
  }

  return createdAt;
}

export async function getActivityLogs(
  rawParams: ActivityLogQueryParams
): Promise<ActivityLogsResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      rows: [],
      totalPages: 1,
      totalCount: 0,
      currentPage: 1,
      pageSize: PAGE_SIZE,
      filters: {
        page: 1,
        category: "ALL",
        action: "ALL",
        startDate: "",
        endDate: "",
      },
      error: "You must be signed in to view activity logs.",
    };
  }

  const action = normalizeAction(firstValue(rawParams.action));
  const category = normalizeCategory(firstValue(rawParams.category));
  const startDate = normalizeDate(firstValue(rawParams.startDate));
  const endDate = normalizeDate(firstValue(rawParams.endDate));
  const requestedPage = normalizePage(firstValue(rawParams.page));
  const createdAtFilter = dateRange(startDate, endDate);
  const actionsForCategory =
    category === "ALL"
      ? null
      : (Object.entries(activityActionRegistry)
          .filter(([, config]) => config.category === category)
          .map(([name]) => name) as ActivityActionType[]);

  const actionFilter =
    action !== "ALL"
      ? action
      : actionsForCategory && actionsForCategory.length > 0
        ? { in: actionsForCategory }
        : undefined;

  const where = {
    userId: session.user.id,
    ...(actionFilter ? { action: actionFilter } : {}),
    ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
  };

  try {
    const totalCount = await prisma.auditLog.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const currentPage = Math.min(requestedPage, totalPages);
    const offset = (currentPage - 1) * PAGE_SIZE;

    const rows = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: PAGE_SIZE,
      select: {
        id: true,
        action: true,
        entity: true,
        metadata: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
    });

    return {
      rows: rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
      totalPages,
      totalCount,
      currentPage,
      pageSize: PAGE_SIZE,
      filters: {
        page: currentPage,
        category,
        action,
        startDate,
        endDate,
      },
    };
  } catch {
    return {
      rows: [],
      totalPages: 1,
      totalCount: 0,
      currentPage: 1,
      pageSize: PAGE_SIZE,
      filters: {
        page: 1,
        category,
        action,
        startDate,
        endDate,
      },
      error: "Unable to load activity logs right now. Please try again.",
    };
  }
}
