"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/features/settings/lib/auth";
import { prisma } from "@/features/settings/lib/prisma";
import { settingsRoutes } from "@/features/settings/lib/routes";
import {
  getSecurityAuthAdapter,
} from "@/features/settings/lib/auth-adapter";
import { getCurrentSessionToken } from "@/features/settings/lib/session-token";
import {
  passwordChangeSchema,
  type SecurityActionState,
  type SessionActionState,
} from "@/features/settings/types/schemas";

function failedSecurity(message: string, errors?: SecurityActionState["errors"]): SecurityActionState {
  return { success: false, message, errors };
}

function failedSession(message: string): SessionActionState {
  return { success: false, message };
}

async function getRequestContext() {
  const requestHeaders = await headers();
  return {
    ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: requestHeaders.get("user-agent"),
  };
}

export async function changePassword(
  _prevState: SecurityActionState,
  formData: FormData
): Promise<SecurityActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return failedSecurity("You must be signed in to change your password.");
  }

  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return failedSecurity(
      "Please correct the highlighted fields.",
      parsed.error.flatten().fieldErrors
    );
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return failedSecurity("New password must be different from current password.", {
      newPassword: ["New password must be different from current password."],
    });
  }

  try {
    const adapter = getSecurityAuthAdapter();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    });

    if (!user?.password) {
      return failedSecurity("Password update is unavailable for this account.", {
        form: ["This account does not support password changes."],
      });
    }

    const isCurrentPasswordValid = await adapter.verifyPassword(
      parsed.data.currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return failedSecurity("Current password is incorrect.", {
        currentPassword: ["Current password is incorrect."],
      });
    }

    const passwordHash = await adapter.hashPassword(parsed.data.newPassword);
    const { ipAddress, userAgent } = await getRequestContext();

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: { password: passwordHash },
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "SECURITY_PASSWORD_CHANGE",
          entity: "USER",
          metadata: {
            reason: "user_initiated",
          },
          ipAddress,
          userAgent,
        },
      });
    });
  } catch {
    return failedSecurity("Unable to update password right now.", {
      form: ["Unexpected server error while changing password."],
    });
  }

  revalidatePath(settingsRoutes.security);

  return {
    success: true,
    message: "Password updated successfully.",
  };
}

export async function revokeSession(
  prevState: SessionActionState,
  formData: FormData
): Promise<SessionActionState> {
  void prevState;
  const session = await auth();
  if (!session?.user?.id) {
    return failedSession("You must be signed in to manage sessions.");
  }

  const tokenField = formData.get("sessionToken");
  const sessionToken = typeof tokenField === "string" ? tokenField : "";
  if (!sessionToken) {
    return failedSession("Session token is missing.");
  }

  try {
    const currentToken = await getCurrentSessionToken();
    if (!currentToken) {
      return failedSession("Current session token could not be resolved.");
    }

    if (sessionToken === currentToken) {
      return failedSession("You cannot revoke the current device from this action.");
    }

    const targetSession = await prisma.session.findFirst({
      where: {
        sessionToken,
        userId: session.user.id,
      },
      select: { sessionToken: true },
    });

    if (!targetSession) {
      return failedSession("Session not found or access denied.");
    }

    const adapter = getSecurityAuthAdapter();
    const { ipAddress, userAgent } = await getRequestContext();

    await adapter.revokeSession(targetSession.sessionToken);

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SECURITY_SESSION_REVOKE",
        entity: "SESSION",
        metadata: {
          revokedSessionToken: sessionToken,
        },
        ipAddress,
        userAgent,
      },
    });
  } catch {
    return failedSession("Unable to revoke the session. Please try again.");
  }

  revalidatePath(settingsRoutes.sessions);

  return {
    success: true,
    message: "Session revoked successfully.",
  };
}

export async function logoutOthers(
  prevState: SessionActionState,
  formData: FormData
): Promise<SessionActionState> {
  void prevState;
  void formData;
  const session = await auth();
  if (!session?.user?.id) {
    return failedSession("You must be signed in to manage sessions.");
  }

  try {
    const currentToken = await getCurrentSessionToken();
    if (!currentToken) {
      return failedSession("Current session token could not be resolved.");
    }

    const adapter = getSecurityAuthAdapter();
    const { ipAddress, userAgent } = await getRequestContext();

    const removed = await prisma.session.count({
      where: {
        userId: session.user.id,
        sessionToken: { not: currentToken },
      },
    });

    await adapter.logoutAllOtherSessions(session.user.id, currentToken);

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SECURITY_SESSIONS_REVOKE_ALL",
        entity: "SESSION",
        metadata: {
          revokedSessionCount: removed,
        },
        ipAddress,
        userAgent,
      },
    });
  } catch {
    return failedSession("Unable to log out other devices. Please try again.");
  }

  revalidatePath(settingsRoutes.sessions);

  return {
    success: true,
    message: "Logged out from all other devices.",
  };
}
