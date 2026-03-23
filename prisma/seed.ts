import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "管理者",
      hashedPassword,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "approver@example.com" },
    update: {},
    create: {
      email: "approver@example.com",
      name: "承認者",
      hashedPassword: await hash("approver123", 12),
      role: "APPROVER",
    },
  });

  await prisma.user.upsert({
    where: { email: "editor@example.com" },
    update: {},
    create: {
      email: "editor@example.com",
      name: "編集者",
      hashedPassword: await hash("editor123", 12),
      role: "EDITOR",
    },
  });

  console.log("Seed completed: 3 users created (admin, approver, editor)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
