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
import { formatDateTime } from "@/lib/date";

describe("formatDateTime", () => {
  it("returns em dash for falsy values", () => {
    expect(formatDateTime(undefined)).toBe("—");
    expect(formatDateTime("")).toBe("—");
  });

  it("returns the original value for invalid date strings", () => {
    expect(formatDateTime("not-a-date")).toBe("not-a-date");
  });

  it("formats a valid ISO date string", () => {
    const result = formatDateTime("2025-06-15T14:30:00Z");
    expect(result).not.toBe("—");
    expect(result).not.toBe("2025-06-15T14:30:00Z");
    expect(result.length).toBeGreaterThan(5);
  });

  it("formats different dates differently", () => {
    const r1 = formatDateTime("2025-01-01T00:00:00Z");
    const r2 = formatDateTime("2025-12-31T23:59:59Z");
    expect(r1).not.toBe(r2);
  });
});
