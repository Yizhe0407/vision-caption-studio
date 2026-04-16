import type { PromptTaskType } from "@prisma/client";
import { prisma } from "@/src/infrastructure/orm/prisma";

export class PromptTemplateRepository {
  async getLatestActive(taskType: PromptTaskType) {
    return prisma.promptTemplate.findFirst({
      where: {
        taskType,
        isActive: true,
      },
      orderBy: {
        version: "desc",
      },
    });
  }

  async getActiveById(taskType: PromptTaskType, id: string) {
    return prisma.promptTemplate.findFirst({
      where: {
        id,
        taskType,
        isActive: true,
      },
    });
  }

  async listActive(taskType: PromptTaskType) {
    return prisma.promptTemplate.findMany({
      where: {
        taskType,
        isActive: true,
      },
      orderBy: [{ name: "asc" }, { version: "desc" }],
      select: {
        id: true,
        name: true,
        version: true,
      },
    });
  }

  async listAll() {
    return prisma.promptTemplate.findMany({
      orderBy: [{ taskType: "asc" }, { name: "asc" }, { version: "desc" }],
    });
  }

  async update(id: string, input: { name?: string; content?: string }) {
    return prisma.promptTemplate.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.content !== undefined ? { content: input.content } : {}),
      },
    });
  }

  async findById(id: string) {
    return prisma.promptTemplate.findUnique({
      where: { id },
    });
  }

  async countAll() {
    return prisma.promptTemplate.count();
  }

  async create(input: {
    name: string;
    taskType: PromptTaskType;
    version: number;
    content: string;
    isActive?: boolean;
  }) {
    return prisma.promptTemplate.create({
      data: {
        name: input.name,
        taskType: input.taskType,
        version: input.version,
        content: input.content,
        isActive: input.isActive ?? true,
      },
    });
  }

  async deleteById(id: string) {
    return prisma.promptTemplate.delete({
      where: { id },
    });
  }

  async getLatestByNameAndTask(name: string, taskType: PromptTaskType) {
    return prisma.promptTemplate.findFirst({
      where: {
        name,
        taskType,
      },
      orderBy: {
        version: "desc",
      },
    });
  }

  async countAIRequests(id: string) {
    return prisma.aIRequest.count({
      where: {
        promptTemplateId: id,
      },
    });
  }
}
