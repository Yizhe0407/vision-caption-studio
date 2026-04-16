import { PromptTemplateRepository } from "@/src/repositories/prompt-template.repository";

export class PromptTemplateService {
  constructor(private readonly templates: PromptTemplateRepository) {}

  async listAll() {
    return this.templates.listAll();
  }

  async update(id: string, input: { name?: string; content?: string }) {
    return this.templates.update(id, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
    });
  }

  async createFromBase(
    baseTemplateId: string,
    input?: { content?: string; mode?: "blank" | "copy" },
  ) {
    const base = await this.templates.findById(baseTemplateId);
    if (!base) {
      throw new Error("Prompt template not found.");
    }

    const latest = await this.templates.getLatestByNameAndTask(base.name, base.taskType);
    const version = (latest?.version ?? base.version) + 1;
    return this.templates.create({
      name: base.name,
      taskType: base.taskType,
      version,
      isActive: base.isActive,
      content:
        input?.mode === "blank"
          ? ""
          : input?.content?.trim().length
            ? input.content.trim()
            : base.content,
    });
  }

  async remove(id: string) {
    const total = await this.templates.countAll();
    if (total <= 1) {
      throw new Error("至少需要保留一個 Prompt Template。");
    }
    const usedCount = await this.templates.countAIRequests(id);
    if (usedCount > 0) {
      throw new Error("此 Prompt Template 已被歷史任務使用，無法刪除。");
    }
    return this.templates.deleteById(id);
  }
}
