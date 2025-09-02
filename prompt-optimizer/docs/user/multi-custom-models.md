# Multiple Custom Models Configuration Guide

## Overview

Prompt Optimizer now supports configuring an unlimited number of custom models, allowing you to use multiple local models or self-hosted API services simultaneously.

## Features

- ✅ Support for an unlimited number of custom models
- ✅ Automatic discovery and registration via environment variables
- ✅ User-friendly model name display
- ✅ Fully backward compatible with existing configurations
- ✅ Supports all deployment methods (Web, Desktop, Docker, MCP)

## Configuration Method

### Environment Variable Format

Use the following format to configure multiple custom models:

```bash
VITE_CUSTOM_API_KEY_<suffix>=your-api-key          # Required
VITE_CUSTOM_API_BASE_URL_<suffix>=your-base-url    # Required
VITE_CUSTOM_API_MODEL_<suffix>=your-model-name     # Required
```

### Configuration Requirements

-   **Suffix**: Only letters (a-z, A-Z), numbers (0-9), underscores (_), and hyphens (-) are allowed, with a maximum length of 50 characters.
-   **API_KEY**: Required for API authentication.
-   **BASE_URL**: Required, the base URL of the API service.
-   **MODEL**: Required, the specific model name.

### Suffix Naming Examples

| Model Service | Recommended Suffix | Environment Variable Example | Display Name |
|---|---|---|---|
| Qwen3 | `qwen3` | `VITE_CUSTOM_API_KEY_qwen3` | Qwen3 |
| Qwen2.5 | `qwen2_5` or `qwen25` | `VITE_CUSTOM_API_KEY_qwen2_5` | Qwen2 5 |
| Claude Local | `claude_local` | `VITE_CUSTOM_API_KEY_claude_local` | Claude Local |
| GPT Local | `gpt_local` | `VITE_CUSTOM_API_KEY_gpt_local` | Gpt Local |
| Custom LLM | `my_llm` | `VITE_CUSTOM_API_KEY_my_llm` | My Llm |
| Company Internal Model | `company_ai` | `VITE_CUSTOM_API_KEY_company_ai` | Company Ai |

**Naming Rules:**
- ✅ **Allowed**: Letters (a-z, A-Z), numbers (0-9), underscores (_), hyphens (-)
- ❌ **Not Allowed**: Periods (.), spaces, special characters, etc.
- 💡 **Recommended**: Use lowercase letters and separate words with underscores (e.g., `qwen2_5`, `claude_local`).
- 📏 **Length Limit**: Maximum 50 characters.

### Restrictions

-   **Character Restrictions**: The suffix can only contain `a-z`, `A-Z`, `0-9`, `_`, and `-`. No periods, spaces, or special characters are allowed.
-   **Length Restrictions**: The maximum length is 50 characters.
-   **Conflict Detection**: Cannot conflict with existing static model names (e.g., openai, gemini, deepseek, zhipu, siliconflow, custom).
-   **Completeness Requirements**: All three configuration items must be provided. If any are missing, the model will be skipped.

### Configuration Examples

```bash
# Keep original configuration for backward compatibility
VITE_CUSTOM_API_KEY=default-custom-key
VITE_CUSTOM_API_BASE_URL=http://localhost:11434/v1
VITE_CUSTOM_API_MODEL=default-model

# Ollama Qwen3 model
VITE_CUSTOM_API_KEY_qwen3=ollama-qwen3-key
VITE_CUSTOM_API_BASE_URL_qwen3=http://localhost:11434/v1
VITE_CUSTOM_API_MODEL_qwen3=qwen3:8b

# Ollama Qwen2.5 model (use underscores to separate version numbers)
VITE_CUSTOM_API_KEY_qwen2_5=ollama-qwen25-key
VITE_CUSTOM_API_BASE_URL_qwen2_5=http://localhost:11434/v1
VITE_CUSTOM_API_MODEL_qwen2_5=qwen2.5:14b

# Local Claude compatible service
VITE_CUSTOM_API_KEY_claude_local=claude-local-key
VITE_CUSTOM_API_BASE_URL_claude_local=http://localhost:8080/v1
VITE_CUSTOM_API_MODEL_claude_local=claude-3-sonnet

# Other self-built API services
VITE_CUSTOM_API_KEY_my_llm=my-llm-api-key
VITE_CUSTOM_API_BASE_URL_my_llm=https://my-api.example.com/v1
VITE_CUSTOM_API_MODEL_my_llm=my-custom-model
```

## UI Display Effect

Configured models will be displayed in the model selection dropdown box as:

-   **Custom** (original configuration)
-   **Qwen3** (from custom_qwen3)
-   **Qwen2 5** (from custom_qwen2_5)
-   **Claude Local** (from custom_claude_local)
-   **My Llm** (from custom_my_llm)

