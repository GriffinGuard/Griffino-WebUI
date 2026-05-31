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
import * as pluginsApi from "@/api/plugins.api";
import type { Plugin, PluginStats } from "@/types/plugin";

interface PluginAdminState {
  items: Plugin[];
  selectedId: string | null;
  loading: boolean;
  load: () => Promise<void>;
  select: (id: string | null) => void;
  stats: () => PluginStats;
}

function computeStats(items: Plugin[]): PluginStats {
  return {
    total: items.length,
    running: items.filter((item) => item.status === "running").length,
    stopped: items.filter((item) => item.status === "stopped").length,
    pending: items.filter((item) => item.status === "pending_setup").length,
  };
}

export const usePluginAdminStore = create<PluginAdminState>((set, get) => ({
  items: [],
  selectedId: null,
  loading: false,
  load: async () => {
    set({ loading: true });
    try {
      const items = await pluginsApi.listPlugins();
      set({ items });
    } finally {
      set({ loading: false });
    }
  },
  select: (id) => set({ selectedId: id }),
  stats: () => computeStats(get().items),
}));