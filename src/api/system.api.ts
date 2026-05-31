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
import type { RawSystemStatusResponse, SystemStatus } from "@/types/system";

function normalizeSystemStatus(payload: RawSystemStatusResponse): SystemStatus {
  return {
    rabbitmq: {
      containerName: payload.system?.rabbitmq?.container ?? "",
      amqpPort: payload.system?.rabbitmq?.port ?? 0,
      managementPort: payload.system?.rabbitmq?.mgmtPort ?? 0,
      bindMode: "127.0.0.1 only",
      image: "—",
    },
    redis: {
      containerName: payload.system?.redis?.container ?? "",
      port: payload.system?.redis?.port ?? 0,
      persistence: "—",
      bindMode: "127.0.0.1 only",
      image: "—",
    },
    daemon: {
      apiEndpoint: "http://localhost:7070/api/v1",
      systemNetwork: "—",
      databasePath: "—",
      webUiStatus: payload.status ?? "unknown",
    },
  };
}

export function getSystemStatus() {
  return request<RawSystemStatusResponse>("/api/v1/system/status").then(normalizeSystemStatus);
}