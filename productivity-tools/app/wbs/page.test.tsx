import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the WBS components
vi.mock("@/components/wbs/wbs-page", () => ({
  WBSPage: () => <div data-testid="wbs-page">WBS Page Component</div>,
}));

describe("WBS Page", () => {
  it("renders the WBS page component", async () => {
    // Dynamic import after mock
    const { default: WBSPage } = await import("./page");
    
    render(<WBSPage />);
    
    expect(screen.getByTestId("wbs-page")).toBeInTheDocument();
  });
});