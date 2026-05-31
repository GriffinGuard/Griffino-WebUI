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
import type { Plugin } from "@/types/plugin";

interface PluginUserState {
  items: Plugin[];
  loading: boolean;
  load: () => Promise<void>;
}

export const usePluginUserStore = create<PluginUserState>((set) => ({
  items: [],
  loading: false,
  load: async () => {
    set({ loading: true });
    try {
      const plugins = await pluginsApi.listPlugins();
      set({
        items: Array.isArray(plugins)
          ? plugins.filter((plugin) => plugin.status === "running")
          : [],
      });
    } finally {
      set({ loading: false });
    }
  },
}));