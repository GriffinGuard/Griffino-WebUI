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

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Blueprint, BlueprintNode } from "@/types/blueprint";
import type { FlowNodeData } from "@/pages/user/components/blueprint-flow/types";

const mockStore = new Map<string, string>();
const mockLocalStorage: Storage = {
  getItem: vi.fn((key: string) => mockStore.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => { mockStore.set(key, value); }),
  removeItem: vi.fn((key: string) => { mockStore.delete(key); }),
  clear: vi.fn(() => { mockStore.clear(); }),
  length: 0,
  key: vi.fn(() => null),
};
Object.defineProperty(globalThis, "localStorage", { value: mockLocalStorage, writable: true });

import { blueprintToFlow, flowToPayload, saveFlowMeta, loadFlowMeta, makeCapabilityNode, makeBuiltinNode } from "@/pages/user/components/blueprint-flow/serializer";

describe("saveFlowMeta / loadFlowMeta", () => {
  beforeEach(() => {
    mockStore.clear();
    vi.clearAllMocks();
  });

  it("saves and loads flow meta", () => {
    const nodes = [
      { id: "n1", position: { x: 100, y: 200 }, data: { kind: "capability", label: "N1" } },
    ] as any;
    const edges = [{ id: "e1", source: "n1", target: "n2", sourceHandle: "out", targetHandle: "in" }] as any;

    saveFlowMeta("bp-1", nodes, edges);
    const meta = loadFlowMeta("bp-1");

    expect(meta).not.toBeNull();
    expect(meta!.positions["n1"]).toEqual({ x: 100, y: 200 });
    expect(meta!.edgeMeta!["e1"]).toEqual({ sourceHandle: "out", targetHandle: "in" });
  });

  it("returns null for non-existent blueprint", () => {
    expect(loadFlowMeta("nonexistent")).toBeNull();
  });

  it("returns null for corrupt JSON", () => {
    mockStore.set("bp-flow-meta:bad", "not json{{{{");
    expect(loadFlowMeta("bad")).toBeNull();
  });
});

describe("blueprintToFlow", () => {
  beforeEach(() => {
    mockStore.clear();
  });

  it("creates trigger node and capability nodes from blueprint", () => {
    const bp: Blueprint = {
      id: "bp-1",
      userId: "u1",
      name: "Test BP",
      trigger: { eventType: "plugin.started", pluginId: "p1" },
      nodes: [
        {
          id: "node-1",
          pluginId: "some-plugin",
          capabilityId: "some-cap",
          requestTopicPattern: "invoke.some-plugin.some-cap.v1",
          nextNodes: [],
          timeoutMs: 5000,
        },
      ],
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    };

    const { nodes, edges } = blueprintToFlow(bp);

    const triggerNode = nodes.find((n) => n.id === "__trigger__");
    expect(triggerNode).toBeDefined();
    expect(triggerNode!.data.eventType).toBe("plugin.started");
    expect(triggerNode!.data.triggerPluginId).toBe("p1");

    const capNode = nodes.find((n) => n.id === "node-1");
    expect(capNode).toBeDefined();
    expect(capNode!.data.pluginId).toBe("some-plugin");
    expect(capNode!.data.requestTopicPattern).toBe("invoke.some-plugin.some-cap.v1");

    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe("__trigger__");
    expect(edges[0].target).toBe("node-1");
  });

  it("generates edges for nextNodes chain", () => {
    const bp: Blueprint = {
      id: "bp-2",
      userId: "u1",
      name: "Chain BP",
      trigger: { eventType: "hook.webhook" },
      nodes: [
        { id: "a", pluginId: "p1", capabilityId: "c1", requestTopicPattern: "", nextNodes: ["b"] },
        { id: "b", pluginId: "p1", capabilityId: "c2", requestTopicPattern: "", nextNodes: ["c"] },
        { id: "c", pluginId: "p1", capabilityId: "c3", requestTopicPattern: "", nextNodes: [] },
      ],
      createdAt: "",
      updatedAt: "",
    };

    const { nodes, edges } = blueprintToFlow(bp);
    expect(edges).toHaveLength(3);
    expect(edges.map((e) => `${e.source}->${e.target}`)).toContain("__trigger__->a");
    expect(edges.map((e) => `${e.source}->${e.target}`)).toContain("a->b");
    expect(edges.map((e) => `${e.source}->${e.target}`)).toContain("b->c");
  });

  it("restores positions from localStorage meta", () => {
    mockStore.set("bp-flow-meta:bp-pos", JSON.stringify({
      positions: { "__trigger__": { x: 50, y: 50 }, "n1": { x: 400, y: 100 } },
      nodeExtras: {},
      edgeMeta: {},
    }));

    const bp: Blueprint = {
      id: "bp-pos",
      userId: "u1",
      name: "Pos BP",
      trigger: { eventType: "tick" },
      nodes: [{ id: "n1", pluginId: "p1", capabilityId: "c1", requestTopicPattern: "", nextNodes: [] }],
      createdAt: "",
      updatedAt: "",
    };

    const { nodes } = blueprintToFlow(bp);
    const triggerNode = nodes.find((n) => n.id === "__trigger__");
    expect(triggerNode!.position).toEqual({ x: 50, y: 50 });
    expect(nodes.find((n) => n.id === "n1")!.position).toEqual({ x: 400, y: 100 });
  });
});

