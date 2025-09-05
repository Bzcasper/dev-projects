// 🎬 Ready-to-Use YouTube Content Creation Templates
// Drop these into your MCP server src/tools/ directory

import { registerTool } from "@modelcontextprotocol/sdk";
import { z } from "zod";
import { promptService } from "../adapters/core-services.js";

// ============================================================================
// TOOL 1: YouTube Script Generator
// ============================================================================
export const generateYouTubeScript = registerTool({
  name: "generate-youtube-script",
  description: "Transform video ideas into structured, engaging YouTube scripts with hooks, value delivery, and strong CTAs.",
  inputSchema: z.object({
    originalPrompt: z.string().describe("Video topic, concept, or raw idea"),
    template: z.enum([
      "youtube-script-viral",
      "youtube-script-educational", 
      "youtube-script-storytelling"
    ]).default("youtube-script-viral").describe("Script optimization style: viral (hook-driven), educational (tutorial-focused), storytelling (narrative-driven)"),
    iterateInput: z.string().optional().describe("Additional requirements: tone, length, specific elements")
  }),
  async execute({ originalPrompt, template, iterateInput }) {
    const templateMessages = [
      {
        role: "system",
        content: `You are a professional YouTube script optimizer specializing in ${template.replace('youtube-script-', '')} content. 

ROLE DEFINITION:
- Create scripts with immediate hooks (first 5 seconds)
- Structure content for 5+ minute engagement
- Include natural transitions and pacing cues
- End with compelling calls-to-action

OUTPUT FORMAT (JSON):
{
  "title": "SEO-optimized title under 60 characters",
  "hook": "Opening 5-second attention grabber", 
  "script_sections": [
    {"section": "intro", "content": "...", "duration_seconds": 30},
    {"section": "main_point_1", "content": "...", "duration_seconds": 120},
    {"section": "main_point_2", "content": "...", "duration_seconds": 120},
    {"section": "outro", "content": "...", "duration_seconds": 30}
  ],
  "call_to_action": "Subscribe/like/comment direction",
  "estimated_duration": "total video length in minutes"
}`
      },
      {
        role: "user",
        content: `Video concept: {{originalPrompt}}

Script style: ${template}

${iterateInput ? `Special requirements: {{iterateInput}}` : ''}

Generate a complete YouTube script following the JSON format above.`
      }
    ];

    const result = await promptService.optimizePrompt({
      targetPrompt: templateMessages.map(msg => 
        msg.content.replace(/\{\{originalPrompt\}\}/g, originalPrompt)
                   .replace(/\{\{iterateInput\}\}/g, iterateInput || '')
      ).join('\n\n'),
      optimizationMode: 'system',
      modelKey: 'mcp-default'
    });
    
    return { content: result };
  }
});

// ============================================================================
// TOOL 2: YouTube SEO Optimizer  
// ============================================================================
export const optimizeYouTubeSEO = registerTool({
  name: "optimize-youtube-seo",
  description: "Generate SEO-optimized titles, descriptions, and tags for maximum YouTube discoverability.",
  inputSchema: z.object({
    originalPrompt: z.string().describe("Video topic or existing title/description"),
    template: z.enum([
      "seo-title-viral",
      "seo-description-detailed",
      "seo-tags-comprehensive"
    ]).default("seo-title-viral").describe("SEO focus: viral (high CTR), detailed (informative), comprehensive (broad reach)"),
    iterateInput: z.string().optional().describe("Target keywords, audience, or specific SEO goals")
  }),
  async execute({ originalPrompt, template, iterateInput }) {
    const templateMessages = [
      {
        role: "system", 
        content: `You are a YouTube SEO specialist focused on ${template.replace('seo-', '').replace('-', ' ')} optimization.

EXPERTISE AREAS:
- Keyword research and integration
- Click-through rate optimization  
- YouTube algorithm understanding
- Audience psychology and engagement triggers

OUTPUT FORMAT (JSON):
{
  "optimized_title": "Under 60 chars, keyword-rich, click-worthy",
  "title_alternatives": ["option 2", "option 3", "option 4"],
  "description": {
    "hook_line": "First sentence to grab attention",
    "main_description": "2-3 paragraphs with natural keyword integration", 
    "timestamps": "Key moment breakdown if applicable",
    "cta_section": "Subscribe and engagement prompts"
  },
  "tags": {
    "primary_keywords": ["main topic tags"],
    "long_tail_keywords": ["specific phrases"],
    "trending_tags": ["current popular tags"],
    "competitor_tags": ["tags competitors use"]
  },
  "seo_score": "Estimated optimization level 1-10"
}`
      },
      {
        role: "user",
        content: `Content to optimize: {{originalPrompt}}

SEO approach: ${template}

${iterateInput ? `Specific requirements: {{iterateInput}}` : ''}

Provide complete SEO optimization following the JSON structure.`
      }
    ];

    const result = await promptService.optimizePrompt({
      targetPrompt: templateMessages.map(msg => 
        msg.content.replace(/\{\{originalPrompt\}\}/g, originalPrompt)
                   .replace(/\{\{iterateInput\}\}/g, iterateInput || '')
      ).join('\n\n'),
      optimizationMode: 'system', 
      modelKey: 'mcp-default'
    });
    
    return { content: result };
  }
});

