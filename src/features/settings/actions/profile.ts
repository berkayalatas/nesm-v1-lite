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

const MAX_AVATAR_URL_LENGTH = 1024;
const DICEBEAR_INITIALS_URL_PREFIX = "https://api.dicebear.com/7.x/initials/svg";

function isPersistableAvatarUrl(value: string | undefined): value is string {
  if (!value) return false;
  if (value.startsWith("data:")) return false;
  if (value.length > MAX_AVATAR_URL_LENGTH) return false;
  if (value.startsWith(DICEBEAR_INITIALS_URL_PREFIX)) return false;
  return true;
}

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
      avatarUrl = await uploadAvatar(avatarFile, parsed.data.name);
    } catch (error) {
      const avatarMessage = error instanceof Error ? error.message : "Avatar upload failed.";
      return fail("Avatar upload failed.", { avatar: [avatarMessage] });
    }
  }

  if (avatarUrl && (avatarUrl.startsWith("data:") || avatarUrl.length > MAX_AVATAR_URL_LENGTH)) {
    return fail("Avatar upload failed.", {
      avatar: ["Avatar URL is invalid. Please upload a different image."],
    });
  }

  const requestHeaders = await headers();
  const ipAddress = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = requestHeaders.get("user-agent");
  let updatedUser: {
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    image: string | null;
  } | null = null;

  try {
    await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { id: session.user.id },
        select: {
          name: true,
          email: true,
          avatarUrl: true,
          image: true,
        },
      });

      if (!existingUser) {
        throw new Error("User not found.");
      }

      const shouldPersistAvatar = isPersistableAvatarUrl(avatarUrl);

      updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          ...(shouldPersistAvatar ? { avatarUrl, image: avatarUrl } : {}),
        },
        select: {
          name: true,
          email: true,
          avatarUrl: true,
          image: true,
        },
      });

      // Clear the Next.js Data Cache immediately for all pages
      revalidatePath("/", "layout");
      revalidatePath("/settings");

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "PROFILE_UPDATE",
          entity: "USER",
          metadata: {
            nameChanged: existingUser.name !== updatedUser.name,
            emailChanged: existingUser.email !== updatedUser.email,
            avatarChanged:
              existingUser.avatarUrl !== updatedUser.avatarUrl ||
              existingUser.image !== updatedUser.image,
          },
          ipAddress,
          userAgent,
        },
      });
    });

    revalidatePath(settingsRoutes.profile);
    revalidatePath("/settings");
    revalidatePath("/settings/preferences");

    type UpdatedUser = {
      name: string | null;
      email: string | null;
      avatarUrl: string | null;
      image: string | null;
    };

    const persistedUser = updatedUser as UpdatedUser | null;

    return {
      success: true,
      message: "Profile updated successfully.",
      image: persistedUser ? persistedUser.image : null,
      profile: persistedUser
        ? {
            name: persistedUser.name ?? "",
            email: persistedUser.email ?? "",
            avatarUrl: persistedUser.avatarUrl,
            image: persistedUser.image,
          }
        : undefined,
    };
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
}
