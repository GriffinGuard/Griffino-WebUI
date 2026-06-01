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


import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSystemStore } from "@/stores/system.store";
import { usePolling } from "@/hooks/use-polling";
import { CardSkeleton } from "@/components/shared/skeletons/card-skeleton";

export function SystemPage() {
  const { t } = useTranslation();
  const data = useSystemStore((state) => state.data);
  const loading = useSystemStore((state) => state.loading);
  const load = useSystemStore((state) => state.load);

  const refresh = useCallback(() => {
    void load();
  }, [load]);

  usePolling(refresh, 15000);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav.admin.system")}
        description={t("system.page.description")}
      />
      {loading ? (
        <div className="grid gap-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <CardSkeleton lines={5} />
            <CardSkeleton lines={5} />
          </div>
          <CardSkeleton lines={4} />
        </div>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>RabbitMQ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>{t("system.container")}: {data?.rabbitmq?.containerName ?? "—"}</div>
                <div>{t("system.amqpPort")}: {data?.rabbitmq?.amqpPort ?? "—"}</div>
                <div>{t("system.managementPort")}: {data?.rabbitmq?.managementPort ?? "—"}</div>
                <div>{t("system.bind")}: {data?.rabbitmq?.bindMode ?? "—"}</div>
                <div>{t("system.image")}: {data?.rabbitmq?.image ?? "—"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Redis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>{t("system.container")}: {data?.redis?.containerName ?? "—"}</div>
                <div>{t("system.port")}: {data?.redis?.port ?? "—"}</div>
                <div>{t("system.persistence")}: {data?.redis?.persistence ?? "—"}</div>
                <div>{t("system.bind")}: {data?.redis?.bindMode ?? "—"}</div>
                <div>{t("system.image")}: {data?.redis?.image ?? "—"}</div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Griffino Daemon</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm md:grid-cols-2">
              <div>{t("system.apiEndpoint")}: {data?.daemon?.apiEndpoint ?? "—"}</div>
              <div>{t("system.systemNetwork")}: {data?.daemon?.systemNetwork ?? "—"}</div>
              <div>{t("system.databasePath")}: {data?.daemon?.databasePath ?? "—"}</div>
              <div>{t("system.webUiStatus")}: {data?.daemon?.webUiStatus ?? "—"}</div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}