# AI Automated Testing System

## 🎯 Objective

This testing system is specifically designed for AI to perform automated testing using MCP tools. The main objectives are:
- **Discover Bugs** - Identify potential issues through edge cases and exceptional scenarios.
- **Regression Testing** - Ensure that new features do not break existing functionality.
- **Stress Testing** - Verify the system's stability under extreme conditions.
- **User Experience Validation** - Find issues that affect the user experience.

## 📁 Directory Structure

```
ai-automation/
├── README.md                       # This file
├── electron-mcp-guide.md          # Electron MCP Automated Testing Guide
├── test-scenarios/                 # Test Scenarios
│   ├── normal-flow/               # Normal Flow Tests
│   │   ├── 01-basic-setup.md
│   │   ├── 02-model-management.md
│   │   ├── 02b-model-add-and-test.md  # Model Add and Connection Test
│   │   ├── 03-template-management.md
│   │   ├── 04-prompt-optimization.md  # Updated - Includes result display feature test
│   │   ├── 04b-user-prompt-optimization.md  # Updated - Includes result display feature test
│   │   ├── 05-history-management.md
│   │   ├── 06-data-management.md
│   │   └── 07-ui-interaction-features.md  # New - UI Interaction Feature Test
│   ├── edge-cases/                # Edge Case Tests
│   │   ├── input-validation.md
│   │   ├── performance-limits.md
│   │   ├── concurrent-operations.md
│   │   └── browser-compatibility.md
│   ├── error-handling/            # Error Handling Tests
│   │   ├── network-failures.md
│   │   ├── invalid-inputs.md
│   │   ├── storage-failures.md
│   │   └── api-errors.md
│   └── stress-testing/            # Stress Tests
│       ├── memory-stress.md
│       ├── rapid-operations.md
│       └── data-volume.md
├── bug-hunting/                   # Dedicated Bug Discovery Tests
│   ├── ui-glitches.md
│   ├── data-corruption.md
│   ├── race-conditions.md
│   └── memory-leaks.md
├── regression/                    # Regression Tests
│   ├── feature-regression.md
│   └── performance-regression.md
├── tools/                         # Testing Tools and Scripts
│   ├── mcp-helpers.md
│   └── test-data-generator.md
└── reports/                       # Test Reports
    ├── latest/
    └── history/
```

## 🤖 AI Testing Execution Principles

### 1. Bug-First Principle
- Focus on scenarios that are likely to cause errors.
- Test boundary conditions and extreme values.
- Verify the completeness of error handling.
- Discover user experience issues.

### 2. Real-World Scenario Simulation
- Simulate real user usage patterns.
- Include unexpected and incorrect operations.
- Test in different environments and conditions.
- Consider concurrency and race conditions.

### 3. Systematic Testing
- Cover all major functional paths.
- Test interactions between features.
- Verify data consistency.
- Check performance and stability.

## 🔍 Test Category Descriptions

### Normal Flow
- Verifies the correctness of basic functions.
- Ensures major user paths are available.
- Serves as a baseline for regression testing.
- Quickly validates core functionality.

### Edge Cases
- Input validation and boundary testing.
- Performance limit testing.
- Concurrent operation testing.
- Browser compatibility testing.

### Error Handling
- Network failure handling.
- Invalid input handling.
- Storage failure handling.
- API error handling.

### Stress Testing
- Memory stress testing.
- Rapid operation testing.
- Large data volume testing.
- Long-duration run testing.

### Bug Hunting
- UI display issues.
- Data corruption issues.
- Race condition issues.
- Memory leak issues.

## 🛠️ MCP Tool Usage Guide

### Basic Tools
```javascript
// Page operations
browser_navigate(url)
browser_snapshot()
browser_resize(width, height)

// Element interaction
browser_click(element, ref)
browser_type(element, ref, text)
browser_hover(element, ref)

// Waiting and validation
browser_wait_for(text/textGone/time)
browser_take_screenshot(filename)
```

