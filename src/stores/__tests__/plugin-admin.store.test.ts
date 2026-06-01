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
import { usePluginAdminStore } from "@/stores/plugin-admin.store";
import type { Plugin } from "@/types/plugin";

vi.mock("@/api/plugins.api", () => ({
  listPlugins: vi.fn(),
}));

import * as pluginsApi from "@/api/plugins.api";

const mockPlugin = (overrides: Partial<Plugin> = {}): Plugin => ({
  id: "plugin-1",
  name: "Plugin 1",
  directory: "/plugins/plugin-1",
  status: "running",
  containerCount: 2,
  isDev: false,
  ...overrides,
});

describe("usePluginAdminStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePluginAdminStore.setState({ items: [], selectedId: null, loading: false });
  });

  describe("load", () => {
    it("sets loading=true, fetches plugins, then sets loading=false", async () => {
      const plugins: Plugin[] = [
        mockPlugin({ id: "p1", name: "Plugin 1", status: "running" }),
        mockPlugin({ id: "p2", name: "Plugin 2", status: "stopped" }),
        mockPlugin({ id: "p3", name: "Plugin 3", status: "pending_setup" }),
      ];
      vi.mocked(pluginsApi.listPlugins).mockResolvedValue(plugins);

      await usePluginAdminStore.getState().load();

      const state = usePluginAdminStore.getState();
      expect(state.items).toEqual(plugins);
      expect(state.loading).toBe(false);
      expect(pluginsApi.listPlugins).toHaveBeenCalledOnce();
    });

    it("keeps items empty and sets loading=false on API error", async () => {
      vi.mocked(pluginsApi.listPlugins).mockRejectedValue(new Error("Network error"));

      await expect(usePluginAdminStore.getState().load()).rejects.toThrow("Network error");

      const state = usePluginAdminStore.getState();
      expect(state.items).toEqual([]);
      expect(state.loading).toBe(false);
    });

    it("sets loading to true while fetching", () => {
      vi.mocked(pluginsApi.listPlugins).mockReturnValue(
        new Promise(() => {}), // never resolves
      );

      const promise = usePluginAdminStore.getState().load();

      expect(usePluginAdminStore.getState().loading).toBe(true);
      // cleanup
      promise.catch(() => {});
    });
  });

  describe("select", () => {
    it("sets selectedId to the given id", () => {
      usePluginAdminStore.getState().select("plugin-a");

      expect(usePluginAdminStore.getState().selectedId).toBe("plugin-a");
    });

    it("sets selectedId to null", () => {
      usePluginAdminStore.setState({ selectedId: "plugin-a" });

      usePluginAdminStore.getState().select(null);

      expect(usePluginAdminStore.getState().selectedId).toBeNull();
    });
  });

  describe("stats", () => {
    it("returns correct stats from items", () => {
      const plugins: Plugin[] = [
        mockPlugin({ id: "p1", status: "running" }),
        mockPlugin({ id: "p2", status: "running" }),
        mockPlugin({ id: "p3", status: "stopped" }),
        mockPlugin({ id: "p4", status: "stopped" }),
        mockPlugin({ id: "p5", status: "stopped" }),
        mockPlugin({ id: "p6", status: "pending_setup" }),
      ];
      usePluginAdminStore.setState({ items: plugins });

      const stats = usePluginAdminStore.getState().stats();

      expect(stats).toEqual({
        total: 6,
        running: 2,
        stopped: 3,
        pending: 1,
      });
    });

    it("returns zero stats when items are empty", () => {
      usePluginAdminStore.setState({ items: [] });

      const stats = usePluginAdminStore.getState().stats();

      expect(stats).toEqual({
        total: 0,
        running: 0,
        stopped: 0,
        pending: 0,
      });
    });
  });
});
