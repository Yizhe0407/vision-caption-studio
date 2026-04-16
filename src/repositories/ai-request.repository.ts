import type { AIProviderType, AIRequestStatus, PromptTaskType } from "@prisma/client";
import { prisma } from "@/src/infrastructure/orm/prisma";

type CreateRequestInput = {
  provider: AIProviderType;
  model: string;
  taskType: PromptTaskType;
  promptTemplateId: string;
};

type CompleteRequestInput = {
  id: string;
  status: AIRequestStatus;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: string;
  errorMessage?: string;
};

export class AIRequestRepository {
  async create(input: CreateRequestInput) {
    return prisma.aIRequest.create({
      data: {
        provider: input.provider,
        model: input.model,
        taskType: input.taskType,
        promptTemplateId: input.promptTemplateId,
        status: "PROCESSING",
        estimatedCostUsd: "0",
        startedAt: new Date(),
      },
    });
  }

  async complete(input: CompleteRequestInput) {
    return prisma.aIRequest.update({
      where: { id: input.id },
      data: {
        status: input.status,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        totalTokens: input.totalTokens,
        estimatedCostUsd: input.estimatedCostUsd,
        errorMessage: input.errorMessage,
        finishedAt: new Date(),
      },
    });
  }

  async createManualSucceeded(input: { provider: AIProviderType; promptTemplateId: string }) {
    return prisma.aIRequest.create({
      data: {
        provider: input.provider,
        model: "manual-edit",
        taskType: "CAPTION",
        promptTemplateId: input.promptTemplateId,
        status: "SUCCEEDED",
        estimatedCostUsd: "0",
        startedAt: new Date(),
        finishedAt: new Date(),
      },
    });
  }
}
