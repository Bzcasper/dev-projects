/** @format */

// Editing Agent - handles content refinement and editing

import { BaseAgent } from "./base-agent";
import {
  IEditingAgent,
  AgentCapability,
  AgentContext,
  AgentInput,
  AgentResult,
  CapabilityType,
  AgentType,
  EditingStyle,
  EditingResult,
  Change,
  SchemaDefinition,
} from "./types";
import { AgentFailureError } from "./errors";

export class EditingAgent extends BaseAgent implements IEditingAgent {
  public readonly agentType: AgentType = AgentType.EDITING;

  constructor(id: string, capabilities: AgentCapability[], config: any = {}) {
    super(
      id,
      "Editing Agent",
      "Handles content refinement and editing",
      capabilities,
      [],
      {
        timeout: 45000, // 45 seconds for editing
        retries: 2,
        ...config,
      }
    );

    this.capabilities.push({
      type: CapabilityType.LANGUAGE_PROCESSING,
      priority: 85,
      configuration: {
        grammarCheck: true,
        styleImprovement: true,
        clarityEnhancement: true,
      },
    });
  }

  getInputSchema(): SchemaDefinition {
    return {
      type: "object",
      properties: {
        content: { type: "string" },
        style: {
          type: "object",
          properties: {
            rules: { type: "array", items: { type: "string" } },
            targetWPM: { type: "number" },
            preserveFormatting: { type: "object" },
          },
        },
        context: { type: "object" },
      },
      required: ["content"],
    };
  }

