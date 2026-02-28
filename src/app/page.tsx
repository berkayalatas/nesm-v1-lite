import Link from "next/link";
import { ArrowRight, CheckCircle2, Shield, SlidersHorizontal, Workflow } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16 sm:px-10 lg:px-14">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-8 shadow-2xl shadow-black/30 sm:p-12">
          <div className="absolute -left-24 top-0 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-56 w-56 rounded-full bg-indigo-400/10 blur-3xl" />

          <p className="mb-5 inline-flex items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-200">
            Next.js Enterprise Module
          </p>

          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">NESM V1.0</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-300">
            Enterprise Settings Module for Next.js
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/settings"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Go to Settings
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/settings/welcome"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
            >
              Preview Success
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <article className="rounded-xl border border-white/10 bg-white/5 p-4">
              <Shield className="h-4 w-4 text-cyan-300" />
              <h2 className="mt-3 text-sm font-semibold text-white">Security First</h2>
              <p className="mt-1 text-sm text-slate-300">Session governance and password controls.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-white/5 p-4">
              <SlidersHorizontal className="h-4 w-4 text-cyan-300" />
              <h2 className="mt-3 text-sm font-semibold text-white">Operational Control</h2>
              <p className="mt-1 text-sm text-slate-300">Profile, preferences, and role-aware access.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-white/5 p-4">
              <Workflow className="h-4 w-4 text-cyan-300" />
              <h2 className="mt-3 text-sm font-semibold text-white">Production Ready</h2>
              <p className="mt-1 text-sm text-slate-300">Consistent UX and audit-friendly workflows.</p>
            </article>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            Built for enterprise account settings delivery
          </div>
        </section>
      </main>
    </div>
  );
}
