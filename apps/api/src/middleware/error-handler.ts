import { Context } from "hono";

export function errorHandler(err: Error, c: Context) {
  console.error(err);

  // Prisma errors
  if ("code" in err) {
    const prismaErr = err as any;
    if (prismaErr.code === "P2025") {
      return c.json({ error: "Not found" }, 404);
    }
    if (prismaErr.code === "P2002") {
      return c.json({ error: "Already exists" }, 409);
    }
  }

  return c.json({ error: "Internal server error" }, 500);
}
