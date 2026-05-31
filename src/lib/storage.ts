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


export const STORAGE_KEYS = {
  token: "griffino_token",
  username: "griffino_username",
  role: "griffino_role",
  mustChangePassword: "griffino_must_change_password",
  language: "griffino_lang",
} as const;

export type UserRole = "admin" | "user";

export interface StoredSession {
  token: string;
  username: string;
  role: UserRole;
  mustChangePassword: boolean;
}

export function readSession(): StoredSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const token = sessionStorage.getItem(STORAGE_KEYS.token);
  const username = sessionStorage.getItem(STORAGE_KEYS.username);
  const role = sessionStorage.getItem(STORAGE_KEYS.role) as UserRole | null;
  const mustChangePassword = sessionStorage.getItem(STORAGE_KEYS.mustChangePassword);

  if (!token || !username || !role || mustChangePassword === null) {
    return null;
  }

  return {
    token,
    username,
    role,
    mustChangePassword: mustChangePassword === "true",
  };
}

export function writeSession(session: StoredSession) {
  sessionStorage.setItem(STORAGE_KEYS.token, session.token);
  sessionStorage.setItem(STORAGE_KEYS.username, session.username);
  sessionStorage.setItem(STORAGE_KEYS.role, session.role);
  sessionStorage.setItem(
    STORAGE_KEYS.mustChangePassword,
    String(session.mustChangePassword),
  );
}

export function clearSession() {
  sessionStorage.removeItem(STORAGE_KEYS.token);
  sessionStorage.removeItem(STORAGE_KEYS.username);
  sessionStorage.removeItem(STORAGE_KEYS.role);
  sessionStorage.removeItem(STORAGE_KEYS.mustChangePassword);
}