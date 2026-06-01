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


import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/shared/app-shell";

export function AdminLayout() {
  const { t } = useTranslation();

  return (
    <AppShell
      title="Admin"
      items={[
        { to: "/admin/plugins", label: t("nav.admin.plugins") },
        { to: "/admin/users", label: t("nav.admin.users") },
        { to: "/admin/system", label: t("nav.admin.system") },
      ]}
    />
  );
}