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


import type { Edge, Node } from "@xyflow/react";
import type { TFunction } from "i18next";
import type { FlowNodeData } from "./types";

export interface FlowValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function getNodeDisplayName(node: Node<FlowNodeData>): string {
  const data = node.data;
  const raw =
    data.capabilityName ??
    data.label ??
    data.varName ??
    data.capabilityId ??
    node.id;

  return String(raw || node.id);
}

export function validateFlow(
  nodes: Node<FlowNodeData>[],
  edges: Edge[],
  blueprintName = "",
  t?: TFunction,
): FlowValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const triggerNode = nodes.find((node) => node.id === "__trigger__");
  const triggerEvent = String(triggerNode?.data?.eventType ?? "").trim();
  if (!triggerEvent) {
    errors.push(t ? t("blueprints.validation.triggerEventRequired") : "Trigger event type is required");
  }

  const triggerEdges = edges.filter((edge) => edge.source === "__trigger__");
  if (triggerEdges.length === 0) {
    errors.push(t ? t("blueprints.validation.triggerNotConnected") : "Trigger is not connected to any node");
  }

  if (!blueprintName.trim()) {
    errors.push(t ? t("blueprints.validation.nameRequired") : "Blueprint name is required");
  }

  const isolatedNodes = nodes
    .filter((node) => node.id !== "__trigger__")
    .filter((node) => {
      const hasIncoming = edges.some((edge) => edge.target === node.id);
      const hasOutgoing = edges.some((edge) => edge.source === node.id);
      return !hasIncoming && !hasOutgoing;
    });

  if (isolatedNodes.length > 0) {
    const names = isolatedNodes.map(getNodeDisplayName).join("、");
    warnings.push(
      t
        ? t("blueprints.validation.isolatedNodes", { names })
        : `There are unconnected nodes: ${names}`,
    );
  }

  // Check Join nodes for single incoming edge
  const joinNodes = nodes.filter((n) => (n.data as FlowNodeData).kind === "join");
  for (const node of joinNodes) {
    const incomingCount = edges.filter((e) => e.target === node.id).length;
    if (incomingCount <= 1) {
      warnings.push(
        t
          ? t("blueprints.validation.joinSingleInput", { nodeId: node.id })
          : `Join node ${node.id} has only one incoming edge; fan-in is unnecessary`,
      );
    }

    // Check if Join is downstream of IF false branch (deadlock risk)
    const visited = new Set<string>();
    const queue = [node.id];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      const incomingEdges = edges.filter((e) => e.target === currentId);
      for (const edge of incomingEdges) {
        if (edge.sourceHandle === "out-false") {
          warnings.push(
            t
              ? t("blueprints.validation.joinDownstreamOfIfFalse", { nodeId: node.id })
              : `Join node ${node.id} is downstream of IF false branch — may deadlock`,
          );
          queue.length = 0;
          break;
        }
        if (!visited.has(edge.source)) queue.push(edge.source);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}