"use client";

import { useActionState, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { changePassword } from "@/features/settings/actions/security";
import {
  passwordChangeSchema,
  securityActionInitialState,
  type PasswordChangeSchema,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

type PasswordField = "currentPassword" | "newPassword" | "confirmPassword";

export function PasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changePassword,
    securityActionInitialState
  );
  const [visible, setVisible] = useState<Record<PasswordField, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const { toast } = useToast();

  const form = useForm<PasswordChangeSchema>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (!state.message) return;

    if (state.success) {
      toast.success(state.message);
      form.reset();
      return;
    }

    toast.error(state.message);

    if (!state.errors) return;
    (Object.keys(state.errors) as Array<keyof typeof state.errors>).forEach((key) => {
      if (key === "form") return;
      const value = state.errors?.[key];
      if (!value?.[0]) return;
      form.setError(key, { message: value[0] });
    });
  }, [form, state, toast]);

  const onSubmit = form.handleSubmit((values) => {
    const data = new FormData();
    data.set("currentPassword", values.currentPassword);
    data.set("newPassword", values.newPassword);
    data.set("confirmPassword", values.confirmPassword);
    formAction(data);
  });

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Password Security</CardTitle>
        <CardDescription>
          Use a strong password and rotate it regularly to reduce account risk.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-5" onSubmit={onSubmit}>
            {([
              ["currentPassword", "Current Password"],
              ["newPassword", "New Password"],
              ["confirmPassword", "Confirm New Password"],
            ] as const).map(([name, label]) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={visible[name] ? "text" : "password"}
                          autoComplete={
                            name === "currentPassword" ? "current-password" : "new-password"
                          }
                          placeholder={label}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          aria-label={visible[name] ? `Hide ${label}` : `Show ${label}`}
                          onClick={() =>
                            setVisible((prev) => ({ ...prev, [name]: !prev[name] }))
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        >
                          {visible[name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            {state.errors?.form?.[0] ? (
              <p className="text-sm text-red-600">{state.errors.form[0]}</p>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
