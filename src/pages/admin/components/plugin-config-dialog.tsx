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
import { getPluginConfig, savePluginConfig } from "@/api/plugins.api";
import { Button } from "@/components/ui/button";
import { SchemaForm } from "@/components/shared/schema-form/schema-form";
import type { Plugin } from "@/types/plugin";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PluginConfigDialog({
  plugin,
  open,
  onClose,
  onSaved,
}: {
  plugin: Plugin | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Awaited<ReturnType<typeof getPluginConfig>>["services"]>([]);
  const [values, setValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!open || !plugin) {
      return;
    }

    void (async () => {
      setLoading(true);
      try {
        const result = await getPluginConfig(plugin.id);
        setServices(result.services);
        setValues(result.currentValues);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, plugin]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("plugins.bootConfig.title")}{plugin ? ` · ${plugin.name}` : ""}</DialogTitle>
        </DialogHeader>
        {plugin ? (
          <>
            <div className="mt-2">
              {loading ? (
                <div className="text-sm text-muted-foreground">{t("plugins.bootConfig.loading")}</div>
              ) : (
                <SchemaForm
                  services={services}
                  values={values}
                  onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
                />
              )}
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
                    await savePluginConfig(plugin.id, {
                      action: plugin.status === "running" ? "save_and_restart" : "save_and_start",
                      values,
                    });
                    onSaved();
                    onClose();
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