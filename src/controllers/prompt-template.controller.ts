import { z } from "zod";
import { PromptTemplateService } from "@/src/services/prompt-template.service";

export class PromptTemplateController {
  constructor(private readonly service: PromptTemplateService) {}

  async list() {
    return this.service.listAll();
  }

  async update(payload: unknown) {
    const parsed = z
      .object({
        id: z.string().min(1),
        name: z.string().trim().min(1).optional(),
        content: z.string().min(1).optional(),
      })
      .refine((value) => value.name !== undefined || value.content !== undefined, {
        message: "At least one field is required.",
      })
      .parse(payload);
    return this.service.update(parsed.id, {
      name: parsed.name,
      content: parsed.content,
    });
  }

  async create(payload: unknown) {
    const parsed = z
      .object({
        baseTemplateId: z.string().min(1),
        content: z.string().optional(),
        mode: z.enum(["blank", "copy"]).optional(),
      })
      .parse(payload);
    return this.service.createFromBase(parsed.baseTemplateId, {
      content: parsed.content,
      mode: parsed.mode,
    });
  }

  async remove(payload: unknown) {
    const parsed = z.object({ id: z.string().min(1) }).parse(payload);
    return this.service.remove(parsed.id);
  }
}
