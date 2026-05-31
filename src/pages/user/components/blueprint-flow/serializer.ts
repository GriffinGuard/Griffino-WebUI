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


import type { Node, Edge } from "@xyflow/react";
import type { Blueprint, BlueprintPayload, BlueprintNode, BlueprintFlowMeta } from "@/types/blueprint";
import { capabilityTypeToPortType } from "./port-types";
import type { FlowNodeData, FlowNodeKind, PortType } from "./types";

// ─── Position persistence (localStorage) ─────────────────────────────────────

const STORAGE_KEY_PREFIX = "bp-flow-meta:";

export function saveFlowMeta(blueprintId: string, nodes: Node[], edges: Edge[]) {
  const meta: BlueprintFlowMeta = {
    positions: Object.fromEntries(nodes.map((n) => [n.id, n.position])),
    nodeExtras: Object.fromEntries(
      nodes.map((n) => {
        const d = n.data as FlowNodeData;
        return [
          n.id,
          {
            kind: d.kind,
            condition: d.condition,
            loopCount: d.loopCount,
            loopType: d.loopType,
            loopConditionExpr: d.loopConditionExpr,
            varName: d.varName,
            varType: d.varType,
            inputPortType: d.inputPortType,
            outputPortType: d.outputPortType,
          },
        ];
      }),
    ),
    edgeMeta: Object.fromEntries(
      edges.map((e) => [e.id, { sourceHandle: e.sourceHandle, targetHandle: e.targetHandle }]),
    ),
  };
  localStorage.setItem(STORAGE_KEY_PREFIX + blueprintId, JSON.stringify(meta));
}

export function loadFlowMeta(blueprintId: string): BlueprintFlowMeta | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + blueprintId);
    return raw ? (JSON.parse(raw) as BlueprintFlowMeta) : null;
  } catch {
    return null;
  }
}

// ─── Auto-layout (simple left-to-right DAG) ───────────────────────────────────

const NODE_WIDTH = 280;
const NODE_GAP_X = 80;
const NODE_GAP_Y = 80;
const NODE_HEIGHT_APPROX = 120;

function autoLayout(
  nodes: BlueprintNode[],
  triggerId: string,
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  const levels: Record<string, number> = {};
  const queue = [triggerId];
  levels[triggerId] = 0;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // BFS to assign column levels
  while (queue.length > 0) {
    const id = queue.shift()!;
    const node = nodeMap.get(id);
    if (!node) continue;
    for (const nextId of node.nextNodes) {
      if (levels[nextId] === undefined) {
        levels[nextId] = (levels[id] ?? 0) + 1;
        queue.push(nextId);
      }
    }
  }

  // Group by level to assign rows
  const byLevel: Record<number, string[]> = {};
  for (const [id, level] of Object.entries(levels)) {
    if (!byLevel[level]) byLevel[level] = [];
    byLevel[level].push(id);
  }

  for (const [levelStr, ids] of Object.entries(byLevel)) {
    const level = Number(levelStr);
    ids.forEach((id, rowIdx) => {
      const totalRows = ids.length;
      positions[id] = {
        x: 80 + level * (NODE_WIDTH + NODE_GAP_X),
        y: 80 + (rowIdx - (totalRows - 1) / 2) * (NODE_HEIGHT_APPROX + NODE_GAP_Y),
      };
    });
  }

  return positions;
}

// ─── Blueprint → Flow ─────────────────────────────────────────────────────────

