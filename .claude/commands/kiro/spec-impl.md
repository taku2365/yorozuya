---
description: Execute spec tasks using TDD methodology
allowed-tools: Bash, Read, Write, Edit, MultiEdit, Grep, Glob, LS, WebFetch
argument-hint: <feature-name> <task-numbers>
---

# Execute Spec Tasks with TDD

Execute implementation tasks from spec using t-wada style Test-Driven Development methodology.

## Arguments: $ARGUMENTS

## Current Specs
Available specs: !`ls .kiro/specs/ 2>/dev/null || echo "No specs found"`

## Instructions

### Help Mode (--help)
If arguments contain "--help", show usage:
```
/kiro:spec-impl <feature-name> <task-numbers>

Examples:
  /kiro:spec-impl auth-system 1.1            # Execute task 1.1
  /kiro:spec-impl auth-system 1,2,3          # Execute tasks 1, 2, 3
  /kiro:spec-impl auth-system --all          # Execute all pending tasks
```

### Pre-Execution Validation
Feature name: !`echo "$ARGUMENTS" | awk '{print $1}'`

Validate required files exist:
- Requirements: !`FEATURE=$(echo "$ARGUMENTS" | awk '{print $1}'); [ -n "$FEATURE" ] && [ -f ".kiro/specs/$FEATURE/requirements.md" ] && echo "Found" || echo "Missing"`
- Design: !`FEATURE=$(echo "$ARGUMENTS" | awk '{print $1}'); [ -n "$FEATURE" ] && [ -f ".kiro/specs/$FEATURE/design.md" ] && echo "Found" || echo "Missing"`
- Tasks: !`FEATURE=$(echo "$ARGUMENTS" | awk '{print $1}'); [ -n "$FEATURE" ] && [ -f ".kiro/specs/$FEATURE/tasks.md" ] && echo "Found" || echo "Missing"`
- Metadata: !`FEATURE=$(echo "$ARGUMENTS" | awk '{print $1}'); [ -n "$FEATURE" ] && [ -f ".kiro/specs/$FEATURE/spec.json" ] && echo "Found" || echo "Missing"`

### Context Loading
**Load all required content before execution:**

**Core Steering:**
- Structure: @.kiro/steering/structure.md
- Tech Stack: @.kiro/steering/tech.md  
- Product: @.kiro/steering/product.md

**Custom Steering:**
Additional files: !`find .kiro/steering -name "*.md" ! -name "structure.md" ! -name "tech.md" ! -name "product.md" 2>/dev/null || echo "None"`

**Spec Documents:**
Feature directory: !`echo "$ARGUMENTS" | awk '{print $1}'`
- Requirements: @.kiro/specs/[FEATURE]/requirements.md
- Design: @.kiro/specs/[FEATURE]/design.md
- Tasks: @.kiro/specs/[FEATURE]/tasks.md

**Note**: [FEATURE] will be replaced with actual feature name during execution

### Task Execution
1. **Parse feature name and task numbers** from arguments
2. **Load all context** (steering + spec documents)
3. **Extract checkboxes** from tasks.md: !`FEATURE=$(echo "$ARGUMENTS" | awk '{print $1}'); [ -n "$FEATURE" ] && grep -n "^- \\[ \\]\\|^- \\[x\\]" .kiro/specs/$FEATURE/tasks.md || echo "No feature specified"`
4. **Execute each checkbox** using t-wada style TDD methodology directly

### For Each Task Checkbox
Execute using t-wada style TDD methodology directly:

**Implementation Steps:**
1. **Load Project Context** (read these files first):
   - Structure: .kiro/steering/structure.md  
   - Tech Stack: .kiro/steering/tech.md
   - Product: .kiro/steering/product.md
   - Custom steering files: !`find .kiro/steering -name "*.md" ! -name "structure.md" ! -name "tech.md" ! -name "product.md" 2>/dev/null || echo "None"`
   - Spec Metadata: .kiro/specs/[FEATURE]/spec.json
   - Requirements: .kiro/specs/[FEATURE]/requirements.md
   - Design: .kiro/specs/[FEATURE]/design.md
   - All Tasks: .kiro/specs/[FEATURE]/tasks.md

