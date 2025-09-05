/** @format */

// Agent system type definitions based on AGENT_PIPELINE_ARCHITECTURE.md

export interface IAgent {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  dependencies: AgentDependency[];

  // Core processing method
  process(ctx: AgentContext, input: AgentInput): Promise<AgentResult>;

  // Configuration and validation
  validateConfiguration(config: AgentConfig): ValidationResult;
  initialize(ctx: AgentContext): Promise<void>;
  cleanup(ctx: AgentContext): Promise<void>;

  // Metadata and introspection
  getMetadata(): AgentMetadata;
  getInputSchema(): SchemaDefinition;
  getOutputSchema(): SchemaDefinition;
}

export interface AgentCapability {
  type: CapabilityType;
  priority: number;
  configuration: Record<string, any>;
}

export enum CapabilityType {
  VECTOR_SEARCH = "vector_search",
  TEXT_ANALYSIS = "text_analysis",
  CONTENT_GENERATION = "content_generation",
  FORMAT_CONVERSION = "format_conversion",
  LANGUAGE_PROCESSING = "language_processing",
}

export interface AgentDependency {
  agentId: string;
  outputs: string[];
  required: boolean;
}

export enum AgentType {
  RESEARCHER = "researcher",
  ANALYSIS = "analysis",
  WRITING = "writing",
  EDITING = "editing",
  FORMATTING = "formatting",
}

export interface AgentInput {
  data: any;
  metadata?: Record<string, any>;
  correlationId?: string;
}

export interface AgentResult {
  success: boolean;
  data: any;
  metadata?: Record<string, any>;
  errors?: AgentError[];
}

export interface AgentConfig {
  timeout: number;
  retries: number;
  modelConfig?: {
    provider: string;
    model: string;
    temperature: number;
  };
  customSettings?: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AgentMetadata {
  version: string;
  author: string;
  created: Date;
  updated: Date;
  category: AgentType;
}

export interface SchemaDefinition {
  type: "object" | "string" | "array" | "number";
  properties?: Record<string, SchemaDefinition>;
  required?: string[];
  items?: SchemaDefinition;
}

// Pipeline related types
export enum PipelineMode {
  SEQUENTIAL = "sequential",
  PARALLEL = "parallel",
  HYBRID = "hybrid",
}

export interface PipelineConfig {
  id: string;
  name: string;
  description: string;

  // Execution mode
  mode: PipelineMode;

  // Agent definitions and connections
  agents: AgentDefinition[];
  connections: AgentConnection[];

  // Resource and timing constraints
  timeouts: TimeoutConfig;
  retries: RetryConfig;
  resourceLimits: ResourceLimits;

  // Callback and notification settings
  callbacks: CallbackConfig;
  notifications: NotificationConfig;
}

export interface AgentDefinition {
  id: string;
  agentType: AgentType;
  config: AgentConfig;
  position: { x: number; y: number };
}

export interface AgentConnection {
  fromAgent: string;
  toAgent: string;
  onSuccess: boolean;
  onError?: boolean;
  condition?: string;
}

export interface TimeoutConfig {
  pipeline: number;
  agent: number;
  communication: number;
}

export interface RetryConfig {
  maxAttempts: number;
  backoffStrategy: BackoffStrategy;
  retryCondition?: string;
}

export enum BackoffStrategy {
  LINEAR = "linear",
  EXPONENTIAL = "exponential",
  FIXED = "fixed",
}

export interface ResourceLimits {
  maxMemory: number;
  maxConcurrentAgents: number;
  maxPipelines: number;
}

export interface CallbackConfig {
  onStart?: (pipelineId: string) => void;
  onProgress?: (pipelineId: string, progress: number) => void;
  onComplete?: (pipelineId: string, result: PipelineResult) => void;
  onError?: (pipelineId: string, error: AgentError) => void;
}

export interface NotificationConfig {
  enableProgressNotifications: boolean;
  enableErrorNotifications: boolean;
  enableCompletionNotifications: boolean;
}

export interface PipelineResult {
  pipelineId: string;
  success: boolean;
  result: any;
  executionTime: number;
  errors: AgentError[];
  agentResults: Map<string, AgentResult>;
}

export interface PipelineStatus {
  id: string;
  state: PipelineState;
  progress: number;
  currentAgent?: string;
  errors: AgentError[];
  startTime: Date;
  updatedTime: Date;
}

export enum PipelineState {
  PENDING = "pending",
  RUNNING = "running",
  PAUSED = "paused",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

// Context Management types
export interface IContextManager {
  // Context lifecycle
  createContext(
    pipelineId: string,
    metadata: ContextMetadata
  ): Promise<Context>;
  getContext(contextId: string): Promise<Context>;
  cloneContext(contextId: string): Promise<Context>;
  deleteContext(contextId: string): Promise<boolean>;

  // Data operations
  setData(
    contextId: string,
    key: string,
    data: any,
    schema?: SchemaDefinition
  ): Promise<boolean>;
  getData(contextId: string, key: string): Promise<any>;
  updateData(
    contextId: string,
    key: string,
    updater: DataUpdater
  ): Promise<boolean>;
  deleteData(contextId: string, key: string): Promise<boolean>;

  // Context sharing and versioning
  shareContext(contextId: string, targetPipeline: string): Promise<boolean>;
  createVersion(contextId: string): Promise<string>;
  revertToVersion(contextId: string, versionId: string): Promise<boolean>;