export function blueprintToFlow(
  blueprint: Blueprint,
): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
  const meta = loadFlowMeta(blueprint.id);

  // Trigger node
  const triggerId = "__trigger__";
  const allBpNodes: BlueprintNode[] = [
    // Synthetic trigger node for layout
    { id: triggerId, pluginId: "", capabilityId: "", requestTopicPattern: "", nextNodes: blueprint.nodes[0] ? [blueprint.nodes[0].id] : [] },
    ...blueprint.nodes,
  ];

  const autoPos = autoLayout(allBpNodes, triggerId);

  const flowNodes: Node<FlowNodeData>[] = [];
  const flowEdges: Edge[] = [];

  // Trigger node
  flowNodes.push({
    id: triggerId,
    type: "trigger",
    position: meta?.positions?.[triggerId] ?? autoPos[triggerId] ?? { x: 80, y: 200 },
    data: {
      kind: "trigger",
      label: "Trigger",
      eventType: blueprint.trigger.eventType,
      triggerPluginId: blueprint.trigger.pluginId,
    },
  });

  // Capability / builtin nodes
  for (const bpNode of blueprint.nodes) {
    const extras = meta?.nodeExtras?.[bpNode.id];
    const kind: FlowNodeKind =
      bpNode.pluginId === "__builtin__"
        ? (bpNode.capabilityId === "__if__"
            ? "if"
            : bpNode.capabilityId === "__loop__"
              ? "loop"
              : bpNode.capabilityId === "__input__"
                ? "input"
                : "output")
        : "capability";

    const nodeData: FlowNodeData = {
      kind,
      label: bpNode.capabilityId,
      pluginId: bpNode.pluginId,
      capabilityId: bpNode.capabilityId,
      requestTopicPattern: bpNode.requestTopicPattern,
      timeoutMs: bpNode.timeoutMs,
      inputPortType: (extras?.inputPortType as PortType) ?? "any",
      outputPortType: (extras?.outputPortType as PortType) ?? "any",
      condition: extras?.condition,
      loopCount: extras?.loopCount,
      loopType: extras?.loopType,
      loopConditionExpr: extras?.loopConditionExpr,
      varName: extras?.varName,
      varType: extras?.varType as PortType | undefined,
    };

    const position =
      meta?.positions?.[bpNode.id] ?? autoPos[bpNode.id] ?? { x: 400, y: 200 };

    flowNodes.push({ id: bpNode.id, type: kind, position, data: nodeData });
  }

  // Edges: trigger → first node
  if (blueprint.nodes[0]) {
    flowEdges.push({
      id: `${triggerId}->>${blueprint.nodes[0].id}`,
      source: triggerId,
      sourceHandle: "out",
      target: blueprint.nodes[0].id,
      targetHandle: "in",
      style: { stroke: "#6366f1", strokeWidth: 2 },
    });
  }

  // Edges: node → nextNodes
  for (const bpNode of blueprint.nodes) {
    const extras = meta?.nodeExtras?.[bpNode.id];
    bpNode.nextNodes.forEach((nextId, idx) => {
      const isIf = extras?.kind === "if";
      const isLoop = extras?.kind === "loop";
      let sourceHandle = "out";
      if (isIf) sourceHandle = idx === 0 ? "out-true" : "out-false";
      if (isLoop) sourceHandle = idx === 0 ? "out-body" : "out-done";

      const edgeMeta = meta?.edgeMeta?.[`${bpNode.id}->>${nextId}`];
      flowEdges.push({
        id: `${bpNode.id}->>${nextId}`,
        source: bpNode.id,
        sourceHandle: edgeMeta?.sourceHandle ?? sourceHandle,
        target: nextId,
        targetHandle: edgeMeta?.targetHandle ?? "in",
        style: { strokeWidth: 2 },
      });
    });
  }

  return { nodes: flowNodes, edges: flowEdges };
}

// ─── Flow → BlueprintPayload ──────────────────────────────────────────────────

