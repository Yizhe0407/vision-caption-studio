import { PrismaClient, PromptTaskType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.promptTemplate.upsert({
    where: {
      name_version: {
        name: "default-caption",
        version: 1,
      },
    },
    update: {},
    create: {
      name: "default-caption",
      version: 1,
      taskType: PromptTaskType.CAPTION,
      content: `Analyze this product image and generate:

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
}`,
      isActive: true,
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  });
