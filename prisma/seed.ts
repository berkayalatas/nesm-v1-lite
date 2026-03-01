import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@example.com" },
    select: { id: true },
  });

  const existingDemo = await prisma.user.findUnique({
    where: { email: "demo@nesm.com" },
    select: { id: true },
  });

  if (!existingAdmin) {
    const hashedAdminPassword = await bcrypt.hash("password123", 12);

    await prisma.user.create({
      data: {
        email: "admin@example.com",
        password: hashedAdminPassword,
        name: "NESM Admin",
        role: "admin",
      },
    });
  }

  if (existingDemo) {
    const hashedDemoPassword = await bcrypt.hash("demo123", 12);
    await prisma.user.update({
      where: { email: "demo@nesm.com" },
      data: {
        password: hashedDemoPassword,
        name: "Demo User",
        role: "user",
      },
    });
  } else {
    const hashedDemoPassword = await bcrypt.hash("demo123", 12);

    await prisma.user.create({
      data: {
        email: "demo@nesm.com",
        password: hashedDemoPassword,
        name: "Demo User",
        role: "user",
      },
    });
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
