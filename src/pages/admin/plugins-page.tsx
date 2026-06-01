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


import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/shared/metric-card";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { PluginDetailDrawer } from "@/pages/admin/components/plugin-detail-drawer";
import { ActivityLogPanel } from "@/pages/admin/components/activity-log-panel";
import { PluginConfigDialog } from "@/pages/admin/components/plugin-config-dialog";
import { InstallPluginDialog } from "@/pages/admin/components/install-plugin-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePluginAdminStore } from "@/stores/plugin-admin.store";
import { usePolling } from "@/hooks/use-polling";
import * as pluginsApi from "@/api/plugins.api";
import { useUiStore } from "@/stores/ui.store";
import { TableSkeleton } from "@/components/shared/skeletons/table-skeleton";

export function PluginsPage() {
  const { t } = useTranslation();
  const [configOpen, setConfigOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [uninstallTarget, setUninstallTarget] = useState<string | null>(null);
  const items = usePluginAdminStore((state) => state.items);
  const loading = usePluginAdminStore((state) => state.loading);
  const selectedId = usePluginAdminStore((state) => state.selectedId);
  const load = usePluginAdminStore((state) => state.load);
  const select = usePluginAdminStore((state) => state.select);
  const addActivity = useUiStore((state) => state.addActivity);

  const stats = useMemo(
    () => ({
      total: Array.isArray(items) ? items.length : 0,
      running: Array.isArray(items) ? items.filter((item) => item.status === "running").length : 0,
      stopped: Array.isArray(items) ? items.filter((item) => item.status === "stopped").length : 0,
      pending: Array.isArray(items) ? items.filter((item) => item.status === "pending_setup").length : 0,
    }),
    [items],
  );

  const refreshPlugins = useCallback(() => {
    void load();
  }, [load]);

  usePolling(refreshPlugins, 30000);
  const selected = useMemo(
    () => (Array.isArray(items) ? items.find((item) => item.id === selectedId) : null) ?? null,
    [items, selectedId],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav.admin.plugins")}
        description={t("plugins.page.description")}
        actions={
          <>
            <Button variant="outline" onClick={refreshPlugins}>
              {t("common.refresh")}
            </Button>
            <Button onClick={() => setInstallOpen(true)}>{t("plugins.install")}</Button>
          </>
        }
      />

      {loading ? (
        <TableSkeleton />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label={t("plugins.total")} value={stats.total} />
            <MetricCard label={t("plugins.running")} value={stats.running} />
            <MetricCard label={t("plugins.stopped")} value={stats.stopped} />
            <MetricCard label={t("plugins.pending")} value={stats.pending} />
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b bg-secondary/40 text-left text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">{t("plugins.table.plugin")}</th>
                      <th className="px-4 py-3">{t("plugins.table.status")}</th>
                      <th className="px-4 py-3">{t("plugins.table.containers")}</th>
                      <th className="px-4 py-3">{t("plugins.table.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(items) ? items : []).map((plugin, index) => (
                      <tr
                        key={plugin.id}
                        className="cursor-pointer border-b border-border/60 hover:bg-secondary/20"
                        onClick={() => select(plugin.id)}
                      >
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{plugin.id}</div>
                          <div className="text-xs text-muted-foreground">{plugin.directory}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={plugin.status} />
                            {plugin.isDev ? <span className="text-xs text-primary">DEV</span> : null}
                          </div>
                        </td>
                        <td className="px-4 py-3">{plugin.containerCount}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={plugin.isDev}
                              onClick={(event) => {
                                event.stopPropagation();
                                void pluginsApi.startPlugin(plugin.id).then(refreshPlugins);
                              }}
                            >
                              {t("plugins.start")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={plugin.isDev}
                              onClick={(event) => {
                                event.stopPropagation();
                                void pluginsApi.stopPlugin(plugin.id).then(refreshPlugins);
                              }}
                            >
                              {t("plugins.stop")}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!Array.isArray(items) || items.length === 0) ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                          {t("plugins.empty")}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <ActivityLogPanel />

      <PluginDetailDrawer
        plugin={selected}
        onClose={() => select(null)}
        onConfig={() => setConfigOpen(true)}
        onStart={async (plugin) => {
          await pluginsApi.startPlugin(plugin.id);
          addActivity({ level: "success", message: t("activity.pluginStarted", { name: plugin.name }) });
          refreshPlugins();
        }}
        onStop={async (plugin) => {
          await pluginsApi.stopPlugin(plugin.id);
          addActivity({ level: "info", message: t("activity.pluginStopped", { name: plugin.name }) });
          refreshPlugins();
        }}
        onUninstall={(plugin) => setUninstallTarget(plugin.id)}
      />

      <PluginConfigDialog
        plugin={selected}
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        onSaved={refreshPlugins}
      />

      <InstallPluginDialog
        open={installOpen}
        onClose={() => setInstallOpen(false)}
        onInstalled={() => {
          addActivity({ level: "success", message: t("activity.pluginInstallStarted") });
          refreshPlugins();
        }}
      />

      <ConfirmDialog
        open={Boolean(uninstallTarget)}
        title={t("plugins.uninstallTitle")}
        description={t("plugins.uninstallDescription")}
        confirmLabel={t("plugins.uninstall")}
        onClose={() => setUninstallTarget(null)}
        onConfirm={async () => {
          if (!uninstallTarget) {
            return;
          }
          await pluginsApi.uninstallPlugin(uninstallTarget);
          addActivity({ level: "info", message: t("activity.pluginUninstalled", { name: uninstallTarget }) });
          setUninstallTarget(null);
          refreshPlugins();
        }}
      />
    </div>
  );
}