/** @format */

// Writing Agent - handles content generation and script writing

import { BaseAgent } from "./base-agent";
import {
  IWritingAgent,
  AgentCapability,
  AgentContext,
  AgentInput,
  AgentResult,
  CapabilityType,
  AgentType,
  WritingConfig,
  WritingResult,
  SchemaDefinition,
} from "./types";
import { AgentFailureError } from "./errors";

export class WritingAgent extends BaseAgent implements IWritingAgent {
  public readonly agentType: AgentType = AgentType.WRITING;

  constructor(id: string, capabilities: AgentCapability[], config: any = {}) {
    super(
      id,
      "Writing Agent",
      "Handles content generation and script writing",
      capabilities,
      [],
      {
        timeout: 60000, // 1 minute for content generation
        retries: 2,
        ...config,
      }
    );

    this.capabilities.push({
      type: CapabilityType.CONTENT_GENERATION,
      priority: 90,
      configuration: {
        maxOutputLength: 10000,
        supportedFormats: ["article", "script", "blog", "social"],
      },
    });
  }

  getInputSchema(): SchemaDefinition {
    return {
      type: "object",
      properties: {
        prompt: { type: "string" },
        config: {
          type: "object",
          properties: {
            tone: { type: "string" },
            length: { type: "number" },
            language: { type: "string" },
            structure: { type: "string" },
          },
        },
        contextData: { type: "object" },
      },
      required: ["prompt"],
    };
  }

  getOutputSchema(): SchemaDefinition {
    return {
      type: "object",
      properties: {
        content: { type: "string" },
        metadata: {
          type: "object",
          properties: {
            wordCount: { type: "number" },
            readability: { type: "number" },
            coherence: { type: "number" },
          },
        },
      },
    };
  }

