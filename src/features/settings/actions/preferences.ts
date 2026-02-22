"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/features/settings/lib/auth";
import { prisma } from "@/features/settings/lib/prisma";
import { settingsRoutes } from "@/features/settings/lib/routes";
import {
  preferenceUpdateSchema,
  preferencesSchema,
  type PreferenceActionState,
  type PreferenceUpdateInput,
} from "@/features/settings/types/schemas";

function failed(message: string): PreferenceActionState {
  return {
    success: false,
    message,
  };
}

async function getRequestContext() {
  const requestHeaders = await headers();
  return {
    ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: requestHeaders.get("user-agent"),
  };
}

export async function updatePreference(
  input: PreferenceUpdateInput
): Promise<PreferenceActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return failed("You must be signed in to update preferences.");
  }

  const parsed = preferenceUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return failed("Invalid preference update payload.");
  }

  const { key, value } = parsed.data;
  const { ipAddress, userAgent } = await getRequestContext();

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const preferences = await tx.userPreferences.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          [key]: value,
        },
        update: {
          [key]: value,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "PREFERENCE_UPDATE",
          entity: "USER_PREFERENCES",
          metadata: {
            key,
            value,
          },
          ipAddress,
          userAgent,
        },
      });

      return preferences;
    });

    const validatedPreferences = preferencesSchema.safeParse({
      marketingEmails: updated.marketingEmails,
      securityAlerts: updated.securityAlerts,
      theme: updated.theme,
    });

    if (!validatedPreferences.success) {
      return failed("Preferences were updated but response validation failed.");
    }

    revalidatePath(settingsRoutes.preferences);

    return {
      success: true,
      message: "Preference updated.",
      preferences: validatedPreferences.data,
    };
  } catch {
    return failed("Unable to update preference. Please try again.");
  }
}
