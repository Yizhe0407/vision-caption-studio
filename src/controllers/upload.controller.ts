import { z } from "zod";
import type { AIProviderType } from "@prisma/client";
import { ImageService } from "@/src/services/image.service";
import { JobService } from "@/src/services/job.service";

const batchUploadSchema = z.object({
  userId: z.string().min(1),
  provider: z.enum(["OPENAI", "OPENROUTER", "GEMINI", "CLAUDE"]).optional(),
  model: z.string().optional(),
  files: z.array(
    z.object({
      name: z.string().min(1),
      type: z.string().min(1),
      buffer: z.instanceof(Buffer),
    }),
  ),
});

export class UploadController {
  constructor(
    private readonly imageService: ImageService,
    private readonly jobService: JobService,
  ) {}

  async batchUpload(payload: unknown) {
    const parsed = batchUploadSchema.parse(payload);
    const items: Array<{
      imageId: string;
      queueJobId: string | null;
    }> = [];

    for (const file of parsed.files) {
      const { image } = await this.imageService.uploadImage({
        userId: parsed.userId,
        fileName: file.name,
        mimeType: file.type,
        data: file.buffer,
      });

      const queueJobId = await this.jobService.enqueueImageJob({
        imageId: image.id,
        userId: parsed.userId,
        provider: parsed.provider as AIProviderType | undefined,
        model: parsed.model,
      });

      items.push({
        imageId: image.id,
        queueJobId: queueJobId ? String(queueJobId) : null,
      });
    }

    return {
      count: items.length,
      items,
    };
  }
}
