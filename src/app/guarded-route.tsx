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


import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { DEFAULT_ROUTE_BY_ROLE } from "@/lib/route-map";
import type { UserRole } from "@/lib/storage";

export function ProtectedRoute() {
  const location = useLocation();
  const { token, user, hydrated, hydrate } = useAuthStore();

  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrate, hydrated]);

  if (!hydrated) {
    return null;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  return <Outlet />;
}

export function PublicRoute() {
  const { token, user, hydrated, hydrate } = useAuthStore();

  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrate, hydrated]);

  if (!hydrated) {
    return null;
  }

  if (token && user) {
    if (user.mustChangePassword) {
      return <Navigate to="/change-password" replace />;
    }

    return <Navigate to={DEFAULT_ROUTE_BY_ROLE[user.role]} replace />;
  }

  return <Outlet />;
}

export function RoleRoute({ allow }: { allow: UserRole }) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return null;
  }

  if (user.role !== allow) {
    return <Navigate to={DEFAULT_ROUTE_BY_ROLE[user.role]} replace />;
  }

  return <Outlet />;
}