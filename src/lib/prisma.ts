import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";

// サーバーレス環境で WebSocket を使用
if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function cleanConnectionString(url: string): string {
  const u = new URL(url);
  u.searchParams.delete("channel_binding");
  u.searchParams.delete("sslmode");
  return u.toString();
}

function createPrismaClient() {
  const pool = new Pool({
    connectionString: cleanConnectionString(process.env.DATABASE_URL!),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaNeon(pool as any);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