// ============================================================================
// TOOL 3: Content Repurposer
// ============================================================================
export const repurposeContent = registerTool({
  name: "repurpose-content", 
  description: "Adapt long-form content into multiple platform-specific formats (TikTok, Instagram, LinkedIn, Twitter).",
  inputSchema: z.object({
    originalPrompt: z.string().describe("Existing content (script, blog post, video transcript)"),
    template: z.enum([
      "repurpose-shortform",
      "repurpose-professional", 
      "repurpose-social-viral"
    ]).default("repurpose-shortform").describe("Target format: shortform (TikTok/Reels), professional (LinkedIn), viral (Twitter/Instagram)"),
    iterateInput: z.string().optional().describe("Specific platforms, length requirements, or style adjustments")
  }),
  async execute({ originalPrompt, template, iterateInput }) {
    const templateMessages = [
      {
        role: "system",
        content: `You are a multi-platform content strategist specializing in ${template.replace('repurpose-', '')} adaptations.

PLATFORM EXPERTISE:
- TikTok/Instagram Reels: 15-60 second hooks
- LinkedIn: Professional insights and thought leadership
- Twitter: Viral threads and engagement drivers  
- Instagram: Visual storytelling and community building

OUTPUT FORMAT (JSON):
{
  "platform_versions": {
    "tiktok": {
      "hook": "First 3-second attention grabber",
      "content": "15-60 second script",
      "hashtags": ["trending", "niche", "viral"],
      "cta": "Follow for more tips"
    },
    "linkedin": {
      "headline": "Professional post title", 
      "content": "Thought leadership post with insights",
      "hashtags": ["professional", "industry"],
      "cta": "What's your experience with this?"
    },
    "twitter": {
      "thread_opener": "Hook tweet to start thread",
      "thread_content": ["tweet 2", "tweet 3", "tweet 4"],
      "hashtags": ["trending", "niche"],
      "cta": "Retweet if you found this valuable"
    },
    "instagram": {
      "caption": "Story-driven caption with personality",
      "carousel_slides": ["slide 1 text", "slide 2 text"],
      "hashtags": ["mix of popular and niche"],
      "cta": "Save this post for later"
    }
  },
  "adaptation_strategy": "How content was modified for each platform"
}`
      },
      {
        role: "user",
        content: `Content to repurpose: {{originalPrompt}}

Repurposing style: ${template}

${iterateInput ? `Platform priorities: {{iterateInput}}` : ''}

Create platform-specific adaptations following the JSON structure.`
      }
    ];

    const result = await promptService.optimizePrompt({
      targetPrompt: templateMessages.map(msg => 
        msg.content.replace(/\{\{originalPrompt\}\}/g, originalPrompt)
                   .replace(/\{\{iterateInput\}\}/g, iterateInput || '')
      ).join('\n\n'),
      optimizationMode: 'system',
      modelKey: 'mcp-default'
    });
    
    return { content: result };
  }
});

