# Normal Flow Test for User Prompt Optimization

## 📖 Test Overview
This test verifies the basic workflow of the user prompt optimization feature, ensuring that users can correctly perform optimization operations on user prompts. User prompt optimization differs from system prompt optimization as it primarily focuses on refining user instructions to make them more specific and actionable.

## 🎯 Test Objectives
- Validate the optimization mode switching functionality (System Prompt ↔ User Prompt).
- Confirm the user prompt input and optimization process.
- Verify the quality and characteristics of the user prompt optimization results.
- Check the automatic template adaptation feature.
- Validate the version management and iteration functionality.

## 📋 Preconditions
- [ ] The application is launched and fully loaded.
- [ ] At least one AI model (OpenAI/Claude/Gemini, etc.) is configured.
- [ ] An available user prompt optimization template exists.
- [ ] The network connection is stable.

---

## 🔧 Test Steps

### Step 1: Switch to User Prompt Optimization Mode

**AI Execution Guidance:**
- Use `browser_snapshot` to capture the current state of the page.
- Find the optimization mode switch buttons: "System Prompt Optimization" and "User Prompt Optimization".
- Use `browser_click` to click the "User Prompt Optimization" button.

**Expected Results:**
- The "User Prompt Optimization" button changes to a selected state (pressed).
- The "System Prompt Optimization" button changes to an unselected state.
- The interface title changes from "Original Prompt" to "User Prompt".
- The input box placeholder text updates to content related to user prompts.
- The optimization template may automatically switch to one suitable for user prompts.

**Verification Points:**
- [ ] The mode switch button states are correct.
- [ ] The interface title and placeholder text are updated correctly.
- [ ] The optimization template adapts automatically (e.g., switches to "Professional Optimization").
- [ ] The test area title updates to "User Prompt Test".

---

### Step 2: Input the User Prompt

**AI Execution Guidance:**
- Use `browser_type` to enter test content into the user prompt input box.
- Observe the changes in the interface state.

**Test Data:**
```
Typical User Prompt: Help me write a work summary.
Short Instruction: Translate this text.
Task Request: Create a learning plan.
```

**Expected Results:**
- The text box displays the entered user prompt.
- The "Optimize →" button becomes clickable.
- A "Compare" button may appear.

**Verification Points:**
- [ ] The user prompt has been successfully entered.
- [ ] The input content is displayed completely.
- [ ] The optimization button becomes available.
- [ ] No input error messages are displayed.

---

### Step 3: Execute User Prompt Optimization

**AI Execution Guidance:**
- Use `browser_click` to click the "Optimize →" button.
- Wait for the optimization process to complete (may take a few seconds).
- Use `browser_wait_for` to wait for the optimization results to be displayed.

**Expected Results:**
- The optimization button displays a "Loading..." state.
- A success message is displayed upon completion.
- The right-side area displays the optimized user prompt.
- Version management buttons (V1) appear.
- A "Continue Optimize" button appears.

**Verification Points:**
- [ ] The optimization process starts normally.
- [ ] The optimization completes successfully with no error messages.
- [ ] The optimization results are displayed correctly.
- [ ] The version management function is available.

---

### Step 4: Verify the User Prompt Optimization Effect

**AI Execution Guidance:**
- Use `browser_snapshot` to view the content of the optimization results.
- Compare the original user prompt with the optimized result.

**Expected Results:**
- The optimized prompt is more specific and detailed than the original.
- It includes clear requirements and guidance.
- It is more structured.
- It is more actionable.

**Verification Points:**
- [ ] The optimization effect is significant (from a simple instruction to detailed requirements).
- [ ] The optimized content is clearly structured.
- [ ] It includes specific execution guidance.
- [ ] The content quality is characteristic of user prompt optimization.

**Example Comparison:**
```
Original: Help me write a work summary.
Optimized: Should include a detailed list of requirements, such as:
- Summary period
- Job responsibilities
- Main work content
- Work achievements
- Highlights and innovations
- Shortcomings
- Lessons learned
- Future outlook
- Format requirements
- Submission deadline
```

---

### Step 5: Test Mode Switch Persistence

**AI Execution Guidance:**
- Use `browser_click` to switch back to "System Prompt Optimization" mode.
- Switch back again to "User Prompt Optimization" mode.
- Observe if the content is retained.

**Expected Results:**
- Mode switching is smooth with no delay.
- The entered content and optimization results are not lost.
- Interface elements update correctly.
- The template adapts automatically.

**Verification Points:**
- [ ] The mode switching function works correctly.
- [ ] Content is not lost due to switching.
- [ ] The interface state updates correctly.
- [ ] The template switches automatically and correctly.

---

### Step 6: Test Iterative Optimization Functionality

**AI Execution Guidance:**
- Use `browser_click` to click the "Continue Optimize" button.
- Enter the optimization direction in the iterative optimization interface.
- Execute the iterative optimization.

**Test Data:**
```
Iteration Requirement: Please add more requirements regarding time management and specific formatting.
```

**Expected Results:**
- The iterative optimization interface opens correctly.
- The optimization direction can be entered.
- The iterative optimization executes successfully.
- A V2 version is generated.
- The version switching function works correctly.

**Verification Points:**
- [ ] The iterative optimization interface opens correctly.
- [ ] The optimization direction is entered successfully.
- [ ] The iterative optimization executes successfully.
- [ ] The V2 version is generated correctly.
- [ ] The version switching function works correctly.

---

### Step 7: Test Result Display Functions ⭐ New

