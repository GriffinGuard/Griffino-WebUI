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


export type PortType =
  | "any"
  | "text"
  | "number"
  | "boolean"
  | "audio"
  | "image"
  | "llm"
  | "tts"
  | "stt"
  | "embedding"
  | "object";

export type FlowNodeKind =
  | "trigger"
  | "capability"
  | "if"
  | "loop"
  | "input"
  | "output";

export interface FlowNodeData extends Record<string, unknown> {
  kind: FlowNodeKind;
  label: string;
  // capability node
  pluginId?: string;
  pluginName?: string;
  capabilityId?: string;
  capabilityName?: string;
  requestTopicPattern?: string;
  timeoutMs?: number;
  outputPortType?: PortType;
  inputPortType?: PortType;
  // trigger node
  eventType?: string;
  triggerPluginId?: string;
  // if node
  condition?: string;
  // loop node
  loopCount?: number;
  loopType?: "count" | "condition";
  loopConditionExpr?: string;
  // io node
  varName?: string;
  varType?: PortType;
}