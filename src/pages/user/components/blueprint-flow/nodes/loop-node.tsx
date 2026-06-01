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
import { RefreshCw } from "lucide-react";
import type { FlowNodeData } from "../types";

type LoopNodeType = Node<FlowNodeData>;

const HEADER_COLOR = "#14b8a6";

export function LoopNode({ data, selected }: NodeProps<LoopNodeType>) {
  const { t } = useTranslation();
  const loopDesc =
    data.loopType === "condition"
      ? (data.loopConditionExpr ?? t("common.notSet"))
      : t("blueprintFlow.nodes.loopTimes", { count: data.loopCount ?? "?" });

  return (
    <div
      className="min-w-[220px] rounded-xl border-2 shadow-lg transition-all"
      style={{
        borderColor: selected ? HEADER_COLOR : `${HEADER_COLOR}66`,
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
          background: "#6b7280",
          border: "2px solid hsl(var(--background))",
          left: -6,
          top: "50%",
        }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 rounded-t-[10px] px-3 py-2"
        style={{ background: `${HEADER_COLOR}18` }}
      >
        <RefreshCw size={13} style={{ color: HEADER_COLOR }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: HEADER_COLOR }}>
          {t("blueprintFlow.nodes.loop")}
        </span>
      </div>

      {/* Body */}
      <div className="px-3 py-2.5">
        <div className="text-[10px] text-muted-foreground">
          {data.loopType === "condition" ? t("blueprintFlow.inspector.loopCondition") : t("blueprintFlow.inspector.loopCount")}
        </div>
        <div className="mt-0.5 truncate font-mono text-xs">
          {loopDesc}
        </div>
      </div>

      {/* Body output */}
      <Handle
        type="source"
        position={Position.Right}
        id="out-body"
        style={{
          width: 12,
          height: 12,
          background: HEADER_COLOR,
          border: "2px solid hsl(var(--background))",
          right: -6,
          top: "38%",
        }}
      />
      <div
        className="absolute right-4 text-[9px] font-medium"
        style={{ top: "calc(38% - 14px)", color: HEADER_COLOR }}
      >
        {t("blueprintFlow.nodes.loopBody")}
      </div>

      {/* Done output */}
      <Handle
        type="source"
        position={Position.Right}
        id="out-done"
        style={{
          width: 12,
          height: 12,
          background: "#6b7280",
          border: "2px solid hsl(var(--background))",
          right: -6,
          top: "62%",
        }}
      />
      <div
        className="absolute right-4 text-[9px] font-medium"
        style={{ top: "calc(62% - 14px)", color: "#6b7280" }}
      >
        {t("blueprintFlow.nodes.loopDone")}
      </div>
    </div>
  );
}