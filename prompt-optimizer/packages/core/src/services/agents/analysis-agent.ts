/** @format */

// Analysis Agent - handles content analysis and insight generation

import { BaseAgent } from "./base-agent";
import {
  IAnalysisAgent,
  AgentCapability,
  AgentContext,
  AgentInput,
  AgentResult,
  CapabilityType,
  AgentType,
  AnalysisCriteria,
  AnalysisResult,
  Insight,
  SchemaDefinition,
} from "./types";
import { AgentFailureError } from "./errors";

export class AnalysisAgent extends BaseAgent implements IAnalysisAgent {
  public readonly agentType: AgentType = AgentType.ANALYSIS;

  constructor(id: string, capabilities: AgentCapability[], config: any = {}) {
    super(
      id,
      "Analysis Agent",
      "Handles content analysis and insight generation",
      capabilities,
      [],
      {
        timeout: 45000, // 45 seconds for analysis
        retries: 2,
        ...config,
      }
    );

    this.capabilities.push({
      type: CapabilityType.TEXT_ANALYSIS,
      priority: 85,
      configuration: {
        maxContentLength: 50000,
      },
    });
  }

  getInputSchema(): SchemaDefinition {
    return {
      type: "object",
      properties: {
        content: { type: "string" },
        criteria: {
          type: "object",
          properties: {
            metrics: { type: "array", items: { type: "string" } },
            thresholds: { type: "object" },
          },
        },
        contextData: { type: "object" },
      },
      required: ["content"],
    };
  }