describe("flowToPayload", () => {
  it("converts flow nodes and edges back to BlueprintPayload", () => {
    const bp: Blueprint = {
      id: "bp-1",
      userId: "u1",
      name: "My BP",
      trigger: { eventType: "plugin.started" },
      nodes: [{ id: "a", pluginId: "p1", capabilityId: "c1", requestTopicPattern: "invoke.p1.c1.v1", nextNodes: [] }],
      createdAt: "",
      updatedAt: "",
    };

    const { nodes, edges } = blueprintToFlow(bp);
    const payload = flowToPayload(nodes, edges, "My BP");

    expect(payload.name).toBe("My BP");
    expect(payload.trigger.eventType).toBe("plugin.started");
    expect(payload.nodes).toHaveLength(1);
    expect(payload.nodes[0].id).toBe("a");
    expect(payload.nodes[0].pluginId).toBe("p1");
    expect(payload.nodes[0].capabilityId).toBe("c1");
    expect(payload.nodes[0].requestTopicPattern).toBe("invoke.p1.c1.v1");
  });

  it("preserves edge connections in payload", () => {
    const bp: Blueprint = {
      id: "bp-chain",
      userId: "u1",
      name: "Chain",
      trigger: { eventType: "hook" },
      nodes: [
        { id: "x", pluginId: "p1", capabilityId: "c1", requestTopicPattern: "", nextNodes: ["y"] },
        { id: "y", pluginId: "p1", capabilityId: "c2", requestTopicPattern: "", nextNodes: [] },
      ],
      createdAt: "",
      updatedAt: "",
    };

    const { nodes, edges } = blueprintToFlow(bp);
    const payload = flowToPayload(nodes, edges, "Chain");

    expect(payload.nodes).toHaveLength(2);
    const nodeX = payload.nodes.find((n) => n.id === "x");
    expect(nodeX!.nextNodes).toEqual(["y"]);
    const nodeY = payload.nodes.find((n) => n.id === "y");
    expect(nodeY!.nextNodes).toEqual([]);
  });
});

describe("makeCapabilityNode", () => {
  it("creates a capability node with correct shape", () => {
    const node = makeCapabilityNode("p1", "Plugin 1", "cap1", "Cap One", "text", "any", "invoke.p1.cap1.v1", { x: 100, y: 200 });
    expect(node.type).toBe("capability");
    expect(node.data.kind).toBe("capability");
    expect(node.data.pluginId).toBe("p1");
    expect(node.data.pluginName).toBe("Plugin 1");
    expect(node.data.capabilityId).toBe("cap1");
    expect(node.data.capabilityName).toBe("Cap One");
    expect(node.data.requestTopicPattern).toBe("invoke.p1.cap1.v1");
    expect(node.data.outputPortType).toBe("text");
    expect(node.data.inputPortType).toBe("any");
    expect(node.position).toEqual({ x: 100, y: 200 });
  });
});

describe("makeBuiltinNode", () => {
  it("creates an if node with defaults", () => {
    const node = makeBuiltinNode("if", { x: 50, y: 100 });
    expect(node.type).toBe("if");
    expect(node.data.kind).toBe("if");
    expect(node.data.condition).toBe("");
    expect(node.data.pluginId).toBe("__builtin__");
  });

  it("creates a loop node with count defaults", () => {
    const node = makeBuiltinNode("loop", { x: 0, y: 0 });
    expect(node.type).toBe("loop");
    expect(node.data.loopType).toBe("count");
    expect(node.data.loopCount).toBe(3);
  });

  it("creates an input node with varName", () => {
    const node = makeBuiltinNode("input", { x: 0, y: 0 });
    expect(node.data.kind).toBe("input");
    expect(node.data.varName).toBe("input");
    expect(node.data.varType).toBe("any");
  });

  it("creates an output node with varName", () => {
    const node = makeBuiltinNode("output", { x: 0, y: 0 });
    expect(node.data.kind).toBe("output");
    expect(node.data.varName).toBe("output");
  });
});
