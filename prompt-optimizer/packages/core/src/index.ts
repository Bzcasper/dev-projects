/** @format */

// Core package entry point

// 导出模板相关
export {
  TemplateManager,
  createTemplateManager,
} from "./services/template/manager";
export { TemplateProcessor } from "./services/template/processor";
export {
  TemplateLanguageService,
  createTemplateLanguageService,
} from "./services/template/languageService";
export type {
  BuiltinTemplateLanguage,
  ITemplateLanguageService,
} from "./services/template/languageService";
export * from "./services/template/types";
export { StaticLoader } from "./services/template/static-loader";
export * from "./services/template/errors";
export { ElectronTemplateManagerProxy } from "./services/template/electron-proxy";
export { ElectronTemplateLanguageServiceProxy } from "./services/template/electron-language-proxy";

// 导出历史记录相关
export {
  HistoryManager,
  createHistoryManager,
} from "./services/history/manager";
export * from "./services/history/types";
export * from "./services/history/errors";
export { ElectronHistoryManagerProxy } from "./services/history/electron-proxy";

// 导出LLM服务相关
export type {
  ILLMService,
  Message,
  StreamHandlers,
  LLMResponse,
  ModelInfo,
  ModelOption,
} from "./services/llm/types";
export { LLMService, createLLMService } from "./services/llm/service";
export { ElectronLLMProxy } from "./services/llm/electron-proxy";
export * from "./services/llm/errors";

// 导出模型管理相关
export { ModelManager, createModelManager } from "./services/model/manager";
export * from "./services/model/types";
export * from "./services/model/defaults";
export * from "./services/model/advancedParameterDefinitions";
export { ElectronModelManagerProxy } from "./services/model/electron-proxy";
export {
  ElectronConfigManager,
  isElectronRenderer,
} from "./services/model/electron-config";

// 导出存储相关
export * from "./services/storage/types";
export { StorageFactory } from "./services/storage/factory";
export { DexieStorageProvider } from "./services/storage/dexieStorageProvider";
export { LocalStorageProvider } from "./services/storage/localStorageProvider";
export { MemoryStorageProvider } from "./services/storage/memoryStorageProvider";
export { FileStorageProvider } from "./services/storage/fileStorageProvider";

// 导出提示词服务相关
export { PromptService } from "./services/prompt/service";
export { createPromptService } from "./services/prompt/factory";
export * from "./services/prompt/types";
export { ElectronPromptServiceProxy } from "./services/prompt/electron-proxy";
export * from "./services/prompt/errors";

// 导出对比服务相关
export {
  CompareService,
  createCompareService,
} from "./services/compare/service";
export type { ICompareService } from "./services/compare/types";
export * from "./services/compare/types";
export * from "./services/compare/errors";

// 导出偏好设置服务相关
export * from "./services/preference/types";
export { ElectronPreferenceServiceProxy } from "./services/preference/electron-proxy";
export {
  PreferenceService,
  createPreferenceService,
} from "./services/preference/service";

// 导出向量搜索服务相关
export {
  VectorSearchService,
  createVectorSearchService,
} from "./services/vector/service";
export * from "./services/vector/types";
export {
  VectorSearchError,
  ChromaConnectionError,
  EmbeddingError,
  SearchError,
} from "./services/vector/errors";
export { ElectronVectorSearchProxy } from "./services/vector/electron-proxy";

// 导出LiteLLM智能路由服务相关
export {
  LiteLLMService,
  createLiteLLMService,
} from "./services/litellm-routing/litellm-service";
export { LiteLLMProvider as LiteLLMProviderClass } from "./services/litellm-routing/service";
export * from "./services/litellm-routing/types";
export {
  LiteLLMError,
  LiteLLMConnectionError,
  LiteLLMAuthenticationError,
  LiteLLMModelError,
  LiteLLMRoutingError,
  CircuitBreakerOpenError as LiteLLMCircuitBreakerError,
  HealthCheckError,
  QuotaExceededError,
  TimeoutError as LiteLLMTimeoutError,
} from "./services/litellm-routing/errors";
export { ElectronLiteLLMProxy } from "./services/litellm-routing/electron-proxy";
export { HealthChecker } from "./services/litellm-routing/health-checker";
export { CircuitBreaker } from "./services/litellm-routing/circuit-breaker";

