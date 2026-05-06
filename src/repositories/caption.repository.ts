import { Prisma } from "@prisma/client";
import { prisma } from "@/src/infrastructure/orm/prisma";

export class CaptionRepository {
  async create(imageId: string, aiRequestId: string, content: string, structuredTags?: Prisma.InputJsonValue) {
    return prisma.caption.create({
      data: {
        imageId,
        aiRequestId,
        content,
        ...(structuredTags !== undefined ? { structuredTags } : {}),
      },
    });
  }

  async updateLatestForImage(imageId: string, content: string) {
    const latest = await prisma.caption.findFirst({
      where: { imageId },
      orderBy: { createdAt: "desc" },
    });
    if (!latest) {
      throw new Error("Caption not found.");
    }

    return prisma.caption.update({
      where: { id: latest.id },
      data: { content },
    });
  }

  async updateStructuredTagsForImage(imageId: string, structuredTags: unknown) {
    const latest = await prisma.caption.findFirst({
      where: { imageId },
      orderBy: { createdAt: "desc" },
    });
    if (!latest) {
      throw new Error("Caption not found.");
    }
    return prisma.caption.update({
      where: { id: latest.id },
      data: { structuredTags: structuredTags as Prisma.InputJsonValue },
    });
  }
}
