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

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { request } from "@/api/client";
import { ApiError } from "@/api/errors";
import { STORAGE_KEYS } from "@/lib/storage";

const mockFetch = vi.fn<typeof fetch>();
globalThis.fetch = mockFetch;

const mockAssign = vi.fn<typeof window.location.assign>();

const mockSessionStore = new Map<string, string>();

function setToken(token: string | null) {
  if (token) {
    mockSessionStore.set(STORAGE_KEYS.token, token);
    mockSessionStore.set(STORAGE_KEYS.username, "testuser");
    mockSessionStore.set(STORAGE_KEYS.role, "admin");
    mockSessionStore.set(STORAGE_KEYS.mustChangePassword, "false");
  } else {
    mockSessionStore.delete(STORAGE_KEYS.token);
    mockSessionStore.delete(STORAGE_KEYS.username);
    mockSessionStore.delete(STORAGE_KEYS.role);
    mockSessionStore.delete(STORAGE_KEYS.mustChangePassword);
  }
}

const mockSessionStorage: Storage = {
  getItem: vi.fn((key: string) => mockSessionStore.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => { mockSessionStore.set(key, value); }),
  removeItem: vi.fn((key: string) => { mockSessionStore.delete(key); }),
  clear: vi.fn(() => { mockSessionStore.clear(); }),
  length: 0,
  key: vi.fn(() => null),
};

Object.defineProperty(globalThis, "sessionStorage", { value: mockSessionStorage, writable: true });

const originalLocation = window.location;
beforeEach(() => {
  vi.clearAllMocks();
  mockSessionStore.clear();
  setToken(null);
  delete (window as any).location;
  (window as any).location = { assign: mockAssign, href: "http://localhost/" };
});

afterEach(() => {
  (window as any).location = originalLocation;
});

function mockResponse(status: number, body?: unknown, contentType = "application/json"): Response {
  const text = body !== undefined ? JSON.stringify(body) : "";
  return {
    ok: status >= 200 && status < 300,
    status,
    text: vi.fn().mockResolvedValue(text),
    json: vi.fn().mockResolvedValue(body),
    headers: new Headers({ "Content-Type": contentType }),
  } as unknown as Response;
}