export function flowToPayload(
  nodes: Node<FlowNodeData>[],
  edges: Edge[],
  name: string,
): BlueprintPayload {
  const triggerNode = nodes.find((n) => n.id === "__trigger__");
  const trigger = {
    eventType: (triggerNode?.data.eventType as string | undefined) ?? "",
    pluginId: (triggerNode?.data.triggerPluginId as string | undefined) || undefined,
  };

  // Build adjacency: sourceId+sourceHandle → [targetId]
  const adjacency: Record<string, { targetId: string; sourceHandle: string }[]> = {};
  for (const edge of edges) {
    const key = edge.source;
    if (!adjacency[key]) adjacency[key] = [];
    adjacency[key].push({ targetId: edge.target, sourceHandle: edge.sourceHandle ?? "out" });
  }

  const nodeList = nodes.filter((n) => n.id !== "__trigger__");
  const payloadByNodeId = new Map<string, BlueprintNode>();

  nodeList.forEach((node) => {
    const data = node.data as FlowNodeData;
    const nexts = [...(adjacency[node.id] ?? [])];
    // Sort: for if/loop, out-true/out-body first
    nexts.sort((a, b) => {
      const order = (handle: string) =>
        handle === "out-true" || handle === "out-body"
          ? 0
          : handle === "out-false" || handle === "out-done"
            ? 1
            : 2;
      return order(a.sourceHandle) - order(b.sourceHandle);
    });

    payloadByNodeId.set(node.id, {
      id: node.id,
      pluginId: data.pluginId ?? "__builtin__",
      capabilityId: data.capabilityId ?? kindToCapabilityId(data.kind),
      requestTopicPattern: data.requestTopicPattern ?? conditionOrLoopExpr(data),
      nextNodes: nexts.map((edge) => edge.targetId),
      timeoutMs: data.timeoutMs,
    });
  });

  const orderedNodeIds: string[] = [];
  const visited = new Set<string>();
  const triggerTargets = (adjacency.__trigger__ ?? []).map((edge) => edge.targetId);
  const queue = [...triggerTargets];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (visited.has(nodeId) || !payloadByNodeId.has(nodeId)) {
      continue;
    }

    visited.add(nodeId);
    orderedNodeIds.push(nodeId);

    const nextNodes = payloadByNodeId.get(nodeId)?.nextNodes ?? [];
    nextNodes.forEach((nextNodeId) => {
      if (!visited.has(nextNodeId)) {
        queue.push(nextNodeId);
      }
    });
  }

  nodeList.forEach((node) => {
    if (!visited.has(node.id)) {
      orderedNodeIds.push(node.id);
    }
  });

  const bpNodes = orderedNodeIds
    .map((nodeId) => payloadByNodeId.get(nodeId))
    .filter((node): node is BlueprintNode => Boolean(node));

  return { name, trigger, nodes: bpNodes };
}

function kindToCapabilityId(kind: FlowNodeKind): string {
  const map: Record<FlowNodeKind, string> = {
    if: "__if__",
    loop: "__loop__",
    input: "__input__",
    output: "__output__",
    trigger: "__trigger__",
    capability: "",
  };
  return map[kind] ?? "";
}

function conditionOrLoopExpr(d: FlowNodeData): string {
  if (d.kind === "if") return d.condition ?? "";
  if (d.kind === "loop")
    return d.loopType === "condition" ? (d.loopConditionExpr ?? "") : String(d.loopCount ?? 1);
  return "";
}

// ─── New capability node factory ──────────────────────────────────────────────

export function makeCapabilityNode(
  pluginId: string,
  pluginName: string,
  capabilityId: string,
  capabilityName: string,
  capabilityType: string,
  consumesType: string,
  entryPoint: string,
  position: { x: number; y: number },
): Node<FlowNodeData> {
  const outType = capabilityTypeToPortType(capabilityType);
  const inType = capabilityTypeToPortType(consumesType || "any");
  return {
    id: crypto.randomUUID(),
    type: "capability",
    position,
    data: {
      kind: "capability",
      label: capabilityName,
      pluginId,
      pluginName,
      capabilityId,
      capabilityName,
      requestTopicPattern: entryPoint,
      outputPortType: outType,
      inputPortType: inType,
    },
  };
}

export function makeBuiltinNode(
  kind: "if" | "loop" | "input" | "output",
  position: { x: number; y: number },
): Node<FlowNodeData> {
  const defaults: Record<string, Partial<FlowNodeData>> = {
    if: { condition: "", kind: "if", label: "If", pluginId: "__builtin__", capabilityId: "__if__" },
    loop: { loopType: "count", loopCount: 3, kind: "loop", label: "Loop", pluginId: "__builtin__", capabilityId: "__loop__" },
    input: { varName: "input", varType: "any", kind: "input", label: "Input", pluginId: "__builtin__", capabilityId: "__input__" },
    output: { varName: "output", varType: "any", kind: "output", label: "Output", pluginId: "__builtin__", capabilityId: "__output__" },
  };
  return {
    id: crypto.randomUUID(),
    type: kind,
    position,
    data: defaults[kind] as FlowNodeData,
  };
}