Suffix names will be automatically formatted into user-friendly display names:
-   Underscores and hyphens will be replaced with spaces.
-   The first letter of each word is automatically capitalized.
-   For example: `qwen2_5` → `Qwen2 5`, `claude_local` → `Claude Local`.

## Deployment Method Configuration

### Web Development Environment

Add the configuration to the `.env.local` file in the project root:

```bash
VITE_CUSTOM_API_KEY_qwen3=your-qwen-key
VITE_CUSTOM_API_BASE_URL_qwen3=http://localhost:11434/v1
VITE_CUSTOM_API_MODEL_qwen3=qwen3:8b
```

### Desktop Application

Set system environment variables or specify them at startup:

```bash
# Windows
set VITE_CUSTOM_API_KEY_qwen3=your-qwen-key
npm run desktop

# macOS/Linux
export VITE_CUSTOM_API_KEY_qwen3=your-qwen-key
npm run desktop
```

### Docker Deployment

#### Method 1: Environment Variable Parameters

```bash
docker run -d -p 8081:80 \
  -e VITE_OPENAI_API_KEY=your-openai-key \
  -e VITE_CUSTOM_API_KEY_ollama=dummy-key \
  -e VITE_CUSTOM_API_BASE_URL_ollama=http://host.docker.internal:11434/v1 \
  -e VITE_CUSTOM_API_MODEL_ollama=qwen2.5:7b \
  -e VITE_CUSTOM_API_KEY_qwen3=your-qwen3-key \
  -e VITE_CUSTOM_API_BASE_URL_qwen3=http://host.docker.internal:11434/v1 \
  -e VITE_CUSTOM_API_MODEL_qwen3=qwen3:8b \
  --restart unless-stopped \
  --name prompt-optimizer \
  linshen/prompt-optimizer
```

#### Method 2: Environment Variable File

Create a `.env` file:

```bash
VITE_OPENAI_API_KEY=your-openai-key
VITE_CUSTOM_API_KEY_ollama=dummy-key
VITE_CUSTOM_API_BASE_URL_ollama=http://host.docker.internal:11434/v1
VITE_CUSTOM_API_MODEL_ollama=qwen2.5:7b
VITE_CUSTOM_API_KEY_qwen3=your-qwen3-key
VITE_CUSTOM_API_BASE_URL_qwen3=http://host.docker.internal:11434/v1
VITE_CUSTOM_API_MODEL_qwen3=qwen3:8b
```

Run with the environment variable file:

```bash
docker run -d -p 8081:80 --env-file .env \
  --restart unless-stopped \
  --name prompt-optimizer \
  linshen/prompt-optimizer
```

#### Method 3: Docker Compose

Modify `docker-compose.yml` to add the `env_file` configuration:

```yaml
services:
  prompt-optimizer:
    image: linshen/prompt-optimizer:latest
    env_file:
      - .env  # Read environment variables from the .env file
    ports:
      - "8081:80"
    restart: unless-stopped
```

Then configure the variables in the `.env` file (same as Method 2).

### MCP Server

The MCP server will automatically recognize all configured custom models. You can specify the preferred model using `MCP_DEFAULT_MODEL_PROVIDER`:

```bash
# Use a specific custom model
MCP_DEFAULT_MODEL_PROVIDER=custom_qwen3
```

## Common Issues

### Q: How can I verify that the configuration is correct?

A: After starting the application, check the console logs. Successfully configured models will display information similar to this:
```
[scanCustomModelEnvVars] Found 2 custom models: qwen3, claude_local
[generateDynamicModels] Generated model: custom_qwen3 (Qwen3)
```

### Q: What happens if the configuration is incorrect?

A: The system will output detailed error information but will not affect the normal use of other models:
```
[scanCustomModelEnvVars] Skipping invalid_suffix due to validation errors:
  - Invalid suffix format: invalid$suffix
```

### Q: How many custom models can be configured?

A: Theoretically, there is no limit, but it is recommended to configure a reasonable number based on actual needs to avoid cluttering the UI.

### Q: How can I remove unwanted custom models?

A: Delete the corresponding environment variables and restart the application.

## Technical Details

-   Model key format: `custom_<suffix>`
-   Configuration validation: Automatic checks for suffix format, API key, baseURL, etc.
-   Error tolerance: Individual configuration errors do not affect other models.
-   Default values: Provides reasonable default configurations to ensure system stability.

## Update Log

-   **v1.2.6**: Code quality fixes and performance optimization
    -   Fixed an MCP Server case conversion bug for more accurate environment variable mapping.
    -   Optimized configuration validation logic with a 66% performance improvement.
    -   Resolved ValidationResult interface conflicts and improved type safety.
    -   Implemented dynamic static model key retrieval with automatic synchronization.
    -   All fixes have been thoroughly tested to ensure cross-environment consistency.

-   **v1.4.0**: Added support for multiple custom models
    -   Fully backward compatible with existing configurations.
    -   Supports all deployment methods.
    -   Added configuration validation and error handling.
