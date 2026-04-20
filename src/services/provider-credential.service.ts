import type { AIProviderType } from "@prisma/client";
import {
  decryptApiKeyWithFlag,
  encryptApiKey,
} from "@/src/infrastructure/security/api-key-crypto";
import { ProviderCredentialRepository } from "@/src/repositories/provider-credential.repository";
import { PromptTemplateRepository } from "@/src/repositories/prompt-template.repository";
import { UserRepository } from "@/src/repositories/user.repository";

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
      apiKey?: string;
      preferredProvider: AIProviderType;
      preferredModel?: string;
      preferredPromptTemplateId?: string;
    },
  ) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    const incomingApiKey = payload.apiKey?.trim();
    const hasIncomingApiKey = Boolean(incomingApiKey && incomingApiKey.length > 0);

    if (payload.preferredPromptTemplateId) {
      const prompt = await this.promptTemplates.getActiveById("CAPTION", payload.preferredPromptTemplateId, userId);
      if (!prompt) {
        throw new Error("Prompt template not found.");
      }
    }

    const preferredHasIncomingKey =
      payload.preferredProvider === payload.provider && hasIncomingApiKey;

    if (!preferredHasIncomingKey) {
      const preferredCredential = await this.credentials.findByUserIdAndProvider(
        userId,
        payload.preferredProvider,
      );
      if (!preferredCredential) {
        throw new Error(`${payload.preferredProvider} API key is not configured.`);
      }
    }

    // Save model preference per-provider on the credential row
    const modelValue = payload.preferredModel?.trim() || null;
    if (hasIncomingApiKey && incomingApiKey) {
      // Re-upsert including model so it's set atomically with the key
      await this.credentials.upsert(userId, payload.provider, encryptApiKey(incomingApiKey), modelValue);
    } else {
      const existingCredential = await this.credentials.findByUserIdAndProvider(userId, payload.provider);
      if (existingCredential) {
        await this.credentials.updateModel(userId, payload.provider, modelValue);
      }
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
    const keys: Partial<Record<AIProviderType, string>> = {};
    const models: Partial<Record<AIProviderType, string>> = {};

    await Promise.all(
      rows.map(async (row) => {
        const decoded = decryptApiKeyWithFlag(row.apiKey);
        keys[row.provider] = decoded.value;
        if (row.preferredModel) {
          models[row.provider] = row.preferredModel;
        }
        if (!decoded.encrypted) {
          await this.credentials.upsert(userId, row.provider, encryptApiKey(decoded.value));
        }
      }),
    );

    return {
      preferredProvider: user.preferredProvider,
      preferredPromptTemplateId: user.preferredPromptTemplateId,
      promptTemplates,
      keys,
      models,
    };
  }

  async getRequiredApiKey(userId: string, provider: AIProviderType) {
    const row = await this.credentials.findByUserIdAndProvider(userId, provider);
    if (!row || row.apiKey.trim().length === 0) {
      throw new Error(`${provider} API key is not configured.`);
    }
    const decoded = decryptApiKeyWithFlag(row.apiKey);
    if (!decoded.encrypted) {
      await this.credentials.upsert(userId, provider, encryptApiKey(decoded.value));
    }
    return decoded.value;
  }

  async getProviderModel(userId: string, provider: AIProviderType) {
    const row = await this.credentials.findByUserIdAndProvider(userId, provider);
    return row?.preferredModel ?? null;
  }
}
