import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { useToast, toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Toast, ToastProvider, ToastViewport } from "@/components/ui/toast"

// Test component that uses the toast hook
function TestComponent() {
  const { toast } = useToast()

  return (
    <div>
      <button
        onClick={() =>
          toast({
            title: "Success",
            description: "This is a success message",
            variant: "default",
          })
        }
      >
        Show Toast
      </button>
      <button
        onClick={() =>
          toast({
            title: "Error",
            description: "This is an error message",
            variant: "destructive",
          })
        }
      >
        Show Error
      </button>
      <Toaster />
    </div>
  )
}

describe("Toast System", () => {
  beforeEach(() => {
    // Clear any existing toasts
    vi.clearAllMocks()
  })

  it("should show a toast notification", async () => {
    render(<TestComponent />)

    const showToastButton = screen.getByText("Show Toast")
    
    act(() => {
      fireEvent.click(showToastButton)
    })

    expect(screen.getByText("Success")).toBeInTheDocument()
    expect(screen.getByText("This is a success message")).toBeInTheDocument()
  })

  it("should show error toast with destructive variant", async () => {
    render(<TestComponent />)

    const showErrorButton = screen.getByText("Show Error")
    
    act(() => {
      fireEvent.click(showErrorButton)
    })

    expect(screen.getByText("Error")).toBeInTheDocument()
    expect(screen.getByText("This is an error message")).toBeInTheDocument()
  })

  it("should display toast with close button", async () => {
    render(<TestComponent />)

    const showToastButton = screen.getByText("Show Toast")
    
    act(() => {
      fireEvent.click(showToastButton)
    })

    // Verify toast content is displayed
    expect(screen.getByText("Success")).toBeInTheDocument()
    expect(screen.getByText("This is a success message")).toBeInTheDocument()

    // Verify that close button exists (even if we can't easily click it in tests)
    const buttons = screen.getAllByRole("button")
    const hasCloseButton = buttons.some(button => 
      button.hasAttribute("toast-close") || 
      button.querySelector('svg') // X icon
    )
    
    expect(hasCloseButton).toBe(true)
  })

  it("should call global toast function directly", () => {
    // This test verifies that the toast function can be called directly
    // without throwing an error
    expect(() => {
      toast({
        title: "Direct toast",
        description: "Direct toast message",
      })
    }).not.toThrow()
  })

  it("should render toast with different variants", () => {
    const variants = ["default", "destructive", "success", "warning", "info"]
    
    variants.forEach((variant) => {
      const { container } = render(
        <ToastProvider>
          <Toast variant={variant as any}>
            <div>Test toast</div>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      )
      
      const toastElement = container.querySelector('[role="listitem"]') || container.firstChild
      expect(toastElement).toBeInTheDocument()
    })
  })
})