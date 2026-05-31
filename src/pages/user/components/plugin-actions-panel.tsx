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


import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LoaderCircle } from "lucide-react";
import { ApiError } from "@/api/errors";
import { getPluginActions, triggerPluginAction } from "@/api/plugins.api";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUiStore } from "@/stores/ui.store";
import type { PluginAction } from "@/types/plugin";

export function PluginActionsPanel({
  pluginId,
  active,
  isRunning,
}: {
  pluginId: string;
  active: boolean;
  isRunning: boolean;
}) {
  const { t } = useTranslation();
  const pushToast = useUiStore((state) => state.pushToast);
  const cooldownTimersRef = useRef<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [actions, setActions] = useState<PluginAction[]>([]);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<PluginAction | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<Record<string, number>>({});

  useEffect(() => {
    return () => {
      Object.values(cooldownTimersRef.current).forEach((timer) => window.clearTimeout(timer));
      cooldownTimersRef.current = {};
    };
  }, []);

  useEffect(() => {
    if (!active || !isRunning) {
      setActions([]);
      setLoading(false);
      setPendingActionId(null);
      setConfirmingAction(null);
      setCooldownUntil({});
      Object.values(cooldownTimersRef.current).forEach((timer) => window.clearTimeout(timer));
      cooldownTimersRef.current = {};
      return;
    }

    void (async () => {
      setLoading(true);
      try {
        const result = await getPluginActions(pluginId);
        setActions(result.actions);
      } catch {
        setActions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [active, isRunning, pluginId]);

  const setCooldown = (actionId: string, until: number) => {
    setCooldownUntil((current) => {
      const nextUntil = Math.max(current[actionId] ?? 0, until);
      if (cooldownTimersRef.current[actionId]) {
        window.clearTimeout(cooldownTimersRef.current[actionId]);
      }

      cooldownTimersRef.current[actionId] = window.setTimeout(() => {
        setCooldownUntil((latest) => {
          if ((latest[actionId] ?? 0) > Date.now()) {
            return latest;
          }
          const next = { ...latest };
          delete next[actionId];
          return next;
        });
      }, Math.max(0, nextUntil - Date.now()));

      return {
        ...current,
        [actionId]: nextUntil,
      };
    });
  };

  const runAction = async (action: PluginAction) => {
    const sentAt = Date.now();
    setCooldown(action.id, sentAt + action.cooldownMs);
    setPendingActionId(action.id);

    try {
      await triggerPluginAction(pluginId, action.id);
      pushToast({
        title: `${action.name.default || action.id} triggered`,
        tone: "success",
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        setCooldown(action.id, sentAt + action.cooldownMs + 5000);
        pushToast({
          title: t("plugins.actions.rateLimited"),
          tone: "error",
        });
      } else {
        const message = error instanceof ApiError ? error.message : t("plugins.actions.triggerFailedFallback");
        pushToast({
          title: t("plugins.actions.triggerFailed"),
          description: message,
          tone: "error",
        });
      }
    } finally {
      setPendingActionId((current) => (current === action.id ? null : current));
    }
  };

  if (!isRunning) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("common.actions")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (actions.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("common.actions")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {actions.map((action) => {
            const inCooldown = (cooldownUntil[action.id] ?? 0) > Date.now();
            const isLoading = pendingActionId === action.id;
            const disabled = isLoading || inCooldown;
            const label = action.name.default || action.id;
            const description = action.description.default || "";

            return (
              <Button
                key={action.id}
                size="sm"
                variant="secondary"
                title={description}
                disabled={disabled}
                className={disabled ? "cursor-not-allowed opacity-60" : undefined}
                onClick={() => {
                  if (action.confirmation.required) {
                    setConfirmingAction(action);
                    return;
                  }
                  void runAction(action);
                }}
              >
                {isLoading ? <LoaderCircle className="size-4 animate-spin" /> : null}
                {label}
              </Button>
            );
          })}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(confirmingAction)}
        title={confirmingAction?.name.default || t("plugins.actions.confirmTitle")}
        description={
          confirmingAction?.confirmation.message?.default || t("plugins.actions.confirmDescription")
        }
        confirmLabel={t("common.confirm")}
        onClose={() => setConfirmingAction(null)}
        onConfirm={() => {
          if (!confirmingAction) {
            return;
          }
          void runAction(confirmingAction);
          setConfirmingAction(null);
        }}
      />
    </>
  );
}