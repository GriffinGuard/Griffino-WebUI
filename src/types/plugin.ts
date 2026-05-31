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


export type PluginStatus =
  | "pending_setup"
  | "ready"
  | "pulling"
  | "starting"
  | "running"
  | "stopped"
  | "failed";

export interface RuntimeContainer {
  serviceId: string;
  containerName: string;
}

export interface PluginRuntime {
  networkName?: string;
  rabbitmqUser?: string;
  redisUser?: string;
}

export interface Plugin {
  id: string;
  name: string;
  directory: string;
  status: PluginStatus;
  containerCount: number;
  isDev: boolean;
  installedAt?: string;
  configDirty?: boolean;
  failStage?: string;
  failReason?: string;
  runtime?: PluginRuntime;
  containers?: RuntimeContainer[];
}

export interface RawPlugin {
  id: string;
  pluginDir?: string;
  status: PluginStatus;
  installedAt?: string;
  isDevPlugin?: boolean;
  configDirty?: boolean;
  failStage?: string;
  failReason?: string;
  runtimeInfo?: {
    containers?: Record<string, string>;
    network?: string;
    rabbitmqUser?: string;
    redisUser?: string;
  };
}

export interface PluginStats {
  total: number;
  running: number;
  stopped: number;
  pending: number;
}

export interface PluginConfigFieldOption {
  label: string;
  value: string;
}

export type PluginConfigFieldType =
  | "string"
  | "int"
  | "float"
  | "boolean"
  | "password"
  | "options"
  | "multiline_string";

export interface PluginConfigField {
  key: string;
  label: string;
  description?: string;
  required?: boolean;
  type: PluginConfigFieldType;
  options?: PluginConfigFieldOption[];
  placeholder?: string;
}

export interface PluginConfigGroup {
  id: string;
  label: string;
  fields: PluginConfigField[];
}

export interface PluginConfigService {
  id: string;
  label: string;
  groups: PluginConfigGroup[];
}

export interface PluginConfigSchemaResponse {
  services: PluginConfigService[];
  currentValues: Record<string, unknown>;
}

export interface PluginUserConfigResponse {
  groups: PluginConfigGroup[];
}

export interface PluginStatusView {
  id: string;
  name: Record<string, string>;
  type: string;
  redisKeyPattern: string;
}

export interface PluginStatusViewsResponse {
  statusViews: PluginStatusView[];
}

export interface PluginStatusViewDataResponse {
  viewId: string;
  type: string;
  data: Record<string, string>;
}

export interface PluginAction {
  id: string;
  name: Record<string, string>;
  description: Record<string, string>;
  confirmation: {
    required: boolean;
    message?: Record<string, string>;
  };
  cooldownMs: number;
}

export interface PluginActionsResponse {
  actions: PluginAction[];
}

export interface TriggerPluginActionResponse {
  ok: boolean;
  actionId: string;
}

export interface CapabilitySlot {
  id: string;
  label?: string;
  name?: string;
  description?: string;
}

export interface PluginCapability {
  id: string;
  pluginId: string;
  pluginName: string;
  capabilityId: string;
  name: string;
  description?: string;
  role: "consumer" | "provider";
  type: string;
  required?: boolean;
  consumesCapabilityType?: string;
  slots?: CapabilitySlot[];
  entryPoint?: string;
}