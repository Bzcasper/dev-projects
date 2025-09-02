# Input Validation Edge Case Test

## 📖 Test Overview
This test evaluates the application's ability to handle various abnormal inputs, discovering bugs and user experience issues related to input validation.

## 🎯 Test Objectives
- Discover input validation vulnerabilities
- Test extreme input conditions
- Verify error handling mechanisms
- Identify UI display issues

## 🔍 Bug Discovery Focus
- Handling of input length limits
- Special character processing
- Null input handling
- Format validation problems
- Risk of memory leaks

---

## 🧪 Test Scenarios

### Scenario 1: Extremely Long Text Input Test

**Test Purpose:** To discover performance issues and UI display bugs when handling long text.

**AI Execution Guide:**
```javascript
// Generate extremely long text
const longText = "This is a test text.".repeat(1000); // Approx. 10,000 characters
browser_type(element="Original Prompt Input", ref="e54", text=longText);

// Check UI responsiveness
browser_snapshot();

// Attempt to optimize
browser_click(element="Start Optimization Button", ref="e78");
browser_wait_for(time=30); // Wait for a longer period
```

**Expected Issues to Discover:**
- Abnormal scrolling in the input box
- UI freezing or unresponsiveness
- High memory usage
- Optimization timeout or failure
- Abnormal display of results

**Verification Points:**
- [ ] Can the input box display long text normally?
- [ ] Does the UI remain responsive?
- [ ] Can the optimization complete successfully?
- [ ] Is memory usage reasonable?
- [ ] Is error handling appropriate?

---

### Scenario 2: Special Characters and Emoji Test

**Test Purpose:** To discover bugs related to character encoding and display.

**AI Execution Guide:**
```javascript
// Test various special characters
const specialChars = [
    "🚀🎯💡🔥⭐️🌟✨🎉🎊🎈", // Emoji
    "中文测试内容包含各种符号！@#￥%……&*（）", // Chinese special symbols
    "English with symbols: !@#$%^&*()_+-=[]{}|;':\",./<>?", // English special symbols
    "Mathematical symbols: ∑∏∫∂∇∆∞±×÷≤≥≠≈∝∈∉∪∩⊂⊃", // Mathematical symbols
    "HTML tags: <script>alert('test')</script><div>test</div>", // HTML injection test
    "SQL injection: '; DROP TABLE users; --", // SQL injection test
    "Newline test: \nFirst line\nSecond line\nThird line", // Newline characters
    "Tab test: \tTab\tseparated\tcontent" // Tab characters
];

for (const testText of specialChars) {
    browser_type(element="Original Prompt Input", ref="e54", text=testText);
    browser_snapshot();
    browser_click(element="Start Optimization Button", ref="e78");
    browser_wait_for(time=10);
    browser_snapshot();
}
```

**Expected Issues to Discover:**
- Abnormal character display or garbled text
- HTML/script injection vulnerabilities
- Incorrect handling of newline characters
- Emoji display problems
- Encoding conversion errors

**Verification Points:**
- [ ] Special characters are displayed correctly
- [ ] No risk of script injection
- [ ] Newline characters are handled correctly
- [ ] Emojis are displayed normally
- [ ] Correct encoding conversion

---

### Scenario 3: Empty Input and Boundary Value Test

**Test Purpose:** To discover bugs in null value handling and boundary conditions.

**AI Execution Guide:**
```javascript
// Test various empty input scenarios
const emptyInputs = [
    "", // Completely empty
    " ", // Single space
    "   ", // Multiple spaces
    "\n", // Only newline
    "\t", // Only tab
    "\n\t ", // Mixed whitespace characters
];

for (const emptyInput of emptyInputs) {
    // Clear the input box
    browser_click(element="Original Prompt Input", ref="e54");
    browser_press_key("Ctrl+a");
    browser_press_key("Delete");

    // Input the test content
    browser_type(element="Original Prompt Input", ref="e54", text=emptyInput);

    // Attempt to optimize
    browser_click(element="Start Optimization Button", ref="e78");
    browser_snapshot();

    // Check error handling
    browser_wait_for(time=3);
}
```

**Expected Issues to Discover:**
- Incorrect button state for empty input
- Missing input validation prompts
- Improper handling of whitespace characters
- Unclear error messages
- Abnormal UI state

**Verification Points:**
- [ ] Appropriate prompt for empty input
- [ ] Button state is correctly disabled
- [ ] Whitespace characters are handled correctly
- [ ] Error messages are clear and specific
- [ ] Consistent UI state

