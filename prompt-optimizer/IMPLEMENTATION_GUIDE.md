# 🛠️ Implementation Guide: YouTube Content Tools for MCP Server

## 📋 Quick Overview

This guide shows you exactly how to integrate the 5 YouTube Content Tools into your existing MCP server following the zero-intrusion architecture and ChatGPT context requirements.

## 🎯 What You're Adding

**5 Production-Ready Tools:**
1. `generate-youtube-script` - Transform ideas into structured scripts
2. `optimize-youtube-seo` - Generate titles, descriptions, tags
3. `repurpose-content` - Adapt content for multiple platforms
4. `format-heygen-script` - Create HeyGen-compatible JSON
5. `expand-content-idea` - Turn 1 idea into a content series

**Features:**
- ✅ Enum-based template selection (no guessing)
- ✅ Advanced templates with {{originalPrompt}}, {{iterateInput}} variables
- ✅ JSON-structured outputs ready for automation
- ✅ Zero Core module intrusion
- ✅ Full integration with existing adapter patterns

## 🔧 Step 1: File Integration

### Copy Template File
```bash
# Navigate to your MCP server directory
cd /home/bobby/projects/dev-projects/prompt-optimizer/packages/mcp-server

# Copy the YouTube templates
cp ../../YOUTUBE_CONTENT_TEMPLATES.ts src/tools/youtube-content-tools.ts
```

### Update Tools Index
Edit `src/tools/index.ts`:

```typescript
// Add to existing exports
export * from './optimize-user-prompt.js';
export * from './optimize-system-prompt.js'; 
export * from './iterate-prompt.js';
export * from './youtube-content-tools.js';  // NEW LINE
```

### Register Tools in Main Server
Edit `src/index.ts` - add to the tools registration section:

```typescript
// Import the new tools
import { youtubeContentTools } from './tools/youtube-content-tools.js';

// In the server.setRequestHandler section, add:
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ... existing tools ...
      {
        name: "generate-youtube-script",
        description: youtubeContentTools.generateYouTubeScript.description,
        inputSchema: youtubeContentTools.generateYouTubeScript.inputSchema
      },
      {
        name: "optimize-youtube-seo", 
        description: youtubeContentTools.optimizeYouTubeSEO.description,
        inputSchema: youtubeContentTools.optimizeYouTubeSEO.inputSchema
      },
      {
        name: "repurpose-content",
        description: youtubeContentTools.repurposeContent.description,
        inputSchema: youtubeContentTools.repurposeContent.inputSchema
      },
      {
        name: "format-heygen-script",
        description: youtubeContentTools.formatHeyGenScript.description,
        inputSchema: youtubeContentTools.formatHeyGenScript.inputSchema
      },
      {
        name: "expand-content-idea",
        description: youtubeContentTools.expandContentIdea.description,
        inputSchema: youtubeContentTools.expandContentIdea.inputSchema
      }
    ]
  };
});

// In the CallTool handler, add:
case "generate-youtube-script":
  return await youtubeContentTools.generateYouTubeScript.execute(request.params.arguments);
case "optimize-youtube-seo":
  return await youtubeContentTools.optimizeYouTubeSEO.execute(request.params.arguments);
case "repurpose-content":
  return await youtubeContentTools.repurposeContent.execute(request.params.arguments);
case "format-heygen-script":
  return await youtubeContentTools.formatHeyGenScript.execute(request.params.arguments);
case "expand-content-idea":
  return await youtubeContentTools.expandContentIdea.execute(request.params.arguments);
```

## 🔧 Step 2: Template Configuration

### Add New Template Types
Edit `packages/mcp-server/src/config/templates.ts`:

```typescript
// Add YouTube-specific template mappings
const YOUTUBE_TEMPLATE_MAPPINGS = {
  'youtube-script-viral': 'user-prompt-basic',
  'youtube-script-educational': 'user-prompt-professional', 
  'youtube-script-storytelling': 'user-prompt-planning',
  'seo-title-viral': 'output-format-optimize',
  'seo-description-detailed': 'analytical-optimize',
  'seo-tags-comprehensive': 'general-optimize',
  'repurpose-shortform': 'user-prompt-basic',
  'repurpose-professional': 'user-prompt-professional',
  'repurpose-social-viral': 'user-prompt-basic',
  'heygen-tutorial': 'output-format-optimize',
  'heygen-presentation': 'analytical-optimize',
  'heygen-marketing': 'user-prompt-professional',
  'expand-educational-series': 'general-optimize',
  'expand-trending-angles': 'user-prompt-basic',
  'expand-audience-segments': 'user-prompt-professional'
};

// Add to getTemplateOptions function
export async function getYouTubeTemplateOptions(
  templateType: 'script' | 'seo' | 'repurpose' | 'heygen' | 'expand'
): Promise<Array<{value: string, label: string, description?: string}>> {
  
  const templateSets = {
    script: [
      { value: 'youtube-script-viral', label: 'Viral Script', description: 'Hook-driven content for maximum engagement' },
      { value: 'youtube-script-educational', label: 'Educational Script', description: 'Tutorial-focused with clear value delivery' },
      { value: 'youtube-script-storytelling', label: 'Story Script', description: 'Narrative-driven content structure' }
    ],
    seo: [
      { value: 'seo-title-viral', label: 'Viral Titles', description: 'High CTR clickbait optimization' },
      { value: 'seo-description-detailed', label: 'Detailed Descriptions', description: 'Comprehensive SEO-rich descriptions' },
      { value: 'seo-tags-comprehensive', label: 'Tag Research', description: 'Broad keyword coverage strategy' }
    ],
    // ... add other template sets
  };
  
  return templateSets[templateType] || [];
}
```

