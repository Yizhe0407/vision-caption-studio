import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import type { AIProviderType } from "@prisma/client";
import type { AIProvider } from "@/src/infrastructure/ai/types";
import { OpenAIProvider } from "@/src/infrastructure/ai/providers/openai-provider";
import { OpenRouterProvider } from "@/src/infrastructure/ai/providers/openrouter-provider";
import { GeminiProvider } from "@/src/infrastructure/ai/providers/gemini-provider";
import { ClaudeProvider } from "@/src/infrastructure/ai/providers/claude-provider";
import { NvidiaNimProvider } from "@/src/infrastructure/ai/providers/nvidia-nim-provider";

export class AIProviderFactory {
  private static readonly MAX_CACHE_SIZE = 100;
  private readonly providerCache = new Map<string, AIProvider>();

  resolve(provider: AIProviderType, apiKey: string): AIProvider {
    const cacheKey = `${provider}:${apiKey}`;
    const cached = this.providerCache.get(cacheKey);
    if (cached) {
      this.providerCache.delete(cacheKey);
      this.providerCache.set(cacheKey, cached);
      return cached;
    }

    if (this.providerCache.size >= AIProviderFactory.MAX_CACHE_SIZE) {
      const oldestKey = this.providerCache.keys().next().value;
      if (oldestKey) {
        this.providerCache.delete(oldestKey);
      }
    }

    const created = this.createProvider(provider, apiKey);
    this.providerCache.set(cacheKey, created);
    return created;
  }

  private createProvider(provider: AIProviderType, apiKey: string): AIProvider {
    switch (provider) {
      case "OPENAI":
        return new OpenAIProvider(
          new OpenAI({
            apiKey,
          }),
        );
      case "OPENROUTER":
        return new OpenRouterProvider(
          new OpenAI({
            apiKey,
            baseURL: "https://openrouter.ai/api/v1",
          }),
        );
      case "GEMINI":
        return new GeminiProvider(new GoogleGenerativeAI(apiKey));
      case "CLAUDE":
        return new ClaudeProvider(
          new Anthropic({
            apiKey,
          }),
        );
      case "NVIDIA_NIM":
        return new NvidiaNimProvider(
          new OpenAI({
            apiKey,
            baseURL: "https://integrate.api.nvidia.com/v1",
          }),
        );
      default:
        throw new Error(`Unsupported provider: ${provider as string}`);
    }
  }
}