// 导出多Agent管道系统相关
export { BaseAgent } from "./services/agents/base-agent";
export { ResearchAgent } from "./services/agents/research-agent";
export { AnalysisAgent } from "./services/agents/analysis-agent";
export { WritingAgent } from "./services/agents/writing-agent";
export { EditingAgent } from "./services/agents/editing-agent";
export { FormattingAgent } from "./services/agents/formatting-agent";
export { PipelineOrchestrator } from "./services/agents/pipeline-orchestrator";
export { ContextManager } from "./services/agents/context-manager";
export {
  AgentMessageBus,
  createProcessRequest,
  createProcessResponse,
  createHeartbeatMessage,
} from "./services/agents/message-passing";
export {
  MainProcessAgentProxy,
  RendererProcessAgentProxy,
  createElectronAgentProxy,
  isElectronEnvironment,
  isMainProcess,
  isRendererProcess,
  setupPreloadApi,
} from "./services/agents/electron-proxy";

// 导出Agent系统类型
export type {
  IAgent,
  IResearcherAgent,
  IAnalysisAgent,
  IWritingAgent,
  IEditingAgent,
  IFormattingAgent,
  AgentType,
  CapabilityType,
  AgentCapability,
  AgentDependency,
  AgentContext,
  AgentInput,
  AgentResult,
  AgentConfig,
  ValidationResult as AgentValidationResult,
  AgentMetadata,
  SchemaDefinition,
  PipelineMode,
  PipelineConfig,
  AgentDefinition,
  AgentConnection,
  PipelineResult,
  PipelineStatus,
  PipelineState,
  IContextManager,
  Context,
  ContextMetadata,
  StorageType,
  DataUpdater,
  OptimizationResult,
  IPipelineOrchestrator,
  Pipeline,
  PipelineInput,
  HistoryQuery,
  AgentRegistry,
} from "./services/agents/types";

// 导出Agent系统错误
export {
  AgentError,
  AgentFailureError,
  AgentInitializationError,
  AgentNotFoundError,
  ContextCorruptionError,
  ContextNotFoundError,
  CommunicationException,
  TimeoutExceededError,
  ResourceExhaustedError,
  MessageDeliveryError,
  ValidationError as AgentValidationError,
  PipelineExecutionError,
  InvalidPipelineConfigError,
  CircuitBreakerOpenError,
  wrapError,
  isCriticalError,
  isRetryableError,
  getErrorType,
  logError,
} from "./services/agents/errors";

// 导出消息传递相关
export type {
  MessageBus,
  MessageHandler,
} from "./services/agents/message-passing";
export type {
  AgentMessage,
  MessagePayload,
  AgentAction,
  MessageType,
  MessageMetadata,
  MessagePriority,
} from "./services/agents/types";

// 导出Electron代理接口
export type { ElectronAgentProxy } from "./services/agents/electron-proxy";

// 导出环境检测工具
export {
  isRunningInElectron,
  isElectronApiReady,
  waitForElectronApi,
  checkVercelApiAvailability,
  resetVercelStatusCache,
  checkDockerApiAvailability,
  resetDockerStatusCache,
  isVercel,
  isDocker,
  isBrowser,
  getProxyUrl,
  getEnvVar,
  scanCustomModelEnvVars,
  clearCustomModelEnvCache,
  CUSTOM_API_PATTERN,
  SUFFIX_PATTERN,
  MAX_SUFFIX_LENGTH,
} from "./utils/environment";
export type {
  CustomModelEnvConfig,
  ValidatedCustomModelEnvConfig,
  ValidationResult,
} from "./utils/environment";
export type {
  LLMValidationResult,
  ValidationError as LLMValidationError,
  ValidationWarning,
} from "./services/model/validation";
export { validateCustomModelConfig } from "./utils/environment";

// 导出IPC序列化工具
export {
  safeSerializeForIPC,
  debugIPCSerializability,
  safeSerializeArgs,
} from "./utils/ipc-serialization";

// 导出存储键常量
export {
  CORE_SERVICE_KEYS,
  UI_SETTINGS_KEYS,
  MODEL_SELECTION_KEYS,
  TEMPLATE_SELECTION_KEYS,
  ALL_STORAGE_KEYS,
  ALL_STORAGE_KEYS_ARRAY,
} from "./constants/storage-keys";
export type {
  CoreServiceKey,
  UISettingsKey,
  ModelSelectionKey,
  TemplateSelectionKey,
  StorageKey,
} from "./constants/storage-keys";