---

### Scenario 4: Rapid Consecutive Input Test

**Test Purpose:** To discover race conditions and performance issues in input handling.

**AI Execution Guide:**
```javascript
// Rapid consecutive input test
for (let i = 0; i < 20; i++) {
    browser_type(element="Original Prompt Input", ref="e54", text=`Rapid input test ${i}`);
    // No waiting, proceed to the next input immediately
}

// Rapid consecutive click test
for (let i = 0; i < 10; i++) {
    browser_click(element="Start Optimization Button", ref="e78");
}

// Check the final state
browser_snapshot();
```

**Expected Issues to Discover:**
- Lost or duplicated input
- Delayed UI updates
- Chaotic button state
- Multiple requests sent
- Memory leaks

**Verification Points:**
- [ ] The final input content is correct
- [ ] Consistent UI state
- [ ] No duplicate requests
- [ ] Normal performance is maintained
- [ ] Stable memory usage

---

### Scenario 5: Copy-Paste Anomaly Test

**Test Purpose:** To discover edge case bugs in the copy-paste functionality.

**AI Execution Guide:**
```javascript
// Test large copy-paste
const largeText = "Copy-paste test content.".repeat(500);

// Simulate copy-paste operation
browser_click(element="Original Prompt Input", ref="e54");
browser_press_key("Ctrl+a");
browser_type(element="Original Prompt Input", ref="e54", text=largeText);

// Test partial selection copy
browser_press_key("Ctrl+a");
browser_press_key("Ctrl+c");
browser_press_key("Ctrl+v");
browser_press_key("Ctrl+v"); // Paste repeatedly

// Check the result
browser_snapshot();
```

**Expected Issues to Discover:**
- Lost copy-pasted content
- Formatting issues
- Performance degradation
- Content duplication
- UI stuttering

**Verification Points:**
- [ ] Copy-paste functionality is normal
- [ ] Content formatting is preserved
- [ ] Acceptable performance impact
- [ ] No content duplication
- [ ] Normal UI responsiveness

---

### Scenario 6: Input Box Focus Anomaly Test

**Test Purpose:** To discover UI bugs related to focus management.

**AI Execution Guide:**
```javascript
// Test focus switching
browser_click(element="Original Prompt Input", ref="e54");
browser_type(element="Original Prompt Input", ref="e54", text="Focus test");

// Rapidly switch focus
browser_click(element="Model Selection Button", ref="e59");
browser_click(element="Original Prompt Input", ref="e54");
browser_click(element="Template Selection Button", ref="e69");
browser_click(element="Original Prompt Input", ref="e54");

// Test Tab key navigation
browser_press_key("Tab");
browser_press_key("Tab");
browser_press_key("Tab");
browser_press_key("Shift+Tab");

// Check focus state
browser_snapshot();
```

**Expected Issues to Discover:**
- Lost or misplaced focus
- Incorrect Tab navigation order
- Abnormal focus styles
- Keyboard operations failing
- Accessibility issues

**Verification Points:**
- [ ] Correct focus management
- [ ] Reasonable Tab navigation order
- [ ] Clear focus styles
- [ ] Normal keyboard operations
- [ ] Good accessibility

---

## 🐛 Common Bug Patterns

### Input Validation Bugs
- Length limit not enforced
- Incorrect handling of special characters
- Missing null value checks
- Non-strict format validation

### Performance-related Bugs
- Stuttering caused by large inputs
- High memory usage
- Long response times
- Delayed UI updates

### UI Display Bugs
- Text overflow or truncation
- Character encoding issues
- Incorrect focus management
- Abnormal style display

### Security-related Bugs
- XSS injection risks
- Improper input filtering
- Leakage of sensitive information
- Missing permission validation

---

## 📊 Bug Report Template

```markdown
# Input Validation Bug Report

## Bug Information
- **Time Found:** [Time]
- **Test Scenario:** [Specific Scenario]
- **Severity:** High/Medium/Low
- **Bug Type:** Input Validation/Performance/UI/Security

## Steps to Reproduce
1. [Specific Step]
2. [Specific Step]
3. [Specific Step]

## Expected Behavior
[What should have happened]

## Actual Behavior
[What actually happened]

## Impact Assessment
[Impact on users and the system]

## Suggested Fix
[Repair suggestion and priority]
```

---

**Note:** These tests are specifically designed to discover bugs and may cause the application to behave abnormally. Execute with caution in a production environment.
