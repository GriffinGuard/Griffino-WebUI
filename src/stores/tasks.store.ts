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
import * as tasksApi from "@/api/tasks.api";
import type { Task } from "@/types/task";

interface TasksState {
  tasks: Task[];
  active: Task | null;
  loading: boolean;
  load: () => Promise<void>;
  loadOne: (id: string) => Promise<Task>;
  clearActive: () => void;
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  active: null,
  loading: false,
  load: async () => {
    set({ loading: true });
    try {
      const tasks = await tasksApi.listTasks();
      set({ tasks: Array.isArray(tasks) ? tasks : [] });
    } finally {
      set({ loading: false });
    }
  },
  loadOne: async (id) => {
    set({ loading: true });
    try {
      const active = await tasksApi.getTask(id);
      set({ active });
      return active;
    } finally {
      set({ loading: false });
    }
  },
  clearActive: () => set({ active: null }),
}));
