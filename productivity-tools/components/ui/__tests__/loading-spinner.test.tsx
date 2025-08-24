import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { LoadingSpinner, LoadingOverlay, LoadingButton } from "@/components/ui/loading-spinner"

describe("LoadingSpinner", () => {
  it("should render loading spinner with default size", () => {
    render(<LoadingSpinner />)
    
    const spinner = screen.getByTestId("loading-spinner") || document.querySelector('[class*="animate-spin"]')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass("h-6", "w-6") // default medium size
  })

  it("should render with different sizes", () => {
    const { rerender } = render(<LoadingSpinner size="sm" />)
    let spinner = document.querySelector('[class*="animate-spin"]')
    expect(spinner).toHaveClass("h-4", "w-4")

    rerender(<LoadingSpinner size="lg" />)
    spinner = document.querySelector('[class*="animate-spin"]')
    expect(spinner).toHaveClass("h-8", "w-8")
  })

  it("should render with text", () => {
    render(<LoadingSpinner text="読み込み中..." />)
    
    expect(screen.getByText("読み込み中...")).toBeInTheDocument()
  })

  it("should apply custom className", () => {
    render(<LoadingSpinner className="custom-class" />)
    
    const container = document.querySelector('.custom-class')
    expect(container).toBeInTheDocument()
  })
})

describe("LoadingOverlay", () => {
  it("should render overlay with default text", () => {
    render(<LoadingOverlay />)
    
    expect(screen.getByText("読み込み中...")).toBeInTheDocument()
    
    const overlay = document.querySelector('[class*="fixed"][class*="inset-0"]')
    expect(overlay).toBeInTheDocument()
    expect(overlay).toHaveClass("z-50")
  })

  it("should render overlay with custom text", () => {
    render(<LoadingOverlay text="保存中..." />)
    
    expect(screen.getByText("保存中...")).toBeInTheDocument()
  })

  it("should apply custom className", () => {
    render(<LoadingOverlay className="custom-overlay" />)
    
    const overlay = document.querySelector('.custom-overlay')
    expect(overlay).toBeInTheDocument()
  })
})

describe("LoadingButton", () => {
  it("should render button with children when not loading", () => {
    render(
      <LoadingButton loading={false}>
        保存
      </LoadingButton>
    )
    
    expect(screen.getByText("保存")).toBeInTheDocument()
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument()
  })

  it("should render loading spinner when loading", () => {
    render(
      <LoadingButton loading={true}>
        保存
      </LoadingButton>
    )
    
    expect(screen.getByText("保存")).toBeInTheDocument()
    
    const spinner = document.querySelector('[class*="animate-spin"]')
    expect(spinner).toBeInTheDocument()
  })

  it("should be disabled when loading", () => {
    render(
      <LoadingButton loading={true}>
        保存
      </LoadingButton>
    )
    
    const button = screen.getByRole("button")
    expect(button).toBeDisabled()
  })

  it("should not be disabled when not loading", () => {
    render(
      <LoadingButton loading={false}>
        保存
      </LoadingButton>
    )
    
    const button = screen.getByRole("button")
    expect(button).not.toBeDisabled()
  })

  it("should apply custom className", () => {
    render(
      <LoadingButton loading={false} className="custom-button">
        保存
      </LoadingButton>
    )
    
    const button = screen.getByRole("button")
    expect(button).toHaveClass("custom-button")
  })

  it("should pass through other button props", () => {
    const onClick = vi.fn()
    render(
      <LoadingButton loading={false} onClick={onClick} data-testid="test-button">
        クリック
      </LoadingButton>
    )
    
    const button = screen.getByTestId("test-button")
    expect(button).toBeInTheDocument()
    
    button.click()
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})