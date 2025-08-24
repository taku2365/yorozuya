import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PrioritySelect, PriorityBadge } from "@/components/ui/priority-select"

describe("PrioritySelect", () => {
  const mockOnValueChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render with placeholder when no value selected", () => {
    render(
      <PrioritySelect
        value={undefined}
        onValueChange={mockOnValueChange}
        placeholder="優先度を選択してください"
      />
    )

    expect(screen.getByText("優先度を選択してください")).toBeInTheDocument()
  })

  it("should display selected priority", () => {
    render(
      <PrioritySelect
        value="high"
        onValueChange={mockOnValueChange}
      />
    )

    expect(screen.getByText("高")).toBeInTheDocument()
    expect(screen.getByText("🔴")).toBeInTheDocument()
  })

  it("should open dropdown when clicked", async () => {
    const user = userEvent.setup()
    render(
      <PrioritySelect
        value={undefined}
        onValueChange={mockOnValueChange}
      />
    )

    const trigger = screen.getByRole("combobox")
    await user.click(trigger)

    expect(screen.getByText("高優先度")).toBeInTheDocument()
    expect(screen.getByText("中優先度")).toBeInTheDocument()
    expect(screen.getByText("低優先度")).toBeInTheDocument()
  })

  it("should call onValueChange when option selected", async () => {
    const user = userEvent.setup()
    render(
      <PrioritySelect
        value={undefined}
        onValueChange={mockOnValueChange}
      />
    )

    const trigger = screen.getByRole("combobox")
    await user.click(trigger)

    const highPriorityOption = screen.getByText("高優先度")
    await user.click(highPriorityOption)

    expect(mockOnValueChange).toHaveBeenCalledWith("high")
  })

  it("should be disabled when disabled prop is true", () => {
    render(
      <PrioritySelect
        value={undefined}
        onValueChange={mockOnValueChange}
        disabled={true}
      />
    )

    const trigger = screen.getByRole("combobox")
    expect(trigger).toBeDisabled()
  })

  it("should apply custom className", () => {
    render(
      <PrioritySelect
        value={undefined}
        onValueChange={mockOnValueChange}
        className="custom-class"
      />
    )

    const trigger = screen.getByRole("combobox")
    expect(trigger).toHaveClass("custom-class")
  })

  it("should show correct icons and labels for each priority", async () => {
    const user = userEvent.setup()
    render(
      <PrioritySelect
        value={undefined}
        onValueChange={mockOnValueChange}
      />
    )

    const trigger = screen.getByRole("combobox")
    await user.click(trigger)

    // High priority
    expect(screen.getByText("🔴")).toBeInTheDocument()
    expect(screen.getByText("高優先度")).toBeInTheDocument()

    // Medium priority
    expect(screen.getByText("🟡")).toBeInTheDocument()
    expect(screen.getByText("中優先度")).toBeInTheDocument()

    // Low priority
    expect(screen.getByText("🟢")).toBeInTheDocument()
    expect(screen.getByText("低優先度")).toBeInTheDocument()
  })
})

describe("PriorityBadge", () => {
  it("should render high priority badge", () => {
    render(<PriorityBadge priority="high" />)

    expect(screen.getByText("高")).toBeInTheDocument()
    expect(screen.getByText("🔴")).toBeInTheDocument()
    
    const badge = screen.getByText("高").parentElement
    expect(badge).toHaveClass("bg-red-100", "text-red-800")
  })

  it("should render medium priority badge", () => {
    render(<PriorityBadge priority="medium" />)

    expect(screen.getByText("中")).toBeInTheDocument()
    expect(screen.getByText("🟡")).toBeInTheDocument()
    
    const badge = screen.getByText("中").parentElement
    expect(badge).toHaveClass("bg-yellow-100", "text-yellow-800")
  })

  it("should render low priority badge", () => {
    render(<PriorityBadge priority="low" />)

    expect(screen.getByText("低")).toBeInTheDocument()
    expect(screen.getByText("🟢")).toBeInTheDocument()
    
    const badge = screen.getByText("低").parentElement
    expect(badge).toHaveClass("bg-green-100", "text-green-800")
  })

  it("should apply custom className", () => {
    render(<PriorityBadge priority="high" className="custom-badge" />)

    const badge = screen.getByText("高").parentElement
    expect(badge).toHaveClass("custom-badge")
  })
})