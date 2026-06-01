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
import { normalizeUsers } from "@/api/users.api";

describe("normalizeUsers", () => {
  it("returns empty array for null", () => {
    expect(normalizeUsers(null)).toEqual([]);
  });

  it("returns empty array for undefined", () => {
    expect(normalizeUsers(undefined)).toEqual([]);
  });

  it("returns empty array for non-array non-object", () => {
    expect(normalizeUsers("invalid")).toEqual([]);
  });

  it("passes through flat array of users", () => {
    const users = [
      { username: "alice", role: "admin", disabled: false, createdAt: "2025-01-01" },
      { username: "bob", role: "user", disabled: true, createdAt: "2025-01-02" },
    ];
    expect(normalizeUsers(users)).toEqual(users);
    expect(normalizeUsers(users)).toHaveLength(2);
  });

  it("extracts from users key", () => {
    const result = normalizeUsers({
      users: [{ username: "carol", role: "user", disabled: false, createdAt: "" }],
    });
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe("carol");
  });

  it("extracts from items key", () => {
    const result = normalizeUsers({
      items: [{ username: "dave", role: "admin", disabled: false, createdAt: "" }],
    });
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe("dave");
  });

  it("returns empty array for unrecognized object shape", () => {
    expect(normalizeUsers({ data: [] })).toEqual([]);
  });
});
