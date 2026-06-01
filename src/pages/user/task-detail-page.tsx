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
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasksStore } from "@/stores/tasks.store";
import { useUiStore } from "@/stores/ui.store";
import { ApiError } from "@/api/errors";
import type { Task } from "@/types/task";

export function TaskDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pushToast = useUiStore((s) => s.pushToast);
  const loadOne = useTasksStore((s) => s.loadOne);
  const loading = useTasksStore((s) => s.loading);
  const clearActive = useTasksStore((s) => s.clearActive);
  const [task, setTask] = useState<Task | null>(null);

  const fetchTask = async () => {
    if (!id) return;
    try {
      const result = await loadOne(id);
      setTask(result);
    } catch (error) {
      pushToast({
        title: t("tasks.toast.loadOneFailed"),
        description: error instanceof ApiError ? error.message : t("common.requestFailed"),
        tone: "error",
      });
      navigate("/user/tasks");
    }
  };

  useEffect(() => {
    void fetchTask();
    return () => {
      clearActive();
    };
  }, [id]);

  if (loading && !task) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!task) return null;

  const outputs = task.context?.__outputs as Record<string, unknown> | undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("tasks.detail.title")}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/user/tasks")}>
              {t("common.back")}
            </Button>
            <Button size="sm" onClick={fetchTask}>
              {t("tasks.detail.refresh")}
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{t("common.status")}:</span>
            <StatusBadge status={task.status} />
          </div>

          {task.status === "failed" && task.failReason && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3">
              <div className="text-xs font-medium text-red-500">{t("tasks.detail.failReason")}</div>
              <div className="mt-1 text-sm">{task.failReason}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Blueprint: </span>
              <span className="font-mono text-xs">{task.blueprintId}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Created: </span>
              {new Date(task.createdAt).toLocaleString()}
            </div>
            <div>
              <span className="text-muted-foreground">Updated: </span>
              {new Date(task.updatedAt).toLocaleString()}
            </div>
            <div>
              <span className="text-muted-foreground">Current Node: </span>
              <span className="font-mono text-xs">{task.currentNodeId}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {task.status === "running" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("tasks.detail.parallel")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              {t("tasks.detail.activeBranches")}: <strong>{task.activeBranches}</strong>
            </div>
            {Object.keys(task.activeNodes).length > 0 && (
              <div>
                <div className="mb-1 text-muted-foreground">{t("tasks.detail.activeNodes")}:</div>
                {Object.entries(task.activeNodes).map(([nodeId, deadline]) => (
                  <div key={nodeId} className="pl-2 font-mono text-xs">
                    {nodeId} → {new Date(deadline).toLocaleString()}
                  </div>
                ))}
              </div>
            )}
            {Object.keys(task.joinState).length > 0 && (
              <div>
                <div className="mb-1 text-muted-foreground">{t("tasks.detail.joinState")}:</div>
                {Object.entries(task.joinState).map(([nodeId, count]) => (
                  <div key={nodeId} className="pl-2 font-mono text-xs">
                    {nodeId}: {count} arrived
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {outputs && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("tasks.detail.outputs")}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-64 overflow-auto rounded-md bg-secondary/50 p-3 text-xs">
              {JSON.stringify(outputs, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
          {t("tasks.detail.context")}
        </summary>
        <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-secondary/50 p-3 text-xs">
          {JSON.stringify(task.context, null, 2)}
        </pre>
      </details>
    </div>
  );
}
