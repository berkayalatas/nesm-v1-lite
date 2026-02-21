import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [adminPassword, userPassword] = await Promise.all([
    bcrypt.hash("Admin#12345", 12),
    bcrypt.hash("User#12345", 12),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: "admin@nesm.local" },
    update: {
      name: "NESM Admin",
      password: adminPassword,
      role: "admin",
      avatarUrl: "https://example.com/avatars/admin.png",
    },
    create: {
      name: "NESM Admin",
      email: "admin@nesm.local",
      password: adminPassword,
      role: "admin",
      avatarUrl: "https://example.com/avatars/admin.png",
      preferences: {
        create: {
          marketingEmails: false,
          securityAlerts: true,
          theme: "dark",
        },
      },
    },
  });

  const standardUser = await prisma.user.upsert({
    where: { email: "user@nesm.local" },
    update: {
      name: "NESM User",
      password: userPassword,
      role: "user",
      avatarUrl: "https://example.com/avatars/user.png",
    },
    create: {
      name: "NESM User",
      email: "user@nesm.local",
      password: userPassword,
      role: "user",
      avatarUrl: "https://example.com/avatars/user.png",
      preferences: {
        create: {
          marketingEmails: true,
          securityAlerts: true,
          theme: "system",
        },
      },
    },
  });

  const users = [admin, standardUser];

  await prisma.auditLog.deleteMany({
    where: {
      entity: "profile",
      action: {
        startsWith: "seed.",
      },
    },
  });

  await prisma.auditLog.createMany({
    data: Array.from({ length: 10 }).map((_, index) => {
      const user = users[index % users.length];
      return {
        userId: user.id,
        action: `seed.profile.update.${index + 1}`,
        entity: "profile",
        metadata: {
          field: index % 2 === 0 ? "name" : "avatarUrl",
          source: "seed",
          success: true,
        },
        ipAddress: `192.168.1.${index + 10}`,
        userAgent: "seed-script/1.0",
      };
    }),
  });

  console.log("Seed completed: 1 admin, 1 user, 10 audit logs.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
