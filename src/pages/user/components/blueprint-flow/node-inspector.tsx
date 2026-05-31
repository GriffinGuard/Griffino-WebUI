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


import type { Node } from "@xyflow/react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PORT_LABELS } from "./port-types";
import type { FlowNodeData, PortType } from "./types";

interface NodeInspectorProps {
  node: Node<FlowNodeData>;
  onUpdate: (id: string, data: Partial<FlowNodeData>) => void;
  onClose: () => void;
}

const PORT_TYPE_OPTIONS = Object.keys(PORT_LABELS);

export function NodeInspector({ node, onUpdate, onClose }: NodeInspectorProps) {
  const { t } = useTranslation();
  const data = node.data as FlowNodeData;
  const patch = (partial: Partial<FlowNodeData>) => onUpdate(node.id, partial);

  return (
    <aside className="flex h-full w-[260px] flex-shrink-0 flex-col overflow-hidden border-l bg-card">
      <div className="flex items-center justify-between border-b px-3 py-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("blueprintFlow.inspector.title")}
        </div>
        <button
          onClick={onClose}
          className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
        {/* ── Trigger ── */}
        {data.kind === "trigger" && (
          <>
            <Field label={t("blueprintFlow.inspector.eventType")}>
              <Input
                value={data.eventType ?? ""}
                onChange={(e) => patch({ eventType: e.target.value })}
                className="h-7 text-xs"
                placeholder="e.g. user.message"
              />
            </Field>
            <Field label={t("blueprintFlow.inspector.sourcePlugin")}>
              <Input
                value={data.triggerPluginId ?? ""}
                onChange={(e) => patch({ triggerPluginId: e.target.value })}
                className="h-7 text-xs"
                placeholder={t("blueprintFlow.inspector.sourcePluginPlaceholder")}
              />
            </Field>
          </>
        )}

        {/* ── Capability ── */}
        {data.kind === "capability" && (
          <>
            <Field label={t("blueprintFlow.inspector.plugin")}>
              <div className="rounded-md border px-2 py-1.5 text-xs text-muted-foreground">
                {data.pluginName ?? data.pluginId ?? "—"}
              </div>
            </Field>
            <Field label={t("blueprintFlow.inspector.capability")}>
              <div className="rounded-md border px-2 py-1.5 text-xs text-muted-foreground">
                {data.capabilityName ?? data.capabilityId ?? "—"}
              </div>
            </Field>
            <Field label="Request Topic">
              <Input
                value={data.requestTopicPattern ?? ""}
                onChange={(e) => patch({ requestTopicPattern: e.target.value })}
                className="h-7 font-mono text-xs"
              />
            </Field>
            <Field label="Timeout (ms)">
              <Input
                type="number"
                value={data.timeoutMs ?? ""}
                onChange={(e) =>
                  patch({ timeoutMs: e.target.value ? Number(e.target.value) : undefined })
                }
                className="h-7 text-xs"
                placeholder={t("blueprintFlow.inspector.timeoutPlaceholder")}
              />
            </Field>
            <Field label={t("blueprintFlow.inspector.inputType")}>
              <PortTypeSelect
                value={data.inputPortType ?? "any"}
                onChange={(v) => patch({ inputPortType: v as PortType })}
              />
            </Field>
            <Field label={t("blueprintFlow.inspector.outputType")}>
              <PortTypeSelect
                value={data.outputPortType ?? "any"}
                onChange={(v) => patch({ outputPortType: v as PortType })}
              />
            </Field>
          </>
        )}

        {/* ── If ── */}
        {data.kind === "if" && (
          <Field label={t("blueprintFlow.inspector.condition")}>
            <Input
              value={data.condition ?? ""}
              onChange={(e) => patch({ condition: e.target.value })}
              className="h-7 font-mono text-xs"
              placeholder="e.g. ctx.score > 0.5"
            />
          </Field>
        )}

        {/* ── Loop ── */}
        {data.kind === "loop" && (
          <>
            <Field label={t("blueprintFlow.inspector.loopType")}>
              <Select
                value={data.loopType ?? "count"}
                onValueChange={(v) => patch({ loopType: v as "count" | "condition" })}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count">{t("blueprintFlow.inspector.loopCountMode")}</SelectItem>
                  <SelectItem value="condition">{t("blueprintFlow.inspector.loopConditionMode")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {data.loopType === "condition" ? (
              <Field label={t("blueprintFlow.inspector.loopCondition")}>
                <Input
                  value={data.loopConditionExpr ?? ""}
                  onChange={(e) => patch({ loopConditionExpr: e.target.value })}
                  className="h-7 font-mono text-xs"
                  placeholder="e.g. ctx.hasMore"
                />
              </Field>
            ) : (
              <Field label={t("blueprintFlow.inspector.loopCount")}>
                <Input
                  type="number"
                  min={1}
                  value={data.loopCount ?? 3}
                  onChange={(e) => patch({ loopCount: Number(e.target.value) })}
                  className="h-7 text-xs"
                />
              </Field>
            )}
          </>
        )}

        {/* ── Input / Output ── */}
        {(data.kind === "input" || data.kind === "output") && (
          <>
            <Field label={t("blueprintFlow.inspector.varName")}>
              <Input
                value={data.varName ?? ""}
                onChange={(e) => patch({ varName: e.target.value })}
                className="h-7 text-xs"
                placeholder="variable_name"
              />
            </Field>
            <Field label={t("blueprintFlow.inspector.dataType")}>
              <PortTypeSelect
                value={data.varType ?? "any"}
                onChange={(v) => patch({ varType: v as PortType })}
              />
            </Field>
          </>
        )}

        {/* Node ID (readonly) */}
        <Field label={t("blueprintFlow.inspector.nodeId")}>
          <div className="rounded-md border px-2 py-1.5 font-mono text-[10px] text-muted-foreground break-all">
            {node.id}
          </div>
        </Field>
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function PortTypeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-7 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PORT_TYPE_OPTIONS.map((value) => (
          <SelectItem key={value} value={value}>
            {t(`port.${value}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}