describe("request", () => {
  describe("Successful responses", () => {
    it("returns parsed JSON data on 200", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(200, { items: [1, 2, 3] }));
      const result = await request("/api/test");
      expect(result).toEqual({ items: [1, 2, 3] });
    });

    it("returns undefined on 204 No Content", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(204));
      const result = await request("/api/test");
      expect(result).toBeUndefined();
    });

    it("returns undefined on responses with empty body", async () => {
      const res: Response = {
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(""),
        headers: new Headers(),
      } as unknown as Response;
      mockFetch.mockResolvedValueOnce(res);
      const result = await request("/api/test");
      expect(result).toBeUndefined();
    });
  });

  describe("Authentication", () => {
    it("attaches Authorization header when token is present", async () => {
      setToken("my-token-123");
      mockFetch.mockResolvedValueOnce(mockResponse(200, { ok: true }));

      await request("/api/secure");

      expect(mockFetch).toHaveBeenCalledWith("/api/secure", expect.objectContaining({
        headers: expect.any(Headers),
      }));

      const callArgs = mockFetch.mock.calls[0] as [string, RequestInit | undefined];
      const headers = callArgs[1]?.headers as Headers;
      expect(headers.get("Authorization")).toBe("Bearer my-token-123");
    });

    it("does not attach Authorization header when token is absent", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(200, { ok: true }));

      await request("/api/public");

      const callArgs = mockFetch.mock.calls[0] as [string, RequestInit | undefined];
      const headers = callArgs[1]?.headers as Headers;
      expect(headers.get("Authorization")).toBeNull();
    });

    it("does not attach Authorization when auth: false even with token", async () => {
      setToken("my-token");
      mockFetch.mockResolvedValueOnce(mockResponse(200, { ok: true }));

      await request("/api/no-auth", { auth: false });

      const callArgs = mockFetch.mock.calls[0] as [string, RequestInit | undefined];
      const headers = callArgs[1]?.headers as Headers;
      expect(headers.get("Authorization")).toBeNull();
    });
  });

  describe("401 Unauthorized", () => {
    it("clears session and redirects to /login", async () => {
      setToken("expired-token");
      mockFetch.mockResolvedValueOnce(mockResponse(401, { error: { code: "UNAUTHORIZED", message: "Token expired" } }));

      await expect(request("/api/protected")).rejects.toThrow(ApiError);

      const storedToken = mockSessionStore.get(STORAGE_KEYS.token);
      expect(storedToken).toBeUndefined();
      expect(mockAssign).toHaveBeenCalledWith("/login");
    });

    it("throws ApiError with UNAUTHORIZED code", async () => {
      setToken("bad-token");
      mockFetch.mockResolvedValueOnce(mockResponse(401, { error: { code: "INVALID_TOKEN" } }));

      let caught: ApiError | undefined;
      try {
        await request("/api/x");
      } catch (e) {
        caught = e as ApiError;
      }

      expect(caught).toBeInstanceOf(ApiError);
      expect(caught?.code).toBe("UNAUTHORIZED");
      expect(caught?.status).toBe(401);
    });
  });

  describe("Non-OK responses (non-401)", () => {
    it("throws ApiError with error envelope data", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(400, {
        error: { code: "BAD_REQUEST", message: "Missing field" },
      }));

      let caught: ApiError | undefined;
      try {
        await request("/api/validate");
      } catch (e) {
        caught = e as ApiError;
      }

      expect(caught).toBeInstanceOf(ApiError);
      expect(caught?.code).toBe("BAD_REQUEST");
      expect(caught?.message).toBe("Missing field");
      expect(caught?.status).toBe(400);
    });

    it("throws ApiError with UNKNOWN_ERROR when no error envelope", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(500, "plain text", "text/plain"));

      let caught: ApiError | undefined;
      try {
        await request("/api/crash");
      } catch (e) {
        caught = e as ApiError;
      }

      expect(caught).toBeInstanceOf(ApiError);
      expect(caught?.code).toBe("UNKNOWN_ERROR");
      expect(caught?.status).toBe(500);
    });

    it("passes response payload through the error", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(403, { reason: "Forbidden" }));

      let caught: ApiError | undefined;
      try {
        await request("/api/forbidden");
      } catch (e) {
        caught = e as ApiError;
      }

      expect(caught?.payload).toEqual({ reason: "Forbidden" });
    });
  });

  describe("Request body", () => {
    it("auto-sets Content-Type: application/json for non-string body", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(200, { ok: true }));
      await request("/api/create", { method: "POST", body: { name: "test" } });

      const callArgs = mockFetch.mock.calls[0] as [string, RequestInit | undefined];
      const headers = callArgs[1]?.headers as Headers;
      expect(headers.get("Content-Type")).toBe("application/json");
      expect(callArgs[1]?.body).toBe('{"name":"test"}');
    });

    it("does not override existing Content-Type header", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(200, { ok: true }));
      const customHeaders = new Headers({ "Content-Type": "application/x-www-form-urlencoded" });
      await request("/api/form", { method: "POST", body: "a=1&b=2", headers: customHeaders });

      const callArgs = mockFetch.mock.calls[0] as [string, RequestInit | undefined];
      const headers = callArgs[1]?.headers as Headers;
      expect(headers.get("Content-Type")).toBe("application/x-www-form-urlencoded");
    });

    it("passes string body as-is without JSON.stringify", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(200, { ok: true }));
      await request("/api/raw", { method: "POST", body: "raw data" });

      const callArgs = mockFetch.mock.calls[0] as [string, RequestInit | undefined];
      expect(callArgs[1]?.body).toBe("raw data");
    });
  });
});
