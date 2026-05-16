import { z } from "zod";
import { ProviderCredentialService } from "@/src/services/provider-credential.service";

const providerSchema = z.enum(["OPENAI", "OPENROUTER", "GEMINI", "CLAUDE", "NVIDIA_NIM"]);

export class ProviderCredentialController {
  constructor(private readonly service: ProviderCredentialService) {}

  async getSettings(payload: unknown) {
    const parsed = z.object({ userId: z.string().min(1) }).parse(payload);
    return this.service.getSettings(parsed.userId);
  }

  async updateSetting(payload: unknown) {
    const parsed = z
      .object({
        userId: z.string().min(1),
        provider: providerSchema,
        preferredModel: z.string().optional(),
        preferredPromptTemplateId: z.string().optional(),
      })
      .parse(payload);

    await this.service.updateSetting(parsed.userId, {
      provider: parsed.provider,
      preferredModel: parsed.preferredModel,
      preferredPromptTemplateId: parsed.preferredPromptTemplateId,
    });
  }
}
