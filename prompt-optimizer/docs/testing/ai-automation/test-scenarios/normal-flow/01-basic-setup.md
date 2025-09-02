# Basic Setup Normal Flow Test

## 📖 Test Overview
This test verifies the normal operation of the application's basic setup functions, including theme switching, language switching, and UI layout adjustments.

## 🎯 Test Objectives
- Verify that the theme switching function works correctly.
- Verify that the language switching function works correctly.
- Verify the saving and loading of settings.
- Verify the basic functionality of the responsive layout.

## 📋 Prerequisites
- [ ] The application has been launched and is fully loaded.
- [ ] The user interface is displayed correctly.
- [ ] The browser supports local storage functionality.

---

## 🔧 Test Steps

### Step 1: Switch Theme Mode

**AI Execution Guide:**
- Use `browser_snapshot` to get the current state of the page.
- Find the theme switch button (may be displayed as "Light Mode", "Dark Mode", or a corresponding icon).
- Use `browser_click` to click the theme switch button.
- Use `browser_snapshot` again to check for theme changes.

**Expected Results:**
- The interface theme switches immediately after clicking.
- The background color, text color, button styles, etc., change accordingly.
- The button icon or text updates to the opposite of the current mode.

**Verification Points:**
- [ ] The theme switch button is visible and clickable.
- [ ] The interface theme changes immediately after clicking.
- [ ] The button state updates correctly.
- [ ] All UI elements have a consistent theme.

---

### Step 2: Switch Interface Language

**AI Execution Guide:**
- Find the language switch button (may be displayed as "Switch to English", "切换到中文", or a language icon).
- Use `browser_click` to click the language switch button.
- Use `browser_snapshot` to check for language changes.
- Verify that the language of the main UI elements has been switched.

**Expected Results:**
- The interface language switches immediately after clicking.
- All visible text is updated to the target language.
- The button text updates to prompt switching to the other language.

**Verification Points:**
- [ ] The language switch button is visible and clickable.
- [ ] The interface language changes immediately after clicking.
- [ ] Main text elements are translated correctly.
- [ ] Button and prompt texts are updated correctly.

---

### Step 3: Test Settings Persistence

**AI Execution Guide:**
- First, perform theme and language switching operations.
- Use `browser_navigate` to refresh the current page.
- Use `browser_snapshot` to check if the settings are preserved.
- Verify that the theme and language states are the same as before the refresh.

**Expected Results:**
- The theme setting remains unchanged after refreshing.
- The language setting remains unchanged after refreshing.
- All user preference settings are loaded correctly.

**Verification Points:**
- [ ] The theme setting is preserved after a refresh.
- [ ] The language setting is preserved after a refresh.
- [ ] Settings load at a normal speed.
- [ ] No settings are lost or reset.

---

### Step 4: Verify Responsive Layout

**AI Execution Guide:**
- Use `browser_resize` to adjust the browser window size.
- Use `browser_snapshot` to check the layout at different sizes.
- Test the accessibility of the main function buttons.
- Verify the adaptive effect of the content area.

**Test Sizes:**
```javascript
// Mobile size
browser_resize(375, 667);
browser_snapshot();

// Tablet size
browser_resize(768, 1024);
browser_snapshot();

// Desktop size
browser_resize(1920, 1080);
browser_snapshot();
```

**Expected Results:**
- The interface adapts to different window sizes.
- Important function buttons are always visible and usable.
- Text and content areas are adjusted reasonably.

**Verification Points:**
- [ ] The UI layout adapts normally.
- [ ] Function buttons are always accessible.
- [ ] Content is displayed completely without overflow.
- [ ] The user experience is good at different sizes.

---

### Step 5: Test UI Interaction Feedback

**AI Execution Guide:**
- Use `browser_hover` to hover over the main buttons.
- Use `browser_snapshot` to check the hover effect.
- Use `browser_click` to click various buttons.
- Observe the click feedback and state changes.

**Expected Results:**
- Buttons show appropriate visual feedback on hover.
- There is clear feedback upon clicking.
- Button state changes are clearly visible.

**Verification Points:**
- [ ] The hover effect displays normally.
- [ ] Click feedback is timely and clear.
- [ ] Button state changes are correct.
- [ ] The interaction experience is smooth and natural.

---

## ⚠️ Common Issue Checklist

### Theme Switching Issues
- Theme switching does not take effect.
- Some elements have inconsistent themes.
- Abnormal switching animation.

### Language Switching Issues
- Incomplete language switching.
- Some text is not translated.
- Abnormal layout after switching.

### Settings Saving Issues
- Settings are not saved.
- Settings are lost after a refresh.
- Local storage anomalies.

### Responsive Issues
- The layout is abnormal on small screens.
- Elements overlap or are hidden.
- Abnormal scrolling behavior.

---

## 🤖 AI Verification Execution Template

```javascript
// 1. Open the application
browser_navigate("http://localhost:18181/")

// 2. Get the initial state
browser_snapshot()

// 3. Test theme switching
browser_click(element="Theme Switch Button", ref="theme_toggle")
browser_snapshot()

// 4. Test language switching
browser_click(element="Language Switch Button", ref="language_toggle")
browser_snapshot()

// 5. Test settings persistence
browser_navigate("http://localhost:18181/") // Refresh the page
browser_snapshot()

// 6. Test responsive layout
browser_resize(375, 667) // Mobile size
browser_snapshot()
browser_resize(1920, 1080) // Desktop size
browser_snapshot()

// 7. Test interaction feedback
browser_hover(element="Main Button", ref="main_button")
browser_snapshot()
```

**Success Criteria:**
- All basic setup functions work correctly.
- Settings can be saved and loaded correctly.
- The responsive layout adapts to different screens.
- Interaction feedback is timely and accurate.
- No error messages or abnormal states.