## 🔧 Step 3: Build & Test

### Build the MCP Server
```bash
# From the mcp-server directory
pnpm build
```

### Start the Server
```bash
# Development mode with HTTP transport
pnpm dev

# Or production mode
node -r ./preload-env.js dist/start.js --transport=http
```

### Test with MCP Inspector
1. Open MCP Inspector: `npx @modelcontextprotocol/inspector`
2. Connect to: `http://localhost:3000`
3. Test the new tools:

```json
{
  "tool": "generate-youtube-script",
  "arguments": {
    "originalPrompt": "How to start a YouTube channel in 2025",
    "template": "youtube-script-viral",
    "iterateInput": "Make it beginner-friendly and under 10 minutes"
  }
}
```

## 🚀 Step 4: Content Pipeline Workflow

### Single Video Workflow
```bash
# 1. Generate script
curl -X POST http://localhost:3000 -d '{
  "tool": "generate-youtube-script", 
  "arguments": {
    "originalPrompt": "Top AI tools for productivity",
    "template": "youtube-script-viral"
  }
}'

# 2. Optimize SEO
curl -X POST http://localhost:3000 -d '{
  "tool": "optimize-youtube-seo",
  "arguments": {
    "originalPrompt": "[Script from step 1]",
    "template": "seo-title-viral"
  }
}'

# 3. Format for HeyGen  
curl -X POST http://localhost:3000 -d '{
  "tool": "format-heygen-script",
  "arguments": {
    "originalPrompt": "[Script from step 1]",
    "template": "heygen-tutorial"
  }
}'
```

### Multi-Platform Content Series
```bash
# 1. Expand idea into series
curl -X POST http://localhost:3000 -d '{
  "tool": "expand-content-idea",
  "arguments": {
    "originalPrompt": "AI productivity tools",
    "template": "expand-educational-series",
    "iterateInput": "Create 5 videos targeting different skill levels"
  }
}'

# 2. For each video idea, run script generation
# 3. Repurpose each script for multiple platforms
curl -X POST http://localhost:3000 -d '{
  "tool": "repurpose-content", 
  "arguments": {
    "originalPrompt": "[Full video script]",
    "template": "repurpose-shortform"
  }
}'
```

## 🔄 Step 5: Iteration & Refinement

### Using iterateInput for Refinement
```javascript
// Initial script generation
let script = await mcpCall('generate-youtube-script', {
  originalPrompt: "JavaScript tips for beginners",
  template: "youtube-script-educational"
});

// First iteration - adjust tone
script = await mcpCall('iterate-prompt', {
  originalPrompt: "JavaScript tips for beginners", 
  lastOptimizedPrompt: script.content,
  iterateInput: "Make it more conversational and add practical examples"
});

// Second iteration - adjust length
script = await mcpCall('iterate-prompt', {
  originalPrompt: "JavaScript tips for beginners",
  lastOptimizedPrompt: script.content, 
  iterateInput: "Shorten to 5-minute format and add more hooks"
});
```

## 📊 Step 6: Integration with External Services

### n8n Webhook Integration
```javascript
// Add webhook call after content generation
async function processVideoContent(videoIdea) {
  // Generate content
  const script = await mcpCall('generate-youtube-script', {
    originalPrompt: videoIdea,
    template: 'youtube-script-viral'
  });
  
  const seo = await mcpCall('optimize-youtube-seo', {
    originalPrompt: script.content,
    template: 'seo-title-viral'
  });
  
  const heygenFormat = await mcpCall('format-heygen-script', {
    originalPrompt: script.content,
    template: 'heygen-tutorial'  
  });
  
  // Send to n8n for further processing
  await fetch('https://your-n8n-webhook-url.com', {
    method: 'POST',
    body: JSON.stringify({
      script: script.content,
      seo: seo.content,
      heygenFormat: heygenFormat.content,
      timestamp: Date.now()
    })
  });
}
```

### Vector Storage Preparation  
```javascript
// Format content for vector storage
async function prepareForVectorStorage(rawContent) {
  const optimized = await mcpCall('optimize-user-prompt', {
    originalPrompt: rawContent,
    template: 'user-prompt-professional'
  });
  
  // Structure for vector database
  const vectorData = {
    content: optimized.content,
    metadata: {
      contentType: 'youtube-script',
      processedAt: Date.now(),
      source: 'mcp-optimizer'
    },
    embedding: null // Will be populated by vector service
  };
  
  return vectorData;
}
```

## ✅ Verification Checklist

After implementation, verify:

- [ ] All 5 tools appear in MCP Inspector
- [ ] Enum template options work correctly
- [ ] {{originalPrompt}} and {{iterateInput}} variable substitution works
- [ ] JSON outputs are properly structured
- [ ] Integration with existing Core services functions
- [ ] No modifications made to Core modules
- [ ] Error handling works for invalid templates
- [ ] Tools can be chained together in workflows

## 🎯 Next Steps

1. **Test Production Workflow**: Run a complete video idea → script → SEO → HeyGen pipeline
2. **Add Custom Templates**: Create channel-specific template variations
3. **Integrate Vector Search**: Add Chroma DB for context-aware content generation  
4. **Set Up Automation**: Connect to n8n for automated content pipelines
5. **Performance Optimization**: Add caching for frequently used templates

Your MCP server is now equipped with professional-grade YouTube content creation tools that maintain the zero-intrusion architecture while providing powerful, scalable content automation capabilities.