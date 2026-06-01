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


import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type IsValidConnection,
  type OnNodesChange,
  type OnEdgesChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";

import { useUndoRedo } from "@/hooks/use-undo-redo";
import type { Blueprint } from "@/types/blueprint";
import type { PluginCapability } from "@/types/plugin";
import { arePortsCompatible, getPortColor } from "./port-types";
import {
  blueprintToFlow,
  flowToPayload,
  makeBuiltinNode,
  makeCapabilityNode,
  saveFlowMeta,
} from "./serializer";
import { TriggerNode } from "./nodes/trigger-node";
import { CapabilityNode } from "./nodes/capability-node";
import { IfNode } from "./nodes/if-node";
import { LoopNode } from "./nodes/loop-node";
import { InputNode, OutputNode } from "./nodes/io-node";
import { JoinNode } from "./nodes/join-node";
import { PluginPalette } from "./plugin-palette";
import { NodeInspector } from "./node-inspector";
import type { FlowNodeData, PortType } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NODE_TYPES: NodeTypes = {
  trigger: TriggerNode,
  capability: CapabilityNode,
  if: IfNode,
  loop: LoopNode,
  input: InputNode,
  output: OutputNode,
  join: JoinNode,
} as unknown as NodeTypes;

// ─── Inner canvas (needs useReactFlow inside ReactFlowProvider) ───────────────

interface CanvasProps {
  blueprintId?: string;
  capabilities: PluginCapability[];
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  mismatchedEdgeIds?: Set<string>;
}

