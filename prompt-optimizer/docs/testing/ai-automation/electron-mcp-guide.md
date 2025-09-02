# Electron MCP Automated Testing Guide

## 📖 Overview

This guide summarizes the best practices and key techniques for using the Model Context Protocol (MCP) to conduct AI-driven automated testing on Electron desktop applications.

## 🚀 Launch and Connection

### Electron Application Launch
```javascript
// 1. Ensure the application is built
// Execute: pnpm clean && pnpm build

// 2. Launch the Electron application
app_launch_circuit-electron({
  app: "/path/to/project/packages/desktop/dist/win-unpacked/YourApp.exe",
  mode: "packaged",  // Key: Use packaged mode
  includeSnapshots: true,
  timeout: 60000
})
```

### Differences from Browser Testing
- **Browser**: `browser_navigate` to a URL
- **Electron**: `app_launch_circuit-electron` to launch an executable file
- **Build Requirement**: Electron needs to be built before testing

## 🎯 Element Location Strategy

### Priority Order (Important!)
1.  **click_by_text_circuit-electron** (Highest priority, most stable)
2.  **smart_click_circuit-electron** (Automatic detection strategy)
3.  **click_circuit-electron** (CSS selector)
4.  **evaluate_circuit-electron** (JavaScript execution, last resort)

### Best Practice Examples
```javascript
// ✅ Preferred: Text-based click
click_by_text_circuit-electron({
  sessionId: "session-id",
  text: "⚙️ Model Manager"
})

// ⚠️ Alternative: CSS selector
click_circuit-electron({
  sessionId: "session-id",
  selector: "button:nth-child(4)"
})

// 🔧 Last Resort: JavaScript execution
evaluate_circuit-electron({
  sessionId: "session-id",
  script: `
    const buttons = document.querySelectorAll('button');
    for (let button of buttons) {
      if (button.textContent.includes('Model Manager')) {
        button.click();
        break;
      }
    }
  `
})
```

## ⚠️ Common Problem Solving

### 1. Element Obstruction Issue
**Symptom**: `Error: <element> intercepts pointer events`

**Solution**:
```javascript
// Solution 1: Use the Escape key to close the obstructing element
key_circuit-electron({ sessionId: "session-id", key: "Escape" })

// Solution 2: Click on a blank area
evaluate_circuit-electron({ script: "document.body.click();" })

// Solution 3: Bypass obstruction with JavaScript
evaluate_circuit-electron({
  script: `
    const button = document.querySelector('button[text="Target"]');
    if (button && !button.closest('.fixed')) {
      button.click();
    }
  `
})
```

### 2. Element Becomes Invalid After Language Switch
**Problem**: Text selectors fail after switching the language.

**Solution**:
```javascript
// ❌ Hardcoded text
click_by_text_circuit-electron({ text: "Model Manager" })

// ✅ Use partial match
evaluate_circuit-electron({
  script: `
    const buttons = document.querySelectorAll('button');
    for (let button of buttons) {
      if (button.textContent.includes('Model') &&
          button.textContent.includes('Manager')) {
        button.click();
        break;
      }
    }
  `
})
```

### 3. Misleading Console Error Messages
**Important**: Do not rely solely on console error messages to determine feature status.

**Correct Approach**:
```javascript
// ✅ Focus on UI state changes
// - Check for the appearance of V1, V2 buttons
// - Check for the activation of the "Continue Optimize" button
// - Check for disabled/pressed/focused states

// ❌ Incorrect Approach: Relying only on console error messages
```

## 🛠️ Input and Wait Strategies

### Text Input Best Practices
```javascript
evaluate_circuit-electron({
  script: `
    const textbox = document.querySelector('textarea[placeholder*="prompt"]');
    if (textbox && textbox.offsetParent !== null) {
      textbox.value = 'test content';
      textbox.dispatchEvent(new Event('input', { bubbles: true }));
      textbox.dispatchEvent(new Event('change', { bubbles: true }));
      textbox.focus();
      return 'success';
    }
    return 'not found';
  `
})
```

### Wait Strategy
```javascript
// Basic wait
wait_for_load_state_circuit-electron({
  sessionId: "session-id",
  state: "load",
  timeout: 5000
})

// AI request wait (Important: AI requests need more time)
wait_for_load_state_circuit-electron({
  sessionId: "session-id",
  state: "networkidle",
  timeout: 15000
})
```

### Recommended Timeout Settings
- **Basic Operations**: 3-5 seconds
- **AI Requests**: 10-20 seconds
- **File Operations**: 5-10 seconds
- **Application Launch**: 60 seconds

## 🔍 Status Checking and Debugging

### UI Status Check
```javascript
// Use snapshot to check UI state
snapshot_circuit-electron({ sessionId: "session-id" })

// Key status indicators:
// - pressed state (button activation)
// - disabled state (button availability)
// - focused state (current focus)
// - value field (input content)
```

### Debugging Techniques
```javascript
// Debug element visibility
evaluate_circuit-electron({
  script: `
    const elements = document.querySelectorAll('button');
    return Array.from(elements).map(el => ({
      text: el.textContent.trim(),
      visible: el.offsetParent !== null,
      disabled: el.disabled
    }));
  `
})
```

## 🚨 Session Management

### Handling Session Disconnection
```javascript
try {
  click_by_text_circuit-electron({ sessionId, text: "button" })
} catch (error) {
  if (error.message.includes('page has been closed')) {
    // Restart the application
    sessionId = app_launch_circuit-electron({
      app: appPath,
      mode: "packaged",
      includeSnapshots: true
    })
  }
}
```

## 📊 Test Execution Flow

### 1. Preparation Phase
```bash
# Build the application
pnpm clean && pnpm build

# Ensure external services are running (if needed)
# Example: Start Ollama service
```

### 2. Test Execution
```javascript
// Launch the application
const sessionId = app_launch_circuit-electron({...})

// Get initial state
snapshot_circuit-electron({ sessionId })

// Execute test steps
// ...

// Close the application
close_circuit-electron({ sessionId })
```

### 3. Result Verification
- Focus on UI state changes.
- Verify the activation state of functional buttons.
- Check the effect of data persistence.

## 🎯 Electron-Specific Advantages

### 1. Real Application Environment
- Test the actual desktop application experience.
- Verify file system operations.
- Test system integration features.

### 2. Persistence Testing
- Configuration is retained after application restart.
- Verification of data persistence.
- Real user workflows.

### 3. Complete Functional Testing
- End-to-end user experience.
- Real performance behavior.
- System-level integration testing.

## 📝 Test Scenario Template

### Basic Functionality Test
```javascript
// 1. Launch the application
// 2. Check the initial state
// 3. Perform a functional operation
// 4. Verify the result
// 5. Check for persistence
```

### AI Functionality Test
```javascript
// 1. Configure the model
// 2. Input test data
// 3. Execute the AI operation
// 4. Wait for the AI response
// 5. Verify the quality of the result
```

## 🏆 Success Criteria

### Technical Indicators
- All test scenarios pass.
- No crashes or exceptions.
- Reasonable response times.

### User Experience
- Smooth operational flow.
- Proper error handling.
- Secure and reliable data.

---

**Last Updated:** 2025-01-09
**Scope:** AI-driven automated testing for Electron desktop applications.
