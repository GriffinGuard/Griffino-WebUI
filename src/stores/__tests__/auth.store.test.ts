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
import { useAuthStore } from "@/stores/auth.store";
import { STORAGE_KEYS } from "@/lib/storage";

const mockStore = new Map<string, string>();

const mockSessionStorage: Storage = {
  getItem: vi.fn((key: string) => mockStore.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStore.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    mockStore.delete(key);
  }),
  clear: vi.fn(() => {
    mockStore.clear();
  }),
  length: 0,
  key: vi.fn(() => null),
};

Object.defineProperty(globalThis, "sessionStorage", {
  value: mockSessionStorage,
  writable: true,
});

describe("useAuthStore", () => {
  beforeEach(() => {
    mockStore.clear();
    vi.clearAllMocks();
    useAuthStore.setState({ token: null, user: null, hydrated: false });
  });

  describe("hydrate", () => {
    it("sets hydrated=true with null user when no session data exists", () => {
      const store = useAuthStore.getState();
      expect(store.hydrated).toBe(false);

      store.hydrate();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.hydrated).toBe(true);
    });

    it("sets hydrated=true with null user when session data is incomplete", () => {
      mockStore.set(STORAGE_KEYS.token, "tok1");
      // missing username, role, mustChangePassword

      useAuthStore.getState().hydrate();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.hydrated).toBe(true);
    });

    it("populates token and user from valid sessionStorage data", () => {
      mockStore.set(STORAGE_KEYS.token, "tok123");
      mockStore.set(STORAGE_KEYS.username, "alice");
      mockStore.set(STORAGE_KEYS.role, "admin");
      mockStore.set(STORAGE_KEYS.mustChangePassword, "true");

      useAuthStore.getState().hydrate();

      const state = useAuthStore.getState();
      expect(state.token).toBe("tok123");
      expect(state.user).toEqual({
        username: "alice",
        role: "admin",
        mustChangePassword: true,
      });
      expect(state.hydrated).toBe(true);
    });

    it("parses mustChangePassword=false correctly", () => {
      mockStore.set(STORAGE_KEYS.token, "tok2");
      mockStore.set(STORAGE_KEYS.username, "bob");
      mockStore.set(STORAGE_KEYS.role, "user");
      mockStore.set(STORAGE_KEYS.mustChangePassword, "false");

      useAuthStore.getState().hydrate();

      const state = useAuthStore.getState();
      expect(state.user?.mustChangePassword).toBe(false);
    });
  });

  describe("setSession", () => {
    it("writes to sessionStorage and sets store state", () => {
      const session = {
        token: "new-token",
        username: "carol",
        role: "user" as const,
        mustChangePassword: true,
      };

      useAuthStore.getState().setSession(session);

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.token,
        "new-token",
      );
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.username,
        "carol",
      );
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.role,
        "user",
      );
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.mustChangePassword,
        "true",
      );

      const state = useAuthStore.getState();
      expect(state.token).toBe("new-token");
      expect(state.user).toEqual({
        username: "carol",
        role: "user",
        mustChangePassword: true,
      });
      expect(state.hydrated).toBe(true);
    });

    it("handles mustChangePassword=false correctly", () => {
      useAuthStore.getState().setSession({
        token: "tok",
        username: "user1",
        role: "admin",
        mustChangePassword: false,
      });

      const state = useAuthStore.getState();
      expect(state.user?.mustChangePassword).toBe(false);
    });
  });

  describe("markPasswordChanged", () => {
    it("updates mustChangePassword to false in sessionStorage and state", () => {
      mockStore.set(STORAGE_KEYS.token, "tok1");
      mockStore.set(STORAGE_KEYS.username, "alice");
      mockStore.set(STORAGE_KEYS.role, "admin");
      mockStore.set(STORAGE_KEYS.mustChangePassword, "true");

      useAuthStore.getState().hydrate();
      vi.clearAllMocks();

      useAuthStore.getState().markPasswordChanged();

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.mustChangePassword,
        "false",
      );

      const state = useAuthStore.getState();
      expect(state.user?.mustChangePassword).toBe(false);
    });

    it("is a no-op when token is null", () => {
      useAuthStore.getState().markPasswordChanged();

      expect(mockSessionStorage.setItem).not.toHaveBeenCalledWith(
        STORAGE_KEYS.mustChangePassword,
        expect.anything(),
      );
    });

    it("is a no-op when user is null", () => {
      useAuthStore.setState({ token: "tok", user: null, hydrated: true });
      vi.clearAllMocks();

      useAuthStore.getState().markPasswordChanged();

      expect(mockSessionStorage.setItem).not.toHaveBeenCalledWith(
        STORAGE_KEYS.mustChangePassword,
        expect.anything(),
      );
    });
  });

  describe("logout", () => {
    it("clears sessionStorage and resets store state", () => {
      mockStore.set(STORAGE_KEYS.token, "tok");
      mockStore.set(STORAGE_KEYS.username, "alice");
      mockStore.set(STORAGE_KEYS.role, "admin");
      mockStore.set(STORAGE_KEYS.mustChangePassword, "true");
      useAuthStore.setState({
        token: "tok",
        user: { username: "alice", role: "admin", mustChangePassword: true },
        hydrated: true,
      });
      vi.clearAllMocks();

      useAuthStore.getState().logout();

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.token);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.username);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.role);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
        STORAGE_KEYS.mustChangePassword,
      );

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.hydrated).toBe(true);
    });
  });
});
