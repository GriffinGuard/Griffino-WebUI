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


import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getSystemStatus } from "@/api/system.api";
import { useOnboardingStore } from "@/stores/onboarding.store";
import { useToastError } from "@/hooks/use-toast-error";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, RefreshCw, Container, Database } from "lucide-react";

interface CheckItem {
  name: string;
  status: "ok" | "missing";
  detail: string;
}

function buildCheckList(status: ReturnType<typeof useOnboardingStore.getState>["systemStatus"]): CheckItem[] {
  if (!status) {
    return [
      { name: "Docker", status: "missing", detail: "" },
      { name: "RabbitMQ", status: "missing", detail: "" },
      { name: "Redis", status: "missing", detail: "" },
    ];
  }

  const dockerOk = status.docker?.available === true;
  const rmqOk = status.rabbitmq?.healthy === true;
  const redisOk = status.redis?.healthy === true;

  return [
    {
      name: "Docker",
      status: dockerOk ? "ok" : "missing",
      detail: dockerOk ? "Running" : "",
    },
    {
      name: "RabbitMQ",
      status: rmqOk ? "ok" : "missing",
      detail: rmqOk
        ? `${status.rabbitmq.containerName}:${status.rabbitmq.amqpPort}`
        : status.rabbitmq.containerName
          ? `${status.rabbitmq.containerName}:${status.rabbitmq.amqpPort} (unhealthy)`
          : "",
    },
    {
      name: "Redis",
      status: redisOk ? "ok" : "missing",
      detail: redisOk
        ? `${status.redis.containerName}:${status.redis.port}`
        : status.redis.containerName
          ? `${status.redis.containerName}:${status.redis.port} (unhealthy)`
          : "",
    },
  ];
}

function StatusIcon({ status }: { status: CheckItem["status"] }) {
  switch (status) {
    case "ok":
      return <CheckCircle2 className="size-5 text-green-500" />;
    case "missing":
      return <XCircle className="size-5 text-red-500" />;
  }
}

export function EnvironmentStep() {
  const { t } = useTranslation();
  const toastError = useToastError();
  const systemStatus = useOnboardingStore((s) => s.systemStatus);
  const setSystemStatus = useOnboardingStore((s) => s.setSystemStatus);
  const loading = useOnboardingStore((s) => s.loading);
  const setLoading = useOnboardingStore((s) => s.setLoading);

  const checks = buildCheckList(systemStatus);

  const dockerOk = systemStatus?.docker?.available === true;
  const rmqOk = systemStatus?.rabbitmq?.healthy === true;
  const redisOk = systemStatus?.redis?.healthy === true;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSystemStatus();
      setSystemStatus(data);
    } catch (err) {
      toastError(err, t("setup.environment.fetchFailed"));
    } finally {
      setLoading(false);
    }
  }, [setLoading, setSystemStatus, toastError, t]);

  useEffect(() => {
    if (!systemStatus) {
      void refresh();
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">{t("setup.environment.heading")}</h2>
        <p className="text-muted-foreground">{t("setup.environment.description")}</p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </>
        ) : (
          checks.map((check) => (
            <div
              key={check.name}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <StatusIcon status={check.status} />
                <div>
                  <p className="font-medium">{check.name}</p>
                  {check.detail && (
                    <p className="text-xs text-muted-foreground">{check.detail}</p>
                  )}
                </div>
              </div>
              <span className="text-sm text-muted-foreground">
                {check.status === "ok"
                  ? t("setup.environment.ready")
                  : t("setup.environment.notReady")}
              </span>
            </div>
          ))
        )}
      </div>

      {systemStatus && !dockerOk && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
          <div className="flex items-start gap-3">
            <Container className="mt-0.5 size-5 shrink-0 text-yellow-500" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-yellow-600 dark:text-yellow-400">
                {t("setup.environment.dockerHintTitle")}
              </p>
              <p className="text-muted-foreground">{t("setup.environment.dockerHint")}</p>
            </div>
          </div>
        </div>
      )}

      {systemStatus && (!rmqOk || !redisOk) && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
          <div className="flex items-start gap-3">
            <Database className="mt-0.5 size-5 shrink-0 text-blue-500" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-blue-600 dark:text-blue-400">
                {t("setup.environment.brokerHintTitle")}
              </p>
              <p className="text-muted-foreground">{t("setup.environment.brokerHint")}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <Button variant="outline" onClick={refresh} disabled={loading}>
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          {t("setup.environment.recheck")}
        </Button>
      </div>
    </div>
  );
}
