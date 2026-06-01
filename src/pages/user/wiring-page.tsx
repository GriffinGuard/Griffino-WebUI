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
import { X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWiringStore } from "@/stores/wiring.store";
import { DetailSkeleton } from "@/components/shared/skeletons/detail-skeleton";
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
  const loading = useWiringStore((state) => state.loading);
  const load = useWiringStore((state) => state.load);
  const addProvider = useWiringStore((state) => state.addProvider);
  const removeProvider = useWiringStore((state) => state.removeProvider);
  const updateProviderWeight = useWiringStore((state) => state.updateProviderWeight);
  const updateStrategy = useWiringStore((state) => state.updateStrategy);
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
      {loading ? (
        <DetailSkeleton />
      ) : (
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

                const selectedProviders = existing?.providers ?? [];
                const strategy = existing?.strategy ?? "fallback";

                return (
                  <div
                    key={`${consumer.id}-${slot.id}`}
                    className="grid gap-4 rounded-2xl border p-4 md:grid-cols-[minmax(0,1fr)_56px_minmax(260px,320px)] md:items-start"
                  >
                    <div>
                      <div className="font-medium">{consumer.name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {capabilityType}
                        {slot.id ? ` · slot: ${slot.label ?? slot.name ?? slot.id}` : ""}
                        {consumer.required ? ` · ${t("wiring.required")}` : ` · ${t("wiring.optional")}`}
                      </div>
                    </div>

                    <div className="pt-2 text-center text-xl text-primary">
                      {selectedProviders.length > 0 ? "→" : "·"}
                    </div>

                    <div className="space-y-2">
                      {selectedProviders.map((provider, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Select
                            value={provider.providerId}
                            onValueChange={(newProviderId) => {
                              const newProvider = providers.find((p) => p.id === newProviderId);
                              if (!newProvider) return;
                              removeProvider(consumer.pluginId, slot.id, capabilityType, idx);
                              addProvider(consumer.pluginId, slot.id, capabilityType, {
                                providerId: newProvider.id,
                                providerTopic: newProvider.entryPoint ?? "",
                                weight: 1,
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  provider.providerId
                                    ? providers.find((p) => p.id === provider.providerId)?.pluginName + " / " + providers.find((p) => p.id === provider.providerId)?.name
                                    : providers.length === 0
                                      ? t("wiring.noProvider")
                                      : t("wiring.unbound")
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {providers.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.pluginName} / {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {selectedProviders.length >= 2 && strategy === "round_robin" && (
                            <Input
                              type="number"
                              min={1}
                              value={provider.weight <= 0 ? 1 : provider.weight}
                              onChange={(e) =>
                                updateProviderWeight(
                                  consumer.pluginId,
                                  slot.id,
                                  capabilityType,
                                  idx,
                                  Math.max(1, Number(e.target.value)),
                                )
                              }
                              className="h-7 w-16 text-xs"
                            />
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => removeProvider(consumer.pluginId, slot.id, capabilityType, idx)}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ))}

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-full border-dashed text-xs"
                        onClick={() =>
                          addProvider(consumer.pluginId, slot.id, capabilityType, {
                            providerId: "",
                            providerTopic: "",
                            weight: 1,
                          })
                        }
                      >
                        + {t("wiring.addProvider")}
                      </Button>

                      {selectedProviders.length >= 2 && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-xs text-muted-foreground">{t("wiring.strategy")}</span>
                          <Select
                            value={strategy}
                            onValueChange={(v) =>
                              updateStrategy(
                                consumer.pluginId,
                                slot.id,
                                capabilityType,
                                v as "fallback" | "round_robin",
                              )
                            }
                          >
                            <SelectTrigger className="h-7 w-48 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fallback">{t("wiring.strategy.fallback")}</SelectItem>
                              <SelectItem value="round_robin">{t("wiring.strategy.roundRobin")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}