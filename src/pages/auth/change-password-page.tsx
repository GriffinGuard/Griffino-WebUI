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


import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { changePassword } from "@/api/auth.api";
import { useAuthStore } from "@/stores/auth.store";
import { DEFAULT_ROUTE_BY_ROLE } from "@/lib/route-map";
import { useToastError } from "@/hooks/use-toast-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function ChangePasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const markPasswordChanged = useAuthStore((state) => state.markPasswordChanged);
  const toastError = useToastError();
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
      if (user) {
        navigate(DEFAULT_ROUTE_BY_ROLE[user.role], { replace: true });
      }
    } catch (error) {
      toastError(error, t("auth.changePassword.failed"));
    }
  });

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("auth.changePassword.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label>{t("auth.changePassword.currentPassword")}</Label>
              <Input type="password" {...form.register("currentPassword")} />
            </div>
            <div className="space-y-2">
              <Label>{t("auth.changePassword.newPassword")}</Label>
              <Input type="password" {...form.register("newPassword")} />
            </div>
            <div className="space-y-2">
              <Label>{t("auth.changePassword.confirmPassword")}</Label>
              <Input type="password" {...form.register("confirmPassword")} />
            </div>
            <Button className="w-full" disabled={form.formState.isSubmitting}>
              {t("auth.changePassword.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}