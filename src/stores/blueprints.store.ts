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
  load: () => Promise<void>;
  loadOne: (id: string) => Promise<Blueprint>;
  clearActive: () => void;
}

export const useBlueprintsStore = create<BlueprintsState>((set) => ({
  items: [],
  active: null,
  loading: false,
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
}));