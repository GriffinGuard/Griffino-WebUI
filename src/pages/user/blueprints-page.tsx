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
import { deleteBlueprint } from "@/api/blueprints.api";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUiStore } from "@/stores/ui.store";
import { useBlueprintsStore } from "@/stores/blueprints.store";
import { formatDateTime } from "@/lib/date";

export function BlueprintsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pushToast = useUiStore((state) => state.pushToast);
  const items = useBlueprintsStore((state) => state.items);
  const load = useBlueprintsStore((state) => state.load);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch {
        pushToast({
          title: t("blueprints.toast.loadFailed"),
          tone: "error",
        });
      }
    })();
  }, [load, pushToast]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav.user.blueprints")}
        description={t("blueprints.page.description")}
        actions={<Button onClick={() => navigate("/user/blueprints/new")}>{t("blueprints.create")}</Button>}
      />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-secondary/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{t("blueprints.table.name")}</th>
                  <th className="px-4 py-3">{t("blueprints.table.trigger")}</th>
                  <th className="px-4 py-3">{t("blueprints.table.nodes")}</th>
                  <th className="px-4 py-3">{t("blueprints.table.created")}</th>
                  <th className="px-4 py-3">{t("blueprints.table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(items) ? items : []).map((blueprint) => (
                  <tr key={blueprint.id} className="border-b border-border/60">
                    <td className="px-4 py-3 font-medium">{blueprint.name}</td>
                    <td className="px-4 py-3">{blueprint.trigger.eventType}</td>
                    <td className="px-4 py-3">{blueprint.nodes.length}</td>
                    <td className="px-4 py-3">{formatDateTime(blueprint.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate(`/user/blueprints/${blueprint.id}`)}
                        >
                          {t("common.edit")}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteTarget({ id: blueprint.id, name: blueprint.name })}
                        >
                          {t("common.delete")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t("blueprints.delete.title")}
        description={
          deleteTarget
            ? t("blueprints.delete.description", { name: deleteTarget.name })
            : ""
        }
        confirmLabel={t("common.delete")}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) {
            return;
          }

          void (async () => {
            try {
              await deleteBlueprint(deleteTarget.id);
              pushToast({
                title: t("blueprints.toast.deleted"),
                tone: "success",
              });
            } catch {
              pushToast({
                title: t("blueprints.toast.deleteFailed"),
                tone: "error",
              });
              setDeleteTarget(null);
              return;
            }

            try {
              await load();
            } catch {
              pushToast({
                title: t("blueprints.toast.loadFailed"),
                tone: "error",
              });
            } finally {
              setDeleteTarget(null);
            }
          })();
        }}
      />
    </div>
  );
}