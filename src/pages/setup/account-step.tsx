// Copyright 2025 GriffinGuard
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePassword } from "@/api/auth.api";
import { useAuthStore } from "@/stores/auth.store";
import { useOnboardingStore } from "@/stores/onboarding.store";
import { useToastError } from "@/hooks/use-toast-error";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function makeSchema(passwordMismatchMessage: string) {
  return z
    .object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
      confirmPassword: z.string().min(8),
    })
    .refine((value) => value.newPassword === value.confirmPassword, {
      path: ["confirmPassword"],
      message: passwordMismatchMessage,
    });
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

export function AccountStep() {
  const { t } = useTranslation();
  const toastError = useToastError();
  const markPasswordChanged = useAuthStore((s) => s.markPasswordChanged);
  const next = useOnboardingStore((s) => s.next);
  const user = useAuthStore((s) => s.user);

  const schema = makeSchema(t("auth.changePassword.passwordMismatch"));
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await changePassword({
        oldPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      markPasswordChanged();
      next();
    } catch (error) {
      toastError(error, t("auth.changePassword.failed"));
    }
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">{t("setup.account.heading")}</h2>
        <p className="text-muted-foreground">{t("setup.account.description")}</p>
      </div>

      {user && (
        <div className="rounded-lg border bg-muted/50 p-3 text-center text-sm">
          <span className="text-muted-foreground">{t("setup.account.loggedInAs")}: </span>
          <span className="font-medium">{user.username}</span>
        </div>
      )}

      <form className="mx-auto max-w-sm space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="currentPassword">{t("auth.changePassword.currentPassword")}</Label>
          <Input
            id="currentPassword"
            type="password"
            {...form.register("currentPassword")}
          />
          {form.formState.errors.currentPassword && (
            <p className="text-sm text-destructive">{form.formState.errors.currentPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">{t("auth.changePassword.newPassword")}</Label>
          <Input
            id="newPassword"
            type="password"
            {...form.register("newPassword")}
          />
          {form.formState.errors.newPassword && (
            <p className="text-sm text-destructive">{form.formState.errors.newPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t("auth.changePassword.confirmPassword")}</Label>
          <Input
            id="confirmPassword"
            type="password"
            {...form.register("confirmPassword")}
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t("common.saving") : t("auth.changePassword.submit")}
        </Button>
      </form>
    </div>
  );
}
