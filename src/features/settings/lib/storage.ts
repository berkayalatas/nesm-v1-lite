import { put } from "@vercel/blob";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export interface AvatarStorageAdapter {
  uploadAvatar(file: File): Promise<string>;
}

function ensureSupportedAvatar(file: File): void {
  if (file.size <= 0) {
    throw new Error("Please select an avatar file.");
  }

  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Avatar must be 5MB or smaller.");
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Unsupported image type. Use JPG, PNG, WEBP, or GIF.");
  }
}

function buildAvatarPath(filename: string): string {
  const clean = filename.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  const ext = clean.includes(".") ? clean.split(".").at(-1) : "bin";
  return `avatars/${crypto.randomUUID()}.${ext}`;
}

const vercelBlobAvatarStorage: AvatarStorageAdapter = {
  async uploadAvatar(file: File): Promise<string> {
    ensureSupportedAvatar(file);

    const blob = await put(buildAvatarPath(file.name), file, {
      access: "public",
      addRandomSuffix: false,
    });

    return blob.url;
  },
};

let avatarStorageAdapter: AvatarStorageAdapter = vercelBlobAvatarStorage;

export function setAvatarStorageAdapter(adapter: AvatarStorageAdapter): void {
  avatarStorageAdapter = adapter;
}

export async function uploadAvatar(file: File): Promise<string> {
  return avatarStorageAdapter.uploadAvatar(file);
}
