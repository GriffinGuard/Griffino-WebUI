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


import type { ErrorEnvelope } from "@/types/api";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public payload?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function asErrorEnvelope(value: unknown): ErrorEnvelope | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  return value as ErrorEnvelope;
}

export function getErrorMessage(error: unknown, fallback = "Request failed") {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export interface PortMismatch {
  fromNodeId: string;
  toNodeId: string;
  portId: string;
  portType: string;
  reason: string;
}

export function getPortMismatches(error: unknown): PortMismatch[] | null {
  if (!(error instanceof ApiError)) return null;
  const env = asErrorEnvelope(error.payload);
  const detail = env?.error?.detail as { mismatches?: PortMismatch[] } | undefined;
  return Array.isArray(detail?.mismatches) ? detail.mismatches : null;
}