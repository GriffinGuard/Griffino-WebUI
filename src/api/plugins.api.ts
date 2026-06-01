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


import { request } from "@/api/client";
import type {
  Plugin,
  PluginCapability,
  PluginConfigField,
  PluginConfigFieldOption,
  PluginConfigSchemaResponse,
  PluginConfigService,
  PluginAction,
  PluginActionsResponse,
  PluginStatusView,
  PluginStatusViewDataResponse,
  PluginStatusViewsResponse,
  TriggerPluginActionResponse,
  RawPlugin,
  PluginConfigGroup,
  PluginUserConfigResponse,
} from "@/types/plugin";

export function normalizePlugin(raw: RawPlugin): Plugin {
  const containers = Object.entries(raw.runtimeInfo?.containers ?? {}).map(
    ([serviceId, containerName]) => ({
      serviceId,
      containerName,
    }),
  );

  return {
    id: raw.id,
    name: raw.id,
    directory: raw.pluginDir ?? "",
    status: raw.status,
    containerCount: containers.length,
    isDev: Boolean(raw.isDevPlugin),
    installedAt: raw.installedAt,
    configDirty: raw.configDirty,
    failStage: raw.failStage,
    failReason: raw.failReason,
    runtime: {
      networkName: raw.runtimeInfo?.network,
      rabbitmqUser: raw.runtimeInfo?.rabbitmqUser,
      redisUser: raw.runtimeInfo?.redisUser,
    },
    containers,
  };
}

export function normalizePluginList(payload: unknown): Plugin[] {
  if (Array.isArray(payload)) {
    return (payload as RawPlugin[]).map(normalizePlugin);
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (Array.isArray(record.plugins)) {
      return (record.plugins as RawPlugin[]).map(normalizePlugin);
    }

    if (Array.isArray(record.items)) {
      return (record.items as RawPlugin[]).map(normalizePlugin);
    }
  }

  return [];
}

export function normalizeCapabilities(payload: unknown): PluginCapability[] {
  const rawItems =
    payload && typeof payload === "object" && "capabilities" in payload
      ? (payload as { capabilities?: unknown }).capabilities
      : payload;

  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems.map((item) => {
    const record = item as Record<string, unknown>;
    return {
      id: String(record.id ?? ""),
      capabilityId: String(record.id ?? ""),
      pluginId: String(record.pluginId ?? ""),
      pluginName: String(record.pluginName ?? ""),
      name: String(record.name ?? record.id ?? ""),
      description: record.description ? String(record.description) : undefined,
      role: record.role === "provider" ? "provider" : "consumer",
      type: String(record.type ?? ""),
      required: record.optional === undefined ? undefined : !Boolean(record.optional),
      consumesCapabilityType: record.consumesCapabilityType
        ? String(record.consumesCapabilityType)
        : String(record.type ?? ""),
      entryPoint:
        record.pluginId && record.id
          ? `invoke.${String(record.pluginId)}.${String(record.id)}.v1`
          : undefined,
      slots: Array.isArray(record.slots)
        ? record.slots.map((slot) => {
            const slotRecord = slot as Record<string, unknown>;
            return {
              id: String(slotRecord.id ?? ""),
              label: slotRecord.name ? String(slotRecord.name) : undefined,
              name: slotRecord.name ? String(slotRecord.name) : undefined,
              description: slotRecord.description
                ? String(slotRecord.description)
                : undefined,
            };
          })
        : [],
    };
  });
}

export function toFieldType(type: unknown): PluginConfigField["type"] {
  if (
    type === "string" ||
    type === "int" ||
    type === "float" ||
    type === "boolean" ||
    type === "password" ||
    type === "options" ||
    type === "multiline_string"
  ) {
    return type;
  }

  return "string";
}

export function toOptions(values: unknown): PluginConfigFieldOption[] | undefined {
  if (!Array.isArray(values)) {
    return undefined;
  }

  return values.map((item, index) => {
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      return {
        label: String(record.display ?? record.value ?? `Option ${index + 1}`),
        value: String(record.value ?? ""),
      };
    }

    return {
      label: String(item),
      value: String(item),
    };
  });
}

