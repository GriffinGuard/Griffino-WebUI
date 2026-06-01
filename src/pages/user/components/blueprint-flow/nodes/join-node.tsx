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


import { Handle, Position, useReactFlow, type NodeProps, type Node } from "@xyflow/react";
import { useTranslation } from "react-i18next";
import { Merge } from "lucide-react";
import type { FlowNodeData } from "../types";

type JoinNodeType = Node<FlowNodeData>;

const HEADER_COLOR = "#8b5cf6";

export function JoinNode({ data, id, selected }: NodeProps<JoinNodeType>) {
  const { t } = useTranslation();
  const { getEdges } = useReactFlow();
  const incomingCount = getEdges().filter((e) => e.target === id).length;

  return (
    <div
      className="min-w-[200px] rounded-xl border-2 shadow-lg transition-all"
      style={{
        borderColor: selected ? HEADER_COLOR : `${HEADER_COLOR}66`,
        background: "hsl(var(--card))",
      }}
    >
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

      <div
        className="flex items-center gap-2 rounded-t-[10px] px-3 py-2"
        style={{ background: `${HEADER_COLOR}18` }}
      >
        <Merge size={13} style={{ color: HEADER_COLOR }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: HEADER_COLOR }}>
          {t("blueprintFlow.nodes.join")}
        </span>
      </div>

      <div className="px-3 py-2.5">
        <div className="text-[10px] text-muted-foreground">
          {t("blueprintFlow.inspector.joinIncoming")}
        </div>
        <div className="mt-0.5 font-mono text-sm">{incomingCount}</div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{
          width: 12,
          height: 12,
          background: HEADER_COLOR,
          border: "2px solid hsl(var(--background))",
          right: -6,
          top: "50%",
        }}
      />
    </div>
  );
}
