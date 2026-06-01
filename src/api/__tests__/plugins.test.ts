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
import {
  normalizePlugin,
  normalizePluginList,
  normalizeCapabilities,
  toFieldType,
  toOptions,
  normalizeBootConfigResponse,
  normalizeUserConfigResponse,
  normalizeUserConfigValues,
  normalizeStatusViews,
  normalizeStatusViewData,
  normalizeActions,
  normalizeTriggerActionResponse,
  toNestedPluginConfig,
} from "@/api/plugins.api";
import type { RawPlugin } from "@/types/plugin";

describe("normalizePlugin", () => {
  const minimal: RawPlugin = {
    id: "test-plugin",
    status: "running",
  };

  it("normalizes a minimal raw plugin", () => {
    const result = normalizePlugin(minimal);
    expect(result.id).toBe("test-plugin");
    expect(result.name).toBe("test-plugin");
    expect(result.status).toBe("running");
    expect(result.directory).toBe("");
    expect(result.containerCount).toBe(0);
    expect(result.isDev).toBe(false);
  });

  it("extracts isDev from isDevPlugin field", () => {
    const result = normalizePlugin({ ...minimal, isDevPlugin: true });
    expect(result.isDev).toBe(true);
  });

  it("maps runtime containers from runtimeInfo.containers", () => {
    const raw: RawPlugin = {
      ...minimal,
      runtimeInfo: {
        containers: { svc1: "container-a", svc2: "container-b" },
      },
    };
    const result = normalizePlugin(raw);
    expect(result.containerCount).toBe(2);
    expect(result.containers).toEqual([
      { serviceId: "svc1", containerName: "container-a" },
      { serviceId: "svc2", containerName: "container-b" },
    ]);
  });

  it("maps runtime info fields", () => {
    const raw: RawPlugin = {
      ...minimal,
      runtimeInfo: {
        network: "griffino-net",
        rabbitmqUser: "rmq-user",
        redisUser: "redis-user",
      },
    };
    const result = normalizePlugin(raw);
    expect(result.runtime).toEqual({
      networkName: "griffino-net",
      rabbitmqUser: "rmq-user",
      redisUser: "redis-user",
    });
  });

  it("uses pluginDir as directory", () => {
    const raw: RawPlugin = { ...minimal, pluginDir: "/opt/plugins/test" };
    expect(normalizePlugin(raw).directory).toBe("/opt/plugins/test");
  });

  it("passes through failStage and failReason", () => {
    const raw: RawPlugin = { ...minimal, failStage: "pull", failReason: "network error" };
    const result = normalizePlugin(raw);
    expect(result.failStage).toBe("pull");
    expect(result.failReason).toBe("network error");
  });

  it("passes through installedAt and configDirty", () => {
    const raw: RawPlugin = {
      ...minimal,
      installedAt: "2025-01-01T00:00:00Z",
      configDirty: true,
    };
    const result = normalizePlugin(raw);
    expect(result.installedAt).toBe("2025-01-01T00:00:00Z");
    expect(result.configDirty).toBe(true);
  });
});

