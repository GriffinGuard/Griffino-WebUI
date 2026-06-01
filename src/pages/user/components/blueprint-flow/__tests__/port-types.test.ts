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
import { getPortColor, arePortsCompatible, capabilityTypeToPortType, PORT_COLORS, PORT_LABELS } from "@/pages/user/components/blueprint-flow/port-types";

describe("PORT_COLORS", () => {
  it("has entries for all known port types", () => {
    expect(PORT_COLORS.any).toBe("#6b7280");
    expect(PORT_COLORS.text).toBe("#22c55e");
    expect(PORT_COLORS.number).toBe("#3b82f6");
    expect(PORT_COLORS.boolean).toBe("#f97316");
    expect(PORT_COLORS.audio).toBe("#a855f7");
    expect(PORT_COLORS.image).toBe("#ef4444");
    expect(PORT_COLORS.llm).toBe("#06b6d4");
    expect(PORT_COLORS.tts).toBe("#8b5cf6");
    expect(PORT_COLORS.stt).toBe("#ec4899");
    expect(PORT_COLORS.embedding).toBe("#14b8a6");
    expect(PORT_COLORS.object).toBe("#f59e0b");
  });
});

describe("PORT_LABELS", () => {
  it("has entries for all known port types", () => {
    expect(PORT_LABELS.any).toBe("Any");
    expect(PORT_LABELS.text).toBe("Text");
    expect(PORT_LABELS.number).toBe("Number");
    expect(PORT_LABELS.llm).toBe("LLM");
  });
});

describe("getPortColor", () => {
  it("returns color for known type", () => {
    expect(getPortColor("text")).toBe("#22c55e");
    expect(getPortColor("llm")).toBe("#06b6d4");
  });

  it("returns any color for unknown type", () => {
    expect(getPortColor("unknown")).toBe("#6b7280");
  });

  it("returns any color for undefined", () => {
    expect(getPortColor(undefined)).toBe("#6b7280");
  });
});

describe("arePortsCompatible", () => {
  it("returns true when both are undefined", () => {
    expect(arePortsCompatible(undefined, undefined)).toBe(true);
  });

  it("returns true when one is undefined", () => {
    expect(arePortsCompatible("text", undefined)).toBe(true);
    expect(arePortsCompatible(undefined, "text")).toBe(true);
  });

  it("returns true when either is any", () => {
    expect(arePortsCompatible("any", "text")).toBe(true);
    expect(arePortsCompatible("text", "any")).toBe(true);
    expect(arePortsCompatible("any", "any")).toBe(true);
  });

  it("returns true when types match", () => {
    expect(arePortsCompatible("text", "text")).toBe(true);
    expect(arePortsCompatible("llm", "llm")).toBe(true);
    expect(arePortsCompatible("number", "number")).toBe(true);
  });

  it("returns false when types differ", () => {
    expect(arePortsCompatible("text", "number")).toBe(false);
    expect(arePortsCompatible("audio", "image")).toBe(false);
    expect(arePortsCompatible("llm", "tts")).toBe(false);
  });

  it("handles undefined safely for the second param", () => {
    expect(arePortsCompatible("text", "")).toBe(true);
  });
});

describe("capabilityTypeToPortType", () => {
  it("returns the same type for known capability types", () => {
    expect(capabilityTypeToPortType("text")).toBe("text");
    expect(capabilityTypeToPortType("number")).toBe("number");
    expect(capabilityTypeToPortType("boolean")).toBe("boolean");
    expect(capabilityTypeToPortType("audio")).toBe("audio");
    expect(capabilityTypeToPortType("image")).toBe("image");
    expect(capabilityTypeToPortType("llm")).toBe("llm");
    expect(capabilityTypeToPortType("tts")).toBe("tts");
    expect(capabilityTypeToPortType("stt")).toBe("stt");
    expect(capabilityTypeToPortType("embedding")).toBe("embedding");
    expect(capabilityTypeToPortType("object")).toBe("object");
  });

  it("returns any for unknown capability types", () => {
    expect(capabilityTypeToPortType("unknown")).toBe("any");
    expect(capabilityTypeToPortType("")).toBe("any");
  });
});
