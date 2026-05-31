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


import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute, PublicRoute, RoleRoute } from "@/app/guarded-route";
import { LoginPage } from "@/pages/auth/login-page";
import { ChangePasswordPage } from "@/pages/auth/change-password-page";
import { AdminLayout } from "@/pages/admin/admin-layout";
import { PluginsPage } from "@/pages/admin/plugins-page";
import { UsersPage } from "@/pages/admin/users-page";
import { SystemPage } from "@/pages/admin/system-page";
import { UserLayout } from "@/pages/user/user-layout";
import { MyPluginsPage } from "@/pages/user/my-plugins-page";
import { WiringPage } from "@/pages/user/wiring-page";
import { BlueprintsPage } from "@/pages/user/blueprints-page";
import { BlueprintEditorPage } from "@/pages/user/blueprint-editor-page";
import { RouteErrorPage } from "@/components/shared/route-error";

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    element: <PublicRoute />,
    children: [{ path: "/login", element: <LoginPage /> }],
  },
  {
    errorElement: <RouteErrorPage />,
    element: <ProtectedRoute />,
    children: [
      { path: "/change-password", element: <ChangePasswordPage /> },
      {
        element: <RoleRoute allow="admin" />,
        children: [
          {
            path: "/admin",
            element: <AdminLayout />,
            children: [
              { index: true, element: <Navigate to="/admin/plugins" replace /> },
              { path: "plugins", element: <PluginsPage /> },
              { path: "users", element: <UsersPage /> },
              { path: "system", element: <SystemPage /> },
            ],
          },
        ],
      },
      {
        element: <RoleRoute allow="user" />,
        children: [
          {
            path: "/user",
            element: <UserLayout />,
            children: [
              { index: true, element: <Navigate to="/user/plugins" replace /> },
              { path: "plugins", element: <MyPluginsPage /> },
              { path: "plugins/:id", element: <MyPluginsPage /> },
              { path: "wiring", element: <WiringPage /> },
              { path: "blueprints", element: <BlueprintsPage /> },
              { path: "blueprints/new", element: <BlueprintEditorPage mode="create" /> },
              { path: "blueprints/:id", element: <BlueprintEditorPage mode="edit" /> },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);