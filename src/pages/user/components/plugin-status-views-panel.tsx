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


import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/api/errors";
import { getPluginStatusViewData, getPluginStatusViews } from "@/api/plugins.api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import type { PluginStatusView } from "@/types/plugin";

interface ViewState {
  loading: boolean;
  initialized: boolean;
  hidden: boolean;
  data: Record<string, string>;
}

function simplifyKey(key: string) {
  const parts = key.split(":");
  return parts.length > 1 ? parts.at(-1) ?? key : key;
}

function statusToneClass(status: string) {
  const value = status.toLowerCase();

  if (value.includes("error") || value.includes("failed")) {
    return "border-red-500/30 bg-red-500/10 text-red-500";
  }

  if (value.includes("running") || value.includes("busy")) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-500";
  }

  if (value.includes("idle")) {
    return "border-slate-500/30 bg-slate-500/10 text-slate-500";
  }

  return "border-amber-500/30 bg-amber-500/10 text-amber-500";
}

function isStatusViewNotFound(error: unknown) {
  return error instanceof ApiError && (error.status === 404 || error.code === "STATUS_VIEW_NOT_FOUND");
}

export function PluginStatusViewsPanel({
  pluginId,
  active,
}: {
  pluginId: string;
  active: boolean;
}) {
  const { t } = useTranslation();
  const [views, setViews] = useState<PluginStatusView[]>([]);
  const [loadingViews, setLoadingViews] = useState(false);
  const [viewStates, setViewStates] = useState<Record<string, ViewState>>({});

  useEffect(() => {
    if (!active) {
      return;
    }

    void (async () => {
      setViews([]);
      setViewStates({});
      setLoadingViews(true);
      try {
        const result = await getPluginStatusViews(pluginId);
        setViews(result.statusViews);
      } catch {
        setViews([]);
      } finally {
        setLoadingViews(false);
      }
    })();
  }, [active, pluginId]);

  useEffect(() => {
    setViewStates((current) => {
      const next: Record<string, ViewState> = {};

      views.forEach((view) => {
        const existing = current[view.id];
        next[view.id] = existing ?? {
          loading: true,
          initialized: false,
          hidden: false,
          data: {},
        };
      });

      return next;
    });
  }, [views]);

  useEffect(() => {
    if (!active || views.length === 0) {
      return;
    }

    const timers: number[] = [];

    views.forEach((view) => {
      const loadView = async () => {
        try {
          const response = await getPluginStatusViewData(pluginId, view.id);
          setViewStates((current) => {
            const target = current[view.id];
            if (!target) {
              return current;
            }
            return {
              ...current,
              [view.id]: {
                ...target,
                loading: false,
                initialized: true,
                hidden: false,
                data: response.data,
              },
            };
          });
        } catch (error) {
          if (isStatusViewNotFound(error)) {
            setViewStates((current) => {
              const target = current[view.id];
              if (!target) {
                return current;
              }
              return {
                ...current,
                [view.id]: {
                  ...target,
                  loading: false,
                  initialized: true,
                  hidden: true,
                },
              };
            });
            return;
          }

          setViewStates((current) => {
            const target = current[view.id];
            if (!target) {
              return current;
            }
            return {
              ...current,
              [view.id]: {
                ...target,
                loading: false,
                initialized: true,
              },
            };
          });
        }
      };

      void loadView();
      timers.push(window.setInterval(() => void loadView(), 5000));
    });

    return () => {
      timers.forEach((timer) => window.clearInterval(timer));
    };
  }, [active, pluginId, views]);

  const visibleViews = useMemo(
    () => views.filter((view) => !(viewStates[view.id]?.hidden ?? false)),
    [viewStates, views],
  );

  if (loadingViews) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("plugins.statusViews.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (visibleViews.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("plugins.statusViews.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {visibleViews.map((view) => {
          const state = viewStates[view.id];
          const entries = Object.entries(state?.data ?? {});
          const normalizedType = view.type.toLowerCase();
          const isStatusView = normalizedType === "status";

          return (
            <div key={view.id} className="rounded-xl border p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-sm font-medium">
                  {view.name.default || view.name["zh-CN"] || view.id}
                </div>
                <Badge variant="secondary">{view.type}</Badge>
              </div>

              {state?.loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : null}

              {!state?.loading && !isStatusView ? (
                entries.length > 0 ? (
                  <div className="space-y-2 text-sm">
                    {entries.map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">{simplifyKey(key)}</span>
                        <span className="font-mono text-xs">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">{t("common.empty")}</div>
                )
              ) : null}

              {!state?.loading && isStatusView ? (
                entries.length > 0 ? (
                  <Badge
                    variant="secondary"
                    className={cn(statusToneClass(entries[0][1]))}
                  >
                    {entries[0][1]}
                  </Badge>
                ) : (
                  <div className="text-sm text-muted-foreground">{t("common.empty")}</div>
                )
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}