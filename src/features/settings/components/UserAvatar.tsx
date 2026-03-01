"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserAvatarProps = {
  image: string | null | undefined;
  fallback: string;
  className?: string;
  avatarKey?: string;
};

export function UserAvatar({ image, fallback, className, avatarKey }: UserAvatarProps) {
  return (
    <Avatar key={avatarKey} className={className}>
      <AvatarImage src={image ?? undefined} alt="Profile avatar" />
      <AvatarFallback className="bg-slate-100 text-slate-700">{fallback}</AvatarFallback>
    </Avatar>
  );
}