  // Cleanup and maintenance
  cleanupExpiredContexts(): Promise<number>;
  optimizeStorage(): Promise<OptimizationResult>;
}

export interface AgentContext {
  id: string;
  pipelineId: string;
  parentContextId?: string;
  data: Map<string, any>;
  metadata: ContextMetadata;
  version: string;
  created: Date;
  updated: Date;
}

export interface ContextMetadata {
  owner: string;
  tags: string[];
  expiration?: Date;
  storage: StorageType;
}

export enum StorageType {
  MEMORY = "memory",
  DATABASE = "database",
  FILESYSTEM = "filesystem",
}

export interface Context {
  id: string;
  data: Map<string, any>;
  metadata: ContextMetadata;
  version: number;
  created: Date;
  updated: Date;
}

export type DataUpdater = (currentData: any) => any;

export interface OptimizationResult {
  itemsCleaned: number;
  storageFreed: number;
  timeTaken: number;
}

// Communication types
export interface AgentMessage {
  id: string;
  timestamp: Date;
  sender: AgentId;
  recipient: AgentId;
  type: MessageType;
  payload: MessagePayload;
  metadata: MessageMetadata;
}

export type AgentId = string;

export interface MessagePayload {
  contextId: string;
  action: AgentAction;
  data: any;
  correlationId?: string;
}

export enum AgentAction {
  PROCESS = "process",
  VALIDATE = "validate",
  INITIALIZE = "initialize",
  CLEANUP = "cleanup",
}

export enum MessageType {
  REQUEST = "request",
  RESPONSE = "response",
  NOTIFICATION = "notification",
  ERROR = "error",
  HEARTBEAT = "heartbeat",
}

export interface MessageMetadata {
  priority: MessagePriority;
  timeout?: number;
  retries?: number;
}

export enum MessagePriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
}

// Error types
export enum ErrorType {
  AGENT_FAILURE = "agent_failure",
  CONTEXT_CORRUPTION = "context_corruption",
  COMMUNICATION_EXCEPTION = "communication_exception",
  TIMEOUT_EXCEEDED = "timeout_exceeded",
  RESOURCE_EXHAUSTED = "resource_exhausted",
  VALIDATION_ERROR = "validation_error",
}

export interface AgentError extends Error {
  type: ErrorType;
  agentId?: string;
  pipelineId?: string;
  critical: boolean;
  retryable: boolean;
  metadata?: Record<string, any>;
}

// Specialized Agent Types
export interface IResearcherAgent extends IAgent {
  search(query: string, filters?: SearchFilters): Promise<SearchResult[]>;
  integrateVectorSearch?: boolean;
}

export interface IAnalysisAgent extends IAgent {
  analyze(data: any, criteria: AnalysisCriteria): Promise<AnalysisResult>;
}

export interface IWritingAgent extends IAgent {
  generate(prompt: string, config: WritingConfig): Promise<WritingResult>;
}

export interface IEditingAgent extends IAgent {
  edit(content: string, style: EditingStyle): Promise<EditingResult>;
}

export interface IFormattingAgent extends IAgent {
  format(content: string, targetFormat: FormatType): Promise<FormattingResult>;
}

export interface SearchResult {
  score: number;
  content: string;
  metadata: Record<string, any>;
  source?: string;
}

export interface SearchFilters {
  dateRange?: { from: Date; to: Date };
  sources?: string[];
  contentTypes?: string[];
}

export interface AnalysisCriteria {
  metrics: string[];
  thresholds: Record<string, number>;
}

export interface AnalysisResult {
  insights: Insight[];
  score: number;
  recommendations: string[];
}

export interface Insight {
  type: string;
  value: any;
  confidence: number;
}

export interface WritingConfig {
  tone: string;
  length: number;
  language: string;
  structure?: string;
}

export interface WritingResult {
  content: string;
  metadata: {
    wordCount: number;
    readability: number;
    coherence: number;
  };
}

export interface EditingStyle {
  rules: string[];
  targetWPM: number;
  preserveFormatting: boolean;
}

export interface EditingResult {
  originalContent: string;
  editedContent: string;
  changes: Change[];
  score: number;
}

export interface Change {
  position: number;
  original: string;
  replacement: string;
  reason: string;
}

export enum FormatType {
  HEYGEN_JSON = "heygen_json",
  BLOG_HTML = "blog_html",
  PLAIN_TEXT = "plain_text",
  MARKDOWN = "markdown",
}

export interface FormattingResult {
  content: string;
  format: FormatType;
  metadata: Record<string, any>;
}

// Pipeline Orchestrator interface
export interface IPipelineOrchestrator {
  // Pipeline lifecycle management
  createPipeline(config: PipelineConfig): Promise<Pipeline>;
  executePipeline(
    pipeline: Pipeline,
    input: PipelineInput
  ): Promise<PipelineResult>;
  pausePipeline(pipelineId: string): Promise<boolean>;
  resumePipeline(pipelineId: string): Promise<boolean>;
  cancelPipeline(pipelineId: string): Promise<boolean>;

  // Monitoring and status
  getPipelineStatus(pipelineId: string): Promise<PipelineStatus>;
  getActivePipelines(): Promise<Pipeline[]>;
  getPipelineHistory(query: HistoryQuery): Promise<Pipeline[]>;
}

export interface Pipeline {
  id: string;
  config: PipelineConfig;
  status: PipelineStatus;
  context: AgentContext;
}

export interface PipelineInput {
  data: any;
  metadata?: Record<string, any>;
  contextId?: string;
}

export interface HistoryQuery {
  dateRange?: { from: Date; to: Date };
  status?: PipelineState;
  limit?: number;
  offset?: number;
}

// Agent Registry
export interface AgentRegistry {
  registerAgent(agent: IAgent): Promise<boolean>;
  unregisterAgent(agentId: string): Promise<boolean>;
  getAvailableAgents(): Promise<IAgent[]>;
  getAgentsByCapability(capability: CapabilityType): Promise<IAgent[]>;
}
