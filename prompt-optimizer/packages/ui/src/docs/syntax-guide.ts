export const syntaxGuideContent = {

  'en-US': `# Syntax Guide

## Syntax Rules

### Variable Syntax
Use double curly braces around variable names: \`{{variableName}}\`

### Variable Naming
Use English camelCase naming, e.g., \`originalPrompt\`

### Case Sensitive
\`{{prompt}}\` and \`{{Prompt}}\` are different variables

## Variable Syntax

### Predefined Variables

The system currently supports the following 3 predefined variables:

#### \`{{originalPrompt}}\` - Original Prompt
- Contains the original prompt content initially entered by the user
- Maintains consistent semantics across optimization and iteration scenarios

#### \`{{lastOptimizedPrompt}}\` - Last Optimized Prompt
- **Iteration scenario only**
- Contains the prompt content generated from the previous optimization round, used as the basis for current iteration

#### \`{{iterateInput}}\` - Iteration Optimization Requirement
- **Iteration scenario only**
- Contains user-specific iteration requirements and directions for the optimized prompt

**Important Reminder:** Only advanced templates support variable replacement functionality

## Template Type Description

### 📝 Simple Template

**Working Principle:** No template technology used, directly uses template content as system prompt, user input as user message

**Usage Scenarios:** 
- ✅ Optimization scenarios only
- ✅ Simple and easy to use, easy to edit
- ✅ Quick creation of basic templates

**Processing Method:** 
1. Template content → system message
2. User input → user message

**Limitations:** 
- ❌ No variable replacement support
- ❌ Does not support iteration scenarios
- ❌ Does not support complex multi-turn conversation structures
- ❌ Cannot customize message roles

### ⚡ Advanced Template

**Working Principle:** Uses message array format and Handlebars template technology, supports variable replacement and precise message control

**Usage Scenarios:** 
- ✅ Optimization and iteration scenarios
- ✅ Complex dialogue structures
- ✅ Role-playing conversations
- ✅ Multi-turn conversation simulation

**Processing Method:** 
1. Send according to message array structure
2. Use \`{{variable}}\` for variable replacement
3. Support custom message roles

**Required Scenarios:** Iteration scenarios mandatorily require advanced templates

### Message Role Description

Advanced templates support the following three message roles:

- **system**: System message, defines AI's role, capabilities, and behavioral norms
- **user**: User message, simulates user input and requests
- **assistant**: Assistant message, simulates AI responses, used for multi-turn conversations

## Template Format Conversion

The system supports converting simple templates to advanced templates:

1. Find the target simple template in the template manager
2. Click the "Upgrade" button
3. System automatically converts string content to message array format
4. After conversion, variable replacement functionality can be used
5. Manually adjust message structure to fit specific needs

## Template Preview Feature

When editing advanced templates in the template manager:

1. **Real-time Preview**: System automatically shows template effects using sample data
2. **Sample Data**:
   - \`originalPrompt\`: "Write a story"
   - \`lastOptimizedPrompt\`: "Create an engaging narrative"
   - \`iterateInput\`: "Make it more creative and add space exploration theme"
3. **Preview Display**: Shows actual message content after variable replacement
4. **Role Identification**: Different roles are identified with different colors

## Examples

### Simple Template Example (Optimization Scenario)

**Note: Simple templates do not support variable replacement, the following content will be sent directly as system message**

\`\`\`
You are a professional AI prompt optimization expert. Please help me optimize the prompt provided by the user.

Please optimize according to the following requirements:
1. Keep the original intent unchanged
2. Improve clarity of expression
3. Enhance instruction executability
4. Optimize output format requirements

Please output the optimized prompt directly without explaining the process.
\`\`\`

### Advanced Template Example (Single-turn Optimization)

Using variables: \`{{originalPrompt}}\`

\`\`\`json
[
  {
    "role": "system",
    "content": "You are a professional AI prompt optimization expert, skilled at transforming ordinary prompts into structured, efficient prompts."
  },
  {
    "role": "user", 
    "content": "Please optimize this prompt: {{originalPrompt}}\\n\\nRequirements: Maintain original meaning while improving clarity and executability."
  }
]
\`\`\`

### Advanced Template Example (Multi-turn Conversation)

Using variables: \`{{originalPrompt}}\`

\`\`\`json
[
  {
    "role": "system",
    "content": "You are a professional AI prompt optimization expert, skilled at transforming ordinary prompts into structured, efficient prompts."
  },
  {
    "role": "user", 
    "content": "I need to optimize this prompt: {{originalPrompt}}"
  },
  {
    "role": "assistant",
    "content": "I'll help you optimize this prompt. Please tell me which aspects you'd like to focus on improving?"
  },
  {
    "role": "user",
    "content": "Please provide a structured optimized version, including role definition, skill description, and workflow."
  }
]
\`\`\`

### Advanced Template Example (Iteration Scenario)

Using variables: \`{{originalPrompt}}\`, \`{{lastOptimizedPrompt}}\`, \`{{iterateInput}}\`

\`\`\`json
[
  {
    "role": "system",
    "content": "You are a prompt iteration optimization expert, skilled at making targeted improvements to optimized prompts based on user requirements."
  },
  {
    "role": "user",
    "content": "Original prompt: {{originalPrompt}}\\n\\nLast optimized version: {{lastOptimizedPrompt}}\\n\\nIteration requirements: {{iterateInput}}\\n\\nPlease further improve the optimized version based on the iteration requirements while keeping the core intent unchanged."
  }
]
\`\`\`

## Common Errors & Solutions

### 1. Using Simple Template in Iteration Scenarios
**Error Message**: Iteration scenarios must use advanced templates (message array format)
**Solution**: Convert simple template to advanced template, or create new advanced template

### 2. Variable Name Spelling Errors
**Problem**: Variables in template are not replaced, showing original \`{{variableName}}\`
**Solution**: Check if variable name is one of the three predefined variables

### 3. Empty Message Content
**Error Message**: Message content cannot be empty
**Solution**: Ensure each message's content field has content

### 4. Advanced Template Format Error
**Problem**: Template cannot be saved or used
**Solution**: Ensure JSON format is correct, each message has role and content fields

## Best Practices

### Selection Recommendations
- 🔸 **New Users**: Recommend starting with simple templates
- 🔸 **Need Variable Replacement**: Must use advanced templates
- 🔸 **Iteration Scenarios**: Mandatorily require advanced templates
- 🔸 **Complex Conversations**: Use multi-message structure of advanced templates

### Writing Techniques
- 🔸 **System Messages**: Clearly define AI's role, capabilities, and behavioral norms
- 🔸 **User Messages**: Provide specific task content and requirements
- 🔸 **Assistant Messages**: Guide conversation direction or provide example responses
- 🔸 **Variable Usage**: Use variables reasonably to avoid hard-coding

### Debugging Methods
- 🔸 **Preview Feature**: View real-time preview effects while editing
- 🔸 **Simple Testing**: Test template with simple content first to ensure it works
- 🔸 **Gradual Improvement**: Start with basic version, gradually add complex features
- 🔸 **Format Conversion**: Use upgrade feature to convert simple templates to advanced templates

### Performance Optimization
- 🔸 **Avoid Excessive Length**: Message content should not be too long, affecting processing speed
- 🔸 **Clear Structure**: Keep template structure clear and understandable
- 🔸 **Avoid Nesting**: Don't over-complicate nested structures
`
} 