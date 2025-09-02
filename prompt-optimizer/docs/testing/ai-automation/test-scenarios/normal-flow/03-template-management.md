# Normal Flow Test for Template Management

## 📖 Test Overview
This test verifies the basic workflow of the template management feature, ensuring that users can properly view, create, edit, and manage optimization templates.

## 🎯 Test Objectives
- Verify that the template management interface opens correctly.
- Validate the template browsing and viewing functionality.
- Validate the template creation and editing functionality.
- Validate the template categorization and management functionality.
- Verify the language switching functionality for built-in templates.

## 📋 Preconditions
- [ ] The application is launched and fully loaded.
- [ ] The user interface is displayed correctly.
- [ ] Basic understanding of template concepts.

---

## 🔧 Test Steps

### Step 1: Open the Template Manager

**AI Execution Guidance:**
- Use `browser_snapshot` to capture the current state of the page.
- Find the button containing the "📝" icon and the text "Feature Prompts".
- Use `browser_click` to click this button.

**Expected Results:**
- The template management dialog box appears.
- The dialog box title displays "Template Management" or "Feature Prompts".
- The interface shows the existing template list and management options.

**Verification Points:**
- [ ] The template management pop-up is displayed.
- [ ] The pop-up title is displayed correctly.
- [ ] The template list or category options are visible.
- [ ] The interface includes buttons for actions like adding and editing.

---

### Step 2: Browse Existing Templates

**AI Execution Guidance:**
- Use `browser_snapshot` to view the content of the template list.
- Look for template category tabs or filter options.
- Click on different categories to see how the template list changes.
- Select a template item to view its details.

**Expected Results:**
- Templates are displayed correctly according to their categories.
- Each template shows basic information such as name and description.
- Clicking on a category tab filters the displayed templates accordingly.
- Selecting a template allows viewing its detailed content.

**Verification Points:**
- [ ] The template list is displayed correctly.
- [ ] The category filtering function works correctly.
- [ ] Template information is displayed completely.
- [ ] The template selection function works correctly.

---

### Step 3: View Template Details

**AI Execution Guidance:**
- Select an existing template.
- View the detailed information of the template.
- Check information such as template content, description, and type.
- Test the template preview function (if available).

**Expected Results:**
- The template's detailed information is displayed completely.
- The template content is formatted correctly.
- The template type and description are accurate.
- The preview function works correctly (if supported).

**Verification Points:**
- [ ] Template details are displayed correctly.
- [ ] Template content is formatted correctly.
- [ ] Type and description are accurate.
- [ ] The preview function works correctly (if available).

---

### Step 4: Create a New Template (Simulated)

**AI Execution Guidance:**
- Look for buttons like "Add", "New", or "Create".
- Use `browser_click` to click the add button.
- Select a template type (if there is a selector).
- Check the layout of the template creation interface.

**Expected Results:**
- The template creation/editing interface opens.
- Template type selection options are displayed.
- Input fields for name, description, content, etc., are provided.
- The interface layout is clean, and fields are clearly labeled.

**Verification Points:**
- [ ] The template creation interface opens correctly.
- [ ] The template type selection function is available.
- [ ] All necessary input fields are present.
- [ ] The interface responds normally.

---

### Step 5: Fill in Template Information (Simulated)

**AI Execution Guidance:**
- Find the template name input field.
- Use `browser_type` to enter a test name.
- Find the description input field and enter a description.
- Locate the template content editing area.

**Test Data:**
```
Template Name: Test Template
Template Description: This is a template for testing purposes.
Template Type: System Optimization (or User Optimization)
```

**Expected Results:**
- Name and description are entered correctly.
- Template type is selected correctly.
- The content editing area is available.
- Input validation works correctly.

**Verification Points:**
- [ ] The name input function works correctly.
- [ ] The description input function works correctly.
- [ ] The type selection function works correctly.
- [ ] Input validation is correct.

---

### Step 6: Write Template Content (Simulated)

**AI Execution Guidance:**
- Find the template content editing area (usually a large text box).
- Use `browser_type` to enter the test template content.
- Look for mode switching options (Simple/Advanced).
- Check the functionality and responsiveness of the editor.

**Test Data:**
```
Template Content:
You are a professional prompt optimization expert.
Please help the user optimize the following prompt:
{original_prompt}

Optimization Requirements:
1. Make the prompt clearer and more specific.
2. Add necessary contextual information.
3. Improve the language and expression.
```

**Expected Results:**
- The template content is correctly entered into the editing area.
- The editor supports multi-line text input.
- The mode switching function works correctly (if it exists).
- The editor responds smoothly.

**Verification Points:**
- [ ] Template content is entered successfully.
- [ ] The editor functions correctly.
- [ ] Mode switching works correctly (if available).
- [ ] The editor responds smoothly.

