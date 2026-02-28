"use client";

import Link from "next/link";
import { useActionState, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import {
  type SignInActionState,
  signInWithCredentials,
} from "@/app/signin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const signInActionInitialState: SignInActionState = { message: "" };

function getErrorMessage(errorCode: string | null): string {
  if (errorCode === "CredentialsSignin") return "Invalid email or password.";
  if (errorCode === "InvalidCallbackUrl") return "Invalid callback URL. Please sign in again.";
  return "";
}

export default function SignInPage() {
  const searchParams = useSearchParams();
  const [state, formAction, isPending] = useActionState(
    signInWithCredentials,
    signInActionInitialState
  );

  const callbackUrl = searchParams.get("callbackUrl") ?? "/settings";
  const queryErrorMessage = useMemo(
    () => getErrorMessage(searchParams.get("error")),
    [searchParams]
  );
  const message = state.message || queryErrorMessage;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center">
        <Card className="w-full border-white/10 bg-slate-900/70">
          <CardHeader>
            <CardTitle className="text-xl text-white">Sign in</CardTitle>
            <CardDescription>
              Access your NESM account settings dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-200">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  className="border-slate-600 bg-slate-800 text-white placeholder:text-slate-400 caret-white"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-200">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  className="border-slate-600 bg-slate-800 text-white placeholder:text-slate-400 caret-white"
                  required
                  autoComplete="current-password"
                />
              </div>
              {message ? (
                <p className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {message}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <p className="mt-4 text-xs text-slate-400">
              Return to{" "}
              <Link href="/" className="text-cyan-300 hover:underline">
                home
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