**AI Execution Guidance:**
- After user prompt optimization is complete, continue testing the result display-related functions.
- Verify the user experience with various operations after obtaining the optimization results.

#### 7.1 View Switching Function Test

**AI Execution Guidance:**
- Use `browser_click` to click the "Source" button.
- Use `browser_snapshot` to verify that the content changes to Markdown source format.
- Use `browser_click` to click the "Render" button.
- Use `browser_snapshot` to verify that the content changes to HTML rendered format.

**Expected Results:**
- Rendered View: Displays the formatted user prompt optimization result.
- Source View: Displays the raw Markdown text format.
- Button states update correctly (the current view's button is disabled).

**Verification Points:**
- [ ] View switching responds normally.
- [ ] Content format is converted correctly.
- [ ] Button states update correctly.
- [ ] Content integrity is maintained.

#### 7.2 Copy Function Test

**AI Execution Guidance:**
- Use `browser_click` to click the "Copy" button.
- Observe if a success message appears.

**Expected Results:**
- A "Copied to clipboard" message appears.
- The message disappears automatically or can be manually closed.

**Verification Points:**
- [ ] The copy button responds normally.
- [ ] The success message is displayed correctly.
- [ ] User feedback is timely and clear.

#### 7.3 Fullscreen View Function Test

**AI Execution Guidance:**
- Use `browser_click` to click the "Fullscreen" button.
- Use `browser_snapshot` to verify the fullscreen interface.
- Test view switching in fullscreen mode.
- Use `browser_click` to close the fullscreen view.

**Expected Results:**
- A separate fullscreen content viewer opens.
- Fullscreen mode has complete functional controls.
- Can be closed normally to return to the original interface.

**Verification Points:**
- [ ] The fullscreen interface opens correctly.
- [ ] Fullscreen mode functionality is complete.
- [ ] View controls work normally.
- [ ] The close function works normally.

#### 7.4 Smart Compare Function Test

**AI Execution Guidance:**
- Use `browser_click` to click the "Compare" button.
- Use `browser_snapshot` to observe the comparison display effect.

**Expected Results:**
- Intelligently identifies differences between the original user prompt and the optimized result.
- Displays different sections (original, common, optimized extension).
- The "Compare" button's state updates to disabled.

**Verification Points:**
- [ ] Compare mode is activated correctly.
- [ ] Text differences are identified correctly.
- [ ] Sectional display is clear.
- [ ] Button state updates correctly.

#### 7.5 Expand Edit Function Test

**AI Execution Guidance:**
- Use `browser_click` to click the "Expand" button.
- Use `browser_snapshot` to verify the fullscreen editing interface.
- Test the input functionality.
- Use `browser_click` to close the editing interface.

**Expected Results:**
- Fullscreen editing mode opens.
- There is a separate editing window and a close button.
- The input function works normally.

**Verification Points:**
- [ ] The fullscreen editing interface opens correctly.
- [ ] The input function is normal.
- [ ] The close function is normal.
- [ ] Content remains consistent.

---

## 🎯 Test Focus

### Core Functionality Verification
1.  **Mode Switching Functionality**: System Prompt Optimization ↔ User Prompt Optimization
2.  **Automatic Template Adaptation**: Different modes automatically select appropriate optimization templates.
3.  **Difference in Optimization Effects**: User prompt optimization should produce instruction optimization results, not content generation.

### User Experience Verification
1.  **Interface Consistency**: The operational flow for both modes should be consistent.
2.  **Content Persistence**: Switching modes should not result in the loss of existing work.
3.  **Timely Feedback**: The optimization process should provide clear status feedback.

### Quality Verification
1.  **Optimization Quality**: User prompt optimization should make instructions more specific and actionable.
2.  **Version Management**: Supports multi-version management and switching.
3.  **Iteration Functionality**: Supports feedback-based iterative optimization.

---

## 📊 Success Criteria

### Grade A Criteria (Must Pass)
- [ ] Mode switching functionality is 100% normal.
- [ ] User prompt optimization functionality is 100% normal.
- [ ] The quality of optimization results meets expectations.
- [ ] Version management functionality is 100% normal.

### Grade B Criteria (Should Pass)
- [ ] Automatic template adaptation function is normal.
- [ ] Iterative optimization function is normal.
- [ ] Interface interaction is smooth.
- [ ] Content persistence function is normal.

### Grade C Criteria (Acceptable Issues)
- [ ] Slightly slow optimization speed (completion within 10 seconds is acceptable).
- [ ] Minor delays in interface element updates.
- [ ] Minor issues with non-critical functions.

---

## 🐛 Common Issue Troubleshooting

### Mode Switching Issues
- Check if button states update correctly.
- Confirm if interface elements switch correctly.
- Verify if the template adapts automatically.

### Optimization Function Issues
- Confirm if the model configuration is correct.
- Check if the network connection is normal.
- Verify if the input content meets requirements.

### Result Display Issues
- Check if the optimization results are displayed completely.
- Confirm if the version management function is normal.
- Verify if the content format is correct.

---

## 📝 Test Record Template

```
Test Execution Time: ____
Test Executor: ____
Test Environment: ____

Step 1 - Mode Switching: □ Pass □ Fail
Step 2 - User Prompt Input: □ Pass □ Fail
Step 3 - Optimization Execution: □ Pass □ Fail
Step 4 - Optimization Effect Verification: □ Pass □ Fail
Step 5 - Mode Switch Persistence: □ Pass □ Fail
Step 6 - Iterative Optimization: □ Pass □ Fail

Overall Score: ____/100
Issues Found: ____
Improvement Suggestions: ____
```
