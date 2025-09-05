/** @format */

// Research Agent - handles contextual research and information gathering

import { BaseAgent } from "./base-agent";
import {
  IResearcherAgent,
  AgentCapability,
  AgentContext,
  AgentInput,
  AgentResult,
  CapabilityType,
  AgentType,
  SearchResult,
  SearchFilters,
  SchemaDefinition,
} from "./types";
import { AgentFailureError } from "./errors";

export class ResearchAgent extends BaseAgent implements IResearcherAgent {
  public readonly agentType: AgentType = AgentType.RESEARCHER;
  private readonly vectorSearchService?: any; // Would be injected

  constructor(
    id: string,
    capabilities: AgentCapability[],
    config: any = {},
    vectorSearchService?: any
  ) {
    super(
      id,
      "Research Agent",
      "Handles contextual research and information gathering",
      capabilities,
      [],
      {
        timeout: 60000, // 1 minute for research
        retries: 2,
        ...config,
      }
    );

    this.vectorSearchService = vectorSearchService;
    this.capabilities.push({
      type: CapabilityType.VECTOR_SEARCH,
      priority: 90,
      configuration: {
        enabled: !!vectorSearchService,
      },
    });
  }

  getInputSchema(): SchemaDefinition {
    return {
      type: "object",
      properties: {
        query: { type: "string" },
        filters: {
          type: "object",
          properties: {
            dateRange: {
              type: "object",
              properties: {
                from: { type: "string" },
                to: { type: "string" },
              },
            },
            sources: { type: "array", items: { type: "string" } },
            contentTypes: { type: "array", items: { type: "string" } },
          },
        },
        context: {
          type: "object",
          properties: {
            previousResults: { type: "array" },
            keywords: { type: "array", items: { type: "string" } },
          },
        },
      },
      required: ["query"],
    };
  }

  getOutputSchema(): SchemaDefinition {
    return {
      type: "object",
      properties: {
        results: {
          type: "array",
          items: {
            type: "object",
            properties: {
              score: { type: "number" },
              content: { type: "string" },
              metadata: { type: "object" },
              source: { type: "string" },
            },
          },
        },
        summary: { type: "string" },
        keywords: { type: "array", items: { type: "string" } },
        sourcesUsed: { type: "array", items: { type: "string" } },
      },
    };
  }

