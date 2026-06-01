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

import { describe, it, expect } from "vitest";
import { ApiError, asErrorEnvelope, getErrorMessage } from "@/api/errors";

describe("ApiError", () => {
  it("sets name to ApiError", () => {
    const error = new ApiError("CODE", "message", 400);
    expect(error.name).toBe("ApiError");
  });

  it("sets code, message, status, payload", () => {
    const payload = { detail: "bad" };
    const error = new ApiError("BAD_REQUEST", "Invalid input", 400, payload);
    expect(error.code).toBe("BAD_REQUEST");
    expect(error.message).toBe("Invalid input");
    expect(error.status).toBe(400);
    expect(error.payload).toBe(payload);
  });

  it("is instance of Error", () => {
    const error = new ApiError("X", "msg", 500);
    expect(error).toBeInstanceOf(Error);
  });

  it("is instance of ApiError", () => {
    const error = new ApiError("X", "msg", 500);
    expect(error).toBeInstanceOf(ApiError);
  });
});

describe("asErrorEnvelope", () => {
  it("returns undefined for null", () => {
    expect(asErrorEnvelope(null)).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(asErrorEnvelope(undefined)).toBeUndefined();
  });

  it("returns undefined for string", () => {
    expect(asErrorEnvelope("error")).toBeUndefined();
  });

  it("returns undefined for number", () => {
    expect(asErrorEnvelope(42)).toBeUndefined();
  });

  it("returns the object cast as ErrorEnvelope for valid objects", () => {
    const obj = { error: { code: "X", message: "m" } };
    const result = asErrorEnvelope(obj);
    expect(result).toBe(obj);
  });

  it("returns an empty object cast as ErrorEnvelope", () => {
    const result = asErrorEnvelope({});
    expect(result).toEqual({});
  });
});

describe("getErrorMessage", () => {
  it("returns message from ApiError", () => {
    const error = new ApiError("X", "api error message", 500);
    expect(getErrorMessage(error)).toBe("api error message");
  });

  it("returns message from standard Error", () => {
    const error = new Error("standard error");
    expect(getErrorMessage(error)).toBe("standard error");
  });

  it("returns fallback for non-Error values", () => {
    expect(getErrorMessage("string error")).toBe("Request failed");
  });

  it("returns custom fallback when provided", () => {
    expect(getErrorMessage(null, "custom fallback")).toBe("custom fallback");
  });

  it("returns custom fallback for non-Error objects", () => {
    expect(getErrorMessage({ code: 500 }, "Something went wrong")).toBe("Something went wrong");
  });
});
