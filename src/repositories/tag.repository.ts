import { prisma } from "@/src/infrastructure/orm/prisma";

export class TagRepository {
  async connectTagsToImage(imageId: string, tags: string[]) {
    for (const rawTag of tags) {
      const normalizedTag = rawTag.trim();
      if (!normalizedTag) {
        continue;
      }

      const tag = await prisma.tag.upsert({
        where: { name: normalizedTag },
        update: {},
        create: { name: normalizedTag },
      });

      await prisma.imageTag.upsert({
        where: {
          imageId_tagId: {
            imageId,
            tagId: tag.id,
          },
        },
        update: {},
        create: {
          imageId,
          tagId: tag.id,
        },
      });
    }
  }

  async replaceTagsForImage(imageId: string, tags: string[]) {
    await prisma.imageTag.deleteMany({
      where: { imageId },
    });
    await this.connectTagsToImage(imageId, tags);
  }
}
