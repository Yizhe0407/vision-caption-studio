import { z } from "zod";
import { AIRequestRepository } from "@/src/repositories/ai-request.repository";
import { minioClient } from "@/src/infrastructure/storage/minio-client";
import { CaptionRepository } from "@/src/repositories/caption.repository";
import { ImageRepository } from "@/src/repositories/image.repository";
import { JobRepository } from "@/src/repositories/job.repository";
import { PromptTemplateRepository } from "@/src/repositories/prompt-template.repository";
import { TagRepository } from "@/src/repositories/tag.repository";
import { UserRepository } from "@/src/repositories/user.repository";

export class ImageController {
  constructor(
    private readonly images: ImageRepository,
    private readonly captions: CaptionRepository,
    private readonly tags: TagRepository,
    private readonly jobs: JobRepository,
    private readonly prompts: PromptTemplateRepository,
    private readonly aiRequests: AIRequestRepository,
    private readonly users: UserRepository,
  ) {}

  async detail(payload: unknown) {
    const parsed = z.object({ id: z.string().min(1), userId: z.string().min(1) }).parse(payload);
    const image = await this.images.findAccessibleById(parsed.id, parsed.userId);
    if (!image) {
      throw new Error("Image not found.");
    }
    return {
      id: image.id,
      originalFilename: image.originalFilename,
      imageUrl: `/api/images/${image.id}/file`,
      captions: image.captions,
      tags: image.tags,
    };
  }

  async updateManual(payload: unknown) {
    const parsed = z
      .object({
        id: z.string().min(1),
        userId: z.string().min(1),
        caption: z.string().min(1),
        tags: z.array(z.string()).default([]),
      })
      .parse(payload);

    const image = await this.images.findAccessibleById(parsed.id, parsed.userId);
    if (!image) {
      throw new Error("Image not found.");
    }

    try {
      await this.captions.updateLatestForImage(parsed.id, parsed.caption.trim());
    } catch {
      const user = await this.users.findById(parsed.userId);
      if (!user) {
        throw new Error("User not found.");
      }
      const promptTemplate =
        (user.preferredPromptTemplateId &&
          (await this.prompts.getActiveById("CAPTION", user.preferredPromptTemplateId))) ||
        (await this.prompts.getLatestActive("CAPTION"));
      if (!promptTemplate) {
        throw new Error("Prompt template not found.");
      }
      const request = await this.aiRequests.createManualSucceeded({
        provider: user.preferredProvider,
        promptTemplateId: promptTemplate.id,
      });
      await this.captions.create(parsed.id, request.id, parsed.caption.trim());
    }
    await this.tags.replaceTagsForImage(parsed.id, parsed.tags);
  }

  async remove(payload: unknown) {
    const parsed = z.object({ id: z.string().min(1), userId: z.string().min(1) }).parse(payload);
    const image = await this.images.findAccessibleById(parsed.id, parsed.userId);
    if (!image) {
      throw new Error("Image not found.");
    }

    await this.jobs.deleteByImageAndUser(parsed.id, parsed.userId);
    const remainedJobs = await this.jobs.countByImage(parsed.id);

    if (remainedJobs === 0 && image.uploadedById === parsed.userId) {
      await minioClient.removeObject(image.storageBucket, image.storageObjectKey);
      await this.images.deleteById(parsed.id);
    }
  }
}
