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

export function UserLayout() {
  const { t } = useTranslation();

  return (
    <AppShell
      title="User"
      items={[
        { to: "/user/plugins", label: t("nav.user.plugins") },
        { to: "/user/wiring", label: t("nav.user.wiring") },
        { to: "/user/blueprints", label: t("nav.user.blueprints") },
      ]}
    />
  );
}