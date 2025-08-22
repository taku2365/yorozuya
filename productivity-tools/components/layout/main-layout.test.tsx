import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MainLayout } from "./main-layout";

describe("MainLayout", () => {
  it("should render the navigation with all main tools", () => {
    render(
      <MainLayout>
        <div>Test content</div>
      </MainLayout>
    );

    // Check that all navigation items are present
    expect(screen.getByText("ToDo管理")).toBeInTheDocument();
    expect(screen.getByText("WBS")).toBeInTheDocument();
    expect(screen.getByText("カンバン")).toBeInTheDocument();
    expect(screen.getByText("ガントチャート")).toBeInTheDocument();
  });

  it("should render children content", () => {
    render(
      <MainLayout>
        <div>Test content</div>
      </MainLayout>
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("should have responsive layout", () => {
    const { container } = render(
      <MainLayout>
        <div>Test content</div>
      </MainLayout>
    );

    const nav = container.querySelector("nav");
    expect(nav).toHaveClass("md:w-64");
  });
});