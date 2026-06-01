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
import { PageHeader } from "@/components/shared/page-header";

describe("PageHeader", () => {
  it("renders the title", () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Dashboard");
  });

  it("renders the description when provided", () => {
    render(
      <PageHeader title="Settings" description="Manage your preferences" />,
    );
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Manage your preferences")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(<PageHeader title="Dashboard" />);
    const heading = screen.getByRole("heading", { level: 1 });
    const container = heading.parentElement;
    expect(container?.children).toHaveLength(1);
  });

  it("renders action buttons when provided", () => {
    render(
      <PageHeader
        title="Plugins"
        actions={<button>Add Plugin</button>}
      />,
    );
    expect(screen.getByText("Plugins")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Plugin" })).toBeInTheDocument();
  });

  it("does not render actions element when not provided", () => {
    render(<PageHeader title="Dashboard" />);
    const buttons = screen.queryByRole("button");
    expect(buttons).toBeNull();
  });

  it("renders multiple action elements", () => {
    render(
      <PageHeader
        title="Plugins"
        actions={
          <>
            <button>Refresh</button>
            <button>Add</button>
          </>
        }
      />,
    );
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });
});
