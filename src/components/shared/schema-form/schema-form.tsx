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


import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PluginConfigGroup, PluginConfigService } from "@/types/plugin";

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: PluginConfigGroup["fields"][number];
  value: unknown;
  onChange: (key: string, value: unknown) => void;
}) {
  if (field.type === "boolean") {
    return (
      <Checkbox
        checked={Boolean(value)}
        onCheckedChange={(checked) => onChange(field.key, Boolean(checked))}
      />
    );
  }

  if (field.type === "multiline_string") {
    return (
      <Textarea
        value={String(value ?? "")}
        placeholder={field.placeholder}
        onChange={(event) => onChange(field.key, event.target.value)}
      />
    );
  }

  if (field.type === "options") {
    return (
      <Select value={String(value ?? "")} onValueChange={(next) => onChange(field.key, next)}>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {field.options?.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      type={field.type === "password" ? "password" : "text"}
      value={String(value ?? "")}
      placeholder={field.placeholder}
      onChange={(event) => onChange(field.key, event.target.value)}
    />
  );
}

export function SchemaForm({
  services,
  groups,
  values,
  onChange,
}: {
  services?: PluginConfigService[];
  groups?: PluginConfigGroup[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const renderedGroups = groups ?? services?.flatMap((service) => service.groups) ?? [];

  return (
    <div className="space-y-6">
      {services?.map((service) => (
        <div key={service.id} className="space-y-4">
          <div className="font-medium">{service.label}</div>
          {service.groups.map((group) => (
            <div key={group.id} className="rounded-2xl border p-4">
              <div className="mb-4 text-sm font-medium">{group.label}</div>
              <div className="grid gap-4 md:grid-cols-2">
                {group.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    <FieldRenderer field={field} value={values[field.key]} onChange={onChange} />
                    {field.description ? (
                      <div className="text-xs text-muted-foreground">{field.description}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}

      {!services
        ? renderedGroups.map((group) => (
            <div key={group.id} className="rounded-2xl border p-4">
              <div className="mb-4 text-sm font-medium">{group.label}</div>
              <div className="grid gap-4 md:grid-cols-2">
                {group.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    <FieldRenderer field={field} value={values[field.key]} onChange={onChange} />
                    {field.description ? (
                      <div className="text-xs text-muted-foreground">{field.description}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))
        : null}
    </div>
  );
}