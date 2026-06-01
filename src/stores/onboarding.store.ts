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
import type { SystemStatus } from "@/types/system";
import { getSetupStatus } from "@/api/setup.api";

export type SetupStep = "welcome" | "environment" | "account" | "complete";

export const STEP_ORDER: SetupStep[] = ["welcome", "environment", "account", "complete"];

export const STEP_INDEX: Record<SetupStep, number> = {
  welcome: 0,
  environment: 1,
  account: 2,
  complete: 3,
};

interface OnboardingState {
  step: SetupStep;
  systemStatus: SystemStatus | null;
  loading: boolean;
  setupCompleted: boolean | null;
  goTo: (step: SetupStep) => void;
  next: () => void;
  prev: () => void;
  setSystemStatus: (data: SystemStatus) => void;
  setLoading: (v: boolean) => void;
  fetchSetupStatus: () => Promise<void>;
  setSetupCompleted: (v: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  step: "welcome",
  systemStatus: null,
  loading: false,
  setupCompleted: null,
  goTo: (step) => set({ step }),
  next: () => {
    const { step } = get();
    const idx = STEP_INDEX[step];
    if (idx < STEP_ORDER.length - 1) {
      set({ step: STEP_ORDER[idx + 1] });
    }
  },
  prev: () => {
    const { step } = get();
    const idx = STEP_INDEX[step];
    if (idx > 0) {
      set({ step: STEP_ORDER[idx - 1] });
    }
  },
  setSystemStatus: (data) => set({ systemStatus: data }),
  setLoading: (v) => set({ loading: v }),
  fetchSetupStatus: async () => {
    try {
      const result = await getSetupStatus();
      set({ setupCompleted: result.completed });
    } catch {
      set({ setupCompleted: false });
    }
  },
  setSetupCompleted: (v) => set({ setupCompleted: v }),
}));
