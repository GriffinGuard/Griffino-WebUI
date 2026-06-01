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
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RouteErrorPage } from "@/components/shared/route-error";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useRouteError: () => new Error("Something went wrong"),
  isRouteErrorResponse: () => false,
}));

describe("RouteErrorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the error title", () => {
    render(<RouteErrorPage />);
    expect(screen.getByText("error.page.title")).toBeInTheDocument();
  });

  it("renders the error description from Error object", () => {
    render(<RouteErrorPage />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders a refresh button", () => {
    render(<RouteErrorPage />);
    expect(
      screen.getByRole("button", { name: "error.page.refresh" }),
    ).toBeInTheDocument();
  });

  it("renders a back to login button", () => {
    render(<RouteErrorPage />);
    expect(
      screen.getByRole("button", { name: "error.page.backToLogin" }),
    ).toBeInTheDocument();
  });

  it("navigates to login on back to login click", async () => {
    render(<RouteErrorPage />);
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: "error.page.backToLogin" }),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
  });
});
