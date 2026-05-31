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
  CreateUserResponse,
  ResetPasswordResponse,
  UserRecord,
} from "@/types/user";

function normalizeUsers(payload: unknown): UserRecord[] {
  if (Array.isArray(payload)) {
    return payload as UserRecord[];
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (Array.isArray(record.users)) {
      return record.users as UserRecord[];
    }

    if (Array.isArray(record.items)) {
      return record.items as UserRecord[];
    }
  }

  return [];
}

export function listUsers() {
  return request<unknown>("/api/v1/users").then(normalizeUsers);
}

export function createUser(username: string) {
  return request<CreateUserResponse>("/api/v1/users", {
    method: "POST",
    body: { username },
  });
}

export function patchUser(
  username: string,
  payload: { resetPassword?: boolean; disabled?: boolean },
) {
  return request<ResetPasswordResponse | void>(`/api/v1/users/${username}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteUser(username: string) {
  return request<void>(`/api/v1/users/${username}`, { method: "DELETE" });
}