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
import { MetricCard } from "@/components/shared/metric-card";

describe("MetricCard", () => {
  it("renders the label", () => {
    render(<MetricCard label="CPU Usage" value="45%" />);
    expect(screen.getByText("CPU Usage")).toBeInTheDocument();
  });

  it("renders the value", () => {
    render(<MetricCard label="Memory" value="2.1 GB" />);
    expect(screen.getByText("2.1 GB")).toBeInTheDocument();
  });

  it("renders numeric values correctly", () => {
    render(<MetricCard label="Containers" value={42} />);
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Containers")).toBeInTheDocument();
  });

  it("renders zero as a value", () => {
    render(<MetricCard label="Errors" value={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders both label and value together", () => {
    render(<MetricCard label="Uptime" value="3 days" />);
    expect(screen.getByText("Uptime")).toBeInTheDocument();
    expect(screen.getByText("3 days")).toBeInTheDocument();
  });
});
