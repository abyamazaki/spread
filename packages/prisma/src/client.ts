import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// pg の接続文字列パーサーが sslmode を ssl オブジェクトに変換してしまい
// startup メッセージでオブジェクトを文字列として送ろうとしてエラーになるため除去
function cleanConnectionString(url: string): string {
  return url
    .replace(/[?&]channel_binding=[^&]*/gi, "")
    .replace(/[?&]sslmode=[^&]*/gi, "")
    .replace(/\?$/, "");
}

function createPrismaClient() {
  const pool = new pg.Pool({
    connectionString: cleanConnectionString(process.env.DATABASE_URL!),
    ssl: { rejectUnauthorized: false },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaPg(pool as any);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
