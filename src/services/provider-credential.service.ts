import type { AIProviderType } from "@prisma/client";
import {
  decryptApiKeyWithFlag,
  encryptApiKey,
} from "@/src/infrastructure/security/api-key-crypto";
import { env } from "@/src/lib/env";
import { ProviderCredentialRepository } from "@/src/repositories/provider-credential.repository";
import { PromptTemplateRepository } from "@/src/repositories/prompt-template.repository";
import { UserRepository } from "@/src/repositories/user.repository";

function getEnvApiKey(provider: AIProviderType): string | undefined {
  const keyMap: Record<AIProviderType, string | undefined> = {
    OPENAI: env.OPENAI_API_KEY,
    OPENROUTER: env.OPENROUTER_API_KEY,
    GEMINI: env.GEMINI_API_KEY,
    CLAUDE: env.ANTHROPIC_API_KEY,
    NVIDIA_NIM: env.NVIDIA_NIM_API_KEY,
  };
  const raw = keyMap[provider];
  if (!raw || raw.trim().length === 0) return undefined;
  // Decrypt if the value was accidentally stored in encrypted form; raw keys pass through unchanged.
  const key = decryptApiKeyWithFlag(raw).value.trim();
  return key.length > 0 ? key : undefined;
}

function normalizeApiKey(_provider: AIProviderType, apiKey: string) {
  return apiKey.trim().replace(/^Bearer\s+/i, "");
}

export class ProviderCredentialService {
  constructor(
    private readonly credentials: ProviderCredentialRepository,
    private readonly users: UserRepository,
    private readonly promptTemplates: PromptTemplateRepository,
  ) {}

  async updateSetting(
    userId: string,
    payload: {
      provider: AIProviderType;
      preferredProvider: AIProviderType;
      preferredModel?: string;
      preferredPromptTemplateId?: string;
    },
  ) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    if (payload.preferredPromptTemplateId) {
      const prompt = await this.promptTemplates.getActiveById("CAPTION", payload.preferredPromptTemplateId, userId);
      if (!prompt) {
        throw new Error("Prompt template not found.");
      }
    }

    await this.getRequiredApiKey(userId, payload.preferredProvider);

    // Save model preference per-provider on the credential row
    const modelValue = payload.preferredModel?.trim() || null;
    const existingCredential = await this.credentials.findByUserIdAndProvider(userId, payload.provider);
    if (existingCredential) {
      await this.credentials.updateModel(userId, payload.provider, modelValue);
    } else if (modelValue) {
      // Create a stub (empty apiKey) solely to persist the model preference.
      // getRequiredApiKey will still use the env key for auth; the stub is
      // only consulted by getProviderModel during generation.
      await this.credentials.upsert(userId, payload.provider, "", modelValue);
    }

    await this.users.updatePreferences(user.id, {
      preferredProvider: payload.preferredProvider,
      preferredPromptTemplateId: payload.preferredPromptTemplateId,
    });
  }

  async getSettings(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    const rows = await this.credentials.listByUserId(userId);
    const promptTemplates = await this.promptTemplates.listActive("CAPTION", userId);
    const models: Partial<Record<AIProviderType, string>> = {};
    const keyStatus: Record<AIProviderType, boolean> = {
      OPENAI: Boolean(getEnvApiKey("OPENAI")),
      OPENROUTER: Boolean(getEnvApiKey("OPENROUTER")),
      GEMINI: Boolean(getEnvApiKey("GEMINI")),
      CLAUDE: Boolean(getEnvApiKey("CLAUDE")),
      NVIDIA_NIM: Boolean(getEnvApiKey("NVIDIA_NIM")),
    };

    await Promise.all(
      rows.map(async (row) => {
        const decoded = decryptApiKeyWithFlag(row.apiKey);
        // Stub rows (empty apiKey) store model preferences for env-key providers;
        // don't expose the empty value and don't re-encrypt it.
        if (decoded.value.trim().length > 0) {
          keyStatus[row.provider] = true;
          if (!decoded.encrypted) {
            await this.credentials.upsert(userId, row.provider, encryptApiKey(decoded.value));
          }
        }
        if (row.preferredModel) {
          models[row.provider] = row.preferredModel;
        }
      }),
    );

    return {
      preferredProvider: user.preferredProvider,
      preferredPromptTemplateId: user.preferredPromptTemplateId,
      promptTemplates,
      keys: {},
      keyStatus,
      models,
    };
  }

  async getRequiredApiKey(userId: string, provider: AIProviderType) {
    const envKey = getEnvApiKey(provider);
    if (envKey) return normalizeApiKey(provider, envKey);

    const row = await this.credentials.findByUserIdAndProvider(userId, provider);
    if (!row || row.apiKey.trim().length === 0) {
      throw new Error(`The API key for this provider is not configured. Please contact the system administrator.`);
    }
    const decoded = decryptApiKeyWithFlag(row.apiKey);
    // Guard against encrypted-empty values left by older code paths.
    if (decoded.value.trim().length === 0) {
      throw new Error(`The API key for this provider is not configured. Please contact the system administrator.`);
    }
    if (!decoded.encrypted) {
      await this.credentials.upsert(userId, provider, encryptApiKey(decoded.value));
    }
    return normalizeApiKey(provider, decoded.value);
  }

  async getProviderModel(userId: string, provider: AIProviderType) {
    const row = await this.credentials.findByUserIdAndProvider(userId, provider);
    return row?.preferredModel ?? null;
  }
}
