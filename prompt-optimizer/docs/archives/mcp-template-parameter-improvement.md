# MCP Server Template Parameter Improvements

## Problem Description

The `template` parameter in MCP server tool parameters was originally optional with a string type, which led to poor user experience because:

1. Users didn't know what template options were available
2. There was no default value, forcing users to guess or check documentation
3. Entering wrong template IDs easily caused errors

## Solution

Change the `template` parameter to enum type and provide default values:

### 1. Added New Template Options Retrieval Function

Added `getTemplateOptions` function in `packages/mcp-server/src/config/templates.ts`:

```typescript
export async function getTemplateOptions(
  templateManager: TemplateManager,
  templateType: 'optimize' | 'userOptimize' | 'iterate'
): Promise<Array<{value: string, label: string, description?: string}>>
```

This function:
- Retrieves all available templates based on template type
- Returns formatted option arrays containing value, label, and description
- Ensures default templates are always in the options list
- Provides error handling and fallback mechanisms

### 2. Modified Tool Definitions

Modified the `inputSchema` for three tools in `packages/mcp-server/src/index.ts`:

#### optimize-user-prompt
```json
{
  "template": {
    "type": "string",
    "description": "Select optimization template. Different templates have different optimization strategies and styles.",
    "enum": ["user-prompt-professional", "user-prompt-basic", "user-prompt-planning"],
    "default": "user-prompt-basic"
  }
}
```

#### optimize-system-prompt
```json
{
  "template": {
    "type": "string",
    "description": "Select optimization template. Different templates have different optimization strategies and styles.",
    "enum": ["general-optimize", "output-format-optimize", "analytical-optimize"],
    "default": "general-optimize"
  }
}
```

#### iterate-prompt
```json
{
  "template": {
    "type": "string",
    "description": "Select iteration optimization template. Different templates have different iteration strategies.",
    "enum": ["iterate"],
    "default": "iterate"
  }
}
```

### 3. Added CoreServicesManager Method

Added `getTemplateManager()` method in `packages/mcp-server/src/adapters/core-services.ts` to retrieve template manager instance.

## Improvement Benefits

1. **User Friendly**: Users can now see all available template options, no need to guess
2. **Has Default Values**: Every tool has reasonable default templates, users can use directly
3. **Type Safe**: Enum type prevents entering invalid template IDs
4. **Clear Descriptions**: Every parameter has detailed descriptions explaining their purpose
5. **Dynamic Acquisition**: Template options are dynamically retrieved, supporting future new templates

## Validation Testing

Verified through testing:
- MCP server can start normally
- All tools register correctly
- Template parameters contain correct enum values and defaults
- Different types of templates are correctly categorized and mapped

## Technical Details

- Used template type mapping to handle type differences between Core module and MCP server
- Implemented error handling and fallback mechanisms to ensure basic functionality available even when template loading fails
- Filtered out MCP server-specific template IDs ending in `-default`, only showing true built-in templates
- Modified default template ID mapping, using built-in templates instead of MCP server's simplified templates
- Maintained backward compatibility, existing template IDs still valid

## Final Results

Fixed template options:

- **User Optimization**: `user-prompt-professional`, `user-prompt-basic`, `user-prompt-planning` (Default: `user-prompt-basic`)
- **System Optimization**: `general-optimize`, `output-format-optimize`, `analytical-optimize` (Default: `general-optimize`)
- **Iteration Optimization**: `iterate` (Default: `iterate`)

All template IDs are real existing built-in templates, users can use them with confidence.
