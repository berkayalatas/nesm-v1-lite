import Link from "next/link";
import { CheckCircle2, Rocket, Sparkles, Wrench } from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/features/settings/lib/auth";
import { authRoutes, settingsRoutes } from "@/features/settings/lib/routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const features = [
  "Profile editing with avatar upload support",
  "Password security and session management",
  "Optimistic notification preferences",
  "Paginated and filterable activity logs",
];

const nextSteps = [
  "Customize theme behavior for your design system.",
  "Connect your email/SMS provider for production alerts.",
  "Hook onboarding events into your analytics pipeline.",
];

export default async function SettingsWelcomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(authRoutes.signIn);
  }

  const isProduction = process.env.NODE_ENV === "production";

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50">
        <div className="space-y-5 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="rounded-full border border-emerald-300 bg-emerald-100/80 text-emerald-800">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              Developer Mode Only
            </Badge>
            {isProduction ? (
              <Badge variant="destructive" className="rounded-full">
                Production Notice
              </Badge>
            ) : null}
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Module Integrated Successfully!
            </h1>
            <p className="max-w-2xl text-sm text-slate-600">
              NESM settings is active and ready to extend. You can now ship account controls with
              auditability and modern UX out of the box.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            System checks complete
          </div>
        </div>
      </div>

      {isProduction ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          This page is intended for onboarding and should be hidden or removed in production
          deployments.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
            <Rocket className="h-4 w-4 text-slate-600" />
            Active Features
          </h2>
          <ul className="space-y-2 text-sm text-slate-600">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
            <Wrench className="h-4 w-4 text-slate-600" />
            Next Steps
          </h2>
          <ul className="space-y-2 text-sm text-slate-600">
            {nextSteps.map((step) => (
              <li key={step} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <Button asChild>
          <Link href={settingsRoutes.profile}>Go to Profile Settings</Link>
        </Button>
      </div>
    </section>
  );
}