2. **t-wada Style TDD Implementation** for each specific task:
   
   **File Search & Navigation**:
   - Use serena-mcp for efficient file search and codebase exploration
   - Search for existing patterns and similar implementations
   - Navigate to relevant files and modules quickly
   
   **TDD Cycle**:
   - **RED Phase**: 
     - Write a failing test that precisely describes the expected behavior
     - Run the test to confirm it fails with the expected error
     - The test should be minimal and focused on one behavior
   
   - **GREEN Phase**: 
     - Write the minimal production code to make the test pass
     - Don't write more code than necessary
     - Focus only on making the current test pass
   
   - **REFACTOR Phase**: 
     - Clean up the code while keeping all tests green
     - Remove duplication
     - Improve naming and structure
     - Apply design patterns where appropriate
     - Use serena-mcp to check for similar patterns in codebase
   
   **E2E Testing (when applicable)**:
   - Set up Playwright for end-to-end testing
   - Write E2E tests for critical user journeys
   - Use playwright-mcp for debugging E2E test failures
   - Capture screenshots and traces for failed tests
   - Implement page object models for maintainable E2E tests

3. **Task Completion**:
   - Verify all unit tests pass
   - Verify all E2E tests pass (if applicable)
   - Check test coverage meets project standards
   - Update checkbox from `- [ ]` to `- [x]` in .kiro/specs/[FEATURE]/tasks.md
   - Ensure no regressions in existing tests
   - Use serena-mcp to verify no unintended changes in other modules

**For each task:**
- Extract exact checkbox content from tasks.md
- Follow t-wada style TDD methodology strictly
- Use serena-mcp for efficient file navigation
- Implement Playwright E2E tests where specified
- Debug E2E failures with playwright-mcp
- Implement only the specific task requirements
- Maintain code quality and test coverage

## Implementation Logic

1. **Parse Arguments**:
   - Feature name: First argument
   - Task numbers: Second argument (support: "1", "1,2,3", "--all")

2. **Validate**:
   - Spec directory exists
   - Required files (requirements.md, design.md, tasks.md, spec.json) exist
   - Spec is approved for implementation

3. **Execute**:
   - **Load all file contents** into memory first
   - **Build complete context** for implementation
   - **Initialize MCP tools** (serena-mcp, playwright-mcp if needed)
   - **Execute each task sequentially** using t-wada style TDD methodology
   - Each task implementation receives complete project knowledge
   - Leverage serena-mcp for efficient code navigation
   - Use playwright-mcp for E2E test debugging

## Tool Usage Guidelines

### serena-mcp
- Use for searching existing code patterns
- Navigate to related files quickly
- Find similar implementations for reference
- Explore codebase structure efficiently

### Playwright
- Set up for E2E testing requirements
- Write comprehensive user journey tests
- Capture test artifacts (screenshots, videos, traces)
- Implement robust selectors and assertions

### playwright-mcp
- Debug failing E2E tests interactively
- Inspect page state during test execution
- Analyze test failure reasons
- Fix flaky tests with proper waits and assertions

## Error Handling

- Spec not found: Run /kiro:spec-init first
- Not approved: Complete spec workflow first
- Task failure: Keep checkbox unchecked, show error
- Test failure: Debug with appropriate tools (playwright-mcp for E2E)
- File not found: Use serena-mcp to locate correct paths

## Success Metrics

- All selected checkboxes marked [x] in tasks.md
- All unit tests pass with good coverage
- All E2E tests pass consistently (no flaky tests)
- No regressions in existing test suites
- Code follows t-wada TDD principles
- Clean, maintainable, and well-tested code