// ============================================================================
// TOOL 4: HeyGen Script Formatter
// ============================================================================
export const formatHeyGenScript = registerTool({
  name: "format-heygen-script",
  description: "Convert video scripts into HeyGen-compatible JSON format with scenes, timing, and avatar settings.",
  inputSchema: z.object({
    originalPrompt: z.string().describe("Video script or content to format for HeyGen"),
    template: z.enum([
      "heygen-tutorial",
      "heygen-presentation",
      "heygen-marketing"
    ]).default("heygen-tutorial").describe("HeyGen style: tutorial (educational), presentation (business), marketing (promotional)"),
    iterateInput: z.string().optional().describe("Avatar preferences, voice settings, or timing adjustments")
  }),
  async execute({ originalPrompt, template, iterateInput }) {
    const templateMessages = [
      {
        role: "system",
        content: `You are a HeyGen video production specialist creating ${template.replace('heygen-', '')} content.

HEYGEN EXPERTISE:
- Scene timing and pacing optimization
- Avatar selection and positioning
- Voice synthesis optimization
- Visual transition planning

OUTPUT FORMAT (Exact HeyGen JSON):
{
  "title": "Video project title",
  "total_duration": 120,
  "avatar_settings": {
    "avatar_id": "professional_male_1",
    "voice_id": "en-US-neural-1",
    "background": "office_modern"
  },
  "scenes": [
    {
      "scene_id": 1,
      "duration": 30,
      "text": "TTS-optimized spoken text (clear, natural)",
      "actions": [
        {"type": "gesture", "timing": 5, "action": "point_forward"},
        {"type": "expression", "timing": 15, "action": "smile"}
      ],
      "background_music": "corporate_light",
      "transition": "fade"
    }
  ],
  "global_settings": {
    "speaking_speed": 1.0,
    "pause_duration": 0.5,
    "background_volume": 0.3
  }
}`
      },
      {
        role: "user", 
        content: `Script to format: {{originalPrompt}}

HeyGen style: ${template}

${iterateInput ? `Special settings: {{iterateInput}}` : ''}

Convert to exact HeyGen JSON format with proper scene timing and avatar settings.`
      }
    ];

    const result = await promptService.optimizePrompt({
      targetPrompt: templateMessages.map(msg => 
        msg.content.replace(/\{\{originalPrompt\}\}/g, originalPrompt)
                   .replace(/\{\{iterateInput\}\}/g, iterateInput || '')
      ).join('\n\n'),
      optimizationMode: 'system',
      modelKey: 'mcp-default'
    });
    
    return { content: result };
  }
});

// ============================================================================
// TOOL 5: Content Idea Expander  
// ============================================================================
export const expandContentIdea = registerTool({
  name: "expand-content-idea",
  description: "Transform a single content idea into a multi-video series with unique angles and approaches.",
  inputSchema: z.object({
    originalPrompt: z.string().describe("Base content idea or topic"),
    template: z.enum([
      "expand-educational-series",
      "expand-trending-angles", 
      "expand-audience-segments"
    ]).default("expand-educational-series").describe("Expansion method: educational (tutorial series), trending (viral angles), segments (different audiences)"),
    iterateInput: z.string().optional().describe("Target number of videos, specific angles, or audience preferences")
  }),
  async execute({ originalPrompt, template, iterateInput }) {
    const templateMessages = [
      {
        role: "system",
        content: `You are a content strategy expert specializing in ${template.replace('expand-', '').replace('-', ' ')} development.

EXPANSION STRATEGIES:
- Educational Series: Progressive skill building and knowledge delivery
- Trending Angles: Viral hooks and current event connections  
- Audience Segments: Different demographics and interest groups
- SEO Optimization: Search-friendly topic variations

OUTPUT FORMAT (JSON):
{
  "series_overview": {
    "main_topic": "Core subject matter",
    "target_audience": "Primary viewer demographic", 
    "content_goal": "Educational/entertainment/promotional objective",
    "recommended_frequency": "Upload schedule"
  },
  "video_ideas": [
    {
      "video_number": 1,
      "title": "SEO-optimized title",
      "angle": "Unique perspective or approach",
      "target_keywords": ["seo", "keywords"],
      "hook_concept": "Opening attention grabber",
      "main_points": ["point 1", "point 2", "point 3"],
      "cta_focus": "Subscribe/engage/next video",
      "estimated_views": "Low/Medium/High potential"
    }
  ],
  "content_calendar": {
    "week_1": "video titles for first week",
    "week_2": "video titles for second week",
    "month_1": "monthly content themes"
  },
  "cross_promotion": "How videos connect and reference each other"
}`
      },
      {
        role: "user",
        content: `Base idea: {{originalPrompt}}

Expansion strategy: ${template}

${iterateInput ? `Requirements: {{iterateInput}}` : ''}

Create a comprehensive content series expansion following the JSON format.`
      }
    ];

    const result = await promptService.optimizePrompt({
      targetPrompt: templateMessages.map(msg => 
        msg.content.replace(/\{\{originalPrompt\}\}/g, originalPrompt)
                   .replace(/\{\{iterateInput\}\}/g, iterateInput || '')
      ).join('\n\n'),
      optimizationMode: 'system',
      modelKey: 'mcp-default' 
    });
    
    return { content: result };
  }
});

// ============================================================================
// Export all tools for registration
// ============================================================================
export const youtubeContentTools = {
  generateYouTubeScript,
  optimizeYouTubeSEO,
  repurposeContent, 
  formatHeyGenScript,
  expandContentIdea
};