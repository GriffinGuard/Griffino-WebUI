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
import {
  getPluginUserConfigSchema,
  getPluginUserConfigValues,
  savePluginUserConfigValues,
} from "@/api/plugins.api";
import { useToastError } from "@/hooks/use-toast-error";
import { useUiStore } from "@/stores/ui.store";
import { SchemaForm } from "@/components/shared/schema-form/schema-form";
import { Button } from "@/components/ui/button";
import type { Plugin } from "@/types/plugin";
import { PluginActionsPanel } from "@/pages/user/components/plugin-actions-panel";
import { PluginStatusViewsPanel } from "@/pages/user/components/plugin-status-views-panel";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function UserConfigDialog({
  plugin,
  open,
  onClose,
}: {
  plugin: Plugin | null;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const toastError = useToastError();
  const pushToast = useUiStore((state) => state.pushToast);
  const [groups, setGroups] = useState<Awaited<ReturnType<typeof getPluginUserConfigSchema>>["groups"]>(
    [],
  );
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !plugin) {
      return;
    }

    void (async () => {
      setLoading(true);
      try {
        const [schema, savedValues] = await Promise.all([
          getPluginUserConfigSchema(plugin.id),
          getPluginUserConfigValues(plugin.id),
        ]);
        setGroups(schema.groups);
        setValues(savedValues);
      } catch (error) {
        toastError(error, t("plugins.userConfig.loadFailed"));
      } finally {
        setLoading(false);
      }
    })();
  }, [open, plugin]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("plugins.userConfig.title")}{plugin ? ` · ${plugin.name}` : ""}</DialogTitle>
        </DialogHeader>
        {plugin ? (
          <>
            <div className="mt-2">
              {loading ? (
                <div className="text-sm text-muted-foreground">{t("plugins.userConfig.loading")}</div>
              ) : (
                <SchemaForm
                  groups={groups}
                  values={values}
                  onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
                />
              )}
            </div>
            <div className="mt-4">
              <PluginStatusViewsPanel pluginId={plugin.id} active={open} />
            </div>
            <div className="mt-4">
              <PluginActionsPanel
                pluginId={plugin.id}
                active={open}
                isRunning={plugin.status === "running"}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Button
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    const nextValues = Object.fromEntries(
                      Object.entries(values).filter(([_, value]) => value !== ""),
                    );
                    await savePluginUserConfigValues(plugin.id, nextValues);
                    pushToast({
                      title: t("common.saved"),
                      description: t("plugins.userConfig.savedDescription"),
                      tone: "success",
                    });
                    onClose();
                  } catch (error) {
                    toastError(error, t("plugins.userConfig.saveFailed"));
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {t("common.save")}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}