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
  searchQuery: string;
  page: number;
  pageSize: number;
  load: () => Promise<void>;
  select: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  stats: () => PluginStats;
  filteredItems: () => Plugin[];
  paginatedItems: () => Plugin[];
}

function computeStats(items: Plugin[]): PluginStats {
  return {
    total: items.length,
    running: items.filter((item) => item.status === "running").length,
    stopped: items.filter((item) => item.status === "stopped").length,
    pending: items.filter((item) => item.status === "pending_setup").length,
  };
}

function filterPlugins(items: Plugin[], query: string): Plugin[] {
  if (!query.trim()) return items;
  const lower = query.toLowerCase();
  return items.filter(
    (item) =>
      item.id.toLowerCase().includes(lower) ||
      item.name.toLowerCase().includes(lower) ||
      item.directory.toLowerCase().includes(lower) ||
      item.status.toLowerCase().includes(lower)
  );
}

function paginatePlugins(items: Plugin[], page: number, pageSize: number): Plugin[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export const usePluginAdminStore = create<PluginAdminState>((set, get) => ({
  items: [],
  selectedId: null,
  loading: false,
  searchQuery: "",
  page: 1,
  pageSize: 10,
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
  setSearchQuery: (query) => set({ searchQuery: query, page: 1 }),
  setPage: (page) => set({ page }),
  setPageSize: (size) => set({ pageSize: size, page: 1 }),
  stats: () => computeStats(get().items),
  filteredItems: () => filterPlugins(get().items, get().searchQuery),
  paginatedItems: () => {
    const filtered = filterPlugins(get().items, get().searchQuery);
    return paginatePlugins(filtered, get().page, get().pageSize);
  },
}));