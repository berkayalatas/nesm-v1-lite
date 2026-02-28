import { put } from "@vercel/blob";
import fs from "node:fs/promises";
import path from "node:path";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const isBlobTokenConfigured = Boolean(
  process.env.BLOB_READ_WRITE_TOKEN &&
    process.env.BLOB_READ_WRITE_TOKEN !== "local-dev-placeholder-token"
);

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

    if (!isBlobTokenConfigured) {
      throw new Error("Vercel Blob storage is not configured.");
    }

    try {
      const blob = await put(buildAvatarPath(file.name), file, {
        access: "public",
        addRandomSuffix: false,
      });

      return blob.url;
    } catch (error) {
      throw error;
    }
  },
};

const localFileSystemAvatarStorage: AvatarStorageAdapter = {
  async uploadAvatar(file: File): Promise<string> {
    ensureSupportedAvatar(file);
    const buffer = Buffer.from(await file.arrayBuffer());
    const publicDir = path.join(process.cwd(), "public", "avatars");

    try {
      await fs.access(publicDir);
    } catch {
      await fs.mkdir(publicDir, { recursive: true });
    }

    const filename = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const filePath = path.join(publicDir, filename);
    await fs.writeFile(filePath, buffer);

    return `/avatars/${filename}`;
  },
};

let avatarStorageAdapter: AvatarStorageAdapter = isBlobTokenConfigured
  ? vercelBlobAvatarStorage
  : localFileSystemAvatarStorage;

export function setAvatarStorageAdapter(adapter: AvatarStorageAdapter): void {
  avatarStorageAdapter = adapter;
}

export async function uploadAvatar(file: File): Promise<string> {
  return avatarStorageAdapter.uploadAvatar(file);
}
