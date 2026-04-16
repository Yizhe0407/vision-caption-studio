import type { AIProviderType } from "@prisma/client";
import { getImageProcessingQueue } from "@/src/infrastructure/queue/queues";
import { JobRepository } from "@/src/repositories/job.repository";

export class JobService {
  constructor(private readonly jobs: JobRepository) {}

  async enqueueImageJob(input: {
    imageId: string;
    userId: string;
    provider?: AIProviderType;
    model?: string;
  }) {
    const job = await getImageProcessingQueue().add("generate-caption", {
      imageId: input.imageId,
      userId: input.userId,
      provider: input.provider,
      model: input.model,
    });

    await this.jobs.create(input.userId, input.imageId, job.id ?? "");
    return job.id;
  }

  async listUserJobs(userId: string) {
    return this.jobs.listByUser(userId);
  }
}
