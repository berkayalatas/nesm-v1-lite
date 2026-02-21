import { cookies } from "next/headers";

const SESSION_COOKIE_KEYS = ["__Secure-authjs.session-token", "authjs.session-token"];

export async function getCurrentSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();

  for (const key of SESSION_COOKIE_KEYS) {
    const value = cookieStore.get(key)?.value;
    if (value) return value;
  }

  return null;
}
