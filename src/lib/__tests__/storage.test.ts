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

import { describe, it, expect, vi, beforeEach } from "vitest";
import { readSession, writeSession, clearSession, STORAGE_KEYS } from "@/lib/storage";

const mockStore = new Map<string, string>();

const mockSessionStorage: Storage = {
  getItem: vi.fn((key: string) => mockStore.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => { mockStore.set(key, value); }),
  removeItem: vi.fn((key: string) => { mockStore.delete(key); }),
  clear: vi.fn(() => { mockStore.clear(); }),
  length: 0,
  key: vi.fn(() => null),
};

Object.defineProperty(globalThis, "sessionStorage", {
  value: mockSessionStorage,
  writable: true,
});

describe("readSession", () => {
  beforeEach(() => {
    mockStore.clear();
    vi.clearAllMocks();
  });

  it("returns null when token is missing", () => {
    mockStore.set(STORAGE_KEYS.username, "alice");
    mockStore.set(STORAGE_KEYS.role, "admin");
    mockStore.set(STORAGE_KEYS.mustChangePassword, "false");
    expect(readSession()).toBeNull();
  });

  it("returns null when username is missing", () => {
    mockStore.set(STORAGE_KEYS.token, "tok1");
    mockStore.set(STORAGE_KEYS.role, "admin");
    mockStore.set(STORAGE_KEYS.mustChangePassword, "false");
    expect(readSession()).toBeNull();
  });

  it("returns null when role is missing", () => {
    mockStore.set(STORAGE_KEYS.token, "tok1");
    mockStore.set(STORAGE_KEYS.username, "alice");
    mockStore.set(STORAGE_KEYS.mustChangePassword, "false");
    expect(readSession()).toBeNull();
  });

  it("returns null when mustChangePassword is missing", () => {
    mockStore.set(STORAGE_KEYS.token, "tok1");
    mockStore.set(STORAGE_KEYS.username, "alice");
    mockStore.set(STORAGE_KEYS.role, "admin");
    expect(readSession()).toBeNull();
  });

  it("returns session when all keys are present", () => {
    mockStore.set(STORAGE_KEYS.token, "tok1");
    mockStore.set(STORAGE_KEYS.username, "alice");
    mockStore.set(STORAGE_KEYS.role, "admin");
    mockStore.set(STORAGE_KEYS.mustChangePassword, "true");
    expect(readSession()).toEqual({
      token: "tok1",
      username: "alice",
      role: "admin",
      mustChangePassword: true,
    });
  });

  it("parses mustChangePassword: false correctly", () => {
    mockStore.set(STORAGE_KEYS.token, "tok2");
    mockStore.set(STORAGE_KEYS.username, "bob");
    mockStore.set(STORAGE_KEYS.role, "user");
    mockStore.set(STORAGE_KEYS.mustChangePassword, "false");
    expect(readSession()?.mustChangePassword).toBe(false);
  });

  it("treats non-'true' string as false for mustChangePassword", () => {
    mockStore.set(STORAGE_KEYS.token, "tok3");
    mockStore.set(STORAGE_KEYS.username, "carol");
    mockStore.set(STORAGE_KEYS.role, "user");
    mockStore.set(STORAGE_KEYS.mustChangePassword, "whatever");
    expect(readSession()?.mustChangePassword).toBe(false);
  });
});

describe("writeSession", () => {
  beforeEach(() => {
    mockStore.clear();
    vi.clearAllMocks();
  });

  it("writes all session keys to sessionStorage", () => {
    writeSession({
      token: "tok1",
      username: "alice",
      role: "admin",
      mustChangePassword: true,
    });

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.token, "tok1");
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.username, "alice");
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.role, "admin");
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.mustChangePassword, "true");
  });

  it("writes mustChangePassword as 'false' string when false", () => {
    writeSession({
      token: "tok2",
      username: "bob",
      role: "user",
      mustChangePassword: false,
    });
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.mustChangePassword, "false");
  });
});

describe("clearSession", () => {
  beforeEach(() => {
    mockStore.clear();
    vi.clearAllMocks();
  });

  it("removes all session keys from sessionStorage", () => {
    mockStore.set(STORAGE_KEYS.token, "tok1");
    mockStore.set(STORAGE_KEYS.username, "alice");
    mockStore.set(STORAGE_KEYS.role, "admin");
    mockStore.set(STORAGE_KEYS.mustChangePassword, "true");

    clearSession();

    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.token);
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.username);
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.role);
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.mustChangePassword);
  });
});
