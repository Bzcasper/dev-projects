# Normal Flow Test for Model Management

## 📖 Test Overview
This test verifies the basic workflow of the model management feature, ensuring that users can properly configure and manage AI models.

## 🎯 Test Objectives
- Verify that the model management interface opens correctly.
- Validate the API key configuration functionality.
- Validate the model connection testing functionality.
- Verify that configurations are saved and loaded correctly.

## 📋 Preconditions
- [ ] The application is launched and fully loaded.
- [ ] The user interface is displayed correctly.
- [ ] The network connection is stable.
- [ ] A test API key is prepared (optional).

---

## 🔧 Test Steps

### Step 1: Open the Model Manager

**AI Execution Guidance:**
- Use `browser_snapshot` to capture the current state of the page.
- Find the button containing the "⚙️" icon and the text "Model Management".
- Use `browser_click` to click this button.

**Expected Results:**
- The model management dialog box appears.
- The dialog box title displays "Model Configuration" or similar text.
- The interface shows configuration options for various models.

**Verification Points:**
- [ ] The model management pop-up is displayed.
- [ ] The pop-up title is displayed correctly.
- [ ] Options for models like OpenAI, Claude, and Gemini are visible.
- [ ] The interface layout is clean, and functional areas are clearly defined.

---

### Step 2: Inspect the Model Configuration Interface

**AI Execution Guidance:**
- Use `browser_snapshot` to view the content of the current pop-up.
- Examine the configuration areas for each model.
- Check the API key input fields and other configuration options.
- Verify the availability of buttons and controls.

**Expected Results:**
- Each model has its own dedicated configuration area.
- The API key input field is clearly visible.
- The model selection dropdown is available.
- The "Test Connection" button is visible.

**Verification Points:**
- [ ] The model configuration areas are well-organized.
- [ ] The API key input field is visible.
- [ ] The model selection options are available.
- [ ] The "Test Connection" button is visible.

---

### Step 3: Configure the OpenAI Model (Simulated)

**AI Execution Guidance:**
- Locate the configuration area labeled "OpenAI".
- Find the API key input field.
- Use `browser_type` to enter a test key (if allowed).
- Find the model selection dropdown and check the available options.

**Test Data:**
```
API Key: test_api_key_for_testing
Model Selection: GPT-4 or GPT-3.5-turbo
```

**Expected Results:**
- The API key input field accepts input.
- The model selection dropdown displays available options.
- The configuration interface responds normally.

**Verification Points:**
- [ ] The API key input function works correctly.
- [ ] The model selection function is available.
- [ ] The configuration interface responds as expected.
- [ ] No format error messages are displayed.

---

### Step 4: Test the Connection Functionality (Simulated)

**AI Execution Guidance:**
- Look for buttons like "Test Connection", "Validate", or "Test".
- Use `browser_click` to click the test button.
- Use `browser_wait_for` to wait for the test to complete.
- Check the display status of the test result.

**Expected Results:**
- The test button responds to the click.
- A status indicator (e.g., a loading icon) shows that the test is in progress.
- The result (success or failure) is displayed after the test is complete.
- The result message is clear and unambiguous.

**Verification Points:**
- [ ] The test button functions correctly.
- [ ] The testing process status is clearly indicated.
- [ ] The test result is displayed clearly.
- [ ] Error messages are helpful (if the test fails).

---

### Step 5: Save the Configuration

**AI Execution Guidance:**
- Review all configuration information.
- Look for buttons like "Save", "Confirm", or "Apply".
- Use `browser_click` to click the save button.
- Wait for confirmation that the save operation is complete.

**Expected Results:**
- The save button responds correctly.
- A success message is displayed.
- The pop-up window updates its state or closes.
- The configuration information is saved.

**Verification Points:**
- [ ] The save button functions correctly.
- [ ] A success message is displayed.
- [ ] The pop-up status updates correctly.
- [ ] The configuration is saved successfully.

---

### Step 6: Verify the Configuration is Active

**AI Execution Guidance:**
- Close the model management pop-up (if it is still open).
- Use `browser_snapshot` to check the state of the main interface.
- Find the model selection dropdown.
- Verify that the newly configured model appears in the options.

**Expected Results:**
- The main interface's model selector includes the configured model.
- The model name is displayed correctly.
- The status indicator shows as "available".
- The model can be selected and switched normally.

**Verification Points:**
- [ ] The configured model appears in the selector.
- [ ] The model name is displayed correctly.
- [ ] The status indicator displays normally.
- [ ] The model selection function works correctly.

---

### Step 7: Reopen to Verify Persistence

**AI Execution Guidance:**
- Reopen the model management interface.
- Check if the previous configuration is retained.
- Verify that the API key and model selection are saved.
- Test the integrity of the configuration.

**Expected Results:**
- The previous configuration is loaded correctly.
- The API key status is displayed correctly.
- The model selection remains unchanged.
- All settings are persistently saved.

**Verification Points:**
- [ ] The configuration is loaded correctly.
- [ ] The API key status is correct.
- [ ] The model selection is retained.
- [ ] The settings are saved persistently.

---

## ⚠️ Common Issues to Check

### Interface Display Issues
- The pop-up fails to open.
- The configuration area displays abnormally.
- Incorrect button states.
- Layout is distorted.

### Configuration Functionality Issues
- The API key cannot be entered.
- Model selection is unavailable.
- The connection test fails.
- The save function is not working.

### Data Persistence Issues
- The configuration cannot be saved.
- The configuration is lost after a refresh.
- Settings fail to load.
- Local storage anomalies.

---

## 🤖 AI-Powered Verification Execution Template

```javascript
// 1. Open the application
browser_navigate("http://localhost:18181/")

// 2. Get the initial state
browser_snapshot()

// 3. Open model management
browser_click(element="Model Management Button", ref="model_management_button")
browser_snapshot()

// 4. Check the configuration interface
browser_snapshot()

// 5. Configure the OpenAI model (if allowed)
browser_type(element="API Key Input", ref="api_key_input", text="test_api_key")
browser_snapshot()

// 6. Test the connection (if possible)
browser_click(element="Test Connection Button", ref="test_connection_button")
browser_wait_for(time=5)
browser_snapshot()

// 7. Save the configuration
browser_click(element="Save Button", ref="save_button")
browser_snapshot()

// 8. Close the pop-up
browser_press_key("Escape")

// 9. Verify the configuration is active
browser_snapshot()

// 10. Reopen to verify persistence
browser_click(element="Model Management Button", ref="model_management_button")
browser_snapshot()
```

**Success Criteria:**
- The model management interface opens and closes correctly.
- Configuration functions work as expected.
- The connection test function responds normally.
- Configurations can be saved and loaded correctly.
- The main interface accurately reflects configuration changes.
- No error messages or abnormal states are observed.
