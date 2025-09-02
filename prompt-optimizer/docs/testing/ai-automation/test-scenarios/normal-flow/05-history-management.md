# Normal Flow Test for History Management

## 📖 Test Overview
This test verifies the basic workflow of the history management feature, ensuring that users can properly view, manage, and reuse their prompt optimization history.

## 🎯 Test Objectives
- Verify that the history interface opens correctly.
- Validate the history display and browsing functionality.
- Validate the history reuse functionality.
- Validate the history deletion and management functionality.
- Validate the history clearing functionality.

## 📋 Preconditions
- [ ] The application is launched and fully loaded.
- [ ] The user interface is displayed correctly.
- [ ] Some prompt optimization history records exist (or create some first).

---

## 🔧 Test Steps

### Step 1: Create History Records (if none exist)

**AI Execution Guidance:**
- If no history records exist, create some first.
- Use `browser_type` to enter a test prompt.
- Use `browser_click` to execute the optimization.
- Wait for the optimization to complete to create a history record.

**Test Data:**
```
Test Prompt 1: Please help me write a product introduction.
Test Prompt 2: How to learn programming.
Test Prompt 3: Create a fitness plan.
```

**Expected Results:**
- The optimization operation completes successfully.
- The history record is saved automatically.
- Subsequent history management tests can be performed.

**Verification Points:**
- [ ] The optimization operation is successful.
- [ ] The history record is saved automatically.
- [ ] The record contains complete information.

---

### Step 2: Open the History Manager

**AI Execution Guidance:**
- Use `browser_snapshot` to capture the current state of the page.
- Find the button containing the "📜" icon and the text "History".
- Use `browser_click` to click this button.

**Expected Results:**
- The history sidebar or pop-up opens.
- The history list is displayed.
- The interface includes function buttons for search, filter, clear, etc.

**Verification Points:**
- [ ] The history interface is displayed.
- [ ] The history list is loaded correctly.
- [ ] Function buttons are visible and available.
- [ ] The interface layout is clean and logical.

---

### Step 3: Browse History Records

**AI Execution Guidance:**
- Use `browser_snapshot` to view the content of the history list.
- Scroll the list to view more records (if necessary).
- Click on a history record to view its details.
- Check the display of the detailed information.

**Expected Results:**
- History records are sorted by time (usually newest first).
- Each record displays a timestamp and a prompt summary.
- Clicking a record expands or displays detailed information.
- Detailed information includes the original prompt, optimization results, etc.

**Verification Points:**
- [ ] History records are displayed correctly.
- [ ] The record sorting is logical (by time).
- [ ] The record summary information is accurate.
- [ ] Detailed information is displayed completely.

---

### Step 4: View Record Details

**AI Execution Guidance:**
- Select a history record.
- View the complete detailed information of the record.
- Check the original prompt, optimization results, template used, etc.
- Verify the completeness and accuracy of the information.

**Expected Results:**
- The record details are displayed completely.
- It includes the original prompt and the optimization results.
- It shows the template and model information used.
- The timestamp and other metadata are accurate.

**Verification Points:**
- [ ] The record details are displayed completely.
- [ ] The original prompt is correct.
- [ ] The optimization results are complete.
- [ ] The metadata information is accurate.

---

### Step 5: Reuse a History Record

**AI Execution Guidance:**
- Select a history record you want to reuse.
- Look for buttons like "Reuse," "Apply," or "Load."
- Use `browser_click` to click the reuse button.
- Check if the main interface has loaded the content of the history record.

**Expected Results:**
- The content of the history record is loaded into the main interface.
- The original prompt is filled into the input box.
- The optimization results are displayed in the results area.
- The relevant template and model settings are also applied.

**Verification Points:**
- [ ] The reuse operation is executed successfully.
- [ ] The original prompt is loaded correctly.
- [ ] The optimization results are displayed correctly.
- [ ] The template and model settings are applied correctly.

---

### Step 6: Search History Records (if supported)

**AI Execution Guidance:**
- Find the search input box.
- Use `browser_type` to enter search keywords.
- Check the changes in the search results.
- Clear the search box to verify that the list is restored.

**Test Data:**
```
Search Keywords: product, programming, fitness, etc.
```

**Expected Results:**
- The search function can filter records based on keywords.
- The search results accurately match the keywords.
- The full list is displayed after clearing the search.
- The search response speed is reasonable.

**Verification Points:**
- [ ] The search function works correctly.
- [ ] The search results are accurate.
- [ ] The search clear function works correctly.
- [ ] The search performance is good.

