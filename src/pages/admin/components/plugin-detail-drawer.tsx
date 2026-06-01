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
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Plugin } from "@/types/plugin";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function PluginDetailDrawer({
  plugin,
  onClose,
  onConfig,
  onStart,
  onStop,
  onUninstall,
}: {
  plugin: Plugin | null;
  onClose: () => void;
  onConfig: (plugin: Plugin) => void;
  onStart: (plugin: Plugin) => void;
  onStop: (plugin: Plugin) => void;
  onUninstall: (plugin: Plugin) => void;
}) {
  const { t } = useTranslation();
  const canStart = plugin ? !plugin.isDev && ["stopped", "ready", "failed"].includes(plugin.status) : false;
  const canStop = plugin ? !plugin.isDev && plugin.status === "running" : false;
  const canConfigure = plugin
    ? ["pending_setup", "stopped", "ready", "failed", "running"].includes(plugin.status)
    : false;

  return (
    <Sheet open={Boolean(plugin)} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="w-full max-w-xl overflow-y-auto sm:max-w-xl">
        {plugin ? (
          <>
            <SheetHeader>
              <SheetTitle>{plugin.name}</SheetTitle>
              <SheetDescription>{plugin.directory}</SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <div className="rounded-2xl border p-4">
                <div className="mb-3 text-sm font-medium">{t("plugins.detail.overview")}</div>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>{t("common.status")}</span>
                    <StatusBadge status={plugin.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t("plugins.detail.installed")}</span>
                    <span>{plugin.installedAt ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t("plugins.detail.configDirty")}</span>
                    <span>{plugin.configDirty ? t("common.yes") : t("common.no")}</span>
                  </div>
                </div>
              </div>

              {plugin.status === "failed" ? (
                <div className="rounded-2xl border border-destructive/30 p-4 text-sm">
                  <div className="font-medium text-destructive">{t("plugins.detail.failure")}</div>
                  <div className="mt-2">{t("plugins.detail.stage")}: {plugin.failStage ?? t("common.unknown")}</div>
                  <div>{t("plugins.detail.reason")}: {plugin.failReason ?? t("common.unknown")}</div>
                </div>
              ) : null}

              <div className="rounded-2xl border p-4">
                <div className="mb-3 text-sm font-medium">{t("plugins.detail.runtime")}</div>
                <div className="grid gap-2 text-sm">
                  <div>{t("plugins.detail.network")}: {plugin.runtime?.networkName ?? "—"}</div>
                  <div>RabbitMQ User: {plugin.runtime?.rabbitmqUser ?? "—"}</div>
                  <div>Redis User: {plugin.runtime?.redisUser ?? "—"}</div>
                </div>
              </div>

              <div className="rounded-2xl border p-4">
                <div className="mb-3 text-sm font-medium">{t("plugins.table.containers")}</div>
                <div className="space-y-2 text-sm">
                  {plugin.containers?.length ? (
                    plugin.containers.map((container) => (
                      <div key={container.serviceId} className="flex items-center justify-between">
                        <span className="font-mono">{container.serviceId}</span>
                        <span>{container.containerName}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground">{t("plugins.detail.noContainers")}</div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" disabled={!canConfigure} onClick={() => onConfig(plugin)}>
                  {t("plugins.config")}
                </Button>
                <Button disabled={!canStart} onClick={() => onStart(plugin)}>
                  {t("plugins.start")}
                </Button>
                <Button variant="outline" disabled={!canStop} onClick={() => onStop(plugin)}>
                  {t("plugins.stop")}
                </Button>
                <Button variant="destructive" onClick={() => onUninstall(plugin)}>
                  {t("plugins.uninstall")}
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}