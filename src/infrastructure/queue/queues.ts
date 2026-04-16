import { Queue } from "bullmq";
import { redisConnection } from "@/src/infrastructure/queue/connection";

export const IMAGE_PROCESSING_QUEUE = "image-processing";

export type ImageProcessingPayload = {
  imageId: string;
  userId: string;
  provider?: "OPENAI" | "OPENROUTER" | "GEMINI" | "CLAUDE";
  model?: string;
};

let queue: Queue<ImageProcessingPayload> | undefined;

export function getImageProcessingQueue() {
  queue ??= new Queue<ImageProcessingPayload>(IMAGE_PROCESSING_QUEUE, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      removeOnComplete: 1000,
      removeOnFail: 1000,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    },
  });

  return queue;
}
