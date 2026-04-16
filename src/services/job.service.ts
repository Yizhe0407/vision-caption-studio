import { randomUUID } from "node:crypto";
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
    const queueJobId = randomUUID();
    const job = await getImageProcessingQueue().add("generate-caption", {
      imageId: input.imageId,
      userId: input.userId,
      provider: input.provider,
      model: input.model,
    }, {
      jobId: queueJobId,
    });

    await this.jobs.create(input.userId, input.imageId, String(job.id ?? queueJobId));
    return String(job.id ?? queueJobId);
  }

  async listUserJobs(userId: string) {
    return this.jobs.listByUser(userId);
  }
}
