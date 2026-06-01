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


import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createUser, deleteUser, listUsers, patchUser } from "@/api/users.api";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PasswordOnceDialog } from "@/components/shared/password-once-dialog";
import type { UserRecord } from "@/types/user";
import { formatDateTime } from "@/lib/date";
import { TableSkeleton } from "@/components/shared/skeletons/table-skeleton";

export function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [username, setUsername] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [passwordDialog, setPasswordDialog] = useState<{
    username: string;
    tempPassword: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const items = await listUsers();
      setUsers(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("users.page.title")}
        description={t("users.page.description")}
        actions={
          <div className="flex gap-2">
            <Input
              placeholder={t("users.newUsername")}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            <Button
              onClick={async () => {
                const result = await createUser(username);
                setUsername("");
                setPasswordDialog(result);
                await load();
              }}
            >
              {t("users.createUser")}
            </Button>
          </div>
        }
      />

      {loading ? (
        <TableSkeleton />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b bg-secondary/40 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">{t("users.table.username")}</th>
                    <th className="px-4 py-3">{t("users.table.role")}</th>
                    <th className="px-4 py-3">{t("users.table.status")}</th>
                    <th className="px-4 py-3">{t("users.table.created")}</th>
                    <th className="px-4 py-3">{t("users.table.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(users) ? users : []).map((user) => (
                    <tr key={user.username} className="border-b border-border/60">
                      <td className="px-4 py-3 font-medium">{user.username}</td>
                      <td className="px-4 py-3">{user.role}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={user.disabled ? "disabled" : "active"} />
                      </td>
                      <td className="px-4 py-3">{formatDateTime(user.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={async () => {
                              const result = await patchUser(user.username, {
                                resetPassword: true,
                              });
                              if (result) {
                                setPasswordDialog(result);
                              }
                            }}
                          >
                            {t("users.resetPassword")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              await patchUser(user.username, { disabled: !user.disabled });
                              await load();
                            }}
                          >
                            {user.disabled ? t("users.enable") : t("users.disable")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={user.username === "admin"}
                            onClick={() => setDeleteTarget(user.username)}
                          >
                            {t("common.delete")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!Array.isArray(users) || users.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                        {t("users.empty")}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t("users.delete.title")}
        description={t("users.delete.description")}
        confirmLabel={t("common.delete")}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteUser(deleteTarget);
          setDeleteTarget(null);
          await load();
        }}
      />

      <PasswordOnceDialog
        open={Boolean(passwordDialog)}
        username={passwordDialog?.username ?? ""}
        password={passwordDialog?.tempPassword ?? ""}
        onClose={() => setPasswordDialog(null)}
      />
    </div>
  );
}