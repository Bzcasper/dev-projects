/** @format */

// Formatting Agent - handles final output formatting for specific platforms

import { BaseAgent } from "./base-agent";
import {
  IFormattingAgent,
  AgentCapability,
  AgentContext,
  AgentInput,
  AgentResult,
  CapabilityType,
  AgentType,
  FormatType,
  FormattingResult,
  SchemaDefinition,
} from "./types";
import { AgentFailureError } from "./errors";

export class FormattingAgent extends BaseAgent implements IFormattingAgent {
  public readonly agentType: AgentType = AgentType.FORMATTING;

  constructor(id: string, capabilities: AgentCapability[], config: any = {}) {
    super(
      id,
      "Formatting Agent",
      "Handles final output formatting for specific platforms",
      capabilities,
      [],
      {
        timeout: 30000, // 30 seconds for formatting
        retries: 2,
        ...config,
      }
    );

    this.capabilities.push({
      type: CapabilityType.FORMAT_CONVERSION,
      priority: 90,
      configuration: {
        supportedFormats: Object.values(FormatType),
      },
    });
  }

  getInputSchema(): SchemaDefinition {
    return {
      type: "object",
      properties: {
        content: { type: "string" },
        targetFormat: { type: "string" },
        options: { type: "object" },
      },
      required: ["content", "targetFormat"],
    };
  }

  getOutputSchema(): SchemaDefinition {
    return {
      type: "object",
      properties: {
        content: { type: "string" },
        format: { type: "string" },
        metadata: { type: "object" },
      },
    };
  }

  protected async processImpl(
    ctx: AgentContext,
    input: AgentInput
  ): Promise<AgentResult> {
    try {
      const { content, targetFormat, options } = input.data;

      if (!content || typeof content !== "string") {
        throw new AgentFailureError(
          "Content is required for formatting",
          this.id,
          {
            pipelineId: ctx.pipelineId,
          }
        );
      }

      if (!targetFormat || !Object.values(FormatType).includes(targetFormat)) {
        throw new AgentFailureError(
          `Unsupported format: ${targetFormat}`,
          this.id,
          {
            pipelineId: ctx.pipelineId,
          }
        );
      }

      const result = await this.formatContent(
        content,
        targetFormat as FormatType,
        options
      );

      // Store results in context
      await this.storeInContext(ctx, "formattingResults", result);

      return this.createSuccessResult(result, {
        originalLength: content.length,
        formattedLength: result.content.length,
        format: targetFormat,
        processingTimeMs: Date.now() - ctx.updated.getTime(),
      });
    } catch (error) {
      if (error instanceof AgentFailureError) {
        return this.createFailureResult(
          `Content formatting failed: ${error.message}`,
          null,
          {
            contentLength: input.data?.content?.length,
            targetFormat: input.data?.targetFormat,
          }
        );
      }

      return this.createFailureResult(
        `Unexpected formatting error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        null,
        {
          contentLength: input.data?.content?.length,
          targetFormat: input.data?.targetFormat,
        }
      );
    }
  }

  async format(
    content: string,
    targetFormat: FormatType
  ): Promise<FormattingResult> {
    return this.formatContent(content, targetFormat);
  }

  private async formatContent(
    content: string,
    targetFormat: FormatType,
    options?: any
  ): Promise<FormattingResult> {
    let formattedContent: string;
    let metadata: Record<string, any> = {};

    switch (targetFormat) {
      case FormatType.HEYGEN_JSON:
        const heygenResult = this.formatForHeyGen(content);
        formattedContent = heygenResult.content;
        metadata = heygenResult.metadata;
        break;

      case FormatType.BLOG_HTML:
        const htmlResult = this.formatForBlogHTML(content);
        formattedContent = htmlResult.content;
        metadata = htmlResult.metadata;
        break;

      case FormatType.MARKDOWN:
        const markdownResult = this.formatForMarkdown(content);
        formattedContent = markdownResult.content;
        metadata = markdownResult.metadata;
        break;

      case FormatType.PLAIN_TEXT:
      default:
        formattedContent = this.cleanPlainText(content);
        metadata = {
          format: "plain_text",
          wordCount: content.split(/\s+/).length,
        };
        break;
    }

    return {
      content: formattedContent,
      format: targetFormat,
      metadata,
    };
  }

  private formatForHeyGen(content: string): {
    content: string;
    metadata: Record<string, any>;
  } {
    // HeyGen video script JSON format structure
    const scriptSegments = this.parseScriptSegments(content);

    const heygenScript = {
      version: "1.0",
      scenes: scriptSegments.map((segment, index) => ({
        id: `scene_${index + 1}`,
        duration: Math.max(3, Math.min(15, segment.content.length / 20)), // Estimate duration
        content: segment.content,
        type: segment.type,
        background: segment.background || "default",
        avatar: segment.avatar || "default",
        voice: segment.voice || "en-US-male-1",
      })),
      metadata: {
        title: "Generated Script",
        totalDuration: scriptSegments.reduce(
          (sum, seg) => sum + seg.content.length / 20,
          0
        ),
        language: "en",
        platform: "heygen",
      },
    };

    return {
      content: JSON.stringify(heygenScript, null, 2),
      metadata: {
        segmentsCount: scriptSegments.length,
        estimatedDuration: heygenScript.metadata.totalDuration,
        format: "heygen_json",
      },
    };
  }

  private formatForBlogHTML(content: string): {
    content: string;
    metadata: Record<string, any>;
  } {
    // HTML blog post format
    const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim());
    const headerMatch = content.match(/^#\s+(.+)/m) || content.match(/^(.+)$/m);
    const title = headerMatch ? headerMatch[1].trim() : "Blog Post";

    let htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1 { color: #333; }
        h2 { color: #666; margin-top: 30px; }
        p { margin-bottom: 15px; }
        .intro { font-size: 1.2em; font-weight: bold; }
    </style>
</head>
<body>
    <h1>${title}</h1>`;

    // Process paragraphs
    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i].trim();
      if (para.startsWith("## ")) {
        htmlContent += `\n    <h2>${para.replace("## ", "")}</h2>`;
      } else if (para.startsWith("# ")) {
        // Title already handled
        continue;
      } else if (i === 0 && para.includes(".")) {
        htmlContent += `\n    <p class="intro">${para}</p>`;
      } else {
        htmlContent += `\n    <p>${para}</p>`;
      }
    }

    htmlContent += `\n</body>\n</html>`;

    return {
      content: htmlContent,
      metadata: {
        title,
        paragraphsCount: paragraphs.length,
        format: "blog_html",
        wordCount: content.split(/\s+/).length,
      },
    };
  }

