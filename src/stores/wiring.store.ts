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


import { create } from "zustand";
import { getCapabilities } from "@/api/plugins.api";
import { getUserRoutes, saveUserRoutes } from "@/api/wiring.api";
import type { PluginCapability } from "@/types/plugin";
import type { Route } from "@/types/wiring";

interface WiringState {
  capabilities: PluginCapability[];
  routes: Route[];
  loading: boolean;
  dirty: boolean;
  load: () => Promise<void>;
  setRoute: (route: Route) => void;
  persist: () => Promise<void>;
}

export const useWiringStore = create<WiringState>((set, get) => ({
  capabilities: [],
  routes: [],
  loading: false,
  dirty: false,
  load: async () => {
    set({ loading: true });
    try {
      const [capabilities, routesResponse] = await Promise.all([
        getCapabilities(),
        getUserRoutes(),
      ]);
      set({
        capabilities: Array.isArray(capabilities) ? capabilities : [],
        routes: Array.isArray(routesResponse.routes) ? routesResponse.routes : [],
        dirty: false,
      });
    } finally {
      set({ loading: false });
    }
  },
  setRoute: (route) =>
    set((state) => {
      const nextRoutes = [...state.routes];
      const index = nextRoutes.findIndex(
        (item) =>
          item.pluginId === route.pluginId &&
          item.slot === route.slot &&
          item.capabilityType === route.capabilityType,
      );

      if (index >= 0) {
        nextRoutes[index] = route;
      } else {
        nextRoutes.push(route);
      }

      return {
        routes: nextRoutes,
        dirty: true,
      };
    }),
  persist: async () => {
    const routes = get().routes.filter((route) => route.providers.length > 0);
    await saveUserRoutes(routes);
    set({ dirty: false });
  },
}));