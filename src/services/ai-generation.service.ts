import type { AIProviderType } from "@prisma/client";
import { env } from "@/src/lib/env";
import { AIProviderFactory } from "@/src/infrastructure/ai/ai-provider-factory";
import { minioClient } from "@/src/infrastructure/storage/minio-client";
import { AIRequestRepository } from "@/src/repositories/ai-request.repository";
import { CaptionRepository } from "@/src/repositories/caption.repository";
import { ImageRepository } from "@/src/repositories/image.repository";
import { JobRepository } from "@/src/repositories/job.repository";
import { PromptTemplateRepository } from "@/src/repositories/prompt-template.repository";
import { TagRepository } from "@/src/repositories/tag.repository";
import { UserRepository } from "@/src/repositories/user.repository";
import { ProviderCredentialService } from "@/src/services/provider-credential.service";

function estimateCostUsd(provider: AIProviderType, inputTokens: number, outputTokens: number) {
  const pricing = {
    OPENAI: [env.OPENAI_INPUT_USD_PER_1K, env.OPENAI_OUTPUT_USD_PER_1K],
    OPENROUTER: [env.OPENROUTER_INPUT_USD_PER_1K, env.OPENROUTER_OUTPUT_USD_PER_1K],
    GEMINI: [env.GEMINI_INPUT_USD_PER_1K, env.GEMINI_OUTPUT_USD_PER_1K],
    CLAUDE: [env.CLAUDE_INPUT_USD_PER_1K, env.CLAUDE_OUTPUT_USD_PER_1K],
    NVIDIA_NIM: [env.NVIDIA_NIM_INPUT_USD_PER_1K, env.NVIDIA_NIM_OUTPUT_USD_PER_1K],
  } as const;

  const [inputRate, outputRate] = pricing[provider];
  return ((inputTokens / 1000) * inputRate + (outputTokens / 1000) * outputRate).toFixed(6);
}

async function streamToBuffer(stream: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function resolveErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return "Unknown error";

  const maybeRaw = (
    error as Error & {
      error?: {
        metadata?: {
          raw?: string;
        };
      };
    }
  ).error?.metadata?.raw;

  if (typeof maybeRaw === "string" && maybeRaw.trim().length > 0) {
    try {
      const parsed = JSON.parse(maybeRaw) as { error?: { message?: string } };
      if (parsed.error?.message && parsed.error.message.trim().length > 0) {
        return parsed.error.message;
      }
    } catch {
      // Keep original message
    }
  }

  return error.message;
}

export class AIGenerationService {
  constructor(
    private readonly aiProviderFactory: AIProviderFactory,
    private readonly images: ImageRepository,
    private readonly prompts: PromptTemplateRepository,
    private readonly requests: AIRequestRepository,
    private readonly captions: CaptionRepository,
    private readonly tags: TagRepository,
    private readonly jobs: JobRepository,
    private readonly credentials: ProviderCredentialService,
    private readonly users: UserRepository,
  ) {}

  async processImageJob(input: {
    queueJobId: string;
    imageId: string;
    userId: string;
    provider?: AIProviderType;
    model?: string;
  }) {
    await this.jobs.updateStatus(
      input.queueJobId,
      "PROCESSING",
      undefined,
      { incrementAttempt: true },
    );

    const image = await this.images.findById(input.imageId);
    if (!image) {
      await this.jobs.updateStatus(input.queueJobId, "FAILED", "Image not found.");
      throw new Error("Image not found.");
    }

    const user = await this.users.findById(input.userId);
    if (!user) {
      await this.jobs.updateStatus(input.queueJobId, "FAILED", "User not found.");
      throw new Error("User not found.");
    }

    const resolvedPromptTemplate = user.preferredPromptTemplateId
      ? await this.prompts.getActiveById("CAPTION", user.preferredPromptTemplateId, input.userId)
      : await this.prompts.getLatestActive("CAPTION", input.userId);
    if (!resolvedPromptTemplate) {
      await this.jobs.updateStatus(input.queueJobId, "FAILED", "Prompt template not found.");
      throw new Error("Prompt template not found.");
    }

    const provider = input.provider ?? user.preferredProvider ?? env.DEFAULT_AI_PROVIDER;
    const providerModel = await this.credentials.getProviderModel(input.userId, provider);
    const model =
      input.model ??
      providerModel ??
      (provider === "OPENROUTER"
        ? env.OPENROUTER_MODEL
        : provider === "GEMINI"
          ? env.GEMINI_MODEL
          : provider === "CLAUDE"
            ? env.ANTHROPIC_MODEL
            : provider === "NVIDIA_NIM"
              ? env.NVIDIA_NIM_MODEL
              : env.OPENAI_MODEL);

    const request = await this.requests.create({
      provider,
      model,
      taskType: "CAPTION",
      promptTemplateId: resolvedPromptTemplate.id,
    });

    try {
      if (image.fileSize > BigInt(env.MAX_UPLOAD_FILE_SIZE_BYTES)) {
        throw new Error(
          `Image too large for processing. Max size is ${Math.floor(env.MAX_UPLOAD_FILE_SIZE_BYTES / (1024 * 1024))}MB.`,
        );
      }

      const objectStream = await minioClient.getObject(image.storageBucket, image.storageObjectKey);
      const imageBuffer = await streamToBuffer(objectStream);
      const apiKey = await this.credentials.getRequiredApiKey(input.userId, provider);
      const providerClient = this.aiProviderFactory.resolve(provider, apiKey);

      const result = await providerClient.generateCaptionAndTags({
        prompt: resolvedPromptTemplate.content,
        mimeType: image.mimeType,
        imageBuffer,
        model,
      });

      await this.captions.create(image.id, request.id, result.caption);
      await this.tags.connectTagsToImage(image.id, result.tags);
      await this.requests.complete({
        id: request.id,
        status: "SUCCEEDED",
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        totalTokens: result.usage.totalTokens,
        estimatedCostUsd: estimateCostUsd(
          provider,
          result.usage.inputTokens,
          result.usage.outputTokens,
        ),
      });

      await this.jobs.updateStatus(input.queueJobId, "SUCCEEDED");
    } catch (error) {
      const errorMessage = resolveErrorMessage(error);
      await this.requests.complete({
        id: request.id,
        status: "FAILED",
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: "0",
        errorMessage,
      });
      await this.jobs.updateStatus(
        input.queueJobId,
        "FAILED",
        errorMessage,
      );
      throw error;
    }
  }
}