  private formatForMarkdown(content: string): {
    content: string;
    metadata: Record<string, any>;
  } {
    // Ensure proper Markdown formatting
    let markdownContent = content;

    // Add title if not present
    if (!/^#/.test(markdownContent)) {
      const firstLine = markdownContent.split("\n")[0];
      markdownContent = `# ${firstLine}\n\n${markdownContent.substring(
        firstLine.length
      )}`;
    }

    // Ensure proper spacing between paragraphs
    markdownContent = markdownContent.replace(/\n\s*\n\s*\n/g, "\n\n");

    // Add list formatting if bullets are detected
    if (/\n\s*[-*]\s/.test(markdownContent)) {
      // Content already has bullet lists
    } else {
      // Add some structure with headings
      const lines = markdownContent.split("\n");
      if (lines.length > 10) {
        const middleIndex = Math.floor(lines.length / 2);
        lines.splice(middleIndex, 0, "\n## Key Points\n");
        markdownContent = lines.join("\n");
      }
    }

    return {
      content: markdownContent,
      metadata: {
        headingsCount: (markdownContent.match(/^#/gm) || []).length,
        format: "markdown",
        wordCount: content.split(/\s+/).length,
      },
    };
  }

  private cleanPlainText(content: string): string {
    // Clean up formatting for plain text
    let cleanContent = content;

    // Remove markdown formatting
    cleanContent = cleanContent.replace(/^#+\s*/gm, ""); // Remove headers
    cleanContent = cleanContent.replace(/\*\*([^*]+)\*\*/g, "$1"); // Remove bold
    cleanContent = cleanContent.replace(/\*([^*]+)\*/g, "$1"); // Remove italics
    cleanContent = cleanContent.replace(/`([^`]+)`/g, "$1"); // Remove code

    // Fix spacing
    cleanContent = cleanContent.replace(/\n\s*\n\s*\n/g, "\n\n"); // Max 2 newlines
    cleanContent = cleanContent.replace(/\s{2,}/g, " "); // Single spaces
    cleanContent = cleanContent.replace(/\n\s+/g, "\n"); // Remove indentation

    return cleanContent.trim();
  }

  private parseScriptSegments(content: string): Array<{
    content: string;
    type: string;
    background?: string;
    avatar?: string;
    voice?: string;
  }> {
    // Parse the content into script segments for video
    const segments = content.split(/(?:\n\s*\n|\. |\?|! )/);

    return segments
      .filter((segment) => segment.trim().length > 0)
      .map((segment) => {
        const cleaned = segment.trim();
        return {
          content: cleaned,
          type: this.detectSegmentType(cleaned),
          background: "studio",
          avatar: "presenter",
          voice: "en-US-neutral-1",
        };
      });
  }

  private detectSegmentType(content: string): string {
    const lowerContent = content.toLowerCase();

    if (
      lowerContent.includes("welcome") ||
      lowerContent.includes("introduction")
    ) {
      return "introduction";
    } else if (
      lowerContent.includes("summary") ||
      lowerContent.includes("conclusion")
    ) {
      return "conclusion";
    } else if (
      lowerContent.includes("example") ||
      lowerContent.includes("case")
    ) {
      return "example";
    } else {
      return "main_content";
    }
  }

  private async storeInContext(
    ctx: AgentContext,
    key: string,
    data: any
  ): Promise<void> {
    ctx.data.set(key, data);
  }
}