  getOutputSchema(): SchemaDefinition {
    return {
      type: "object",
      properties: {
        originalContent: { type: "string" },
        editedContent: { type: "string" },
        changes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              position: { type: "number" },
              original: { type: "string" },
              replacement: { type: "string" },
              reason: { type: "string" },
            },
          },
        },
        score: { type: "number" },
        metadata: { type: "object" },
      },
    };
  }

  protected async processImpl(
    ctx: AgentContext,
    input: AgentInput
  ): Promise<AgentResult> {
    try {
      const { content, style, context } = input.data;

      if (!content || typeof content !== "string") {
        throw new AgentFailureError(
          "Content is required for editing",
          this.id,
          {
            pipelineId: ctx.pipelineId,
          }
        );
      }

      const editingStyle = style || this.getDefaultStyle();
      const result = await this.editContent(content, editingStyle, context);

      // Store results in context
      await this.storeInContext(ctx, "editingResults", result);

      return this.createSuccessResult(result, {
        originalLength: content.length,
        editedLength: result.editedContent.length,
        changesCount: result.changes.length,
        qualityScore: result.score,
        processingTimeMs: Date.now() - ctx.updated.getTime(),
      });
    } catch (error) {
      if (error instanceof AgentFailureError) {
        return this.createFailureResult(
          `Content editing failed: ${error.message}`,
          null,
          { contentLength: input.data?.content?.length }
        );
      }

      return this.createFailureResult(
        `Unexpected editing error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        null,
        { contentLength: input.data?.content?.length }
      );
    }
  }

  async edit(content: string, style: EditingStyle): Promise<EditingResult> {
    return this.editContent(content, style);
  }

  private async editContent(
    content: string,
    style: EditingStyle,
    context?: any
  ): Promise<EditingResult> {
    let editedContent = content;
    const changes: Change[] = [];

    // Apply grammar and spelling corrections
    const grammarResult = await this.applyGrammarCorrections(editedContent);
    editedContent = grammarResult.content;
    changes.push(...grammarResult.changes);

    // Apply style improvements
    const styleResult = await this.applyStyleImprovements(editedContent, style);
    editedContent = styleResult.content;
    changes.push(...styleResult.changes);

    // Apply clarity enhancements
    const clarityResult = await this.applyClarityEnhancements(editedContent);
    editedContent = clarityResult.content;
    changes.push(...clarityResult.changes);

    // Calculate final score
    const score = this.calculateEditingScore(content, editedContent, changes);

    return {
      originalContent: content,
      editedContent,
      changes,
      score,
    };
  }

  private async applyGrammarCorrections(
    content: string
  ): Promise<{ content: string; changes: Change[] }> {
    const changes: Change[] = [];
    let corrected = content;

    // Common grammar corrections (simplified)
    const corrections = [
      { pattern: /\bi\s+/g, replacement: "I ", reason: "capitalize I" },
      { pattern: /\s{2,}/g, replacement: " ", reason: "remove extra spaces" },
      {
        pattern: /([.!?])\s*([a-z])/g,
        replacement: "$1 $2",
        reason: "fix sentence spacing",
      },
      { pattern: /(\w+),\s*,/g, replacement: "$1,", reason: "fix comma usage" },
    ];

    for (let i = 0; i < corrections.length; i++) {
      const before = corrected;
      corrected = corrected.replace(
        corrections[i].pattern,
        corrections[i].replacement
      );

      if (corrected !== before) {
        changes.push({
          position: i,
          original: before.match(corrections[i].pattern)?.[0] || "unknown",
          replacement: corrections[i].replacement,
          reason: corrections[i].reason,
        });
      }
    }

    return { content: corrected, changes };
  }

  private async applyStyleImprovements(
    content: string,
    style: EditingStyle
  ): Promise<{ content: string; changes: Change[] }> {
    const changes: Change[] = [];
    let improved = content;

    // Apply style rules
    for (const rule of style.rules) {
      switch (rule.toLowerCase()) {
        case "remove_passive":
          const passiveResult = this.removePassiveVoice(improved);
          improved = passiveResult.content;
          changes.push(...passiveResult.changes);
          break;
        case "use_active":
          // Passive removal is already handled above
          break;
        case "simplify_sentences":
          const sentenceResult = this.simplifySentences(improved);
          improved = sentenceResult.content;
          changes.push(...sentenceResult.changes);
          break;
        case "improve_flow":
          // Already achieved through previous improvements
          break;
      }
    }

    return { content: improved, changes };
  }

  private removePassiveVoice(content: string): {
    content: string;
    changes: Change[];
  } {
    const changes: Change[] = [];
    // Simple passive voice detection and improvement
    const passivePatterns = [
      {
        pattern: /(\w+)\s+(was|were|is|are|been|being)\s+(\w+ed)/gi,
        replacement: "$3 $1",
        reason: "convert to active voice",
      },
    ];

    let improved = content;
    for (let i = 0; i < passivePatterns.length; i++) {
      const before = improved;
      improved = improved.replace(
        passivePatterns[i].pattern,
        passivePatterns[i].replacement
      );

      if (improved !== before) {
        changes.push({
          position: i,
          original: "passive construction",
          replacement: "active construction",
          reason: passivePatterns[i].reason,
        });
      }
    }

    return { content: improved, changes };
  }

  private simplifySentences(content: string): {
    content: string;
    changes: Change[];
  } {
    const changes: Change[] = [];
    let simplified = content;

    // Break long sentences
    const sentences = simplified.split(/([.!?]+\s+)/);
    const simplifiedSentences: string[] = [];

    for (let i = 0; i < sentences.length; i += 2) {
      let sentence = sentences[i];
      if (sentences[i + 1]) {
        sentence += sentences[i + 1];
      }

      if (sentence.length > 150) {
        // Simple sentence splitting logic
        const words = sentence.split(/\s+/);
        const midpoint = Math.floor(words.length / 2);

        if (midpoint > 0) {
          const firstHalf = words.slice(0, midpoint).join(" ") + ".";
          const secondHalf =
            words.slice(midpoint).join(" ").charAt(0).toUpperCase() +
            words.slice(midpoint).join(" ").slice(1);

          simplifiedSentences.push(firstHalf);
          simplifiedSentences.push(secondHalf);

          changes.push({
            position: simplifiedSentences.length - 2,
            original: sentence.trim(),
            replacement: `${firstHalf} ${secondHalf}`,
            reason: "split long sentence for clarity",
          });
        } else {
          simplifiedSentences.push(sentence);
        }
      } else {
        simplifiedSentences.push(sentence);
      }
    }

    simplified = simplifiedSentences.join("");

    return { content: simplified, changes };
  }

  private async applyClarityEnhancements(
    content: string
  ): Promise<{ content: string; changes: Change[] }> {
    const changes: Change[] = [];
    let enhanced = content;

    // Improve word choice and add clarity
    const vagueWords = [
      {
        pattern: /\bgood\b/gi,
        replacement: "excellent",
        reason: "improve word choice",
      },
      {
        pattern: /\bbad\b/gi,
        replacement: "poor",
        reason: "improve word choice",
      },
      {
        pattern: /\bnice\b/gi,
        replacement: "impressive",
        reason: "improve word choice",
      },
      {
        pattern: /\bthing\b/gi,
        replacement: "aspect",
        reason: "improve word choice",
      },
    ];

    for (let i = 0; i < vagueWords.length; i++) {
      const before = enhanced;
      enhanced = enhanced.replace(
        vagueWords[i].pattern,
        vagueWords[i].replacement
      );

      if (enhanced !== before) {
        changes.push({
          position: i,
          original: vagueWords[i].pattern.source,
          replacement: vagueWords[i].replacement,
          reason: vagueWords[i].reason,
        });
      }
    }

    return { content: enhanced, changes };
  }

  private calculateEditingScore(
    original: string,
    edited: string,
    changes: Change[]
  ): number {
    if (original === edited) return 0;

    const improvementFactors = [
      (changes.length / original.length) * 50, // Improvement density
      Math.min(
        changes.filter((c) => c.reason.includes("clarity")).length * 10,
        20
      ), // Clarity improvements
      Math.min(
        changes.filter((c) => c.reason.includes("grammar")).length * 15,
        20
      ), // Grammar corrections
      Math.min(
        changes.filter((c) => c.reason.includes("active")).length * 10,
        10
      ), // Style improvements
    ];

    const totalScore = improvementFactors.reduce(
      (sum, factor) => sum + factor,
      0
    );
    return Math.min(100, Math.max(0, totalScore));
  }

  private getDefaultStyle(): EditingStyle {
    return {
      rules: ["remove_passive", "simplify_sentences"],
      targetWPM: 200, // Target words per minute for readability
      preserveFormatting: true,
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
