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
import { normalizeSystemStatus } from "@/api/system.api";
import type { RawSystemStatusResponse } from "@/types/system";

describe("normalizeSystemStatus", () => {
  it("handles empty payload", () => {
    const result = normalizeSystemStatus({});
    expect(result.rabbitmq.containerName).toBe("");
    expect(result.rabbitmq.amqpPort).toBe(0);
    expect(result.rabbitmq.managementPort).toBe(0);
    expect(result.rabbitmq.healthy).toBe(false);
    expect(result.redis.containerName).toBe("");
    expect(result.redis.port).toBe(0);
    expect(result.redis.healthy).toBe(false);
    expect(result.docker.available).toBe(false);
    expect(result.daemon.webUiStatus).toBe("unknown");
  });

  it("extracts rabbitmq info", () => {
    const payload: RawSystemStatusResponse = {
      system: {
        rabbitmq: { container: "rmq-cont", port: 5672, mgmtPort: 15672, healthy: true },
      },
    };
    const result = normalizeSystemStatus(payload);
    expect(result.rabbitmq.containerName).toBe("rmq-cont");
    expect(result.rabbitmq.amqpPort).toBe(5672);
    expect(result.rabbitmq.managementPort).toBe(15672);
    expect(result.rabbitmq.healthy).toBe(true);
  });

  it("extracts redis info", () => {
    const payload: RawSystemStatusResponse = {
      system: {
        redis: { container: "redis-cont", port: 6379, healthy: true },
      },
    };
    const result = normalizeSystemStatus(payload);
    expect(result.redis.containerName).toBe("redis-cont");
    expect(result.redis.port).toBe(6379);
    expect(result.redis.healthy).toBe(true);
  });

  it("extracts daemon web ui status", () => {
    const payload: RawSystemStatusResponse = { status: "running" };
    const result = normalizeSystemStatus(payload);
    expect(result.daemon.webUiStatus).toBe("running");
  });

  it("extracts docker availability", () => {
    const payload: RawSystemStatusResponse = { docker: { available: true } };
    const result = normalizeSystemStatus(payload);
    expect(result.docker.available).toBe(true);
  });

  it("defaults docker.available to false when absent", () => {
    const result = normalizeSystemStatus({});
    expect(result.docker.available).toBe(false);
  });

  it("provides default constant values", () => {
    const result = normalizeSystemStatus({});
    expect(result.rabbitmq.bindMode).toBe("127.0.0.1 only");
    expect(result.redis.bindMode).toBe("127.0.0.1 only");
    expect(result.daemon.apiEndpoint).toBe(`${window.location.origin}/api/v1`);
  });
});
