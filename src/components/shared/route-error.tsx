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


import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RouteErrorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const error = useRouteError();

  let title = t("error.page.title");
  let description = t("error.page.description");

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    if (typeof error.data === "string") {
      description = error.data;
    }
  } else if (error instanceof Error) {
    description = error.message;
  }

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t("error.page.refresh")}
          </Button>
          <Button onClick={() => navigate("/login", { replace: true })}>
            {t("error.page.backToLogin")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}