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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOnboardingStore, STEP_ORDER, STEP_INDEX } from "@/stores/onboarding.store";
import { WelcomeStep } from "./welcome-step";
import { EnvironmentStep } from "./environment-step";
import { AccountStep } from "./account-step";
import { CompleteStep } from "./complete-step";
import { Check, ChevronRight, ChevronLeft } from "lucide-react";

const STEP_LABELS = [
  "setup.steps.welcome",
  "setup.steps.environment",
  "setup.steps.account",
  "setup.steps.complete",
] as const;

function StepIndicator() {
  const { t } = useTranslation();
  const step = useOnboardingStore((s) => s.step);
  const currentIdx = STEP_INDEX[step];

  return (
    <nav className="mb-8" aria-label={t("setup.steps.progress")}>
      <ol className="flex items-center justify-center gap-2">
        {STEP_ORDER.map((key, idx) => {
          const isActive = idx === currentIdx;
          const isDone = idx < currentIdx;
          return (
            <li key={key} className="flex items-center gap-2">
              <span
                className={`flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? <Check className="size-4" /> : idx + 1}
              </span>
              <span
                className={`hidden text-sm sm:inline ${
                  isActive ? "font-medium text-foreground" : isDone ? "text-muted-foreground" : "text-muted-foreground/60"
                }`}
              >
                {t(STEP_LABELS[idx])}
              </span>
              {idx < STEP_ORDER.length - 1 && (
                <span className="mx-1 hidden h-px w-8 bg-border sm:block" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepContent() {
  const step = useOnboardingStore((s) => s.step);

  switch (step) {
    case "welcome":
      return <WelcomeStep />;
    case "environment":
      return <EnvironmentStep />;
    case "account":
      return <AccountStep />;
    case "complete":
      return <CompleteStep />;
  }
}

function StepNavigation() {
  const { t } = useTranslation();
  const step = useOnboardingStore((s) => s.step);
  const next = useOnboardingStore((s) => s.next);
  const prev = useOnboardingStore((s) => s.prev);
  const idx = STEP_INDEX[step];
  const isFirst = idx === 0;
  const isLast = idx === STEP_ORDER.length - 1;

  return (
    <div className="mt-8 flex items-center justify-between">
      <div>
        {!isFirst && (
          <Button variant="outline" onClick={prev}>
            <ChevronLeft className="size-4" />
            {t("common.back")}
          </Button>
        )}
      </div>
      {!isLast && (
        <Button onClick={next}>
          {t("setup.next")}
          <ChevronRight className="size-4" />
        </Button>
      )}
    </div>
  );
}

export function SetupPage() {
  const { t } = useTranslation();

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("setup.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <StepIndicator />
          <StepContent />
          <StepNavigation />
        </CardContent>
      </Card>
    </div>
  );
}
