import { PromptTemplateRepository } from "@/src/repositories/prompt-template.repository";

export const DEFAULT_TEMPLATE_CONTENT = `Analyze this product image and generate a product description and structured semantic tags.

Return only valid JSON. Do not include markdown, comments, or extra text.

Task:
1. Write a detailed product description in 2-3 sentences.
   Include:
   - Product category and product type
   - Key visible features
   - Shape, materials, textures, patterns, colors, and details when visible
   - Overall visual style and mood when clearly supported by the image

2. Generate a structured tags object. Use the exact keys listed in the instruction below — no other keys.
   Each value must be a string or an array of strings.

Rules:
- Use lowercase English values only.
- Use hyphenated values for multi-word terms, for example graphic-print, slim-fit, cool-toned.
- Only describe what is visible or strongly inferable from the image.
- Do not invent brand names, prices, origin, gender, age group, or hidden materials.
- If a field is unknown or not applicable, use an empty string "" for string fields and an empty array [] for array fields.
- Keep array fields concise. Prefer 1-5 high-confidence values.

Output format:
{
  "description": "...",
  "tags": {
    "<key>": "<string or array of strings>",
    ...
  }
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
      throw new Error("At least one prompt template must be kept.");
    }
    const usedCount = await this.templates.countAIRequests(id);
    if (usedCount > 0) {
      throw new Error("This prompt template has been used in tasks and cannot be deleted.");
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
