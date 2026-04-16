import { PromptTemplateRepository } from "@/src/repositories/prompt-template.repository";

export const DEFAULT_TEMPLATE_CONTENT = `Analyze this product image and generate:

1. A detailed description (2-3 sentences) highlighting:
   - Product type and category
   - Key visual features
   - Quality and style

2. Relevant tags (5-10) for:
   - Product attributes
   - Style keywords
   - Search optimization

Output format:
{
  "description": "...",
  "tags": ["tag1", "tag2", ...]
}`;

export class PromptTemplateService {
  constructor(private readonly templates: PromptTemplateRepository) {}

  async listAll(userId: string) {
    return this.templates.listAll(userId);
  }

  async update(id: string, userId: string, input: { name?: string; content?: string }) {
    return this.templates.update(id, userId, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
    });
  }

  async createFromBase(
    baseTemplateId: string,
    userId: string,
    input?: { content?: string; mode?: "blank" | "copy" },
  ) {
    const base = await this.templates.findById(baseTemplateId, userId);
    if (!base) {
      throw new Error("Prompt template not found.");
    }

    const latest = await this.templates.getLatestByNameAndTask(base.name, base.taskType, userId);
    const version = (latest?.version ?? base.version) + 1;
    return this.templates.create({
      userId,
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

  async remove(id: string, userId: string) {
    const template = await this.templates.findById(id, userId);
    if (!template) {
      throw new Error("Prompt template not found.");
    }
    const total = await this.templates.countAll(userId);
    if (total <= 1) {
      throw new Error("至少需要保留一個 Prompt Template。");
    }
    const usedCount = await this.templates.countAIRequests(id);
    if (usedCount > 0) {
      throw new Error("此 Prompt Template 已被歷史任務使用，無法刪除。");
    }
    return this.templates.deleteById(id, userId);
  }

  async createDefault(userId: string) {
    return this.templates.create({
      userId,
      name: "default-caption",
      version: 1,
      taskType: "CAPTION",
      content: DEFAULT_TEMPLATE_CONTENT,
      isActive: true,
    });
  }
}
