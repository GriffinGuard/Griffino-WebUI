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


import type { PortType } from "./types";

export const PORT_COLORS: Record<string, string> = {
  any: "#6b7280",
  text: "#22c55e",
  number: "#3b82f6",
  boolean: "#f97316",
  audio: "#a855f7",
  image: "#ef4444",
  llm: "#06b6d4",
  tts: "#8b5cf6",
  stt: "#ec4899",
  embedding: "#14b8a6",
  object: "#f59e0b",
};

export const PORT_LABELS: Record<string, string> = {
  any: "Any",
  text: "Text",
  number: "Number",
  boolean: "Boolean",
  audio: "Audio",
  image: "Image",
  llm: "LLM",
  tts: "TTS",
  stt: "STT",
  embedding: "Embedding",
  object: "Object",
};

export function getPortColor(type: PortType | string | undefined): string {
  return PORT_COLORS[type ?? "any"] ?? PORT_COLORS.any;
}

export function arePortsCompatible(
  outputType: PortType | string | undefined,
  inputType: PortType | string | undefined,
): boolean {
  if (!outputType || !inputType) return true;
  if (outputType === "any" || inputType === "any") return true;
  return outputType === inputType;
}

export function capabilityTypeToPortType(capType: string): PortType {
  const known = new Set<string>([
    "text", "number", "boolean", "audio", "image",
    "llm", "tts", "stt", "embedding", "object",
  ]);
  return known.has(capType) ? (capType as PortType) : "any";
}