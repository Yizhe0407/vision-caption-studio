import type { PromptTaskType } from "@prisma/client";
import { prisma } from "@/src/infrastructure/orm/prisma";

export class PromptTemplateRepository {
  async getLatestActive(taskType: PromptTaskType, userId: string) {
    return prisma.promptTemplate.findFirst({
      where: { taskType, isActive: true, userId },
      orderBy: { version: "desc" },
    });
  }

  async getActiveById(taskType: PromptTaskType, id: string, userId: string) {
    return prisma.promptTemplate.findFirst({
      where: { id, taskType, isActive: true, userId },
    });
  }

  async listActive(taskType: PromptTaskType, userId: string) {
    return prisma.promptTemplate.findMany({
      where: { taskType, isActive: true, userId },
      orderBy: [{ name: "asc" }, { version: "desc" }],
      select: { id: true, name: true, version: true },
    });
  }

  async listAll(userId: string) {
    return prisma.promptTemplate.findMany({
      where: { userId },
      orderBy: [{ taskType: "asc" }, { name: "asc" }, { version: "desc" }],
    });
  }

  async update(id: string, userId: string, input: { name?: string; content?: string }) {
    return prisma.promptTemplate.update({
      where: { id, userId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.content !== undefined ? { content: input.content } : {}),
      },
    });
  }

  async findById(id: string, userId: string) {
    return prisma.promptTemplate.findFirst({
      where: { id, userId },
    });
  }

  async countAll(userId: string) {
    return prisma.promptTemplate.count({ where: { userId } });
  }

  async create(input: {
    userId: string;
    name: string;
    taskType: PromptTaskType;
    version: number;
    content: string;
    isActive?: boolean;
  }) {
    return prisma.promptTemplate.create({
      data: {
        userId: input.userId,
        name: input.name,
        taskType: input.taskType,
        version: input.version,
        content: input.content,
        isActive: input.isActive ?? true,
      },
    });
  }

  async deleteById(id: string, userId: string) {
    return prisma.promptTemplate.delete({ where: { id, userId } });
  }

  async getLatestByNameAndTask(name: string, taskType: PromptTaskType, userId: string) {
    return prisma.promptTemplate.findFirst({
      where: { name, taskType, userId },
      orderBy: { version: "desc" },
    });
  }

  async countAIRequests(id: string) {
    return prisma.aIRequest.count({ where: { promptTemplateId: id } });
  }
}