function Canvas({
  capabilities,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  mismatchedEdgeIds,
}: CanvasProps) {
  const { screenToFlowPosition, getNode } = useReactFlow();
  const { resolvedTheme } = useTheme();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;

  // ── Port type validation ────────────────────────────────────────────────────
  const isValidConnection = useCallback<IsValidConnection>(
    (connection: Connection | Edge) => {
      const srcNode = getNode(connection.source!);
      const tgtNode = getNode(connection.target!);
      if (!srcNode || !tgtNode) return false;
      if (srcNode.id === tgtNode.id) return false;

      const src = srcNode.data as FlowNodeData;
      const tgt = tgtNode.data as FlowNodeData;

      // Determine output port type from source
      let outType: PortType | string = "any";
      const sh = connection.sourceHandle;
      if (src.kind === "capability") outType = src.outputPortType ?? "any";
      else if (src.kind === "input") outType = src.varType ?? "any";
      else if (src.kind === "trigger") outType = "any";
      else if (src.kind === "if") outType = sh === "out-true" ? "boolean" : "any";
      else if (src.kind === "loop") outType = "any";
      else if (src.kind === "join") outType = "any";

      // Determine input port type from target
      let inType: PortType | string = "any";
      if (tgt.kind === "capability") inType = tgt.inputPortType ?? "any";
      else if (tgt.kind === "output") inType = tgt.varType ?? "any";
      else inType = "any";
      if (tgt.kind === "join") inType = "any";

      return arePortsCompatible(outType, inType);
    },
    [getNode],
  );

  // ── Connect handler ─────────────────────────────────────────────────────────
  const onConnect = useCallback(
    (connection: Connection) => {
      const srcNode = getNode(connection.source!);
      const src = srcNode?.data as FlowNodeData | undefined;
      const outType =
        src?.kind === "capability"
          ? (src.outputPortType ?? "any")
          : src?.kind === "input"
            ? (src.varType ?? "any")
            : src?.kind === "join"
              ? "any"
              : "any";

      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            style: { stroke: getPortColor(outType), strokeWidth: 2 },
          },
          eds,
        ),
      );
    },
    [getNode, setEdges],
  );

  // ── Drag & Drop from palette ────────────────────────────────────────────────
  const dragKindRef = useRef<string>("");
  const dragMetaRef = useRef<Record<string, string>>({});

  const onDragStart = useCallback(
    (e: React.DragEvent, kind: string, meta: Record<string, string> = {}) => {
      dragKindRef.current = kind;
      dragMetaRef.current = meta;
      e.dataTransfer.effectAllowed = "move";
    },
    [],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const kind = dragKindRef.current;
      if (!kind) return;

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const meta = dragMetaRef.current;

      let newNode: Node;
      if (kind === "capability") {
        newNode = makeCapabilityNode(
          meta.pluginId ?? "",
          meta.pluginName ?? "",
          meta.capabilityId ?? "",
          meta.capabilityName ?? "",
          meta.capabilityType ?? "any",
          meta.consumesType ?? "any",
          meta.entryPoint ?? "",
          position,
        );
      } else {
        newNode = makeBuiltinNode(kind as "if" | "loop" | "input" | "output" | "join", position);
      }

      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition, setNodes],
  );

  // ── Node data update (from inspector) ──────────────────────────────────────
  const onUpdateNodeData = useCallback(
    (id: string, partial: Partial<FlowNodeData>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, ...partial } } : n,
        ),
      );
    },
    [setNodes],
  );

  // ── Delete selected node (backspace/delete) ─────────────────────────────────
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        onRedo();
        return;
      }

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        onUndo();
        return;
      }

      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        onRedo();
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedNodeId) {
        if (selectedNodeId === "__trigger__") return;
        setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
        setEdges((eds) =>
          eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId),
        );
        setSelectedNodeId(null);
      }
    },
    [selectedNodeId, setNodes, setEdges, onUndo, onRedo],
  );

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <div className="w-[220px] flex-shrink-0">
        <PluginPalette capabilities={capabilities} onDragStart={onDragStart} />
      </div>

      {/* Canvas */}
      <div className="relative flex-1" onKeyDown={onKeyDown} tabIndex={0}>
        <ReactFlow
          nodes={nodes}
          edges={edges.map((edge) => ({
            ...edge,
            style: {
              ...edge.style,
              stroke: mismatchedEdgeIds?.has(edge.id) ? "#ef4444" : ((edge.style as Record<string, unknown>)?.stroke as string) ?? "#6b7280",
              strokeWidth: mismatchedEdgeIds?.has(edge.id) ? 3 : 2,
            },
          }))}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          nodeTypes={NODE_TYPES}
          isValidConnection={isValidConnection}
          colorMode={resolvedTheme === "dark" ? "dark" : "light"}
          defaultEdgeOptions={{ style: { strokeWidth: 2 } }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          deleteKeyCode={null}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls />
          <MiniMap
            nodeStrokeWidth={3}
            style={{ background: "hsl(var(--card))" }}
          />
        </ReactFlow>

        {/* Incompatibility toast overlay */}
      </div>

      {/* Right panel */}
      {selectedNode && (
        <NodeInspector
          node={selectedNode as Node<FlowNodeData>}
          onUpdate={onUpdateNodeData}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export interface BlueprintFlowEditorHandle {
  getPayload: (name: string) => ReturnType<typeof flowToPayload>;
  getFlowSnapshot: () => { nodes: Node<FlowNodeData>[]; edges: Edge[] };
  persistMeta: () => void;
  undo: () => void;
  redo: () => void;
  highlightMismatches: (mismatches: { fromNodeId: string; toNodeId: string }[]) => void;
  clearHighlights: () => void;
}

interface BlueprintFlowEditorProps {
  blueprint?: Blueprint;
  capabilities: PluginCapability[];
  editorRef?: React.RefObject<BlueprintFlowEditorHandle | null>;
  onFlowChange?: () => void;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
}

export function BlueprintFlowEditor({
  blueprint,
  capabilities,
  editorRef,
  onFlowChange,
  onHistoryChange,
}: BlueprintFlowEditorProps) {
  const initialFlow = blueprint
    ? blueprintToFlow(blueprint)
    : {
        nodes: [
          {
            id: "__trigger__",
            type: "trigger",
            position: { x: 80, y: 200 },
            data: {
              kind: "trigger" as const,
              label: "Trigger",
              eventType: "",
              triggerPluginId: "",
            },
          },
        ] as Node<FlowNodeData>[],
        edges: [] as Edge[],
      };

  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow.nodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow.edges);
  const [mismatchedEdgeIds, setMismatchedEdgeIds] = useState<Set<string>>(new Set());

  const { push, undo: undoOp, redo: redoOp, clear: clearHistory, canUndo, canRedo } =
    useUndoRedo({ nodes: initialFlow.nodes as Node[], edges: initialFlow.edges as Edge[] });

  const skipPushRef = useRef(false);

  const handleUndo = useCallback(() => {
    const snapshot = undoOp();
    if (!snapshot) return;
    skipPushRef.current = true;
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
  }, [undoOp, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    const snapshot = redoOp();
    if (!snapshot) return;
    skipPushRef.current = true;
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
  }, [redoOp, setNodes, setEdges]);

  useEffect(() => {
    onHistoryChange?.(canUndo, canRedo);
  }, [canUndo, canRedo, onHistoryChange]);

  useEffect(() => {
    if (skipPushRef.current) {
      skipPushRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      push({ nodes, edges });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [nodes, edges]);

  // Re-init when blueprint changes (edit mode loading)
  const prevIdRef = useRef<string | undefined>(blueprint?.id);
  useEffect(() => {
    if (blueprint && blueprint.id !== prevIdRef.current) {
      prevIdRef.current = blueprint.id;
      const flow = blueprintToFlow(blueprint);
      clearHistory();
      skipPushRef.current = true;
      setNodes(flow.nodes);
      setEdges(flow.edges);
    }
  }, [blueprint, setNodes, setEdges, clearHistory]);

  // Expose imperative handle
  useEffect(() => {
    if (!editorRef) return;
    (editorRef as React.MutableRefObject<BlueprintFlowEditorHandle>).current = {
      getPayload: (name: string) => flowToPayload(nodes as Node<FlowNodeData>[], edges, name),
      getFlowSnapshot: () => ({
        nodes: nodes as Node<FlowNodeData>[],
        edges,
      }),
      persistMeta: () => {
        if (blueprint?.id) saveFlowMeta(blueprint.id, nodes as Node<FlowNodeData>[], edges);
      },
      undo: handleUndo,
      redo: handleRedo,
      highlightMismatches: (mismatches) => {
        const ids = new Set(mismatches.map((m) => `${m.fromNodeId}->>${m.toNodeId}`));
        setMismatchedEdgeIds(ids);
      },
      clearHighlights: () => setMismatchedEdgeIds(new Set()),
    };
  });

  useEffect(() => {
    onFlowChange?.();
  }, [edges, nodes, onFlowChange]);

  return (
    <ReactFlowProvider>
      <Canvas
        blueprintId={blueprint?.id}
        capabilities={capabilities}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        setNodes={setNodes}
        setEdges={setEdges}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        mismatchedEdgeIds={mismatchedEdgeIds}
      />
    </ReactFlowProvider>
  );
}