describe("normalizePluginList", () => {
  it("returns empty array for null", () => {
    expect(normalizePluginList(null)).toEqual([]);
  });

  it("returns empty array for undefined", () => {
    expect(normalizePluginList(undefined)).toEqual([]);
  });

  it("normalizes flat array of raw plugins", () => {
    const result = normalizePluginList([
      { id: "a", status: "running" },
      { id: "b", status: "stopped" },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("a");
    expect(result[1].id).toBe("b");
  });

  it("normalizes payload with plugins key", () => {
    const result = normalizePluginList({
      plugins: [{ id: "a", status: "running" }],
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });

  it("normalizes payload with items key", () => {
    const result = normalizePluginList({
      items: [{ id: "b", status: "stopped" }],
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("b");
  });

  it("returns empty array for unrecognized object shape", () => {
    expect(normalizePluginList({ data: [] })).toEqual([]);
  });

  it("returns empty array for non-array non-object", () => {
    expect(normalizePluginList("invalid")).toEqual([]);
  });
});

describe("normalizeCapabilities", () => {
  it("returns empty array for null", () => {
    expect(normalizeCapabilities(null)).toEqual([]);
  });

  it("extracts from capabilities object wrapper", () => {
    const result = normalizeCapabilities({
      capabilities: [
        { id: "cap1", pluginId: "p1", pluginName: "Plugin 1", role: "consumer", type: "llm" },
      ],
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("cap1");
  });

  it("extracts from flat array", () => {
    const result = normalizeCapabilities([
      { id: "cap2", pluginId: "p2", pluginName: "Plugin 2", role: "provider", type: "text" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("provider");
  });

  it("defaults role to consumer for non-provider values", () => {
    const result = normalizeCapabilities([
      { id: "cap3", pluginId: "p3", pluginName: "P3", type: "text", role: "unknown" },
    ]);
    expect(result[0].role).toBe("consumer");
  });

  it("creates entryPoint from pluginId and id", () => {
    const result = normalizeCapabilities([
      { id: "cap4", pluginId: "my-plugin", pluginName: "MP", role: "consumer", type: "text" },
    ]);
    expect(result[0].entryPoint).toBe("invoke.my-plugin.cap4.v1");
  });

  it("handles slots array", () => {
    const result = normalizeCapabilities([
      {
        id: "cap5",
        pluginId: "p5",
        pluginName: "P5",
        role: "consumer",
        type: "text",
        slots: [
          { id: "slot1", name: "Slot One", description: "First slot" },
          { id: "slot2", name: "Slot Two" },
        ],
      },
    ]);
    expect(result[0].slots).toHaveLength(2);
    expect(result[0].slots![0]).toEqual({
      id: "slot1",
      label: "Slot One",
      name: "Slot One",
      description: "First slot",
    });
  });

  it("handles optional field", () => {
    const result = normalizeCapabilities([
      { id: "cap6", pluginId: "p6", pluginName: "P6", role: "consumer", type: "text", optional: true },
    ]);
    expect(result[0].required).toBe(false);
  });

  it("handles required (non-optional) field", () => {
    const result = normalizeCapabilities([
      { id: "cap7", pluginId: "p7", pluginName: "P7", role: "consumer", type: "text", optional: false },
    ]);
    expect(result[0].required).toBe(true);
  });

  it("returns empty array for non-array input", () => {
    expect(normalizeCapabilities({})).toEqual([]);
    expect(normalizeCapabilities("bad")).toEqual([]);
  });
});

describe("toFieldType", () => {
  it("returns valid field types unchanged", () => {
    expect(toFieldType("string")).toBe("string");
    expect(toFieldType("int")).toBe("int");
    expect(toFieldType("float")).toBe("float");
    expect(toFieldType("boolean")).toBe("boolean");
    expect(toFieldType("password")).toBe("password");
    expect(toFieldType("options")).toBe("options");
    expect(toFieldType("multiline_string")).toBe("multiline_string");
  });

  it("defaults to string for invalid types", () => {
    expect(toFieldType("invalid")).toBe("string");
    expect(toFieldType(42)).toBe("string");
    expect(toFieldType(null)).toBe("string");
    expect(toFieldType(undefined)).toBe("string");
  });
});

describe("toOptions", () => {
  it("returns undefined for non-array input", () => {
    expect(toOptions(null)).toBeUndefined();
    expect(toOptions("bad")).toBeUndefined();
    expect(toOptions(42)).toBeUndefined();
  });

  it("handles object items with display field", () => {
    const result = toOptions([
      { display: "Label A", value: "a" },
      { display: "Label B", value: "b" },
    ]);
    expect(result).toEqual([
      { label: "Label A", value: "a" },
      { label: "Label B", value: "b" },
    ]);
  });

  it("falls back to value for label when display is missing", () => {
    const result = toOptions([{ value: "x" }]);
    expect(result).toEqual([{ label: "x", value: "x" }]);
  });

  it("handles primitive string items", () => {
    const result = toOptions(["a", "b"]);
    expect(result).toEqual([
      { label: "a", value: "a" },
      { label: "b", value: "b" },
    ]);
  });

  it("handles empty array", () => {
    expect(toOptions([])).toEqual([]);
  });
});

describe("normalizeBootConfigResponse", () => {
  it("handles null/undefined", () => {
    const result = normalizeBootConfigResponse(null);
    expect(result.services).toEqual([]);
    expect(result.currentValues).toEqual({});
  });

  it("normalizes services with configs into groups", () => {
    const payload = {
      services: [
        {
          id: "svc1",
          configs: [
            { key: "host", name: "Host", type: "string", group: "Connection" },
            { key: "port", name: "Port", type: "int", group: "Connection" },
          ],
        },
      ],
    };
    const result = normalizeBootConfigResponse(payload);
    expect(result.services).toHaveLength(1);
    expect(result.services[0].id).toBe("svc1");
    expect(result.services[0].groups).toHaveLength(1);
    expect(result.services[0].groups[0].label).toBe("Connection");
    expect(result.services[0].groups[0].fields).toHaveLength(2);
    expect(result.services[0].groups[0].fields[0].key).toBe("svc1.host");
    expect(result.services[0].groups[0].fields[1].key).toBe("svc1.port");
  });

  it("handles configs with no group (defaults to General)", () => {
    const payload = {
      services: [
        { id: "svc1", configs: [{ key: "debug", name: "Debug", type: "boolean" }] },
      ],
    };
    const result = normalizeBootConfigResponse(payload);
    expect(result.services[0].groups[0].label).toBe("General");
  });

  it("extracts currentValues across services", () => {
    const payload = {
      services: [],
      currentValues: {
        svc1: { host: "localhost", port: 8080 },
        svc2: { enabled: true },
      },
    };
    const result = normalizeBootConfigResponse(payload);
    expect(result.currentValues).toEqual({
      "svc1.host": "localhost",
      "svc1.port": 8080,
      "svc2.enabled": true,
    });
  });

  it("handles optional field", () => {
    const payload = {
      services: [{ id: "s1", configs: [{ key: "k", name: "K", type: "string", optional: true }] }],
    };
    const result = normalizeBootConfigResponse(payload);
    expect(result.services[0].groups[0].fields[0].required).toBe(false);
  });
});

describe("normalizeUserConfigResponse", () => {
  it("handles null/undefined", () => {
    expect(normalizeUserConfigResponse(null).groups).toEqual([]);
  });

  it("normalizes configs into groups", () => {
    const payload = {
      configs: [
        { key: "threshold", name: "Threshold", type: "float", group: "Settings" },
        { key: "mode", name: "Mode", type: "options", group: "Settings", values: ["auto", "manual"] },
      ],
    };
    const result = normalizeUserConfigResponse(payload);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].fields).toHaveLength(2);
    expect(result.groups[0].fields[0].key).toBe("threshold");
    expect(result.groups[0].fields[1].key).toBe("mode");
  });
});

describe("normalizeUserConfigValues", () => {
  it("returns empty object for null", () => {
    expect(normalizeUserConfigValues(null)).toEqual({});
  });

  it("extracts values from values wrapper", () => {
    expect(normalizeUserConfigValues({ values: { a: 1, b: "x" } })).toEqual({ a: 1, b: "x" });
  });

  it("returns the object itself when no values key", () => {
    expect(normalizeUserConfigValues({ a: 1 })).toEqual({ a: 1 });
  });
});

describe("normalizeStatusViews", () => {
  it("handles null/undefined", () => {
    expect(normalizeStatusViews(null).statusViews).toEqual([]);
  });

  it("normalizes status views with localized names", () => {
    const payload = {
      statusViews: [
        {
          id: "view1",
          name: { "en-US": "CPU Usage", "zh-CN": "CPU 使用率" },
          type: "status",
          redisKeyPattern: "plugin:*:cpu",
        },
      ],
    };
    const result = normalizeStatusViews(payload);
    expect(result.statusViews).toHaveLength(1);
    expect(result.statusViews[0].id).toBe("view1");
    expect(result.statusViews[0].name).toEqual({ "en-US": "CPU Usage", "zh-CN": "CPU 使用率" });
    expect(result.statusViews[0].type).toBe("status");
  });
});

describe("normalizeStatusViewData", () => {
  it("handles null/undefined", () => {
    const result = normalizeStatusViewData(null);
    expect(result.viewId).toBe("");
    expect(result.type).toBe("");
    expect(result.data).toEqual({});
  });

  it("normalizes status view data", () => {
    const payload = {
      viewId: "view1",
      type: "status",
      data: { cpu: "45%", memory: "2.1GB", uptime: "3d" },
    };
    const result = normalizeStatusViewData(payload);
    expect(result.viewId).toBe("view1");
    expect(result.type).toBe("status");
    expect(result.data).toEqual({ cpu: "45%", memory: "2.1GB", uptime: "3d" });
  });
});

describe("normalizeActions", () => {
  it("handles null/undefined", () => {
    expect(normalizeActions(null).actions).toEqual([]);
  });

  it("normalizes actions with confirmation", () => {
    const payload = {
      actions: [
        {
          id: "restart",
          name: { "en-US": "Restart" },
          description: { "en-US": "Restart the service" },
          confirmation: {
            required: true,
            message: { "en-US": "Are you sure?" },
          },
          cooldownMs: 5000,
        },
      ],
    };
    const result = normalizeActions(payload);
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].id).toBe("restart");
    expect(result.actions[0].confirmation.required).toBe(true);
    expect(result.actions[0].confirmation.message).toEqual({ "en-US": "Are you sure?" });
    expect(result.actions[0].cooldownMs).toBe(5000);
  });

  it("handles action without confirmation", () => {
    const payload = {
      actions: [{ id: "ping", name: { "en-US": "Ping" }, description: { "en-US": "Check status" }, cooldownMs: 1000 }],
    };
    const result = normalizeActions(payload);
    expect(result.actions[0].confirmation.required).toBe(false);
    expect(result.actions[0].confirmation.message).toBeUndefined();
  });
});

describe("normalizeTriggerActionResponse", () => {
  it("handles null/undefined", () => {
    const result = normalizeTriggerActionResponse(null);
    expect(result.ok).toBe(false);
    expect(result.actionId).toBe("");
  });

  it("normalizes a successful response", () => {
    const result = normalizeTriggerActionResponse({ ok: true, actionId: "restart" });
    expect(result.ok).toBe(true);
    expect(result.actionId).toBe("restart");
  });
});

describe("toNestedPluginConfig", () => {
  it("splits dot-separated keys into service groups", () => {
    const result = toNestedPluginConfig({
      "svc1.host": "localhost",
      "svc1.port": "8080",
      "svc2.enabled": "true",
    });
    expect(result).toEqual({
      svc1: { host: "localhost", port: "8080" },
      svc2: { enabled: "true" },
    });
  });

  it("ignores keys without a dot separator", () => {
    const result = toNestedPluginConfig({ plainkey: "value" });
    expect(result).toEqual({});
  });

  it("converts non-string values to strings", () => {
    const result = toNestedPluginConfig({ "svc.port": 8080 as unknown as string });
    expect(result.svc.port).toBe("8080");
  });

  it("returns empty object for empty input", () => {
    expect(toNestedPluginConfig({})).toEqual({});
  });
});