  public async processImpl(
    ctx: AgentContext,
    input: AgentInput
  ): Promise<AgentResult> {
    try {
      const { query, filters, context } = input.data;

      if (!query || typeof query !== "string") {
        throw new AgentFailureError("Research query is required", this.id, {
          pipelineId: ctx.pipelineId,
        });
      }

      // Perform research using available capabilities
      const searchResults = await this.performResearch(query, filters, context);

      // Generate summary and extract keywords
      const summary = await this.generateSummary(searchResults);
      const keywords = await this.extractKeywords(searchResults);

      const outputData = {
        results: searchResults,
        summary,
        keywords,
        sourcesUsed: searchResults.map((r) => r.source).filter(Boolean),
        timestamp: new Date().toISOString(),
      };

      // Store results in context for other agents
      await this.storeInContext(ctx, "researchResults", outputData);

      return this.createSuccessResult(outputData, {
        researchQuery: query,
        resultCount: searchResults.length,
        totalSources: searchResults.length,
        processingTimeMs: Date.now() - ctx.updated.getTime(),
      });
    } catch (error) {
      if (error instanceof AgentFailureError) {
        return this.createFailureResult(
          `Research failed: ${error.message}`,
          null,
          { researchQuery: input.data?.query || "" }
        );
      }

      return this.createFailureResult(
        `Unexpected research error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        null,
        { researchQuery: input.data?.query || "" }
      );
    }
  }

  async search(
    query: string,
    filters?: SearchFilters
  ): Promise<SearchResult[]> {
    return this.performResearch(query, filters);
  }

  private async performResearch(
    query: string,
    filters?: SearchFilters,
    _context?: any
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // Use vector search if available
    if (
      this.vectorSearchService &&
      this.hasCapability(CapabilityType.VECTOR_SEARCH)
    ) {
      try {
        const vectorResults = await this.vectorSearchService.search(
          query,
          filters
        );
        results.push(...vectorResults);
      } catch (error) {
        console.warn(`Vector search failed for query "${query}":`, error);
        // Continue with other search methods
      }
    }

    // Mock additional sources (web, docs, etc.)
    // In real implementation, integrate with external APIs
    if (results.length === 0) {
      results.push(...this.generateMockResults(query, filters));
    }

    // Apply filters if provided
    if (filters) {
      results.filter((result) => this.matchesFilters(result, filters));
    }

    // Sort by relevance
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, 10); // Return top 10 results
  }

  private generateMockResults(
    query: string,
    filters?: SearchFilters
  ): SearchResult[] {
    const mockResults: SearchResult[] = [
      {
        score: 0.95,
        content: `Comprehensive information about ${query}. This includes detailed analysis and relevant context.`,
        metadata: {
          type: "article",
          date: new Date().toISOString(),
          author: "Research System",
        },
        source: "Mock Knowledge Base",
      },
      {
        score: 0.88,
        content: `Additional insights related to ${query}, providing supporting evidence and related topics.`,
        metadata: {
          type: "research",
          date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          author: "Research Assistant",
        },
        source: "Mock Documentation",
      },
      {
        score: 0.82,
        content: `Background information and historical context for ${query}.`,
        metadata: {
          type: "historical",
          date: new Date(Date.now() - 604800000).toISOString(), // Last week
          author: "Historical Archive",
        },
        source: "Mock Archive",
      },
    ];

    // Apply any date filters mock
    if (filters?.dateRange) {
      return mockResults.filter((result) => {
        const resultDate = new Date(result.metadata.date);
        return (
          resultDate >= filters.dateRange!.from &&
          resultDate <= filters.dateRange!.to
        );
      });
    }

    return mockResults;
  }

  private matchesFilters(
    result: SearchResult,
    filters: SearchFilters
  ): boolean {
    if (filters.sources && result.source) {
      if (!filters.sources.includes(result.source)) {
        return false;
      }
    }

    if (filters.contentTypes && result.metadata.type) {
      if (!filters.contentTypes.includes(result.metadata.type)) {
        return false;
      }
    }

    if (filters.dateRange && result.metadata.date) {
      const resultDate = new Date(result.metadata.date);
      if (
        resultDate < filters.dateRange.from ||
        resultDate > filters.dateRange.to
      ) {
        return false;
      }
    }

    return true;
  }

  private async generateSummary(results: SearchResult[]): Promise<string> {
    if (results.length === 0) {
      return "No research results found.";
    }

    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    const avgScore = totalScore / results.length;

    const summary = `Research completed with ${
      results.length
    } results. Average relevance score: ${(avgScore * 100).toFixed(
      0
    )}%. Top result on "${results[0].content.substring(
      0,
      100
    )}...". Sources include ${[
      ...new Set(results.map((r) => r.source).filter(Boolean)),
    ].join(", ")}.`;

    return summary;
  }

  private async extractKeywords(results: SearchResult[]): Promise<string[]> {
    if (results.length === 0) return [];

    // Extract keywords from content and metadata
    const keywords = new Set<string>();

    for (const result of results) {
      // Simple keyword extraction (in real implementation, use NLP)
      const contentWords = result.content
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 3)
        .slice(0, 5);

      contentWords.forEach((word) => keywords.add(word));

      if (result.metadata.keywords) {
        result.metadata.keywords.forEach((keyword: string) =>
          keywords.add(keyword.toLowerCase())
        );
      }
    }

    return Array.from(keywords).slice(0, 10);
  }

  private async storeInContext(
    ctx: AgentContext,
    key: string,
    data: any
  ): Promise<void> {
    ctx.data.set(key, data);
  }
}
