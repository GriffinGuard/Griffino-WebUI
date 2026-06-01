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
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { useOnboardingStore } from "@/stores/onboarding.store";
import { completeSetup } from "@/api/setup.api";
import { DEFAULT_ROUTE_BY_ROLE } from "@/lib/route-map";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";

export function CompleteStep() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setSetupCompleted = useOnboardingStore((s) => s.setSetupCompleted);

  const handleEnter = async () => {
    try {
      await completeSetup();
      setSetupCompleted(true);
    } catch {
      // proceed even if the server call fails
      setSetupCompleted(true);
    }
    if (user) {
      navigate(DEFAULT_ROUTE_BY_ROLE[user.role], { replace: true });
    }
  };

  return (
    <div className="space-y-6 text-center">
      <CheckCircle2 className="mx-auto size-16 text-green-500" />
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{t("setup.complete.heading")}</h2>
        <p className="text-muted-foreground">{t("setup.complete.description")}</p>
      </div>
      <div className="flex justify-center">
        <Button size="lg" onClick={handleEnter}>
          {t("setup.complete.enterConsole")}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
