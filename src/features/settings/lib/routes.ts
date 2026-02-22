export const settingsRoutes = {
  profile: "/settings",
  security: "/settings/security",
  sessions: "/settings/sessions",
  preferences: "/settings/preferences",
  activity: "/settings/activity",
  welcome: "/settings/welcome",
} as const;

export const authRoutes = {
  signIn: "/api/auth/signin",
} as const;

export const appRoutes = {
  home: "/",
} as const;