### Advanced Techniques
```javascript
// Rapid consecutive operations (to test race conditions)
for (let i = 0; i < 10; i++) {
    browser_click(element, ref);
}

// Large data input (to test performance)
browser_type(element, ref, "x".repeat(10000));

// Window size changes (to test responsiveness)
browser_resize(320, 568); // Mobile size
browser_resize(1920, 1080); // Desktop size
```

## 📊 Test Report Format

### Bug Report Template
```markdown
# Bug Report - [Bug Title]

## Basic Information
- **Time Found:** 2025-01-07 15:30:00
- **Test Scenario:** [Specific Test Scenario]
- **Severity:** High/Medium/Low
- **Scope of Impact:** [Affected features or users]

## Bug Description
[Detailed description of the problem found]

## Steps to Reproduce
1. [Specific Step 1]
2. [Specific Step 2]
3. [Specific Step 3]

## Expected Behavior
[What should have happened]

## Actual Behavior
[What actually happened]

## Environment Information
- **Browser:** Chrome 120.0
- **Operating System:** Windows 11
- **Screen Resolution:** 1920x1080
- **Network Condition:** Normal/Slow/Offline

## Attachments
- **Screenshot:** bug_screenshot.png
- **Console Logs:** console_errors.txt
- **Network Requests:** network_log.har

## Suggested Solution
[Possible solutions or improvement suggestions]
```

## 🚀 Quick Start

### 1. Select a Test Scenario
```bash
# Normal flow validation
cd test-scenarios/normal-flow/

# Edge case testing
cd test-scenarios/edge-cases/

# Bug discovery testing
cd bug-hunting/
```

### 2. Execute the Test
```bash
# Read the test document
# Follow the AI execution guide for testing
# Record any issues found
# Generate a test report
```

### 3. Report the Issue
```bash
# Generate the report in the reports/latest/ directory
# Include detailed reproduction steps and evidence
# Provide suggestions for improvement
```

## 📈 Test Metrics

### Coverage Metrics
- **Function Coverage** - The proportion of tested functions to total functions.
- **Scenario Coverage** - The extent to which usage scenarios are tested.
- **Edge Case Coverage** - The extent to which edge cases are tested.

### Quality Metrics
- **Bug Discovery Rate** - The number of bugs found per test run.
- **Bug Severity Distribution** - The distribution of high/medium/low severity bugs.
- **Regression Bug Rate** - The proportion of bugs that reappear after being fixed.

### Efficiency Metrics
- **Test Execution Time** - The time to complete one round of testing.
- **Problem Localization Time** - The time from discovery to localization of a problem.
- **Automation Level** - The proportion of automated tests.

## 🖥️ Electron Desktop Application Testing

### Specific Guide
For details, see [`electron-mcp-guide.md`](./electron-mcp-guide.md) - The Complete Guide to Electron MCP Automated Testing.

### Key Differences
- **Launch Method**: Use `app_launch_circuit-electron` instead of `browser_navigate`.
- **Element Location**: Prioritize using `click_by_text_circuit-electron`.
- **Problem Handling**: Make good use of JavaScript execution to bypass UI limitations.
- **State Judgment**: Emphasize UI state over console information.

### Testing Process
1. **Build the Application**: `pnpm clean && pnpm build`
2. **Start the Test**: Launch in packaged mode.
3. **Execute Scenarios**: Execute in the order of `normal-flow`.
4. **Verify Results**: Focus on changes in the state of functional buttons.

### Success Story
- **Test Coverage**: 9/9 (100%)
- **Pass Rate**: 100%
- **Core Validation**: End-to-end AI optimization flow.
- **Technical Accumulation**: A complete methodology for Electron testing.

## 🔄 Continuous Improvement

### Test Optimization
- Adjust testing focus based on discovered issues.
- Add new edge case tests.
- Optimize test execution efficiency.
- Improve the accuracy of bug discovery.

### Tool Improvement
- Develop better auxiliary testing tools.
- Optimize the usage of MCP tools.
- Automate test report generation.
- Integrate with CI/CD pipelines.

---

**Note:** This testing system focuses on discovering issues through AI automation, not just simple functional validation. Each test scenario should be designed to uncover potential bugs and user experience problems.
