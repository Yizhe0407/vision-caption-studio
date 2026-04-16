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
    const incomingApiKey = payload.apiKey?.trim();
    const hasIncomingApiKey = Boolean(incomingApiKey && incomingApiKey.length > 0);

    if (payload.preferredPromptTemplateId) {
      const prompt = await this.promptTemplates.getActiveById("CAPTION", payload.preferredPromptTemplateId);
      if (!prompt) {
        throw new Error("Prompt template not found.");
      }
    }

    if (hasIncomingApiKey && incomingApiKey) {
      await this.credentials.upsert(userId, payload.provider, encryptApiKey(incomingApiKey));
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

    await this.users.updatePreferences(userId, {
      preferredProvider: payload.preferredProvider,
      preferredModel: payload.preferredModel,
      preferredPromptTemplateId: payload.preferredPromptTemplateId,
    });
  }

  async getSettings(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    const rows = await this.credentials.listByUserId(userId);
    const promptTemplates = await this.promptTemplates.listActive("CAPTION");
    const keys: Partial<Record<AIProviderType, string>> = {};
    await Promise.all(
      rows.map(async (row) => {
        const decoded = decryptApiKeyWithFlag(row.apiKey);
        keys[row.provider] = decoded.value;
        if (!decoded.encrypted) {
          await this.credentials.upsert(userId, row.provider, encryptApiKey(decoded.value));
        }
      }),
    );

    return {
      preferredProvider: user.preferredProvider,
      preferredModel: user.preferredModel,
      preferredPromptTemplateId: user.preferredPromptTemplateId,
      promptTemplates,
      keys,
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
}
