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


import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWiringStore } from "@/stores/wiring.store";
import type { PluginCapability } from "@/types/plugin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function capabilityRows(capabilities: PluginCapability[]) {
  return capabilities
    .filter((capability) => capability.role === "consumer")
    .flatMap((capability) => {
      const slots = capability.slots?.length ? capability.slots : [{ id: "", label: "default" }];
      return slots.map((slot) => ({
        consumer: capability,
        slot,
      }));
    });
}

function groupRowsByPlugin(rows: ReturnType<typeof capabilityRows>) {
  return rows.reduce<Record<string, typeof rows>>((acc, row) => {
    const key = row.consumer.pluginId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(row);
    return acc;
  }, {});
}

export function WiringPage() {
  const { t } = useTranslation();
  const capabilities = useWiringStore((state) => state.capabilities);
  const routes = useWiringStore((state) => state.routes);
  const dirty = useWiringStore((state) => state.dirty);
  const load = useWiringStore((state) => state.load);
  const setRoute = useWiringStore((state) => state.setRoute);
  const persist = useWiringStore((state) => state.persist);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => capabilityRows(capabilities), [capabilities]);
  const groups = useMemo(() => groupRowsByPlugin(rows), [rows]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("wiring.title")}
        description={t("wiring.description")}
        actions={
          <Button disabled={!dirty} onClick={() => void persist()}>
            {t("wiring.save")}
          </Button>
        }
      />
      <Card>
        <CardContent className="space-y-4 p-4">
          {rows.length === 0 ? (
            <EmptyState title={t("wiring.empty")} />
          ) : null}
          {Object.entries(groups).map(([pluginId, pluginRows]) => (
            <div key={pluginId} className="space-y-3">
              <div className="rounded-xl border border-border/70 bg-secondary/20 px-4 py-3">
                <div className="font-medium">{pluginRows[0]?.consumer.pluginName ?? pluginId}</div>
                <div className="text-xs text-muted-foreground">{pluginId}</div>
              </div>

              {pluginRows.map(({ consumer, slot }) => {
                const capabilityType = consumer.consumesCapabilityType ?? consumer.type;
                const providers = capabilities.filter(
                  (capability) =>
                    capability.role === "provider" && capability.type === capabilityType,
                );

                const existing = routes.find(
                  (route) =>
                    route.pluginId === consumer.pluginId &&
                    route.slot === slot.id &&
                    route.capabilityType === capabilityType,
                );

                return (
                  <div
                    key={`${consumer.id}-${slot.id}`}
                    className="grid gap-4 rounded-2xl border p-4 md:grid-cols-[minmax(0,1fr)_56px_minmax(260px,320px)] md:items-center"
                  >
                    <div>
                      <div className="font-medium">{consumer.name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {capabilityType}
                        {slot.id ? ` · slot: ${slot.label ?? slot.name ?? slot.id}` : ""}
                        {consumer.required ? ` · ${t("wiring.required")}` : ` · ${t("wiring.optional")}`}
                      </div>
                    </div>
                    <div className="text-center text-xl text-primary">
                      {existing?.providers.length ? "→" : "·"}
                    </div>
                    <Select
                      value={existing?.providers[0]?.providerId}
                      onValueChange={(providerId) => {
                        const provider = providers.find((item) => item.id === providerId);
                        setRoute({
                          pluginId: consumer.pluginId,
                          slot: slot.id,
                          capabilityType,
                          providers: provider
                            ? [
                                {
                                  providerId: provider.id,
                                  providerTopic: provider.entryPoint ?? "",
                                  weight: 1,
                                },
                              ]
                            : [],
                          strategy: "fallback",
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            providers.length === 0 ? t("wiring.noProvider") : t("wiring.unbound")
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.pluginName} / {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}