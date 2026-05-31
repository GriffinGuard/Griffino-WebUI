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
import { clearSession, readSession, writeSession, type UserRole } from "@/lib/storage";

interface UserSession {
  username: string;
  role: UserRole;
  mustChangePassword: boolean;
}

interface AuthState {
  token: string | null;
  user: UserSession | null;
  hydrated: boolean;
  hydrate: () => void;
  setSession: (session: {
    token: string;
    username: string;
    role: UserRole;
    mustChangePassword: boolean;
  }) => void;
  markPasswordChanged: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  hydrated: false,
  hydrate: () => {
    const session = readSession();
    if (!session) {
      set({ token: null, user: null, hydrated: true });
      return;
    }

    set({
      token: session.token,
      user: {
        username: session.username,
        role: session.role,
        mustChangePassword: session.mustChangePassword,
      },
      hydrated: true,
    });
  },
  setSession: (session) => {
    writeSession(session);
    set({
      token: session.token,
      user: {
        username: session.username,
        role: session.role,
        mustChangePassword: session.mustChangePassword,
      },
      hydrated: true,
    });
  },
  markPasswordChanged: () => {
    const state = get();
    if (!state.token || !state.user) {
      return;
    }
    writeSession({
      token: state.token,
      username: state.user.username,
      role: state.user.role,
      mustChangePassword: false,
    });
    set({
      user: {
        ...state.user,
        mustChangePassword: false,
      },
    });
  },
  logout: () => {
    clearSession();
    set({ token: null, user: null, hydrated: true });
  },
}));