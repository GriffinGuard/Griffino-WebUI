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
import { useWiringStore } from "@/stores/wiring.store";
import type { PluginCapability } from "@/types/plugin";
import type { Route } from "@/types/wiring";

vi.mock("@/api/plugins.api", () => ({
  getCapabilities: vi.fn(),
}));

vi.mock("@/api/wiring.api", () => ({
  getUserRoutes: vi.fn(),
  saveUserRoutes: vi.fn(),
}));

import { getCapabilities } from "@/api/plugins.api";
import { getUserRoutes, saveUserRoutes } from "@/api/wiring.api";

const mockCapability = (overrides: Partial<PluginCapability> = {}): PluginCapability => ({
  id: "cap-1",
  pluginId: "p1",
  pluginName: "Plugin 1",
  capabilityId: "cap-1",
  name: "Capability 1",
  role: "consumer",
  type: "com.example.type",
  ...overrides,
});

const mockRoute = (overrides: Partial<Route> = {}): Route => ({
  pluginId: "p1",
  slot: "slot-1",
  capabilityType: "com.example.type",
  providers: [{ providerId: "prov-1", providerTopic: "topic.1", weight: 100 }],
  strategy: "fallback",
  ...overrides,
});

describe("useWiringStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWiringStore.setState({
      capabilities: [],
      routes: [],
      loading: false,
      dirty: false,
    });
  });

  describe("load", () => {
    it("fetches capabilities and routes in parallel and sets state", async () => {
      const capabilities: PluginCapability[] = [
        mockCapability({ id: "cap-1", pluginId: "p1" }),
        mockCapability({ id: "cap-2", pluginId: "p2" }),
      ];
      const routes: Route[] = [
        mockRoute({ pluginId: "p1", slot: "s1" }),
      ];

      vi.mocked(getCapabilities).mockResolvedValue(capabilities);
      vi.mocked(getUserRoutes).mockResolvedValue({ routes });

      await useWiringStore.getState().load();

      const state = useWiringStore.getState();
      expect(state.capabilities).toEqual(capabilities);
      expect(state.routes).toEqual(routes);
      expect(state.loading).toBe(false);
      expect(state.dirty).toBe(false);
      expect(getCapabilities).toHaveBeenCalledOnce();
      expect(getUserRoutes).toHaveBeenCalledOnce();
    });

    it("handles nullish capability response gracefully", async () => {
      vi.mocked(getCapabilities).mockResolvedValue(null as unknown as PluginCapability[]);
      vi.mocked(getUserRoutes).mockResolvedValue({ routes: [] });

      await useWiringStore.getState().load();

      const state = useWiringStore.getState();
      expect(state.capabilities).toEqual([]);
      expect(state.loading).toBe(false);
    });

    it("handles nullish routes response gracefully", async () => {
      vi.mocked(getCapabilities).mockResolvedValue([]);
      vi.mocked(getUserRoutes).mockResolvedValue({
        routes: null as unknown as Route[],
      });

      await useWiringStore.getState().load();

      const state = useWiringStore.getState();
      expect(state.routes).toEqual([]);
      expect(state.loading).toBe(false);
    });

    it("sets loading=false after error", async () => {
      vi.mocked(getCapabilities).mockRejectedValue(new Error("fail"));
      vi.mocked(getUserRoutes).mockRejectedValue(new Error("fail"));

      await expect(useWiringStore.getState().load()).rejects.toThrow("fail");

      expect(useWiringStore.getState().loading).toBe(false);
    });
  });

  describe("setRoute", () => {
    it("inserts a new route and sets dirty=true", () => {
      const route = mockRoute({ pluginId: "new-p", slot: "new-slot" });

      useWiringStore.getState().setRoute(route);

      const state = useWiringStore.getState();
      expect(state.routes).toHaveLength(1);
      expect(state.routes[0]).toEqual(route);
      expect(state.dirty).toBe(true);
    });

    it("updates an existing route matched by pluginId+slot+capabilityType", () => {
      const existing = mockRoute({
        pluginId: "p1",
        slot: "s1",
        capabilityType: "t1",
        providers: [{ providerId: "old", providerTopic: "old.topic", weight: 50 }],
      });
      useWiringStore.setState({ routes: [existing] });

      const updated = mockRoute({
        pluginId: "p1",
        slot: "s1",
        capabilityType: "t1",
        providers: [{ providerId: "new", providerTopic: "new.topic", weight: 100 }],
      });

      useWiringStore.getState().setRoute(updated);

      const state = useWiringStore.getState();
      expect(state.routes).toHaveLength(1);
      expect(state.routes[0]).toEqual(updated);
      expect(state.dirty).toBe(true);
    });

    it("inserts a separate route when capabilityType differs", () => {
      const existing = mockRoute({ pluginId: "p1", slot: "s1", capabilityType: "t1" });
      useWiringStore.setState({ routes: [existing] });

      const newRoute = mockRoute({ pluginId: "p1", slot: "s1", capabilityType: "t2" });

      useWiringStore.getState().setRoute(newRoute);

      const state = useWiringStore.getState();
      expect(state.routes).toHaveLength(2);
    });

    it("inserts a separate route when slot differs", () => {
      const existing = mockRoute({ pluginId: "p1", slot: "s1", capabilityType: "t1" });
      useWiringStore.setState({ routes: [existing] });

      const newRoute = mockRoute({ pluginId: "p1", slot: "s2", capabilityType: "t1" });

      useWiringStore.getState().setRoute(newRoute);

      const state = useWiringStore.getState();
      expect(state.routes).toHaveLength(2);
    });

    it("inserts a separate route when pluginId differs", () => {
      const existing = mockRoute({ pluginId: "p1", slot: "s1", capabilityType: "t1" });
      useWiringStore.setState({ routes: [existing] });

      const newRoute = mockRoute({ pluginId: "p2", slot: "s1", capabilityType: "t1" });

      useWiringStore.getState().setRoute(newRoute);

      const state = useWiringStore.getState();
      expect(state.routes).toHaveLength(2);
    });
  });

  describe("persist", () => {
    it("saves only routes with non-empty providers and resets dirty", async () => {
      const routeWithProviders = mockRoute({
        pluginId: "p1",
        providers: [{ providerId: "prov-1", providerTopic: "t1", weight: 100 }],
      });
      const routeWithNoProviders = mockRoute({
        pluginId: "p2",
        slot: "s2",
        providers: [],
      });
      useWiringStore.setState({
        routes: [routeWithProviders, routeWithNoProviders],
        dirty: true,
      });

      vi.mocked(saveUserRoutes).mockResolvedValue(undefined);

      await useWiringStore.getState().persist();

      expect(saveUserRoutes).toHaveBeenCalledWith([routeWithProviders]);
      expect(useWiringStore.getState().dirty).toBe(false);
    });

    it("saves empty array when all routes have empty providers", async () => {
      const emptyProviderRoute = mockRoute({ providers: [] });
      useWiringStore.setState({ routes: [emptyProviderRoute], dirty: true });

      vi.mocked(saveUserRoutes).mockResolvedValue(undefined);

      await useWiringStore.getState().persist();

      expect(saveUserRoutes).toHaveBeenCalledWith([]);
      expect(useWiringStore.getState().dirty).toBe(false);
    });
  });
});
