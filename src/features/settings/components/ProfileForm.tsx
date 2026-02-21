"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { Camera } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { updateProfile } from "@/features/settings/actions/profile";
import {
  profileActionInitialState,
  profileSchema,
  type ProfileSchema,
} from "@/features/settings/types/schemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";

type ProfileFormProps = {
  initialData: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "U";
  const second = parts[1]?.[0] ?? "";
  return `${first}${second}`.toUpperCase();
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [state, formAction] = useActionState(updateProfile, profileActionInitialState);
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const form = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData.name,
      email: initialData.email,
    },
    mode: "onSubmit",
  });

  const previewUrl = useMemo(() => {
    if (!selectedFile) return initialData.avatarUrl;
    return URL.createObjectURL(selectedFile);
  }, [initialData.avatarUrl, selectedFile]);

  useEffect(() => {
    if (!selectedFile || !previewUrl?.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedFile, previewUrl]);

  useEffect(() => {
    if (!state.message) return;

    if (state.success) {
      toast.success(state.message);
      return;
    }

    toast.error(state.message);

    const fieldErrors = state.errors;
    if (!fieldErrors) return;

    (Object.keys(fieldErrors) as Array<keyof typeof fieldErrors>).forEach((key) => {
      if (key === "avatar" || key === "form") return;
      const value = fieldErrors[key];
      if (!value?.[0]) return;
      form.setError(key, { message: value[0] });
    });
  }, [form, state, toast]);

  const handleSubmit = form.handleSubmit((values) => {
    const payload = new FormData();
    payload.set("name", values.name);
    payload.set("email", values.email);

    if (selectedFile) {
      payload.set("avatar", selectedFile);
    }

    startTransition(() => {
      formAction(payload);
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-5">
          <p className="text-sm font-medium text-slate-900">Avatar</p>
          <p className="mt-1 text-sm text-slate-500">PNG, JPG, WEBP, or GIF up to 5MB.</p>

          <div className="mt-4 flex items-center gap-4">
            <Avatar className="h-16 w-16 border border-slate-200">
              <AvatarImage src={previewUrl ?? undefined} alt="Profile avatar" />
              <AvatarFallback className="bg-slate-100 text-slate-700">
                {initials(form.getValues("name"))}
              </AvatarFallback>
            </Avatar>

            <label
              htmlFor="avatar"
              className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              <Camera className="h-4 w-4" />
              Choose Avatar
            </label>
            <Input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setSelectedFile(file);
              }}
            />
          </div>
          {state.errors?.avatar?.[0] ? (
            <p className="mt-2 text-sm text-red-600">{state.errors.avatar[0]}</p>
          ) : null}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@company.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {state.errors?.form?.[0] ? (
          <p className="text-sm text-red-600">{state.errors.form[0]}</p>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
