# Project Structure Document

> **Note:** This document focuses on the file and directory structure of the project. For details on the technology stack and implementation process, please refer to the [Technical Documentation](./technical-documentation.md).

## 1. Overall Project Architecture

### 1.1 Root Directory Structure
```
prompt-optimizer/
├── packages/             # Project packages
│   ├── core/            # Core functionality package
│   │   ├── src/         # Core source code
│   │   ├── tests/       # Core package tests
│   │   └── package.json # Core package configuration
│   ├── web/             # Web version
│   │   ├── src/         # Web source code
│   │   ├── tests/       # Web tests
│   │   └── package.json # Web package configuration
│   └── extension/       # Chrome extension
├── docs/                # Project documentation
├── tools/               # Tool scripts
└── ...configuration files
```

### 1.2 Configuration Files
- `pnpm-workspace.yaml` - Workspace configuration
- `.env.example` - Environment variable examples
- `package.json` - Project configuration
- `.vscode/` - VSCode configuration directory
- `.cursorrules` - Cursor IDE configuration
- `.gitignore` - Git ignore configuration

### 1.3 Workspace Files
- `README.md` - Project description document
- `scratchpad.md` - Development notes and task planning (migrated to docs/workspace/)
- `experience.md` - Project experience summary (migrated to docs/workspace/)

### 1.4 Documentation Directory (docs/)
- `README.md` - Documentation index
- `development-guidelines.md` - Development guidelines
- `project-status.md` - Project status
- `project-structure.md` - Project structure
- `technical-documentation.md` - Technical documentation
- `prd.md` - Product requirements document
- `CHANGELOG.md` - Changelog

## 2. Core Package Structure (packages/core)

### 2.1 Source Code Directory (packages/core/src/)
```
src/
├── services/           # Core services
│   ├── llm/           # LLM service
│   │   ├── service.ts # LLM service implementation
│   │   ├── types.ts   # Type definitions
│   │   └── errors.ts  # Error definitions
│   ├── model/         # Model management
│   │   ├── manager.ts # Model manager
│   │   ├── types.ts   # Type definitions
│   │   └── defaults.ts# Default configurations
│   ├── prompt/        # Prompt service
│   │   ├── service.ts # Prompt service implementation
│   │   ├── types.ts   # Type definitions
│   │   └── errors.ts  # Error definitions
│   ├── template/      # Template service
│   │   ├── manager.ts # Template manager
│   │   ├── types.ts   # Type definitions
│   └── history/       # History service
│       ├── manager.ts # History manager
│       └── types.ts   # Type definitions
├── types/             # Public type definitions
└── utils/             # Utility functions
```

### 2.2 API Directory (src/api/)
- `api/llm.js` - LLM API call encapsulation

### 2.3 Configuration Directory (packages/core/config/)
- `models.js` - LLM model configuration
- `prompts.js` - Prompt template configuration

### 2.4 Test Directory (packages/core/tests/)
```
tests/
├── unit/             # Unit tests
│   └── services/     # Service tests
│       ├── llm/      # LLM service tests
│       ├── model/    # Model management tests
│       └── prompt/   # Prompt service tests
└── integration/      # Integration tests
    └── services/     # Service integration tests
```

### 2.5 Core Package Configuration
- `package.json` - Core package configuration
- `tsconfig.json` - TypeScript configuration
- `vitest.config.ts` - Test configuration

## 3. Web Package Structure (packages/web)

### 3.1 Source Code Directory (packages/web/src/)
```
src/
├── components/        # Vue components
│   ├── PromptPanel.vue    # Prompt panel
│   ├── ModelManager.vue   # Model manager
│   ├── TemplateManager.vue# Template manager
│   ├── InputPanel.vue     # Input panel
│   └── OutputPanel.vue    # Output panel
├── composables/       # Vue composable functions
├── services/          # Business logic
│   ├── llm/           # LLM service
│   ├── model/         # Model configuration
│   ├── prompt/        # Prompt service
│   ├── promptManager.js # Prompt management
│   └── themeManager.js # Theme management
├── assets/           # Static assets
│   ├── images/       # Image assets
│   └── styles/       # Style assets
├── prompts/          # Prompt templates
├── App.vue           # Root component
└── main.ts           # Entry file
```

### 3.2 Component Directory Details (packages/web/src/components/)
- `PromptPanel.vue` - Prompt input and optimization panel
- `InputPanel.vue` - Input panel component
- `OutputPanel.vue` - Output panel component
- `ModelConfig.vue` - Model configuration component
- `ThemeToggle.vue` - Theme toggle component
- `LoadingSpinner.vue` - Loading spinner component

### 3.3 Test Directory (packages/web/tests/)
```
tests/
├── unit/            # Unit tests
│   ├── components/  # Component tests
│   └── services/    # Service tests
└── integration/     # Integration tests
    └── services/    # Service integration tests
```

### 3.4 Web Package Configuration
- `package.json` - Web package configuration
- `vite.config.ts` - Vite configuration
- `tailwind.config.js` - TailwindCSS configuration
- `.env.local` - Local environment variables
- `postcss.config.js` - PostCSS configuration
- `index.html` - Project entry HTML file

## 4. Extension Package Structure (packages/extension)

### 4.1 Source Code Directory (packages/extension/src/)
```
src/
├── popup/           # Popup window interface
├── background/      # Background scripts
├── content/         # Content scripts
└── manifest.json    # Extension configuration file
```

### 4.2 Extension Package Configuration
- `package.json` - Extension package configuration
- `vite.config.ts` - Build configuration

## 5. Dependencies

### 5.1 Core Package Dependencies (@prompt-optimizer/core)
```
@prompt-optimizer/core
├── @openai/openai ^4.83.0      # OpenAI SDK
├── @google/generative-ai ^0.21.0 # Google Generative AI SDK
└── uuid ^11.0.5                # UUID generation
```

### 5.2 Web Package Dependencies (@prompt-optimizer/web)
```
@prompt-optimizer/web
├── @prompt-optimizer/core  # Depends on the core package
├── vue ^3.5.x             # Vue framework
├── pinia ^2.1.x           # State management
└── tailwindcss ^3.4.1     # Styling framework
```

### 5.3 Extension Package Dependencies (@prompt-optimizer/extension)
```
@prompt-optimizer/extension
├── @prompt-optimizer/core  # Depends on the core package
├── @prompt-optimizer/ui    # Depends on the UI component package
└── vue ^3.5.x             # Vue framework
```
