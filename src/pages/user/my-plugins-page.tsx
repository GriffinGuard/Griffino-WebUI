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


import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePluginUserStore } from "@/stores/plugin-user.store";
import { usePolling } from "@/hooks/use-polling";
import { UserConfigDialog } from "@/pages/user/components/user-config-dialog";

export function MyPluginsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const [selectedId, setSelectedId] = useState<string | null>(params.id ?? null);
  const items = usePluginUserStore((state) => state.items);
  const load = usePluginUserStore((state) => state.load);

  const refresh = useCallback(() => {
    void load();
  }, [load]);

  usePolling(refresh, 30000);

  const selected = useMemo(
    () => items.find((plugin) => plugin.id === selectedId) ?? null,
    [items, selectedId],
  );

  useEffect(() => {
    setSelectedId(params.id ?? null);
  }, [params.id]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("plugins.my.title")} description={t("plugins.my.description")} />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-secondary/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{t("plugins.table.plugin")}</th>
                  <th className="px-4 py-3">{t("plugins.table.directory")}</th>
                  <th className="px-4 py-3">{t("plugins.table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((plugin) => (
                  <tr key={plugin.id} className="border-b border-border/60">
                    <td className="px-4 py-3 font-medium">{plugin.name}</td>
                    <td className="px-4 py-3">{plugin.directory}</td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedId(plugin.id);
                          navigate(`/user/plugins/${plugin.id}`);
                        }}
                      >
                        {t("plugins.userConfig")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <UserConfigDialog
        plugin={selected}
        open={Boolean(selected)}
        onClose={() => {
          setSelectedId(null);
          navigate("/user/plugins");
        }}
      />
    </div>
  );
}