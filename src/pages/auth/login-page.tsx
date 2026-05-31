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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { login } from "@/api/auth.api";
import { useAuthStore } from "@/stores/auth.store";
import { DEFAULT_ROUTE_BY_ROLE } from "@/lib/route-map";
import { useToastError } from "@/hooks/use-toast-error";

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const toastError = useToastError();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await login(values);
      setSession({
        token: result.token,
        username: result.username,
        role: result.role,
        mustChangePassword: result.mustChange,
      });

      navigate(
        result.mustChange ? "/change-password" : DEFAULT_ROUTE_BY_ROLE[result.role],
        { replace: true },
      );
    } catch (error) {
      toastError(error, t("auth.login.failed"));
    }
  });

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-md bg-card/90 bg-panel-glow">
        <CardHeader>
          <CardTitle>{t("auth.login.title")}</CardTitle>
          <CardDescription>{t("auth.login.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">{t("auth.username")}</Label>
              <Input id="username" {...form.register("username")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" {...form.register("password")} />
            </div>
            <Button className="w-full" disabled={form.formState.isSubmitting}>
              {t("auth.login.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}