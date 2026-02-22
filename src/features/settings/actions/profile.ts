"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { auth } from "@/features/settings/lib/auth";
import { prisma } from "@/features/settings/lib/prisma";
import { settingsRoutes } from "@/features/settings/lib/routes";
import { uploadAvatar } from "@/features/settings/lib/storage";
import {
  profileSchema,
  type ProfileActionErrors,
  type ProfileActionState,
} from "@/features/settings/types/schemas";

function fail(message: string, errors?: ProfileActionErrors): ProfileActionState {
  return {
    success: false,
    message,
    errors,
  };
}

export async function updateProfile(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return fail("You must be signed in to update your profile.");
  }

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return fail("Please correct the highlighted fields.", parsed.error.flatten().fieldErrors);
  }

  const avatarField = formData.get("avatar");
  const avatarFile = avatarField instanceof File && avatarField.size > 0 ? avatarField : null;

  let avatarUrl: string | undefined;

  if (avatarFile) {
    try {
      avatarUrl = await uploadAvatar(avatarFile);
    } catch (error) {
      const avatarMessage = error instanceof Error ? error.message : "Avatar upload failed.";
      return fail("Avatar upload failed.", { avatar: [avatarMessage] });
    }
  }

  const requestHeaders = await headers();
  const ipAddress = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = requestHeaders.get("user-agent");

  try {
    await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { id: session.user.id },
        select: {
          name: true,
          email: true,
          avatarUrl: true,
        },
      });

      if (!existingUser) {
        throw new Error("User not found.");
      }

      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          ...(avatarUrl ? { avatarUrl } : {}),
        },
        select: {
          name: true,
          email: true,
          avatarUrl: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "PROFILE_UPDATE",
          entity: "USER",
          metadata: {
            nameChanged: existingUser.name !== updatedUser.name,
            emailChanged: existingUser.email !== updatedUser.email,
            avatarChanged: existingUser.avatarUrl !== updatedUser.avatarUrl,
          },
          ipAddress,
          userAgent,
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return fail("Email is already in use.", {
        email: ["Email is already in use."],
      });
    }

    return fail("Unable to update profile. Please try again.", {
      form: ["Unexpected server error while saving profile."],
    });
  }

  revalidatePath(settingsRoutes.profile);

  return {
    success: true,
    message: "Profile updated successfully.",
  };
}
