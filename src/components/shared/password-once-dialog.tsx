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


import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PasswordOnceDialog({
  open,
  username,
  password,
  onClose,
}: {
  open: boolean;
  username: string;
  password: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("users.temporaryPassword.title")}</DialogTitle>
          <DialogDescription>
            {t("users.temporaryPassword.description", { username })}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border bg-background p-4 font-mono text-sm">
          {password}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.close")}
          </Button>
          <Button
            onClick={async () => {
              await navigator.clipboard.writeText(password);
              setCopied(true);
            }}
          >
            {copied ? t("common.copied") : t("common.copy")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}