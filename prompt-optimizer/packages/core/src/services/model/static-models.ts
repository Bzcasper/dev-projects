/** @format */

import { ModelConfig } from "./types";

/**
 * 静态模型配置定义
 * 这些配置在所有环境中都是相同的
 */
export function createStaticModels(envVars: {
  OPENAI_API_KEY: string;
  GROQ_API_KEY: string;
  GEMINI_API_KEY: string;
  DEEPSEEK_API_KEY: string;
  SILICONFLOW_API_KEY: string;
  ZHIPU_API_KEY: string;
  CUSTOM_API_KEY: string;
  CUSTOM_API_BASE_URL: string;
  CUSTOM_API_MODEL: string;
}): Record<string, ModelConfig> {
  return {
    openai: {
      name: "OpenAI",
      baseURL: "https://api.openai.com/v1",
      models: [
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-4",
        "gpt-3.5-turbo",
        "o1",
        "o1-mini",
        "o1-preview",
        "o3",
        "o4-mini",
      ],
      defaultModel: "gpt-4o-mini",
      apiKey: envVars.OPENAI_API_KEY,
      enabled: !!envVars.OPENAI_API_KEY,
      provider: "openai",
      llmParams: {},
    },
    groq: {
      name: "Groq",
      baseURL: "https://api.groq.com",
      models: [
        "llama-3.3-70b-versatile",
        "llama-3.2-90b-text-preview",
        "llama-3.2-11b-vision-preview",
        "llama-3.2-1b-preview",
        "llama-3.2-3b-preview",
        "llama-3.1-8b-instant",
        "llama-3.1-70b-versatile",
        "llama-3.1-405b-instruct",
        "gemma2-9b-it",
        "mixtral-8x7b-32768",
      ],
      defaultModel: "llama-3.3-70b-versatile",
      apiKey: envVars.GROQ_API_KEY,
      enabled: !!envVars.GROQ_API_KEY,
      provider: "groq",
      llmParams: {
        temperature: 0.7,
        max_tokens: 4096,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
    },
    groq_fast: {
      name: "Groq Fast Response",
      baseURL: "https://api.groq.com",
      models: ["llama-3.2-3b-preview", "llama-3.1-8b-instant", "gemma2-9b-it"],
      defaultModel: "llama-3.1-8b-instant",
      apiKey: envVars.GROQ_API_KEY,
      enabled: !!envVars.GROQ_API_KEY,
      provider: "groq",
      useVercelProxy: true,
      llmParams: {
        temperature: 0.6,
        max_tokens: 1024,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
      },
    },
    groq_reasoning: {
      name: "Groq Reasoning",
      baseURL: "https://api.groq.com",
      models: [
        "llama-3.3-70b-versatile",
        "llama-3.1-70b-versatile",
        "llama-3.1-405b-instruct",
      ],
      defaultModel: "llama-3.3-70b-versatile",
      apiKey: envVars.GROQ_API_KEY,
      enabled: !!envVars.GROQ_API_KEY,
      provider: "groq",
      useVercelProxy: true,
      llmParams: {
        temperature: 0.3,
        max_tokens: 8192,
        top_p: 0.8,
        frequency_penalty: 0.3,
        presence_penalty: 0.2,
      },
    },
    groq_creative: {
      name: "Groq Creative",
      baseURL: "https://api.groq.com",
      models: [
        "llama-3.2-90b-text-preview",
        "llama-3.3-70b-versatile",
        "llama-3.1-70b-versatile",
      ],
      defaultModel: "llama-3.2-90b-text-preview",
      apiKey: envVars.GROQ_API_KEY,
      enabled: !!envVars.GROQ_API_KEY,
      provider: "groq",
      llmParams: {
        temperature: 0.9,
        max_tokens: 4096,
        top_p: 1.0,
        frequency_penalty: -0.1,
        presence_penalty: 0.3,
      },
    },
    gemini: {
      name: "Gemini",
      baseURL: "https://generativelanguage.googleapis.com",
      models: ["gemini-2.0-flash"],
      defaultModel: "gemini-2.0-flash",
      apiKey: envVars.GEMINI_API_KEY,
      enabled: !!envVars.GEMINI_API_KEY,
      provider: "gemini",
      llmParams: {},
    },
    deepseek: {
      name: "DeepSeek",
      baseURL: "https://api.deepseek.com/v1",
      models: ["deepseek-chat", "deepseek-reasoner"],
      defaultModel: "deepseek-chat",
      apiKey: envVars.DEEPSEEK_API_KEY,
      enabled: !!envVars.DEEPSEEK_API_KEY,
      provider: "deepseek",
      llmParams: {},
    },
    siliconflow: {
      name: "SiliconFlow",
      baseURL: "https://api.siliconflow.cn/v1",
      models: ["Qwen/Qwen3-8B"],
      defaultModel: "Qwen/Qwen3-8B",
      apiKey: envVars.SILICONFLOW_API_KEY,
      enabled: !!envVars.SILICONFLOW_API_KEY,
      provider: "siliconflow",
      llmParams: {},
    },
    zhipu: {
      name: "Zhipu",
      baseURL: "https://open.bigmodel.cn/api/paas/v4",
      models: [
        "glm-4-plus",
        "glm-4-0520",
        "glm-4",
        "glm-4-air",
        "glm-4-airx",
        "glm-4-flash",
      ],
      defaultModel: "glm-4-flash",
      apiKey: envVars.ZHIPU_API_KEY,
      enabled: !!envVars.ZHIPU_API_KEY,
      provider: "zhipu",
      llmParams: {},
    },
    custom: {
      name: "Custom",
      baseURL: envVars.CUSTOM_API_BASE_URL || "http://localhost:11434/v1",
      models: [envVars.CUSTOM_API_MODEL || "custom-model"],
      defaultModel: envVars.CUSTOM_API_MODEL || "custom-model",
      apiKey: envVars.CUSTOM_API_KEY,
      enabled: !!envVars.CUSTOM_API_KEY,
      provider: "custom",
      llmParams: {},
    },
  };
}