  getOutputSchema(): SchemaDefinition {
    return {
      type: "object",
      properties: {
        insights: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              value: { type: "object" },
              confidence: { type: "number" },
            },
          },
        },
        score: { type: "number" },
        recommendations: { type: "array", items: { type: "string" } },
        metadata: { type: "object" },
      },
    };
  }

  public async processImpl(
    ctx: AgentContext,
    input: AgentInput
  ): Promise<AgentResult> {
    try {
      const { content, criteria, contextData } = input.data;

      if (!content || typeof content !== "string") {
        throw new AgentFailureError(
          "Content is required for analysis",
          this.id,
          {
            pipelineId: ctx.pipelineId,
          }
        );
      }

      // Perform analysis
      const analysisResult = await this.analyzeContent(
        content,
        criteria || this.getDefaultCriteria(),
        contextData
      );

      // Store results in context
      await this.storeInContext(ctx, "analysisResults", analysisResult);

      return this.createSuccessResult(analysisResult, {
        contentLength: content.length,
        criteriaCount: (criteria as any)?.metrics?.length || 0,
        insightCount: analysisResult.insights.length,
        processingTimeMs: Date.now() - ctx.updated.getTime(),
      });
    } catch (error) {
      if (error instanceof AgentFailureError) {
        return this.createFailureResult(
          `Analysis failed: ${error.message}`,
          null,
          { contentType: typeof input.data?.content }
        );
      }

      return this.createFailureResult(
        `Unexpected analysis error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        null,
        { contentType: typeof input.data?.content }
      );
    }
  }

  async analyze(
    data: any,
    criteria: AnalysisCriteria
  ): Promise<AnalysisResult> {
    if (!data || typeof data !== "string") {
      throw new AgentFailureError(
        "Invalid data for analysis - expected string content",
        this.id
      );
    }

    return this.analyzeContent(data, criteria);
  }

  private async analyzeContent(
    content: string,
    criteria: AnalysisCriteria,
    _contextData?: any
  ): Promise<AnalysisResult> {
    const insights: Insight[] = [];

    // Extract basic metrics
    const wordCount = content.split(/\s+/).length;
    const sentenceCount = (content.match(/[.!?]+/g) || []).length;
    const avgWordsPerSentence =
      sentenceCount > 0 ? wordCount / sentenceCount : wordCount;

    // Perform analysis based on requested metrics
    for (const metric of criteria.metrics) {
      switch (metric.toLowerCase()) {
        case "sentiment":
          if (this.analyzeSentiment) {
            insights.push(await this.analyzeSentiment(content));
          }
          break;
        case "readability":
          insights.push(
            this.analyzeReadability(content, wordCount, sentenceCount)
          );
          break;
        case "topics":
          insights.push(await this.extractTopics(content));
          break;
        case "engagement":
          insights.push(this.analyzeEngagement(content));
          break;
        case "structure":
          insights.push(this.analyzeStructure(content));
          break;
        case "complexity":
          insights.push(this.analyzeComplexity(content, avgWordsPerSentence));
          break;
      }
    }

    // Calculate overall score
    const overallScore =
      insights.reduce((sum, insight) => sum + insight.confidence, 0) /
        insights.length || 0;

    // Generate recommendations
    const recommendations = await this.generateRecommendations(
      insights,
      criteria,
      overallScore
    );

    return {
      insights,
      score: overallScore,
      recommendations,
    };
  }

  private analyzeReadability(
    content: string,
    wordCount: number,
    sentenceCount: number
  ): Insight {
    // Simplified Flesch Reading Ease Score
    const syllables = this.countSyllables(content);
    const avgSyllablesPerWord = syllables / wordCount;
    const avgWordsPerSentence =
      sentenceCount > 0 ? wordCount / sentenceCount : wordCount;

    // Flesch Reading Ease: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
    const fleschScore = Math.max(
      0,
      Math.min(
        100,
        206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord
      )
    );

    let level: string;
    let confidence: number;

    if (fleschScore >= 90) {
      level = "Very Easy";
      confidence = 0.95;
    } else if (fleschScore >= 80) {
      level = "Easy";
      confidence = 0.88;
    } else if (fleschScore >= 70) {
      level = "Fairly Easy";
      confidence = 0.82;
    } else if (fleschScore >= 60) {
      level = "Standard";
      confidence = 0.75;
    } else if (fleschScore >= 50) {
      level = "Fairly Difficult";
      confidence = 0.68;
    } else if (fleschScore >= 30) {
      level = "Difficult";
      confidence = 0.6;
    } else {
      level = "Very Difficult";
      confidence = 0.5;
    }

    return {
      type: "readability",
      value: { fleschScore, level },
      confidence,
    };
  }

  private async extractTopics(content: string): Promise<Insight> {
    // Simple topic extraction (in real implementation, use NLP/LLM)
    const words = content
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3);
    const wordFrequency = words.reduce((freq, word) => {
      freq[word] = (freq[word] || 0) + 1;
      return freq;
    }, {} as Record<string, number>);

    const topics = Object.entries(wordFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word, count]) => `${word}(${count})`);

    return {
      type: "topics",
      value: topics,
      confidence: 0.7, // Moderate confidence with simple method
    };
  }

  private analyzeEngagement(content: string): Insight {
    // Simple engagement metrics
    const questionCount = (content.match(/\?/g) || []).length;
    const exclamationCount = (content.match(/!/g) || []).length;
    const personalPronouns = this.countPersonalPronouns(content);
    const callToActions = this.countCallToActions(content);

    const engagementScore = Math.min(
      1.0,
      questionCount * 0.3 +
        exclamationCount * 0.2 +
        personalPronouns * 0.1 +
        callToActions * 0.4
    );

    return {
      type: "engagement",
      value: {
        questionCount,
        exclamationCount,
        personalPronouns,
        callToActions,
        engagementScore,
      },
      confidence: 0.75,
    };
  }

  private analyzeStructure(content: string): Insight {
    const paragraphs = content.split(/\n\s*\n/).length;
    const headingIndicators = (content.match(/^#+\s/gm) || []).length;
    const bulletPoints = (content.match(/^[\*\-\+]\s/gm) || []).length;
    const numberedItems = (content.match(/^\d+\.\s/gm) || []).length;

    const structureScore = Math.min(
      1.0,
      paragraphs / 10 +
        headingIndicators / 5 +
        bulletPoints / 10 +
        numberedItems / 10
    );

    return {
      type: "structure",
      value: {
        paragraphs,
        headings: headingIndicators,
        bullets: bulletPoints,
        numbered: numberedItems,
        structureScore,
      },
      confidence: 0.8,
    };
  }

  private analyzeComplexity(
    content: string,
    avgWordsPerSentence: number
  ): Insight {
    const complexWords = this.countComplexWords(content);
    const simpleWords = content.split(/\s+/).length - complexWords;
    const complexityRatio = complexWords / (simpleWords + complexWords);

    const complexityScore = Math.min(
      1.0,
      complexityRatio * 0.6 + Math.min(avgWordsPerSentence / 20, 0.4)
    );

    return {
      type: "complexity",
      value: {
        complexWordCount: complexWords,
        complexityRatio: Math.round(complexityRatio * 100) / 100,
        avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
        complexityScore,
      },
      confidence: 0.75,
    };
  }

  private getDefaultCriteria(): AnalysisCriteria {
    return {
      metrics: ["readability", "engagement", "structure", "topics"],
      thresholds: {},
    };
  }

  private async generateRecommendations(
    insights: Insight[],
    _criteria: AnalysisCriteria,
    overallScore: number
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Generate recommendations based on analysis results
    for (const insight of insights) {
      switch (insight.type) {
        case "readability":
          const readabilityData = insight.value as any;
          if (readabilityData.fleschScore < 60) {
            recommendations.push(
              "Consider simplifying language and sentence structure for better readability"
            );
          }
          break;

        case "engagement":
          const engagementData = insight.value as any;
          if (engagementData.engagementScore < 0.5) {
            recommendations.push(
              "Add more questions and personal pronouns to increase engagement"
            );
          }
          break;

        case "structure":
          const structureData = insight.value as any;
          if (structureData.paragraphs < 3) {
            recommendations.push(
              "Add more paragraph breaks to improve content structure"
            );
          }
          break;

        case "topics":
          const topics = insight.value as any;
          if (topics.length < 3) {
            recommendations.push(
              "Consider expanding on more diverse topics for comprehensive coverage"
            );
          }
          break;
      }
    }

    if (overallScore < 0.7) {
      recommendations.unshift(
        "Overall quality could be improved - consider the specific recommendations above"
      );
    }

    return recommendations;
  }

  // Helper methods
  private analyzeSentiment?(content: string): Promise<Insight> {
    // Would integrate with sentiment analysis service
    const sentimentWords =
      content.match(
        /\b(good|great|excellent|amazing|awesome|terrible|awful|bad|poor|horrible)\b/gi
      ) || [];
    const positive = sentimentWords.filter((word) =>
      ["good", "great", "excellent", "amazing", "awesome"].includes(
        word.toLowerCase()
      )
    ).length;
    const negative = sentimentWords.length - positive;

    let sentiment: string;
    let score: number;

    if (positive > negative * 1.5) {
      sentiment = "positive";
      score = 0.8;
    } else if (negative > positive * 1.5) {
      sentiment = "negative";
      score = -0.8;
    } else {
      sentiment = "neutral";
      score = 0.1;
    }

    return Promise.resolve({
      type: "sentiment",
      value: { sentiment, score },
      confidence: Math.min(0.8, sentimentWords.length / 20),
    });
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

  private countComplexWords(content: string): number {
    const words = content.toLowerCase().split(/\s+/);
    let complexCount = 0;

    for (const word of words) {
      const syllables = this.countSyllables(word);
      if (syllables >= 3) {
        complexCount++;
      }
    }

    return complexCount;
  }

  private countPersonalPronouns(content: string): number {
    const pronouns =
      /\b(I|me|my|mine|you|your|yours|he|him|his|she|her|hers|it|its|we|us|our|ours|they|them|their|theirs)\b/gi;
    return (content.match(pronouns) || []).length;
  }

  private countCallToActions(content: string): number {
    // Simple CTAs detection
    const ctaPatterns = [
      /\b(click|learn|discover|get|start|try|sign\s+up|contact|buy|download|subscribe)\s+\b/gi,
      /\b(call|email|visit|go\s+to)\b/gi,
      /\b(more|info|details)/gi,
    ];

    let ctaCount = 0;
    for (const pattern of ctaPatterns) {
      ctaCount += (content.match(pattern) || []).length;
    }

    return ctaCount;
  }

  private async storeInContext(
    ctx: AgentContext,
    key: string,
    data: any
  ): Promise<void> {
    ctx.data.set(key, data);
  }
}
