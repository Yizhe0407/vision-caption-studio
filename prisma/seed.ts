import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Prompt templates are now user-scoped and created automatically on registration.
  // Nothing to seed globally.
  console.log("Seed complete.");
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  });
