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
import { LogIn, LogOut } from "lucide-react";
import { getPortColor, PORT_LABELS } from "../port-types";
import type { FlowNodeData } from "../types";

type IONodeType = Node<FlowNodeData>;

export function InputNode({ data, selected }: NodeProps<IONodeType>) {
  const { t } = useTranslation();
  const color = getPortColor(data.varType);
  return (
    <div
      className="min-w-[200px] rounded-xl border-2 shadow-lg transition-all"
      style={{
        borderColor: selected ? color : `${color}66`,
        background: "hsl(var(--card))",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 rounded-t-[10px] px-3 py-2"
        style={{ background: `${color}18` }}
      >
        <LogIn size={13} style={{ color }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
          {t("blueprintFlow.nodes.inputShort")}
        </span>
      </div>

      {/* Body */}
      <div className="px-3 py-2.5">
        <div className="text-[10px] text-muted-foreground">{t("blueprintFlow.inspector.varName")}</div>
        <div className="mt-0.5 text-sm font-medium">
          {data.varName || <span className="italic text-muted-foreground">{t("common.unnamed")}</span>}
        </div>
        <div
          className="mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
          style={{ background: `${color}22`, color }}
        >
          {t(`port.${data.varType ?? "any"}`, {
            defaultValue: PORT_LABELS[data.varType ?? "any"] ?? "Any",
          })}
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{
          width: 12,
          height: 12,
          background: color,
          border: "2px solid hsl(var(--background))",
          right: -6,
        }}
      />
    </div>
  );
}

export function OutputNode({ data, selected }: NodeProps<IONodeType>) {
  const { t } = useTranslation();
  const color = getPortColor(data.varType);
  return (
    <div
      className="min-w-[200px] rounded-xl border-2 shadow-lg transition-all"
      style={{
        borderColor: selected ? color : `${color}66`,
        background: "hsl(var(--card))",
      }}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{
          width: 12,
          height: 12,
          background: color,
          border: "2px solid hsl(var(--background))",
          left: -6,
        }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 rounded-t-[10px] px-3 py-2"
        style={{ background: `${color}18` }}
      >
        <LogOut size={13} style={{ color }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
          {t("blueprintFlow.nodes.outputShort")}
        </span>
      </div>

      {/* Body */}
      <div className="px-3 py-2.5">
        <div className="text-[10px] text-muted-foreground">{t("blueprintFlow.inspector.varName")}</div>
        <div className="mt-0.5 text-sm font-medium">
          {data.varName || <span className="italic text-muted-foreground">{t("common.unnamed")}</span>}
        </div>
        <div
          className="mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
          style={{ background: `${color}22`, color }}
        >
          {t(`port.${data.varType ?? "any"}`, {
            defaultValue: PORT_LABELS[data.varType ?? "any"] ?? "Any",
          })}
        </div>
      </div>
    </div>
  );
}