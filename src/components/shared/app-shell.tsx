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


import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/stores/auth.store";
import { useUiStore } from "@/stores/ui.store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NavItem {
  to: string;
  label: string;
}

export function AppShell({
  title,
  items,
}: {
  title: string;
  items: NavItem[];
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const setLanguage = useUiStore((state) => state.setLanguage);

  return (
    <div className="min-h-screen">
      <div className="app-grid py-6">
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="panel h-fit p-4">
            <div className="mb-8 space-y-1">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
                {title}
              </div>
              <div className="text-xl font-semibold">Griffino</div>
              <div className="text-xs text-muted-foreground">{user?.username}</div>
            </div>

            <nav className="space-y-1">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "block rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                      isActive && "bg-secondary text-foreground",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-8 space-y-2">
              <Select
                defaultValue={localStorage.getItem("griffino_lang") ?? "zh-CN"}
                onValueChange={setLanguage}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card opacity-100 backdrop-blur-none">
                  <SelectItem value="zh-CN">中文</SelectItem>
                  <SelectItem value="en-US">English</SelectItem>
                  <SelectItem value="ru-RU">Русский</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  logout();
                  navigate("/login", { replace: true });
                }}
              >
                {t("common.logout")}
              </Button>
            </div>
          </aside>

          <main className="space-y-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}