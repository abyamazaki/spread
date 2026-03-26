import { Context, Next } from "hono";
import * as jose from "jose";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

// Extend Hono context
declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);
  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || process.env.AUTH_SECRET || ""
  );

  try {
    const { payload } = await jose.jwtVerify(token, secret);
    c.set("user", {
      id: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
    });
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
}

export async function adminMiddleware(c: Context, next: Next) {
  const user = c.get("user");
  if (user.role !== "ADMIN") {
    return c.json({ error: "Forbidden" }, 403);
  }
  await next();
}
