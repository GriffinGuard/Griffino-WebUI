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


import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBlocker, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "@/api/errors";
import { createBlueprint, updateBlueprint } from "@/api/blueprints.api";
import { getCapabilities } from "@/api/plugins.api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUiStore } from "@/stores/ui.store";
import { useBlueprintsStore } from "@/stores/blueprints.store";
import type { Blueprint } from "@/types/blueprint";
import type { PluginCapability } from "@/types/plugin";
import {
  BlueprintFlowEditor,
  type BlueprintFlowEditorHandle,
} from "./components/blueprint-flow";
import { validateFlow } from "./components/blueprint-flow/validation";

export function BlueprintEditorPage({ mode }: { mode: "create" | "edit" }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const pushToast = useUiStore((state) => state.pushToast);
  const loadOne = useBlueprintsStore((state) => state.loadOne);
  const clearActive = useBlueprintsStore((state) => state.clearActive);

  const [blueprint, setBlueprint] = useState<Blueprint | undefined>(undefined);
  const [capabilities, setCapabilities] = useState<PluginCapability[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [flowRevision, setFlowRevision] = useState(0);
  const [lastSavedPayloadJson, setLastSavedPayloadJson] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [warningPayload, setWarningPayload] = useState<ReturnType<BlueprintFlowEditorHandle["getPayload"]> | null>(null);

  const editorRef = useRef<BlueprintFlowEditorHandle | null>(null);
  const bypassBlockerRef = useRef(false);
  const baselineKeyRef = useRef<string>("");

  useEffect(() => {
    void (async () => {
      try {
        const nextCapabilities = await getCapabilities();
        setCapabilities(nextCapabilities);
      } catch {
        setCapabilities([]);
        pushToast({
          title: t("blueprints.toast.capabilitiesFailed"),
          tone: "default",
        });
      }
    })();
  }, [pushToast]);

  useEffect(() => {
    const blueprintId = params.id;
    if (mode !== "edit" || !blueprintId) {
      clearActive();
      return;
    }
    void (async () => {
      try {
        const bp = await loadOne(blueprintId);
        setBlueprint(bp);
        setName(bp.name);
      } catch {
        pushToast({
          title: t("blueprints.toast.loadOneFailed"),
          tone: "error",
        });
        navigate("/user/blueprints");
      }
    })();
  }, [clearActive, loadOne, mode, navigate, params.id, pushToast]);

  useEffect(() => {
    const baselineKey = mode === "edit" ? `edit:${blueprint?.id ?? ""}` : "create";
    if (baselineKeyRef.current === baselineKey) {
      return;
    }
    if (mode === "edit" && !blueprint?.id) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (!editorRef.current) {
        return;
      }
      const baselineName = mode === "edit" ? (blueprint?.name ?? "") : "";
      const baselinePayload = editorRef.current.getPayload(baselineName);
      baselineKeyRef.current = baselineKey;
      setLastSavedPayloadJson(JSON.stringify(baselinePayload));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [mode, blueprint?.id, blueprint?.name, flowRevision, name]);

  const hasUnsavedChanges = useMemo(() => {
    if (!editorRef.current || !lastSavedPayloadJson) {
      return false;
    }

    const currentPayload = editorRef.current.getPayload(name);
    return JSON.stringify(currentPayload) !== lastSavedPayloadJson;
  }, [flowRevision, lastSavedPayloadJson, name]);

  const blocker = useBlocker(() => {
    if (bypassBlockerRef.current) {
      bypassBlockerRef.current = false;
      return false;
    }
    return hasUnsavedChanges;
  });

  useEffect(() => {
    if (blocker.state !== "blocked") {
      return;
    }

    const shouldLeave = window.confirm(t("blueprints.unsaved.confirm"));
    if (shouldLeave) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }, [blocker]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) {
        return;
      }
      event.preventDefault();
      event.returnValue = t("blueprints.unsaved.confirm");
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedChanges]);

  const doSave = async (payload: ReturnType<BlueprintFlowEditorHandle["getPayload"]>) => {
    setSaving(true);
    try {
      if (mode === "create") {
        await createBlueprint(payload);
      } else if (params.id) {
        await updateBlueprint(params.id, payload);
      }

      setLastSavedPayloadJson(JSON.stringify(payload));
      pushToast({
        title: t("blueprints.toast.saved"),
        tone: "success",
      });
      bypassBlockerRef.current = true;
      navigate("/user/blueprints");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t("blueprints.toast.saveFailedFallback");
      pushToast({
        title: t("blueprints.toast.saveFailed"),
        description: message,
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!editorRef.current) return;

    const snapshot = editorRef.current.getFlowSnapshot();
    const validation = validateFlow(snapshot.nodes, snapshot.edges, name, t);

    if (validation.errors.length > 0) {
      setValidationErrors(validation.errors);
      return;
    }

    editorRef.current.persistMeta();
    const payload = editorRef.current.getPayload(name);

    if (validation.warnings.length > 0) {
      setValidationWarnings(validation.warnings);
      setWarningPayload(payload);
      return;
    }

    await doSave(payload);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex flex-shrink-0 items-center justify-between border-b bg-card px-4 py-2 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => navigate("/user/blueprints")}
          >
            {t("common.back")}
          </Button>
          <div className="h-4 w-px bg-border" />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("blueprints.namePlaceholder")}
            className="h-7 w-48 text-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {mode === "create" ? t("blueprints.createMode") : t("blueprints.editMode")}
          </span>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={saving}>
            {saving ? t("common.saving") : t("blueprints.save")}
          </Button>
        </div>
      </div>

      {/* Flow canvas */}
      <div className="flex-1 overflow-hidden">
        <BlueprintFlowEditor
          blueprint={blueprint}
          capabilities={capabilities}
          editorRef={editorRef}
          onFlowChange={() => setFlowRevision((current) => current + 1)}
        />
      </div>

      <AlertDialog open={validationErrors.length > 0} onOpenChange={(next) => !next && setValidationErrors([])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("blueprints.validation.errorTitle")}</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            {validationErrors.map((error) => (
              <div key={error}>• {error}</div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setValidationErrors([])}>{t("common.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={validationWarnings.length > 0}
        onOpenChange={(next) => {
          if (!next) {
            setValidationWarnings([]);
            setWarningPayload(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("blueprints.validation.warningTitle")}</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            {validationWarnings.map((warning) => (
              <div key={warning}>• {warning}</div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("blueprints.validation.returnToEdit")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const payload = warningPayload;
                setValidationWarnings([]);
                setWarningPayload(null);
                if (!payload) {
                  return;
                }
                void doSave(payload);
              }}
            >
              {t("blueprints.validation.continueSave")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}