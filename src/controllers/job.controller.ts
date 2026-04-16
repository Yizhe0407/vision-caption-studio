import { z } from "zod";
import { JobService } from "@/src/services/job.service";

export class JobController {
  constructor(private readonly jobs: JobService) {}

  async list(payload: unknown) {
    const parsed = z.object({ userId: z.string().min(1) }).parse(payload);
    return this.jobs.listUserJobs(parsed.userId);
  }
}
