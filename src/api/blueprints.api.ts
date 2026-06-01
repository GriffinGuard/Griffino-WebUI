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
import type { Blueprint, BlueprintPayload } from "@/types/blueprint";

function normalizeBlueprintList(payload: unknown): Blueprint[] {
  if (Array.isArray(payload)) {
    return payload as Blueprint[];
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.items)) {
      return record.items as Blueprint[];
    }
    if (Array.isArray(record.blueprints)) {
      return record.blueprints as Blueprint[];
    }
  }

  return [];
}

export function listBlueprints() {
  return request<unknown>("/api/v1/blueprints").then(normalizeBlueprintList);
}

export function getBlueprint(id: string) {
  return request<Blueprint>(`/api/v1/blueprints/${id}`);
}

export function createBlueprint(payload: BlueprintPayload) {
  return request<Blueprint>("/api/v1/blueprints", {
    method: "POST",
    body: payload,
  });
}

export function updateBlueprint(id: string, payload: BlueprintPayload) {
  return request<Blueprint>(`/api/v1/blueprints/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteBlueprint(id: string) {
  return request<void>(`/api/v1/blueprints/${id}`, { method: "DELETE" });
}