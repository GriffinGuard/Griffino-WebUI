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
import { installRegistryPlugin, listRegistryPlugins } from "@/api/registry.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RegistryPlugin } from "@/types/registry";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function InstallPluginDialog({
  open,
  onClose,
  onInstalled,
}: {
  open: boolean;
  onClose: () => void;
  onInstalled: () => void;
}) {
  const { t } = useTranslation();
  const [items, setItems] = useState<RegistryPlugin[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        const result = await listRegistryPlugins();
        setItems(result);
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("registry.title")}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-3">
          {loading ? (
            <div className="text-sm text-muted-foreground">{t("registry.loading")}</div>
          ) : (
            items.map((plugin) => (
              <div
                key={plugin.id}
                className="grid gap-3 rounded-2xl border p-4 md:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{plugin.name}</div>
                    {plugin.verified ? (
                      <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                        {t("registry.verified")}
                      </Badge>
                    ) : null}
                    {plugin.installed ? <Badge variant="secondary">{t("registry.installed")}</Badge> : null}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{plugin.description}</div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{t("registry.version")}: {plugin.version ?? "—"}</span>
                    <span>{t("registry.author")}: {plugin.author ?? "—"}</span>
                    <span>{t("registry.license")}: {plugin.license ?? "—"}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <Button
                    onClick={async () => {
                      await installRegistryPlugin(plugin.id);
                      onInstalled();
                    }}
                  >
                    {plugin.installed ? t("registry.update") : t("plugins.install")}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}