export function normalizeBootConfigResponse(payload: unknown): PluginConfigSchemaResponse {
  const record = (payload ?? {}) as Record<string, unknown>;
  const rawServices = Array.isArray(record.services) ? record.services : [];
  const rawCurrentValues =
    record.currentValues && typeof record.currentValues === "object"
      ? (record.currentValues as Record<string, Record<string, unknown>>)
      : {};

  const services: PluginConfigService[] = rawServices.map((service, serviceIndex) => {
    const serviceRecord = service as Record<string, unknown>;
    const serviceId = String(serviceRecord.id ?? `service_${serviceIndex}`);
    const configs = Array.isArray(serviceRecord.configs) ? serviceRecord.configs : [];
    const grouped = new Map<string, PluginConfigField[]>();

    configs.forEach((config, configIndex) => {
      const configRecord = config as Record<string, unknown>;
      const groupName = String(configRecord.group ?? "General");
      const field: PluginConfigField = {
        key: `${serviceId}.${String(configRecord.key ?? `field_${configIndex}`)}`,
        label: String(configRecord.name ?? configRecord.key ?? `Field ${configIndex + 1}`),
        description: String(configRecord.description ?? ""),
        required: !Boolean(configRecord.optional),
        type: toFieldType(configRecord.type),
        options: toOptions(configRecord.values),
        placeholder: configRecord.default === undefined ? undefined : String(configRecord.default),
      };

      const current = grouped.get(groupName) ?? [];
      current.push(field);
      grouped.set(groupName, current);
    });

    const groups: PluginConfigGroup[] = Array.from(grouped.entries()).map(([groupName, fields]) => ({
      id: `${serviceId}.${groupName}`,
      label: groupName,
      fields,
    }));

    return {
      id: serviceId,
      label: serviceId,
      groups,
    };
  });

  const currentValues: Record<string, unknown> = {};
  Object.entries(rawCurrentValues).forEach(([serviceId, values]) => {
    Object.entries(values ?? {}).forEach(([key, value]) => {
      currentValues[`${serviceId}.${key}`] = value;
    });
  });

  return {
    services,
    currentValues,
  };
}

export function normalizeUserConfigResponse(payload: unknown): PluginUserConfigResponse {
  const record = (payload ?? {}) as Record<string, unknown>;
  const configs = Array.isArray(record.configs) ? record.configs : [];
  const grouped = new Map<string, PluginConfigField[]>();

  configs.forEach((config, index) => {
    const configRecord = config as Record<string, unknown>;
    const groupName = String(configRecord.group ?? "General");
    const field: PluginConfigField = {
      key: String(configRecord.key ?? `field_${index}`),
      label: String(configRecord.name ?? configRecord.key ?? `Field ${index + 1}`),
      description: String(configRecord.description ?? ""),
      required: !Boolean(configRecord.optional),
      type: toFieldType(configRecord.type),
      options: toOptions(configRecord.values),
      placeholder: configRecord.default === undefined ? undefined : String(configRecord.default),
    };

    const current = grouped.get(groupName) ?? [];
    current.push(field);
    grouped.set(groupName, current);
  });

  return {
    groups: Array.from(grouped.entries()).map(([groupName, fields]) => ({
      id: groupName,
      label: groupName,
      fields,
    })),
  };
}

export function normalizeUserConfigValues(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === "object" && "values" in payload) {
    const values = (payload as { values?: Record<string, unknown> }).values;
    return values ?? {};
  }

  if (payload && typeof payload === "object") {
    return payload as Record<string, unknown>;
  }

  return {};
}

export function normalizeStatusViews(payload: unknown): PluginStatusViewsResponse {
  const record = (payload ?? {}) as Record<string, unknown>;
  const rawViews = Array.isArray(record.statusViews) ? record.statusViews : [];

  return {
    statusViews: rawViews.map((view) => {
      const viewRecord = view as Record<string, unknown>;
      const rawName =
        viewRecord.name && typeof viewRecord.name === "object"
          ? (viewRecord.name as Record<string, unknown>)
          : {};

      return {
        id: String(viewRecord.id ?? ""),
        name: Object.fromEntries(
          Object.entries(rawName).map(([key, value]) => [key, String(value ?? "")]),
        ),
        type: String(viewRecord.type ?? ""),
        redisKeyPattern: String(viewRecord.redisKeyPattern ?? ""),
      } satisfies PluginStatusView;
    }),
  };
}

export function normalizeStatusViewData(payload: unknown): PluginStatusViewDataResponse {
  const record = (payload ?? {}) as Record<string, unknown>;
  const rawData =
    record.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : {};

  return {
    viewId: String(record.viewId ?? ""),
    type: String(record.type ?? ""),
    data: Object.fromEntries(
      Object.entries(rawData).map(([key, value]) => [key, String(value ?? "")]),
    ),
  };
}