---

### Step 7: Delete a Single History Record

**AI Execution Guidance:**
- Select a history record.
- Look for a delete button (trash can icon or "Delete" text).
- Use `browser_click` to click the delete button.
- Handle the confirmation dialog (if any).
- Verify that the record has been deleted.

**Expected Results:**
- A delete confirmation dialog is displayed.
- After confirmation, the record is removed from the list.
- A success message for the deletion is displayed.
- The list updates correctly.

**Verification Points:**
- [ ] The delete confirmation dialog appears.
- [ ] The delete operation is executed successfully.
- [ ] The record is removed from the list.
- [ ] The interface updates correctly.

---

### Step 8: Test Clearing All History Records

**AI Execution Guidance:**
- Look for buttons like "Clear," "Clear All," or "Delete All Data."
- Use `browser_click` to click the clear button.
- Handle the confirmation dialog.
- Verify the result of the clearing (but it is recommended to cancel the operation to preserve test data).

**Expected Results:**
- A clear confirmation dialog with a warning message is displayed.
- The confirmation dialog message is clear, stating that the operation is irreversible.
- The clear operation responds normally.
- A clear-related message is displayed.

**Verification Points:**
- [ ] The clear confirmation dialog appears.
- [ ] The confirmation dialog contains an appropriate warning.
- [ ] The clear operation responds normally.
- [ ] The message is clear.

---

### Step 9: Test History Record Sorting

**AI Execution Guidance:**
- Check the sorting method of the history records.
- Look for sorting options (if any).
- Test different sorting methods.
- Verify the correctness of the sorting results.

**Expected Results:**
- The default sorting is by time in descending order.
- Sorting options function correctly (if any).
- The sorting results are accurate.
- Sorting switching is smooth.

**Verification Points:**
- [ ] The default sorting is correct.
- [ ] Sorting options function correctly (if any).
- [ ] The sorting results are accurate.
- [ ] The sorting operation is smooth.

---

### Step 10: Close the History Interface

**AI Execution Guidance:**
- Look for a close button (usually an X icon).
- Use `browser_click` to click the close button.
- Or click outside the interface area to close it.
- Verify that the interface has been closed.

**Expected Results:**
- The history interface is closed.
- Returns to the main interface.
- The main interface functions are normally available.

**Verification Points:**
- [ ] The history interface is closed successfully.
- [ ] Returns to the main interface.
- [ ] The main interface state is normal.
- [ ] Other functions are not affected.

---

## ⚠️ Common Issues to Check

### Interface Display Issues
- The history interface fails to open.
- The record list displays abnormally.
- Detailed information is not displayed completely.
- The interface layout is distorted.

### Functional Operation Issues
- The reuse function is not working.
- The search function is inaccurate.
- The delete operation fails.
- The sorting function is not working.

### Data Management Issues
- History records are lost.
- Record information is incomplete.
- Incorrect timestamps.
- Data fails to load.

---

## 🤖 AI-Powered Verification Execution Template

```javascript
// 1. Open the application
browser_navigate("http://localhost:18181/")

// 2. Create a history record (if needed)
browser_type(element="Original Prompt Input Box", ref="e54", text="Test history record")
browser_click(element="Start Optimization Button", ref="e78")
browser_wait_for(time=10)

// 3. Open history
browser_click(element="History Button", ref="history_button")
browser_snapshot()

// 4. Browse history
browser_snapshot()

// 5. View record details
browser_click(element="History Item", ref="history_item")
browser_snapshot()

// 6. Reuse a history record
browser_click(element="Reuse Button", ref="reuse_button")
browser_snapshot()

// 7. Search history (if supported)
browser_type(element="Search Box", ref="search_input", text="Test")
browser_snapshot()

// 8. Clear search
browser_type(element="Search Box", ref="search_input", text="")
browser_snapshot()

// 9. Delete a record
browser_click(element="Delete Button", ref="delete_button")
browser_snapshot()

// 10. Test the clear function
browser_click(element="Clear Button", ref="clear_button")
browser_snapshot()
browser_press_key("Escape") // Cancel the clear operation

// 11. Close the history interface
browser_press_key("Escape")
browser_snapshot()
```

**Success Criteria:**
- The history interface opens and closes normally.
- History records are displayed and loaded correctly.
- The reuse function works correctly.
- Search and filter functions work correctly (if supported).
- The delete function works correctly.
- The clear function has an appropriate confirmation mechanism.
- All interactive functions work as expected.
- No error messages or abnormal states are observed.
