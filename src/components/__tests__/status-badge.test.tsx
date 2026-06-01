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


import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusBadge } from "@/components/shared/status-badge";

describe("StatusBadge", () => {
  it("renders with running status", () => {
    render(<StatusBadge status="running" />);
    expect(screen.getByText("running")).toBeInTheDocument();
  });

  it("renders with stopped status", () => {
    render(<StatusBadge status="stopped" />);
    expect(screen.getByText("stopped")).toBeInTheDocument();
  });

  it("renders with failed status", () => {
    render(<StatusBadge status="failed" />);
    expect(screen.getByText("failed")).toBeInTheDocument();
  });

  it("renders with pending_setup status", () => {
    render(<StatusBadge status="pending_setup" />);
    expect(screen.getByText("pending_setup")).toBeInTheDocument();
  });

  it("renders with unknown status gracefully", () => {
    render(<StatusBadge status="some-unknown-status" />);
    expect(screen.getByText("some-unknown-status")).toBeInTheDocument();
  });

  it("applies emerald classes for running status", () => {
    render(<StatusBadge status="running" />);
    const badge = screen.getByText("running");
    expect(badge.className).toContain("border-emerald-500/30");
    expect(badge.className).toContain("bg-emerald-500/10");
    expect(badge.className).toContain("text-emerald-500");
  });

  it("applies amber classes for pending_setup status", () => {
    render(<StatusBadge status="pending_setup" />);
    const badge = screen.getByText("pending_setup");
    expect(badge.className).toContain("border-amber-500/30");
    expect(badge.className).toContain("bg-amber-500/10");
    expect(badge.className).toContain("text-amber-500");
  });

  it("does not apply special color classes for unknown status", () => {
    render(<StatusBadge status="bogus" />);
    const badge = screen.getByText("bogus");
    expect(badge.className).not.toContain("emerald");
    expect(badge.className).not.toContain("amber");
  });
});
