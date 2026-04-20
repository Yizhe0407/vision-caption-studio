import OpenAI from "openai";
import type { AIProvider, GenerateCaptionInput, GenerateCaptionResult } from "@/src/infrastructure/ai/types";
import { parseGeneratedOutput } from "@/src/infrastructure/ai/providers/parse-generated-output";

export class NvidiaNimProvider implements AIProvider {
  constructor(private readonly client: OpenAI) {}

  async generateCaptionAndTags(input: GenerateCaptionInput): Promise<GenerateCaptionResult> {
    const imageBase64 = input.imageBuffer.toString("base64");
    const promptWithJsonHint = `${input.prompt}\n\nReturn only valid JSON.`;
    const completion = await this.client.chat.completions.create({
      model: input.model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: promptWithJsonHint,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${input.mimeType};base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_object",
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("NVIDIA NIM returned empty content.");
    }

    const parsed = parseGeneratedOutput(content);

    return {
      caption: parsed.caption,
      tags: parsed.tags,
      usage: {
        inputTokens: completion.usage?.prompt_tokens ?? 0,
        outputTokens: completion.usage?.completion_tokens ?? 0,
        totalTokens: completion.usage?.total_tokens ?? 0,
      },
    };
  }
}
