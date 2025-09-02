# Normal Flow Test for Prompt Optimization

## 📖 Test Overview
This test verifies the basic workflow of the prompt optimization feature, ensuring that users can perform prompt optimization operations correctly.

## 🎯 Test Objectives
- Validate the prompt input and optimization process.
- Confirm the functionality of template and model selection.
- Verify the display and iteration features of optimization results.
- Check the version management and switching functionality.

## 📋 Preconditions
- [ ] The application is launched and fully loaded.
- [ ] At least one AI model (OpenAI/Claude/Gemini, etc.) is configured.
- [ ] An available optimization template exists.
- [ ] The network connection is stable.

---

## 🔧 Test Steps

### Step 1: Input the Original Prompt

**AI Execution Guidance:**
- Use `browser_snapshot` to capture the current state of the page.
- Find the text box labeled "Enter Prompt," "Original Prompt," or similar.
- Use `browser_type` to enter the test prompt content.

**Test Data:**
```
Normal Test: Please help me write an article about the history of artificial intelligence development.
```

**Expected Results:**
- The text box displays the entered prompt content.
- A character count may be displayed below the input box.
- The optimization button becomes clickable.

**Verification Points:**
- [ ] The prompt has been successfully entered into the text box.
- [ ] The text box displays the full content.
- [ ] Optimization-related buttons are available.
- [ ] No input error messages are displayed.

---

### Step 2: Select Optimization Mode and Template

**AI Execution Guidance:**
- Use `browser_snapshot` to view the status of the selectors on the current page.
- Find the optimization mode selector (usually radio buttons or a dropdown).
- Use `browser_click` to select the optimization mode.
- Find the template selection dropdown and choose a suitable template.

**Test Data:**
```
Optimization Mode: System Prompt Optimization
Template Selection: General Optimization
```

**Expected Results:**
- The optimization mode is selected (shows a selected state).
- The template selection box displays the name of the chosen template.
- The template description area shows the corresponding template explanation.

**Verification Points:**
- [ ] The optimization mode is selected correctly.
- [ ] The template is selected successfully.
- [ ] The template description is displayed correctly.
- [ ] The selector status updates normally.

---

### Step 3: Select the Optimization Model

**AI Execution Guidance:**
- Find the model selection dropdown (usually in the top-right area of the page).
- Use `browser_click` to open the model selection dropdown.
- Select an available model (one with a normal status).
- Confirm that the model selection was successful.

**Expected Results:**
- The model selection box displays the name of the chosen model.
- The model status indicator shows as available.
- The optimization button is fully activated.

**Verification Points:**
- [ ] The model is selected successfully.
- [ ] The model status displays normally.
- [ ] The optimization button is clickable.
- [ ] No model configuration error messages are displayed.

---

### Step 4: Execute Prompt Optimization

**AI Execution Guidance:**
- Find and click the main action button, such as "Optimize Prompt," "Start Optimization," or similar.
- Use `browser_wait_for` to wait for the optimization process to begin (button changes to a loading state).
- Wait for the optimization to complete (loading state disappears, results are displayed).
- Use `browser_snapshot` to check the optimization results.

**Expected Results:**
- The optimization button displays a loading state (e.g., a spinning icon).
- The right-side panel begins to display the optimized prompt.
- The reasoning process is shown step-by-step (if enabled).
- The button returns to its normal state after optimization is complete.

**Verification Points:**
- [ ] The optimization process starts successfully.
- [ ] The optimized prompt is displayed on the right side.
- [ ] The content of the reasoning process is reasonable.
- [ ] The optimization process completes normally.
- [ ] No error messages are displayed.

---

### Step 5: View and Evaluate the Optimization Results

**AI Execution Guidance:**
- Use `browser_snapshot` to get the full content of the optimization results panel.
- Check if the optimized prompt is displayed completely.
- Verify that the reasoning process exists and its content is reasonable.
- Confirm that the various function buttons on the results panel are available.

**Expected Results:**
- The optimized prompt is fully displayed in the right-side panel.
- The reasoning process details the reasons for optimization and improvements.
- Action buttons like Copy, Edit, Fullscreen, etc., are visible.
- Version information is displayed correctly.

**Verification Points:**
- [ ] The optimized prompt is displayed completely.
- [ ] The reasoning process content is detailed and reasonable.
- [ ] Action buttons (Copy, Edit, etc.) are available.
- [ ] Version information is displayed correctly.
- [ ] The content format is displayed normally.

---

