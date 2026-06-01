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


import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GitBranch, LogIn, LogOut, Merge, RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getPortColor, PORT_LABELS } from "./port-types";
import type { PluginCapability } from "@/types/plugin";
import type { PortType } from "./types";

interface PluginPaletteProps {
  capabilities: PluginCapability[];
  onDragStart: (event: React.DragEvent, kind: string, meta?: Record<string, string>) => void;
}

const BUILTIN_NODES = [
  {
    kind: "if",
    labelKey: "blueprintFlow.nodes.if",
    descriptionKey: "blueprintFlow.nodes.ifDescription",
    icon: GitBranch,
    color: "#f59e0b",
  },
  {
    kind: "loop",
    labelKey: "blueprintFlow.nodes.loop",
    descriptionKey: "blueprintFlow.nodes.loopDescription",
    icon: RefreshCw,
    color: "#14b8a6",
  },
  {
    kind: "input",
    labelKey: "blueprintFlow.nodes.input",
    descriptionKey: "blueprintFlow.nodes.inputDescription",
    icon: LogIn,
    color: "#22c55e",
  },
  {
    kind: "output",
    labelKey: "blueprintFlow.nodes.output",
    descriptionKey: "blueprintFlow.nodes.outputDescription",
    icon: LogOut,
    color: "#ef4444",
  },
  {
    kind: "join",
    labelKey: "blueprintFlow.nodes.join",
    descriptionKey: "blueprintFlow.nodes.joinDescription",
    icon: Merge,
    color: "#8b5cf6",
  },
];

export function PluginPalette({ capabilities, onDragStart }: PluginPaletteProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const providers = capabilities.filter((c) => c.role === "provider");

  const pluginGroups = providers.reduce<Record<string, PluginCapability[]>>((acc, cap) => {
    const key = cap.pluginId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(cap);
    return acc;
  }, {});

  const lc = search.toLowerCase();
  const filteredGroups = Object.entries(pluginGroups).filter(([pluginId, caps]) => {
    if (!lc) return true;
    return (
      pluginId.toLowerCase().includes(lc) ||
      caps.some((c) => c.name.toLowerCase().includes(lc) || c.type.toLowerCase().includes(lc))
    );
  });

  return (
    <aside className="flex h-full flex-col gap-0 overflow-hidden border-r bg-card">
      <div className="border-b px-3 py-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("blueprintFlow.palette.title")}
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("blueprintFlow.palette.search")}
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Built-in nodes */}
        <div className="border-b px-3 py-2">
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("blueprintFlow.palette.builtin")}
          </div>
          <div className="space-y-1">
            {BUILTIN_NODES.map((node) => {
              const Icon = node.icon;
              return (
                <div
                  key={node.kind}
                  draggable
                  onDragStart={(e) => onDragStart(e, node.kind)}
                  className="flex cursor-grab items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors hover:border-border hover:bg-secondary/50 active:cursor-grabbing"
                  style={{ borderColor: `${node.color}44` }}
                >
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded"
                    style={{ background: `${node.color}18` }}
                  >
                    <Icon size={12} style={{ color: node.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium">{t(node.labelKey)}</div>
                    <div className="truncate text-[10px] text-muted-foreground">{t(node.descriptionKey)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plugin capabilities */}
        {filteredGroups.length === 0 && (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">
            {search ? t("blueprintFlow.palette.noMatches") : t("blueprintFlow.palette.noProviders")}
          </div>
        )}

        {filteredGroups.map(([pluginId, caps]) => {
          const filteredCaps = lc
            ? caps.filter(
                (c) => c.name.toLowerCase().includes(lc) || c.type.toLowerCase().includes(lc),
              )
            : caps;
          if (filteredCaps.length === 0) return null;

          return (
            <div key={pluginId} className="border-b px-3 py-2">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {caps[0]?.pluginName ?? pluginId}
              </div>
              <div className="space-y-1">
                {filteredCaps.map((cap) => {
                  const color = getPortColor(cap.type as PortType);
                  return (
                    <div
                      key={cap.id}
                      draggable
                      onDragStart={(e) =>
                        onDragStart(e, "capability", {
                          pluginId: cap.pluginId,
                          pluginName: cap.pluginName,
                          capabilityId: cap.capabilityId,
                          capabilityName: cap.name,
                          capabilityType: cap.type,
                          consumesType: cap.consumesCapabilityType ?? "",
                          entryPoint: cap.entryPoint ?? "",
                        })
                      }
                      className="flex cursor-grab items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors hover:border-border hover:bg-secondary/50 active:cursor-grabbing"
                      style={{ borderColor: `${color}44` }}
                    >
                      <div
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ background: color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium">{cap.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {t(`port.${cap.type}`, { defaultValue: PORT_LABELS[cap.type] ?? cap.type })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}