---

### Step 7: Save the Template (Simulated)

**AI Execution Guidance:**
- Check the completeness of the template information.
- Look for buttons like "Save", "Confirm", or "Submit".
- Use `browser_click` to click the save button.
- Wait for the save to complete and check the result.

**Expected Results:**
- The save button responds normally.
- A success message is displayed.
- The interface returns to the template list.
- The newly created template appears in the corresponding category.

**Verification Points:**
- [ ] The save button functions correctly.
- [ ] A success message is displayed.
- [ ] The interface returns to the template list.
- [ ] The new template is displayed correctly in the list.

---

### Step 8: Edit an Existing Template (Simulated)

**AI Execution Guidance:**
- Select an existing template from the template list.
- Look for an "Edit" button or try double-clicking the template.
- Check if the editing interface loads correctly.
- Verify that the existing information is displayed correctly.

**Expected Results:**
- The template editing interface opens.
- The existing template information is loaded correctly into the editor.
- All editable fields can be modified.
- The editing interface is fully functional.

**Verification Points:**
- [ ] The editing interface opens correctly.
- [ ] Existing information is loaded correctly.
- [ ] The modification function works correctly.
- [ ] The editing interface is fully functional.

---

### Step 9: Test Template Categorization

**AI Execution Guidance:**
- Look for template category tabs or filters.
- Click on different category options.
- Observe the changes in the template list.
- Verify the accuracy of the category filtering.

**Expected Results:**
- Category tabs are clearly visible.
- Clicking on a category filters the templates.
- The filtering results are accurate.
- Category switching is smooth.

**Verification Points:**
- [ ] The category tab function works correctly.
- [ ] Category filtering is accurate.
- [ ] The filtering results are correct.
- [ ] Category switching is smooth.

---

### Step 10: Test Built-in Template Language Switching

**AI Execution Guidance:**
- Find the language switch button in the template management interface (usually displays "中文" or "EN").
- Use `browser_click` to click the language switch button.
- Observe the change in the names of the built-in templates.
- Verify if the template content language changes accordingly.

**Expected Results:**
- The language switch button responds normally.
- The names of the built-in templates switch from Chinese to English (or vice versa).
- The template content language changes accordingly.
- A success message for the switch is displayed.

**Verification Points:**
- [ ] The language switch button functions correctly.
- [ ] The language of built-in template names switches correctly.
- [ ] The template content language changes accordingly.
- [ ] A success message for the switch is displayed.

**Notes:**
- Switching the built-in template language is different from switching the interface language.
- The built-in template language affects the display language of template names and content.
- After switching, you should see "通用优化" change to "General Optimization".

---

## ⚠️ Common Issues to Check

### Interface Display Issues
- The template management pop-up fails to open.
- The template list displays abnormally.
- The editing interface layout is distorted.
- Issues with the display of category tabs.

### Functional Operation Issues
- The template creation function is not working.
- The editing function is unavailable.
- The save operation fails.
- Inaccurate category filtering.

### Data Management Issues
- Template information is lost.
- Content is abnormal after saving.
- Incorrect category information.
- Template fails to load.

---

## 🤖 AI-Powered Verification Execution Template

```javascript
// 1. Open the application
browser_navigate("http://localhost:18181/")

// 2. Get the initial state
browser_snapshot()

// 3. Open template management
browser_click(element="Template Management Button", ref="template_management_button")
browser_snapshot()

// 4. Browse existing templates
browser_snapshot()

// 5. View template details
browser_click(element="Template Item", ref="template_item")
browser_snapshot()

// 6. Create a new template
browser_click(element="Add Template Button", ref="add_template_button")
browser_snapshot()

// 7. Fill in template information
browser_type(element="Template Name Input", ref="template_name_input", text="Test Template")
browser_type(element="Template Description Input", ref="template_desc_input", text="Test Description")
browser_snapshot()

// 8. Write template content
browser_type(element="Template Content Editor", ref="template_content_editor", text="Test template content")
browser_snapshot()

// 9. Save the template
browser_click(element="Save Button", ref="save_button")
browser_snapshot()

// 10. Test category filtering
browser_click(element="Category Tab", ref="category_tab")
browser_snapshot()

// 11. Test built-in template language switching
browser_click(element="Built-in Language Toggle", ref="builtin_language_toggle")
browser_snapshot()
```

**Success Criteria:**
- The template management interface opens and operates normally.
- Template browsing and viewing functions work correctly.
- Template creation and editing functions work correctly.
- Template categorization and filtering functions work correctly.
- The built-in template language switching function works correctly.
- All operations are responsive and accurate.
- No error messages or abnormal states are observed.
