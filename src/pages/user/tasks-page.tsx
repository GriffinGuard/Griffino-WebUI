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


import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useTasksStore } from "@/stores/tasks.store";
import { useUiStore } from "@/stores/ui.store";
import { ApiError } from "@/api/errors";

export function TasksPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pushToast = useUiStore((s) => s.pushToast);
  const tasks = useTasksStore((s) => s.tasks);
  const loading = useTasksStore((s) => s.loading);
  const load = useTasksStore((s) => s.load);

  useEffect(() => {
    void load().catch(() => {});
  }, [load]);

  const handleRefresh = () => {
    load().catch((error) => {
      pushToast({
        title: t("tasks.toast.loadFailed"),
        description: error instanceof ApiError ? error.message : t("common.requestFailed"),
        tone: "error",
      });
    });
  };

  const sorted = [...tasks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("tasks.title")}
        description={t("tasks.description")}
        actions={
          <Button size="sm" onClick={handleRefresh} disabled={loading}>
            {t("common.refresh")}
          </Button>
        }
      />
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">{t("tasks.table.status")}</th>
                <th className="px-4 py-3 font-medium">{t("tasks.table.blueprint")}</th>
                <th className="px-4 py-3 font-medium">{t("tasks.table.created")}</th>
                <th className="px-4 py-3 font-medium">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((task) => (
                <tr key={task.id} className="border-b text-sm transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {task.blueprintId}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(task.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => navigate(`/user/tasks/${task.id}`)}
                    >
                      {t("common.edit")}
                    </Button>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {t("common.empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