export function normalizeActions(payload: unknown): PluginActionsResponse {
  const record = (payload ?? {}) as Record<string, unknown>;
  const rawActions = Array.isArray(record.actions) ? record.actions : [];

  return {
    actions: rawActions.map((action) => {
      const actionRecord = action as Record<string, unknown>;
      const rawName =
        actionRecord.name && typeof actionRecord.name === "object"
          ? (actionRecord.name as Record<string, unknown>)
          : {};
      const rawDescription =
        actionRecord.description && typeof actionRecord.description === "object"
          ? (actionRecord.description as Record<string, unknown>)
          : {};
      const rawConfirmation =
        actionRecord.confirmation && typeof actionRecord.confirmation === "object"
          ? (actionRecord.confirmation as Record<string, unknown>)
          : {};
      const rawConfirmationMessage =
        rawConfirmation.message && typeof rawConfirmation.message === "object"
          ? (rawConfirmation.message as Record<string, unknown>)
          : undefined;

      return {
        id: String(actionRecord.id ?? ""),
        name: Object.fromEntries(
          Object.entries(rawName).map(([key, value]) => [key, String(value ?? "")]),
        ),
        description: Object.fromEntries(
          Object.entries(rawDescription).map(([key, value]) => [key, String(value ?? "")]),
        ),
        confirmation: {
          required: Boolean(rawConfirmation.required),
          message: rawConfirmationMessage
            ? Object.fromEntries(
                Object.entries(rawConfirmationMessage).map(([key, value]) => [
                  key,
                  String(value ?? ""),
                ]),
              )
            : undefined,
        },
        cooldownMs: Number(actionRecord.cooldownMs ?? 0),
      } satisfies PluginAction;
    }),
  };
}

export function normalizeTriggerActionResponse(payload: unknown): TriggerPluginActionResponse {
  const record = (payload ?? {}) as Record<string, unknown>;
  return {
    ok: Boolean(record.ok),
    actionId: String(record.actionId ?? ""),
  };
}

export function toNestedPluginConfig(values: Record<string, unknown>) {
  const config: Record<string, Record<string, string>> = {};

  Object.entries(values).forEach(([key, value]) => {
    const splitIndex = key.indexOf(".");
    if (splitIndex === -1) {
      return;
    }

    const serviceId = key.slice(0, splitIndex);
    const fieldKey = key.slice(splitIndex + 1);
    if (!config[serviceId]) {
      config[serviceId] = {};
    }
    config[serviceId][fieldKey] = String(value ?? "");
  });

  return config;
}

export function listPlugins() {
  return request<unknown>("/api/v1/plugins").then(normalizePluginList);
}

export function startPlugin(id: string) {
  return request<void>(`/api/v1/plugins/${id}/start`, { method: "POST" });
}

export function stopPlugin(id: string) {
  return request<void>(`/api/v1/plugins/${id}/stop`, { method: "POST" });
}

export function uninstallPlugin(id: string) {
  return request<void>(`/api/v1/plugins/${id}`, { method: "DELETE" });
}

export function getPluginConfig(id: string) {
  return request<unknown>(`/api/v1/plugins/${id}/config`).then(normalizeBootConfigResponse);
}

export function savePluginConfig(
  id: string,
  payload: { action: "save_and_restart" | "save_and_start"; values: Record<string, unknown> },
) {
  return request<void>(`/api/v1/plugins/${id}/config`, {
    method: "POST",
    body: {
      action: payload.action,
      config: toNestedPluginConfig(payload.values),
    },
  });
}

export function getPluginUserConfigSchema(id: string) {
  return request<unknown>(`/api/v1/plugins/${id}/user-config`).then(normalizeUserConfigResponse);
}

export function getPluginUserConfigValues(id: string) {
  return request<unknown>(`/api/v1/plugins/${id}/user-config/values`).then(normalizeUserConfigValues);
}

export function savePluginUserConfigValues(id: string, values: Record<string, unknown>) {
  return request<void>(`/api/v1/plugins/${id}/user-config/values`, {
    method: "POST",
    body: values,
  });
}

export function getPluginStatusViews(id: string) {
  return request<unknown>(`/api/v1/plugins/${id}/status-views`).then(normalizeStatusViews);
}

export function getPluginStatusViewData(id: string, viewId: string) {
  return request<unknown>(`/api/v1/plugins/${id}/status/${encodeURIComponent(viewId)}`).then(
    normalizeStatusViewData,
  );
}

export function getPluginActions(id: string) {
  return request<unknown>(`/api/v1/plugins/${id}/actions`).then(normalizeActions);
}

export function triggerPluginAction(id: string, actionId: string) {
  return request<unknown>(`/api/v1/plugins/${id}/actions/${encodeURIComponent(actionId)}`, {
    method: "POST",
    body: {},
  }).then(normalizeTriggerActionResponse);
}

export function getCapabilities() {
  return request<unknown>("/api/v1/plugins/capabilities").then(normalizeCapabilities);
}