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
import { toast } from "sonner";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { useUiStore } from "@/stores/ui.store";

export function Toaster() {
  const toasts = useUiStore((state) => state.toasts);
  const removeToast = useUiStore((state) => state.removeToast);

  useEffect(() => {
    toasts.forEach((entry) => {
      if (entry.tone === "error") {
        toast.error(entry.title, { description: entry.description, id: entry.id });
      } else if (entry.tone === "success") {
        toast.success(entry.title, { description: entry.description, id: entry.id });
      } else {
        toast(entry.title, { description: entry.description, id: entry.id });
      }
      removeToast(entry.id);
    });
  }, [removeToast, toasts]);

  return <SonnerToaster position="top-right" richColors />;
}