  public async processImpl(
    ctx: AgentContext,
    input: AgentInput
  ): Promise<AgentResult> {
    try {
      const { prompt, config, contextData } = input.data;

      if (!prompt || typeof prompt !== "string") {
        throw new AgentFailureError(
          "Prompt is required for content generation",
          this.id,
          {
            pipelineId: ctx.pipelineId,
          }
        );
      }

      const writingConfig = config || this.getDefaultConfig();
      const result = await this.generateContent(
        prompt,
        writingConfig,
        contextData
      );

      // Store results in context
      await this.storeInContext(ctx, "writingResults", result);

      return this.createSuccessResult(result, {
        promptLength: prompt.length,
        contentLength: result.content.length,
        tone: writingConfig.tone,
        processingTimeMs: Date.now() - ctx.updated.getTime(),
      });
    } catch (error) {
      if (error instanceof AgentFailureError) {
        return this.createFailureResult(
          `Content generation failed: ${error.message}`,
          null,
          { promptPreview: input.data?.prompt?.substring(0, 50) }
        );
      }

      return this.createFailureResult(
        `Unexpected writing error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        null,
        { promptPreview: input.data?.prompt?.substring(0, 50) }
      );
    }
  }

  async generate(
    prompt: string,
    config: WritingConfig
  ): Promise<WritingResult> {
    return this.generateContent(prompt, {
      tone: config.tone || "neutral",
      length: config.length || 500,
      language: config.language || "en",
      structure: config.structure,
    });
  }

  private async generateContent(
    prompt: string,
    config: WritingConfig,
    contextData?: any
  ): Promise<WritingResult> {
    // Mock content generation (in real implementation, use LLM)
    const content = await this.generateMockContent(prompt, config, contextData);

    // Analyze generated content
    const wordCount = content.split(/\s+/).length;
    const readability = this.calculateReadability(content);
    const coherence = this.calculateCoherence(content);

    return {
      content,
      metadata: {
        wordCount,
        readability,
        coherence,
      },
    };
  }

  private async generateMockContent(
    prompt: string,
    config: WritingConfig,
    _contextData?: any
  ): Promise<string> {
    let intro: string;
    let body: string;
    let conclusion: string;

    // Generate based on tone and structure
    switch (config.tone.toLowerCase()) {
      case "professional":
        intro = `Regarding ${prompt}, it is essential to consider the following key aspects.`;
        body = `The subject matter requires careful analysis and strategic consideration. Professional expertise in this domain highlights several important factors that must be addressed to achieve optimal outcomes.`;
        conclusion = `In conclusion, a systematic approach combined with professional insight will yield the most effective results.`;
        break;
      case "casual":
        intro = `So, about ${prompt}... here's what I think.`;
        body = `It's really interesting how this connects to so many different areas. You're probably wondering about the details and how it all fits together.`;
        conclusion = `Anyway, that's my take on it. What do you think?`;
        break;
      case "educational":
        intro = `Let's explore the concept of ${prompt} and its fundamental principles.`;
        body = `Understanding this topic requires examining key components and their interrelationships. Through systematic analysis, we can identify core principles and practical applications.`;
        conclusion = `In summary, mastery of these concepts provides valuable insights for further exploration and application.`;
        break;
      default: // neutral
        intro = `This content explores the topic of ${prompt}.`;
        body = `The discussion covers various aspects of this subject matter. Multiple perspectives and considerations are examined to provide comprehensive understanding.`;
        conclusion = `The analysis reveals important insights that inform our understanding of this topic.`;
    }

    const content = `${intro}\n\n${body}\n\n${conclusion}`;

    // Adjust length based on config
    if (content.length < config.length * 0.8) {
      return this.extendContent(content, config.length);
    } else if (content.length > config.length * 1.2) {
      return content.substring(0, config.length);
    }

    return content;
  }

  private extendContent(baseContent: string, targetLength: number): string {
    // Add detail sections to extend content
    const extensions = [
      "Additional considerations include implementation challenges and potential solutions.",
      "Furthermore, historical context and evolution provide valuable perspectives for understanding current developments.",
      "Practical applications demonstrate how these concepts translate into real-world effectiveness.",
    ];

    let content = baseContent;
    let extensionIndex = 0;

    while (
      content.length < targetLength &&
      extensionIndex < extensions.length
    ) {
      content += `\n\n${extensions[extensionIndex]}`;
      extensionIndex++;
    }

    return content;
  }

  private calculateReadability(content: string): number {
    const words = content.split(/\s+/);
    const sentences = content
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);

    if (words.length === 0 || sentences.length === 0) return 0;

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = this.countSyllables(content) / words.length;

    // Simple readability formula (approximate Flesch score)
    const readability =
      206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
    return Math.min(100, Math.max(0, readability));
  }

  private calculateCoherence(content: string): number {
    // Simple coherence calculation based on word variety and transition usage
    const words = content
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);
    const uniqueWords = new Set(words).size;
    const wordVariety = uniqueWords / words.length;

    const transitions =
      /\b(however|therefore|consequently|furthermore|additionally|moreover|in\s+conclusion)\b/gi;
    const transitionCount = (content.match(transitions) || []).length;

    return Math.min(1.0, wordVariety * 0.7 + transitionCount * 0.05);
  }

  private countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    const vowels = "aeiouy";
    let syllableCount = 0;

    for (const word of words) {
      let wordSyllables = 0;
      let prevWasVowel = false;

      for (let i = 0; i < word.length; i++) {
        const isVowel = vowels.includes(word[i]);
        if (isVowel && !prevWasVowel) {
          wordSyllables++;
        }
        prevWasVowel = isVowel;
      }

      syllableCount += Math.max(1, wordSyllables);
    }

    return syllableCount;
  }

  private getDefaultConfig(): WritingConfig {
    return {
      tone: "neutral",
      length: 500,
      language: "en",
    };
  }

  private async storeInContext(
    ctx: AgentContext,
    key: string,
    data: any
  ): Promise<void> {
    ctx.data.set(key, data);
  }
}
