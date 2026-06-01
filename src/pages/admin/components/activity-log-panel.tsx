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


import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUiStore } from "@/stores/ui.store";
import { formatDateTime } from "@/lib/date";

export function ActivityLogPanel() {
  const { t } = useTranslation();
  const activityLog = useUiStore((state) => state.activityLog);
  const clearActivity = useUiStore((state) => state.clearActivity);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("dashboard.activityLog")}</CardTitle>
        <Button variant="ghost" size="sm" onClick={clearActivity}>
          {t("common.clear")}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activityLog.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t("dashboard.noActivity")}</div>
          ) : (
            activityLog.map((entry) => (
              <div key={entry.id} className="rounded-xl border p-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>{entry.message}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {formatDateTime(entry.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}