### Step 6: Perform Iterative Optimization

**AI Execution Guidance:**
- Find the iterative input box (usually below the optimization results).
- Use `browser_type` to enter iterative improvement requirements.
- Select an iterative template (if there is a selector).
- Click the iterative optimization button.

**Test Data:**
```
Iteration Requirement: Please add more specific technical details about the development of deep learning and neural networks, and include a timeline structure.
```

**Expected Results:**
- The iterative input box displays the improvement requirements.
- A new optimization process begins.
- A new version of the optimization results is generated.
- A new version is added to the version history.

**Verification Points:**
- [ ] The iteration requirement is entered successfully.
- [ ] The iterative optimization process starts normally.
- [ ] A new optimization version is generated.
- [ ] The version switching function works correctly.
- [ ] The quality of the iterative results has improved.

---

### Step 7: Test Version Switching

**AI Execution Guidance:**
- Find the version switching buttons (V1, V2, etc.).
- Use `browser_click` to switch between different versions.
- Verify that the content switches correctly.
- Test the copy functionality.

**Expected Results:**
- Able to switch freely between different versions.
- The content of each version is displayed correctly.
- The copy function works normally.

**Verification Points:**
- [ ] The version switching function works correctly.
- [ ] The version content is displayed correctly.
- [ ] The copy function works correctly.
- [ ] The interface status updates correctly.

---

### Step 8: Test Result Display Functions ⭐ New

**AI Execution Guidance:**
- After the optimization is complete, continue testing the result display-related functions.
- Verify the user experience with various operations after obtaining the optimization results.

#### 8.1 View Switching Function Test

**AI Execution Guidance:**
- Use `browser_click` to click the "Source" button.
- Use `browser_snapshot` to verify that the content changes to Markdown source format.
- Use `browser_click` to click the "Render" button.
- Use `browser_snapshot` to verify that the content changes to HTML rendered format.

**Expected Results:**
- Rendered View: Displays formatted HTML (headings, paragraphs, lists, etc.).
- Source View: Displays the raw Markdown text (**markup**, *lists*, etc.).
- Button states update correctly (the current view's button is disabled).

**Verification Points:**
- [ ] View switching responds normally.
- [ ] Content format is converted correctly.
- [ ] Button states update correctly.
- [ ] Content integrity is maintained.

#### 8.2 Copy Function Test

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

#### 8.3 Fullscreen View Function Test

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

#### 8.4 Smart Compare Function Test

**AI Execution Guidance:**
- Use `browser_click` to click the "Compare" button.
- Use `browser_snapshot` to observe the comparison display effect.

**Expected Results:**
- Intelligently identifies differences between the original prompt and the optimized result.
- Displays different sections (original, common, optimized extension).
- The "Compare" button's state updates to disabled.

**Verification Points:**
- [ ] Compare mode is activated correctly.
- [ ] Text differences are identified correctly.
- [ ] Sectional display is clear.
- [ ] Button state updates correctly.

#### 8.5 Expand Edit Function Test

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

## ⚠️ Common Issues to Check

### Network-Related Issues
- Interruption or timeout during optimization.
- API call failure.
- Model connection anomaly.

### Interface Interaction Issues
- Button is unresponsive.
- Content displays abnormally.
- Version switching fails.

### Data Processing Issues
- Input validation fails.
- Incorrect result format.
- Version management anomaly.

---

## 🤖 AI-Powered Verification Execution Template

```javascript
// 1. Open the application
browser_navigate("http://localhost:18181/")

// 2. Get the initial state
browser_snapshot()

// 3. Input the prompt
browser_type(element="Original Prompt Input Box", ref="e54", text="Please help me write an article about the history of artificial intelligence development.")

// 4. Execute optimization
browser_click(element="Start Optimization Button", ref="e78")

// 5. Wait for completion
browser_wait_for(text="Optimization successful")

// 6. Verify the results
browser_snapshot()

// 7. Test iteration
browser_click(element="Continue Optimization Button", ref="e178")
browser_type(element="Iteration Input Box", ref="e284", text="Please add more technical details")
browser_click(element="Confirm Optimization Button", ref="e287")

// 8. Verify version switching
browser_click(element="V1 Button", ref="e177")
browser_click(element="V2 Button", ref="e288")

// 9. Test the copy function
browser_click(element="Copy Button", ref="e93")
```

**Success Criteria:**
- All steps are executed successfully.
- All verification points are passed.
- The feature works as expected.
- No error messages or exceptions.
