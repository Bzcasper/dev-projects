/**
 * Electron Proxy for Vector Search Service
 * Provides IPC bridge for Electron renderer process
 */

import type {
  IVectorSearchService,
  VectorSearchConfig,
  VectorSearchDocument,
  SearchResult,
  VectorSearchQuery,
} from "./types";

interface VectorElectronAPI {
  vector?: {
    initialize: (config: VectorSearchConfig) => Promise<void>;
    addDocuments: (documents: VectorSearchDocument[]) => Promise<void>;
    search: (query: VectorSearchQuery) => Promise<SearchResult[]>;
    deleteDocuments: (ids: string[]) => Promise<void>;
    getCollectionInfo: () => Promise<{
      name: string;
      count: number;
      metadata?: Record<string, any>;
    }>;
    isReady: () => Promise<boolean>;
  };
}

export class ElectronVectorSearchProxy implements IVectorSearchService {
  private electronAPI: NonNullable<VectorElectronAPI["vector"]>;

  constructor() {
    const electronAPI = (window as any).electronAPI as VectorElectronAPI;
    if (!electronAPI?.vector) {
      throw new Error(
        "Electron Vector API not available. Make sure you are running in Electron environment.",
      );
    }
    this.electronAPI = electronAPI.vector;
  }

  async initialize(config: VectorSearchConfig): Promise<void> {
    return await this.electronAPI.initialize(config);
  }

  async addDocuments(documents: VectorSearchDocument[]): Promise<void> {
    return await this.electronAPI.addDocuments(documents);
  }

  async search(query: VectorSearchQuery): Promise<SearchResult[]> {
    return await this.electronAPI.search(query);
  }

  async deleteDocuments(ids: string[]): Promise<void> {
    return await this.electronAPI.deleteDocuments(ids);
  }

  async getCollectionInfo(): Promise<{
    name: string;
    count: number;
    metadata?: Record<string, any>;
  }> {
    return await this.electronAPI.getCollectionInfo();
  }

  isReady(): boolean {
    // Note: Electron IPC is async, but this method needs to be sync
    // In practice, you might want to cache the ready state
    throw new Error(
      "isReady() not supported in Electron proxy. Use getCollectionInfo() instead.",
    );
  }
}
