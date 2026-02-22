"use client";

import { useOptimistic, useState, useTransition } from "react";

import { updatePreference } from "@/features/settings/actions/preferences";
import type { PreferenceKey, PreferencesSchema } from "@/features/settings/types/schemas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

type PreferenceToggleKey = Extract<PreferenceKey, "marketingEmails" | "securityAlerts">;

type OptimisticUpdate = {
  key: PreferenceToggleKey;
  value: boolean;
};

type PreferencesFormProps = {
  initialPreferences: PreferencesSchema;
};

const preferenceItems: Array<{
  key: PreferenceToggleKey;
  title: string;
  description: string;
}> = [
  {
    key: "marketingEmails",
    title: "Marketing Emails",
    description: "Receive updates about new features, product improvements, and events.",
  },
  {
    key: "securityAlerts",
    title: "Security Alerts",
    description: "Get notified about sign-ins, password changes, and account security events.",
  },
];

export function PreferencesForm({ initialPreferences }: PreferencesFormProps) {
  const [serverPreferences, setServerPreferences] = useState(initialPreferences);
  const [isPending, startTransition] = useTransition();
  const [optimisticPreferences, addOptimisticPreference] = useOptimistic<
    PreferencesSchema,
    OptimisticUpdate
  >(serverPreferences, (state, update) => ({
    ...state,
    [update.key]: update.value,
  }));
  const { toast } = useToast();

  const handleToggle = (key: PreferenceToggleKey, checked: boolean) => {
    const previousValue = serverPreferences[key];
    addOptimisticPreference({ key, value: checked });

    startTransition(async () => {
      const result = await updatePreference({ key, value: checked });

      if (!result.success || !result.preferences) {
        setServerPreferences((prev) => ({ ...prev, [key]: previousValue }));
        toast.error(result.message || "Unable to save your preference.");
        return;
      }

      setServerPreferences(result.preferences);
    });
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Changes are saved automatically as soon as you toggle a setting.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {preferenceItems.map((item, index) => (
          <div key={item.key} className="space-y-4">
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.description}</p>
              </div>
              <Switch
                checked={optimisticPreferences[item.key]}
                onCheckedChange={(checked) => handleToggle(item.key, checked)}
                aria-label={item.title}
                disabled={isPending}
              />
            </div>
            {index < preferenceItems.length - 1 ? <Separator /> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
