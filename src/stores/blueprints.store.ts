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
import * as blueprintsApi from "@/api/blueprints.api";
import type { Blueprint } from "@/types/blueprint";

interface BlueprintsState {
  items: Blueprint[];
  active: Blueprint | null;
  loading: boolean;
  searchQuery: string;
  page: number;
  pageSize: number;
  load: () => Promise<void>;
  loadOne: (id: string) => Promise<Blueprint>;
  clearActive: () => void;
  setSearchQuery: (query: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  filteredItems: () => Blueprint[];
  paginatedItems: () => Blueprint[];
}

function filterBlueprints(items: Blueprint[], query: string): Blueprint[] {
  if (!query.trim()) return items;
  const lower = query.toLowerCase();
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(lower) ||
      item.id.toLowerCase().includes(lower) ||
      item.trigger.eventType.toLowerCase().includes(lower) ||
      item.userId.toLowerCase().includes(lower)
  );
}

function paginateBlueprints(items: Blueprint[], page: number, pageSize: number): Blueprint[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export const useBlueprintsStore = create<BlueprintsState>((set, get) => ({
  items: [],
  active: null,
  loading: false,
  searchQuery: "",
  page: 1,
  pageSize: 10,
  load: async () => {
    set({ loading: true });
    try {
      const items = await blueprintsApi.listBlueprints();
      set({ items: Array.isArray(items) ? items : [] });
    } finally {
      set({ loading: false });
    }
  },
  loadOne: async (id) => {
    set({ loading: true });
    try {
      const active = await blueprintsApi.getBlueprint(id);
      set({ active });
      return active;
    } finally {
      set({ loading: false });
    }
  },
  clearActive: () => set({ active: null }),
  setSearchQuery: (query) => set({ searchQuery: query, page: 1 }),
  setPage: (page) => set({ page }),
  setPageSize: (size) => set({ pageSize: size, page: 1 }),
  filteredItems: () => filterBlueprints(get().items, get().searchQuery),
  paginatedItems: () => {
    const filtered = filterBlueprints(get().items, get().searchQuery);
    return paginateBlueprints(filtered, get().page, get().pageSize);
  },
}));