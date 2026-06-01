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


import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { ApiError } from "@/api/errors";

const mockPushToast = vi.fn();
const mockT = vi.fn((key: string) => key === "common.requestFailed" ? "Request failed" : key);

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: {
      language: "en-US",
      changeLanguage: vi.fn(),
    },
  }),
}));

vi.mock("@/stores/ui.store", () => ({
  useUiStore: (selector: (state: unknown) => unknown) => {
    if (typeof selector === "function") {
      return selector({ pushToast: mockPushToast });
    }
    return { pushToast: mockPushToast };
  },
}));

import { useToastError } from "@/hooks/use-toast-error";

describe("useToastError", () => {
  beforeEach(() => {
    mockPushToast.mockClear();
    mockT.mockClear();
  });

  it("returns a function", () => {
    const { result } = renderHook(() => useToastError());
    expect(typeof result.current).toBe("function");
  });

  it("produces toast with correct message for ApiError", () => {
    const { result } = renderHook(() => useToastError());
    const error = new ApiError("CODE", "api error message", 500);

    result.current(error);

    expect(mockPushToast).toHaveBeenCalledTimes(1);
    expect(mockPushToast).toHaveBeenCalledWith({
      title: "Request failed",
      description: "api error message",
      tone: "error",
    });
  });

  it("produces toast with correct message for standard Error", () => {
    const { result } = renderHook(() => useToastError());
    const error = new Error("standard error message");

    result.current(error);

    expect(mockPushToast).toHaveBeenCalledTimes(1);
    expect(mockPushToast).toHaveBeenCalledWith({
      title: "Request failed",
      description: "standard error message",
      tone: "error",
    });
  });

  it("produces toast with fallback message for non-Error values", () => {
    const { result } = renderHook(() => useToastError());

    result.current("string error");

    expect(mockPushToast).toHaveBeenCalledTimes(1);
    expect(mockPushToast).toHaveBeenCalledWith({
      title: "Request failed",
      description: "Request failed",
      tone: "error",
    });
  });

  it("uses custom fallback as title and description for non-Error values", () => {
    const { result } = renderHook(() => useToastError());

    result.current(null, "Custom fallback");

    expect(mockPushToast).toHaveBeenCalledTimes(1);
    expect(mockPushToast).toHaveBeenCalledWith({
      title: "Custom fallback",
      description: "Custom fallback",
      tone: "error",
    });
  });

  it("uses custom fallback as title for ApiError", () => {
    const { result } = renderHook(() => useToastError());
    const error = new ApiError("CODE", "api error", 400);

    result.current(error, "Whoops!");

    expect(mockPushToast).toHaveBeenCalledTimes(1);
    expect(mockPushToast).toHaveBeenCalledWith({
      title: "Whoops!",
      description: "api error",
      tone: "error",
    });
  });
});
