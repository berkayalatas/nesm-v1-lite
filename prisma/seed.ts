import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@example.com" },
    select: { id: true },
  });

  if (existingAdmin) {
    console.log("Seed skipped: admin@example.com already exists.");
    return;
  }

  const hashedPassword = await bcrypt.hash("password123", 12);

  await prisma.user.create({
    data: {
      email: "admin@example.com",
      password: hashedPassword,
      name: "NESM Admin",
      role: "admin",
    },
  });

  console.log("Seed complete: created admin@example.com.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
