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


import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { PluginStatus } from "@/types/plugin";

export function StatusBadge({ status }: { status: PluginStatus | string }) {
  return (
    <Badge
      variant={status === "failed" ? "destructive" : "secondary"}
      className={cn(
        status === "running" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
        status === "pending_setup" && "border-amber-500/30 bg-amber-500/10 text-amber-500",
      )}
    >
      {status}
    </Badge>
  );
}