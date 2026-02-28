export const settingsRoutes = {
  profile: "/settings",
  security: "/settings/security",
  sessions: "/settings/sessions",
  preferences: "/settings/preferences",
  activity: "/settings/activity",
  welcome: "/settings/welcome",
} as const;

export const authRoutes = {
  signIn: "/signin",
} as const;

export function getSignInRoute(callbackPath?: string) {
  if (!callbackPath) return authRoutes.signIn;

  return `${authRoutes.signIn}?callbackUrl=${encodeURIComponent(callbackPath)}`;
}

export const appRoutes = {
  home: "/",
} as const;
