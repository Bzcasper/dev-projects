# Model Addition and Connection Test

## 📖 Test Overview
This test validates the complete process of adding a new model and testing its connection, ensuring that users can successfully add a local or remote AI model and verify its availability.

## 🎯 Test Objectives
- Validate the complete flow of adding a new model.
- Verify the actual effectiveness of the model connection test.
- Validate the integration of a local Ollama model.
- Verify the functionality of fetching the model list.
- Verify the model enable and disable functionality.

## 📋 Preconditions
- [ ] The application is launched and fully loaded.
- [ ] The local Ollama service is running (http://localhost:11434).
- [ ] The `qwen3:0.6b` model is installed in Ollama.
- [ ] The network connection is stable.

---

## 🔧 Test Steps

### Step 1: Open Model Manager and Add a New Model

**AI Execution Guidance:**
- Use `browser_snapshot` to capture the current state of the page.
- Click the "⚙️ Model Manager" button to open model management.
- Click the "Add" button to start adding a new model.

**Expected Results:**
- The model management interface opens correctly.
- The "Add Model" dialog is displayed.
- All input fields are visible and editable.

**Verification Points:**
- [ ] The model management interface opens correctly.
- [ ] The "Add" button functions correctly.
- [ ] The "Add Model" dialog is displayed correctly.

---

### Step 2: Configure the Local Ollama Model

**AI Execution Guidance:**
- In the "Display Name" field, enter: "Local Ollama".
- In the "API URL" field, enter: "http://localhost:11434/v1".
- Click the "Click arrow to fetch model list" button to get available models.
- Select the "qwen3:0.6b" model from the dropdown list.
- No API Key is needed (for a local model).

**Test Data:**
```
Display Name: Local Ollama
API URL: http://localhost:11434/v1
Model Name: your-model-name (select from the list, e.g., qwen2.5:0.5b)
API Key: (leave blank)
```

**Expected Results:**
- All fields accept input correctly.
- The model list is successfully fetched and displays available models.
- The target model appears in the selection list.
- The configuration interface responds normally.

**Verification Points:**
- [ ] "Display Name" input is normal.
- [ ] "API URL" input is normal.
- [ ] The model list fetching function works correctly.
- [ ] The model selection function works correctly.
- [ ] Configuration without an API Key is handled correctly.

---

### Step 3: Save the Model Configuration

**AI Execution Guidance:**
- Check if all configuration information is correct.
- Click the "Save" button to save the configuration.
- Wait for the save operation to complete.
- Confirm that you are returned to the main model management interface.

**Expected Results:**
- The save operation completes successfully.
- The newly added model appears in the model list.
- The model status is displayed as configurable.
- The interface updates correctly.

**Verification Points:**
- [ ] The save operation is successful.
- [ ] The new model appears in the list.
- [ ] The model information is displayed correctly.
- [ ] The interface status updates correctly.

---

### Step 4: Test the Model Connection

**AI Execution Guidance:**
- Find the newly added "Local Ollama" model.
- Click the corresponding "Test Connection" button.
- Wait for the connection test to complete.
- Observe the display of the test result.

**Expected Results:**
- The "Test Connection" button responds normally.
- The status of the connection test in progress is displayed.
- The connection test completes successfully.
- A successful connection result is displayed.

**Verification Points:**
- [ ] The "Test Connection" button functions correctly.
- [ ] The connection test process status is clear.
- [ ] The connection test completes successfully.
- [ ] The success result is clearly displayed.

---

### Step 5: Enable the Model

**AI Execution Guidance:**
- Click the "Enable" button to enable the model.
- Wait for the enable operation to complete.
- Check for changes in the model's status.
- Confirm the model's availability status.

**Expected Results:**
- The enable operation completes successfully.
- The model status updates to "enabled".
- The "Enable" button changes to a "Disable" button.
- The model can be selected on the main interface.

**Verification Points:**
- [ ] The enable operation is successful.
- [ ] The model status updates correctly.
- [ ] The button status changes correctly.
- [ ] The model is selectable on the main interface.

---

### Step 6: Verify Model Availability on the Main Interface

**AI Execution Guidance:**
- Close the model management dialog.
- Check the model selector on the main interface.
- Confirm that the newly added model appears in the options.
- Try to select the model.

**Expected Results:**
- The main interface's model selector includes the new model.
- The model name is displayed correctly.
- The model can be selected successfully.
- The model status is displayed as available.

**Verification Points:**
- [ ] The new model appears in the main interface selector.
- [ ] The model name is displayed correctly.
- [ ] The model selection function works correctly.
- [ ] The model status is displayed correctly.

---

### Step 7: Test the Model's Actual Functionality

**AI Execution Guidance:**
- Select the newly added local model.
- Enter simple test content in the prompt input box.
- Click the optimization button for an actual test.
- Observe if a real AI response can be obtained.

**Test Data:**
```
Test Prompt: "Please write a simple greeting for me."
```

**Expected Results:**
- The model is selected successfully.
- The optimization button becomes available.
- A request can be sent to the local model.
- A real AI response is obtained.

**Verification Points:**
- [ ] The model is selected successfully.
- [ ] The optimization function is available.
- [ ] The request is sent successfully.
- [ ] A real AI response is obtained.

---

## ⚠️ Common Issues to Check

### Ollama Service Issues
- The Ollama service is not started.
- The model is not installed or downloaded.
- Port conflicts or access permission issues.
- API interface is incompatible.

### Model Addition Issues
- Failed to fetch the model list.
- Network connection issues.
- Incorrect API URL format.
- Incorrect model name.

### Connection Test Issues
- Connection timeout.
- Authentication failure.
- Model is unavailable.
- Service response is abnormal.

### Functional Integration Issues
- The model does not appear on the main interface.
- The function is unavailable after selecting the model.
- The optimization request fails.
- Incorrect response format.

---

## 🤖 AI-Powered Verification Execution Template

```javascript
// 1. Open model management
browser_click(element="Model Management Button", ref="model_management_button")
browser_snapshot()

// 2. Add a new model
browser_click(element="Add Button", ref="add_model_button")
browser_snapshot()

// 3. Configure the Ollama model
browser_type(element="Display Name", ref="display_name", text="Local Ollama")
browser_type(element="API URL", ref="api_url", text="http://localhost:11434/v1")
browser_click(element="Fetch Model List Button", ref="fetch_models_button")
browser_wait_for(time=3)
browser_select(element="Model Selection", ref="model_select", value="qwen3:0.6b")
browser_snapshot()

// 4. Save the configuration
browser_click(element="Save Button", ref="save_button")
browser_wait_for(time=2)
browser_snapshot()

// 5. Test the connection
browser_click(element="Test Connection Button", ref="test_connection_button")
browser_wait_for(time=5)
browser_snapshot()

// 6. Enable the model
browser_click(element="Enable Button", ref="enable_button")
browser_wait_for(time=2)
browser_snapshot()

// 7. Verify on the main interface
browser_click(element="Close Button", ref="close_button")
browser_snapshot()

// 8. Test actual functionality
browser_click(element="Model Selector", ref="model_selector")
browser_click(element="Local Ollama", ref="local_ollama_option")
browser_type(element="Prompt Input Box", ref="prompt_input", text="Please write a simple greeting for me.")
browser_click(element="Optimize Button", ref="optimize_button")
browser_wait_for(time=10)
browser_snapshot()
```

**Success Criteria:**
- Can successfully add a local Ollama model.
- The model connection test is genuinely effective.
- The model is correctly displayed and selectable on the main interface.
- A real AI response can be obtained.
- The entire process is free of errors or exceptions.
- The model configuration is saved persistently.

---

## 📝 Important Notes

### Why Real Model Testing is Necessary
1.  **Functionality Verification**: Ensures the application can communicate correctly with a real AI service.
2.  **Integration Testing**: Validates the complete workflow from configuration to usage.
3.  **Performance Testing**: Checks actual response times and stability.
4.  **Error Handling**: Tests the ability to handle various exceptional situations.

### Advantages of Local Ollama
1.  **No API Key Required**: Avoids the security risks of using real API keys.
2.  **Stable and Controllable**: The local service is not affected by network fluctuations.
3.  **Cost-Effective**: Does not consume paid API quotas.
4.  **Privacy Protection**: Test data is not sent to external services.

### Test Data Security
- Use a local model to prevent sensitive data leakage.
- Test prompts should be harmless, generic content.
- Do not use real business data in tests.
