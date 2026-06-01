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


export interface BlueprintNode {
  id: string;
  pluginId: string;
  capabilityId: string;
  requestTopicPattern: string;
  nextNodes: string[];
  timeoutMs?: number;
}

export interface BlueprintFlowMeta {
  positions: Record<string, { x: number; y: number }>;
  nodeExtras?: Record<
    string,
    {
      kind?: string;
      condition?: string;
      loopCount?: number;
      loopType?: "count" | "condition";
      loopConditionExpr?: string;
      varName?: string;
      varType?: string;
      inputPortType?: string;
      outputPortType?: string;
    }
  >;
  edgeMeta?: Record<string, { sourceHandle?: string | null; targetHandle?: string | null }>;
}

export interface Blueprint {
  id: string;
  userId: string;
  name: string;
  trigger: {
    eventType: string;
    pluginId?: string;
  };
  nodes: BlueprintNode[];
  createdAt: string;
  updatedAt: string;
}

export interface BlueprintPayload {
  name: string;
  trigger: {
    eventType: string;
    pluginId?: string;
  };
  nodes: BlueprintNode[];
}