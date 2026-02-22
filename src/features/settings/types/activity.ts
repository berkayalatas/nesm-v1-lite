export const activityActionRegistry = {
  PROFILE_UPDATE: { label: "Profile Updated", category: "profile" },
  SECURITY_PASSWORD_CHANGE: {
    label: "Password Changed",
    category: "security",
  },
  SECURITY_SESSION_REVOKE: {
    label: "Session Revoked",
    category: "security",
  },
  SECURITY_SESSIONS_REVOKE_ALL: {
    label: "Other Sessions Logged Out",
    category: "security",
  },
  PREFERENCE_UPDATE: {
    label: "Preference Updated",
    category: "preferences",
  },
} as const;

export type ActivityActionType = keyof typeof activityActionRegistry;
export type ActivityCategoryType =
  | (typeof activityActionRegistry)[ActivityActionType]["category"]
  | "ALL";

export const activityActionFilterOptions = [
  { value: "ALL", label: "All Activities" },
  ...Object.entries(activityActionRegistry).map(([value, config]) => ({
    value,
    label: config.label,
  })),
] as const;

export const activityCategoryFilterOptions = [
  { value: "ALL", label: "All" },
  { value: "security", label: "Security" },
  { value: "profile", label: "Profile" },
  { value: "preferences", label: "Preferences" },
] as const;

export type ActivityLogFilters = {
  page: number;
  category: ActivityCategoryType;
  action: ActivityActionType | "ALL";
  startDate: string;
  endDate: string;
};

export type ActivityLogQueryParams = {
  page?: string | string[] | undefined;
  category?: string | string[] | undefined;
  action?: string | string[] | undefined;
  startDate?: string | string[] | undefined;
  endDate?: string | string[] | undefined;
};

export type ActivityLogRow = {
  id: string;
  action: string;
  entity: string;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type ActivityLogsResult = {
  rows: ActivityLogRow[];
  totalPages: number;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filters: ActivityLogFilters;
};
