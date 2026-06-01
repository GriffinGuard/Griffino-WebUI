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

import { describe, it, expect } from "vitest";
import { validateFlow } from "@/pages/user/components/blueprint-flow/validation";
import type { FlowNodeData } from "@/pages/user/components/blueprint-flow/types";
import type { Node, Edge } from "@xyflow/react";

function makeNode(overrides: Partial<Node<FlowNodeData>> & { id: string; data: FlowNodeData }): Node<FlowNodeData> {
  return {
    id: overrides.id,
    type: overrides.type ?? (overrides.data.kind as string),
    position: overrides.position ?? { x: 0, y: 0 },
    data: overrides.data,
  } as Node<FlowNodeData>;
}

function makeEdge(overrides: Partial<Edge> & { id: string; source: string; target: string }): Edge {
  return { ...overrides } as Edge;
}

describe("validateFlow", () => {
  it("returns valid: false when trigger has no event type", () => {
    const nodes: Node<FlowNodeData>[] = [
      makeNode({
        id: "__trigger__",
        data: { kind: "trigger", label: "Trigger", eventType: "" },
      }),
    ];
    const result = validateFlow(nodes, [], "My Blueprint");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Trigger event type is required");
  });

  it("returns valid: false when trigger is not connected", () => {
    const nodes: Node<FlowNodeData>[] = [
      makeNode({
        id: "__trigger__",
        data: { kind: "trigger", label: "Trigger", eventType: "plugin.started" },
      }),
    ];
    const result = validateFlow(nodes, [], "My Blueprint");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Trigger is not connected to any node");
  });

  it("returns valid: false when name is empty", () => {
    const nodes: Node<FlowNodeData>[] = [
      makeNode({
        id: "__trigger__",
        data: { kind: "trigger", label: "Trigger", eventType: "plugin.started" },
      }),
      makeNode({
        id: "node1",
        data: { kind: "capability", label: "Node 1" },
      }),
    ];
    const edges: Edge[] = [
      makeEdge({ id: "e1", source: "__trigger__", target: "node1" }),
    ];
    const result = validateFlow(nodes, edges, "");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Blueprint name is required");
  });

  it("returns valid: true for a valid flow", () => {
    const nodes: Node<FlowNodeData>[] = [
      makeNode({
        id: "__trigger__",
        data: { kind: "trigger", label: "Trigger", eventType: "plugin.started" },
      }),
      makeNode({
        id: "node1",
        data: { kind: "capability", label: "Node 1" },
      }),
    ];
    const edges: Edge[] = [
      makeEdge({ id: "e1", source: "__trigger__", target: "node1" }),
    ];
    const result = validateFlow(nodes, edges, "My Blueprint");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("warns about isolated (unconnected) nodes", () => {
    const nodes: Node<FlowNodeData>[] = [
      makeNode({
        id: "__trigger__",
        data: { kind: "trigger", label: "Trigger", eventType: "plugin.started" },
      }),
      makeNode({
        id: "node1",
        data: { kind: "capability", label: "Connected Node", capabilityName: "Connected" },
      }),
      makeNode({
        id: "node2",
        data: { kind: "capability", label: "Isolated Node", capabilityName: "Isolated" },
      }),
    ];
    const edges: Edge[] = [
      makeEdge({ id: "e1", source: "__trigger__", target: "node1" }),
    ];
    const result = validateFlow(nodes, edges, "My Blueprint");
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("unconnected");
    expect(result.warnings[0]).toContain("Isolated");
  });

  it("does not warn when all non-trigger nodes are connected", () => {
    const nodes: Node<FlowNodeData>[] = [
      makeNode({
        id: "__trigger__",
        data: { kind: "trigger", label: "T", eventType: "e" },
      }),
      makeNode({
        id: "a",
        data: { kind: "capability", label: "A" },
      }),
    ];
    const edges: Edge[] = [
      makeEdge({ id: "e1", source: "__trigger__", target: "a" }),
    ];
    const result = validateFlow(nodes, edges, "Blueprint");
    expect(result.warnings).toHaveLength(0);
  });
});
