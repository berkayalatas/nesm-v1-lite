"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/features/settings/lib/auth";
import { settingsRoutes } from "@/features/settings/lib/routes";

export type SignInActionState = {
  message: string;
};

function isSafeCallbackUrl(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//");
}

function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

export async function signInWithCredentials(
  _prevState: SignInActionState,
  formData: FormData
): Promise<SignInActionState> {
  const email = typeof formData.get("email") === "string" ? String(formData.get("email")).trim() : "";
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const callbackUrl =
    typeof formData.get("callbackUrl") === "string"
      ? String(formData.get("callbackUrl"))
      : settingsRoutes.profile;

  if (!email || !password) {
    return { message: "Please enter both email and password." };
  }

  if (!isSafeCallbackUrl(callbackUrl)) {
    return { message: "Invalid callback URL. Please sign in again." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
    return { message: "" };
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    const errorType =
      error instanceof AuthError
        ? error.type
        : typeof error === "object" && error && "type" in error
          ? String((error as { type?: unknown }).type ?? "")
          : "";

    if (errorType === "CredentialsSignin") {
      return { message: "Invalid email or password." };
    }
    if (errorType === "InvalidCallbackUrl") {
      return { message: "Invalid callback URL. Please sign in again." };
    }
    return { message: "Unable to sign in right now. Please try again." };
  }
}
