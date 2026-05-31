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
import { Box } from "lucide-react";
import { getPortColor } from "../port-types";
import type { FlowNodeData } from "../types";

type CapabilityNodeType = Node<FlowNodeData>;

export function CapabilityNode({ data, selected }: NodeProps<CapabilityNodeType>) {
  const inColor = getPortColor(data.inputPortType);
  const outColor = getPortColor(data.outputPortType);
  const headerColor = outColor;

  return (
    <div
      className="min-w-[260px] rounded-xl border-2 shadow-lg transition-all"
      style={{
        borderColor: selected ? headerColor : `${headerColor}66`,
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
          background: inColor,
          border: "2px solid hsl(var(--background))",
          left: -6,
        }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 rounded-t-[10px] px-3 py-2"
        style={{ background: `${headerColor}18` }}
      >
        <Box size={13} style={{ color: headerColor }} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[10px] text-muted-foreground">{data.pluginName ?? data.pluginId}</div>
          <div className="truncate text-xs font-semibold" style={{ color: headerColor }}>
            {data.capabilityName ?? data.capabilityId ?? data.label}
          </div>
        </div>
        {(data.outputPortType && data.outputPortType !== "any") && (
          <span
            className="rounded px-1 py-0.5 text-[9px] font-medium uppercase"
            style={{ background: `${headerColor}28`, color: headerColor }}
          >
            {data.outputPortType}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="space-y-1.5 px-3 py-2.5">
        {data.requestTopicPattern && (
          <div>
            <div className="text-[10px] text-muted-foreground">Topic</div>
            <div className="truncate font-mono text-xs text-foreground/80">{data.requestTopicPattern}</div>
          </div>
        )}
        {data.timeoutMs !== undefined && (
          <div>
            <div className="text-[10px] text-muted-foreground">Timeout</div>
            <div className="text-xs">{data.timeoutMs} ms</div>
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
          background: outColor,
          border: "2px solid hsl(var(--background))",
          right: -6,
        }}
      />
    </div>
  );
}