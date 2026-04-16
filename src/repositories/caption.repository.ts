import { prisma } from "@/src/infrastructure/orm/prisma";

export class CaptionRepository {
  async create(imageId: string, aiRequestId: string, content: string) {
    return prisma.caption.create({
      data: {
        imageId,
        aiRequestId,
        content,
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
}
