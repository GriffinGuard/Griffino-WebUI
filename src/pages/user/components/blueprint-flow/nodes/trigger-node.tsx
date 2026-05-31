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


import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { useTranslation } from "react-i18next";
import { Zap } from "lucide-react";
import type { FlowNodeData } from "../types";

type TriggerNodeType = Node<FlowNodeData>;

export function TriggerNode({ data, selected }: NodeProps<TriggerNodeType>) {
  const { t } = useTranslation();
  return (
    <div
      className="min-w-[220px] rounded-xl border-2 shadow-lg transition-all"
      style={{
        borderColor: selected ? "#6366f1" : "rgba(99,102,241,0.5)",
        background: "hsl(var(--card))",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 rounded-t-[10px] px-3 py-2"
        style={{ background: "rgba(99,102,241,0.15)" }}
      >
        <Zap size={14} style={{ color: "#6366f1" }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6366f1" }}>
          {t("blueprintFlow.nodes.trigger")}
        </span>
      </div>

      {/* Body */}
      <div className="space-y-1.5 px-3 py-2.5">
        <div>
          <div className="text-[10px] text-muted-foreground">{t("blueprintFlow.inspector.eventType")}</div>
          <div className="truncate text-sm font-medium">
            {data.eventType || <span className="italic text-muted-foreground">{t("common.notSet")}</span>}
          </div>
        </div>
        {data.triggerPluginId && (
          <div>
            <div className="text-[10px] text-muted-foreground">{t("blueprintFlow.inspector.sourcePluginShort")}</div>
            <div className="truncate text-sm">{data.triggerPluginId}</div>
          </div>
        )}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{
          width: 12,
          height: 12,
          background: "#6366f1",
          border: "2px solid hsl(var(--background))",
          right: -6,
        }}
      />
    </div>
  );
}