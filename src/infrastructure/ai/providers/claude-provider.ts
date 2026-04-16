import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, GenerateCaptionInput, GenerateCaptionResult } from "@/src/infrastructure/ai/types";
import { parseGeneratedOutput } from "@/src/infrastructure/ai/providers/parse-generated-output";

export class ClaudeProvider implements AIProvider {
  constructor(private readonly client: Anthropic) {}

  async generateCaptionAndTags(input: GenerateCaptionInput): Promise<GenerateCaptionResult> {
    const response = await this.client.messages.create({
      model: input.model,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
               type: "text",
               text: input.prompt,
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: input.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: input.imageBuffer.toString("base64"),
              },
            },
          ],
        },
      ],
    });

    const textPart = response.content.find((item) => item.type === "text");
    if (!textPart || textPart.type !== "text") {
      throw new Error("Claude returned empty content.");
    }

    const parsed = parseGeneratedOutput(textPart.text);

    return {
      caption: parsed.caption,
      tags: parsed.tags,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }
}
