# Normal Flow Test for Data Management

## 📖 Test Overview
This test verifies the basic workflow of the data management feature, ensuring that users can properly import, export, back up, and restore application data.

## 🎯 Test Objectives
- Verify that the data management interface opens correctly.
- Validate the data export functionality.
- Validate the data import functionality.

## 📋 Preconditions
- [ ] The application is launched and fully loaded.
- [ ] The user interface is displayed correctly.
- [ ] The browser supports file downloads and uploads.
- [ ] Some data (templates, history, etc.) already exists.

---

## 🔧 Test Steps

### Step 1: Prepare Test Data

**AI Execution Guidance:**
- If there is not enough test data, create some first.
- Perform a few prompt optimizations to create history records.
- Ensure that there are templates and configuration data.
- Prepare for import/export testing.

**Test Data Preparation:**
```
1. Create 2-3 optimization history records.
2. Ensure there is model configuration data.
3. Ensure there is template data.
4. Verify the integrity of the data.
```

**Expected Results:**
- The application has sufficient test data.
- The data types are diverse.
- The data status is normal.

**Verification Points:**
- [ ] History record data exists.
- [ ] Model configuration data exists.
- [ ] Template data exists.
- [ ] The data status is normal.

---

### Step 2: Open the Data Manager

**AI Execution Guidance:**
- Use `browser_snapshot` to capture the current state of the page.
- Find the button containing the "💾" icon and the text "Data Management".
- Use `browser_click` to click this button.

**Expected Results:**
- The data management dialog box appears.
- The dialog box title displays "Data Management" or similar text.
- The interface shows options for import, export, backup, etc.

**Verification Points:**
- [ ] The data management pop-up is displayed.
- [ ] The pop-up title is displayed correctly.
- [ ] Buttons for import, export, etc., are visible.
- [ ] The interface layout is clean, and functional areas are clearly defined.

---

### Step 3: Inspect the Data Management Interface

**AI Execution Guidance:**
- Use `browser_snapshot` to view the content of the data management interface.
- Check the various function buttons and options.
- View data statistics (if available).
- Check the interface layout and usability.

**Expected Results:**
- The data management interface layout is clean.
- Function buttons are clearly visible.
- Data statistics are accurate (if available).
- All function options are available.

**Verification Points:**
- [ ] The interface layout is clean and logical.
- [ ] Function buttons are clearly visible.
- [ ] Data statistics are accurate (if available).
- [ ] Function options are available.

---

### Step 4: Export Application Data

**AI Execution Guidance:**
- Look for buttons like "Export," "Backup," or "Download."
- Use `browser_click` to click the export button.
- Handle any selection dialogs that may appear.
- Wait for the export process to complete.

**Expected Results:**
- Export options are displayed, or the export starts directly.
- The browser begins downloading the export file.
- The filename includes a timestamp or version information.
- A success message for the export is displayed.

**Verification Points:**
- [ ] The export process starts successfully.
- [ ] The file download begins normally.
- [ ] The filename format is correct.
- [ ] A success message for the export is displayed.

---

### Step 5: Verify the Exported File

**AI Execution Guidance:**
- Check the browser's download status.
- Verify that the file was downloaded successfully.
- If possible, check the basic properties of the file.
- Confirm the completeness of the export operation.

**Expected Results:**
- The file is successfully downloaded to the local machine.
- The file size is reasonable (not empty).
- The file format is correct (usually JSON).
- The file contains application data.

**Verification Points:**
- [ ] The file is downloaded successfully.
- [ ] The file size is reasonable.
- [ ] The file format is correct.
- [ ] The file content is complete.

---

### Step 6: Test the Data Import Interface

**AI Execution Guidance:**
- Look for buttons like "Import," "Restore," or "Upload."
- Use `browser_click` to click the import button.
- Check if the file selection dialog appears.
- Verify the usability of the import interface.

**Expected Results:**
- The file selection dialog opens.
- The import interface responds normally.
- The file selection function is available.
- The interface messages are clear.

**Verification Points:**
- [ ] The file selection dialog opens normally.
- [ ] The import interface responds normally.
- [ ] The file selection function is available.
- [ ] The interface messages are clear.

---

### Step 7: Verify the Integrity of Data Management Functions

**AI Execution Guidance:**
- Test the response of each function button.
- Check the interaction between functions.
- Verify the error handling mechanism.
- Test the stability of the interface.

**Expected Results:**
- All function buttons respond normally.
- The interaction between functions is good.
- The error handling mechanism is robust.
- The interface is stable and reliable.

**Verification Points:**
- [ ] All function buttons are normal.
- [ ] The interaction between functions is good.
- [ ] Error handling is robust.
- [ ] The interface is stable and reliable.

---

### Step 8: Close the Data Management Interface

**AI Execution Guidance:**
- Look for a close button (usually an X icon).
- Use `browser_click` to click the close button.
- Or click outside the interface area to close it.
- Verify that the interface has been closed.

**Expected Results:**
- The data management interface is closed.
- Returns to the main interface.
- The main interface functions are normally available.

**Verification Points:**
- [ ] The data management interface is closed successfully.
- [ ] Returns to the main interface.
- [ ] The main interface state is normal.
- [ ] Other functions are not affected.

---

## ⚠️ Common Issues to Check

### Interface Display Issues
- The data management interface fails to open.
- Function buttons display abnormally.
- The interface layout is distorted.
- Unclear messages.

### Export Function Issues
- The export operation fails.
- File download is abnormal.
- The exported file is empty.
- Incorrect file format.

### Import Function Issues
- File selection is abnormal.
- The import operation fails.
- The file format is not supported.
- Data is abnormal after import.

---

## 🤖 AI-Powered Verification Execution Template

```javascript
// 1. Open the application
browser_navigate("http://localhost:18181/")

// 2. Prepare test data (if needed)
browser_type(element="Original Prompt Input Box", ref="e54", text="Data management test")
browser_click(element="Start Optimization Button", ref="e78")
browser_wait_for(time=10)

// 3. Open data management
browser_click(element="Data Management Button", ref="data_management_button")
browser_snapshot()

// 4. Inspect the data management interface
browser_snapshot()

// 5. Test the export function
browser_click(element="Export Button", ref="export_button")
browser_wait_for(time=5)
browser_snapshot()

// 6. Test the import interface
browser_click(element="Import Button", ref="import_button")
browser_snapshot()
browser_press_key("Escape") // Close the file selection dialog

// 7. Close the data management interface
browser_press_key("Escape")
browser_snapshot()
```

**Success Criteria:**
- The data management interface opens and closes normally.
- The export function can be started normally.
- The import interface can be opened normally.
- All function buttons respond normally.
- The interface interaction is smooth and stable.
- No error messages or abnormal states are observed.

**Notes:**
- The export test mainly verifies that the function starts; the actual file download may need to be verified manually.
- The import test mainly verifies that the interface opens; a test file needs to be prepared for the actual file upload.
- The data clearing function is tested in history management, not in the data management interface.
