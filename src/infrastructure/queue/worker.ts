import { Worker } from "bullmq";
import { container } from "@/src/di/container";
import { redisConnection } from "@/src/infrastructure/queue/connection";
import { IMAGE_PROCESSING_QUEUE, type ImageProcessingPayload } from "@/src/infrastructure/queue/queues";

const worker = new Worker<ImageProcessingPayload>(
  IMAGE_PROCESSING_QUEUE,
  async (job) => {
    await container.aiGenerationService.processImageJob({
      queueJobId: String(job.id),
      imageId: job.data.imageId,
      userId: job.data.userId,
      provider: job.data.provider,
      model: job.data.model,
    });
  },
  {
    connection: redisConnection,
    concurrency: 3,
  },
);

worker.on("completed", (job) => {
  console.info(`Job completed: ${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(`Job failed: ${job?.id ?? "unknown"}`, error);
});

process.on("SIGINT", async () => {
  await worker.close();
  await redisConnection.quit();
  process.exit(0);
});
