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
import { Server, Shield, Zap } from "lucide-react";

export function WelcomeStep() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto max-w-md space-y-4">
        <h2 className="text-xl font-semibold">{t("setup.welcome.heading")}</h2>
        <p className="text-muted-foreground">{t("setup.welcome.description")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2 rounded-lg border p-4">
          <Server className="mx-auto size-8 text-primary" />
          <h3 className="font-medium">{t("setup.welcome.feature1Title")}</h3>
          <p className="text-sm text-muted-foreground">{t("setup.welcome.feature1Desc")}</p>
        </div>
        <div className="space-y-2 rounded-lg border p-4">
          <Shield className="mx-auto size-8 text-primary" />
          <h3 className="font-medium">{t("setup.welcome.feature2Title")}</h3>
          <p className="text-sm text-muted-foreground">{t("setup.welcome.feature2Desc")}</p>
        </div>
        <div className="space-y-2 rounded-lg border p-4">
          <Zap className="mx-auto size-8 text-primary" />
          <h3 className="font-medium">{t("setup.welcome.feature3Title")}</h3>
          <p className="text-sm text-muted-foreground">{t("setup.welcome.feature3Desc")}</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{t("setup.welcome.footer")}</p>
    </div>
  );
}
