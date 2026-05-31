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


import { clearSession, readSession } from "@/lib/storage";
import { ApiError, asErrorEnvelope } from "@/api/errors";

export interface RequestOptions extends Omit<RequestInit, "body"> {
  auth?: boolean;
  body?: unknown;
}

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const session = readSession();
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false && session?.token) {
    headers.set("Authorization", `Bearer ${session.token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers,
    body:
      options.body === undefined
        ? undefined
        : typeof options.body === "string"
          ? options.body
          : JSON.stringify(options.body),
  });

  const data = await parseResponse(response);

  if (response.status === 401) {
    clearSession();
    window.location.assign("/login");
    throw new ApiError("UNAUTHORIZED", "Unauthorized", 401, data);
  }

  if (!response.ok) {
    const payload = asErrorEnvelope(data);
    throw new ApiError(
      payload?.error?.code ?? "UNKNOWN_ERROR",
      payload?.error?.message ?? "Request failed",
      response.status,
      data,
    );
  }

  return data as T;
}