"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Sparkles, X } from "lucide-react";

import { settingsRoutes } from "@/features/settings/lib/routes";
import { Button } from "@/components/ui/button";

type WelcomeBannerProps = {
  forceShow?: boolean;
};

const DISMISS_KEY = "nesm_welcome_banner_dismissed";

function subscribeToStorage(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function getDismissedSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.sessionStorage.getItem(DISMISS_KEY) === "1";
}

export function WelcomeBanner({ forceShow = false }: WelcomeBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const dismissedFromSession = useSyncExternalStore(
    subscribeToStorage,
    getDismissedSnapshot,
    () => false
  );

  const visible = useMemo(() => {
    if (forceShow) return true;
    return !dismissed && !dismissedFromSession;
  }, [dismissed, dismissedFromSession, forceShow]);

  if (!visible) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">NESM module is ready.</p>
          <p className="text-sm text-slate-600">
            See onboarding tips and recommended next steps for your team.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="default">
          <Link href={`${settingsRoutes.welcome}?from=settings`}>Open Welcome</Link>
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Dismiss welcome banner"
          onClick={() => {
            window.sessionStorage.setItem(DISMISS_KEY, "1");
            setDismissed(true);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
