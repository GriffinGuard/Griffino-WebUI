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
import i18n from "@/locales/i18n";
import { STORAGE_KEYS } from "@/lib/storage";

export interface ActivityEntry {
  id: string;
  level: "info" | "success" | "error";
  message: string;
  createdAt: string;
}

export interface ToastEntry {
  id: string;
  title: string;
  description?: string;
  tone?: "default" | "success" | "error";
}

interface UiState {
  activityLog: ActivityEntry[];
  toasts: ToastEntry[];
  addActivity: (entry: Omit<ActivityEntry, "id" | "createdAt">) => void;
  clearActivity: () => void;
  pushToast: (toast: Omit<ToastEntry, "id">) => void;
  removeToast: (id: string) => void;
  setLanguage: (language: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activityLog: [],
  toasts: [],
  addActivity: (entry) =>
    set((state) => ({
      activityLog: [
        {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          ...entry,
        },
        ...state.activityLog,
      ],
    })),
  clearActivity: () => set({ activityLog: [] }),
  pushToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { id: crypto.randomUUID(), ...toast }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
  setLanguage: (language) => {
    localStorage.setItem(STORAGE_KEYS.language, language);
    void i18n.changeLanguage(language);
  },
}));