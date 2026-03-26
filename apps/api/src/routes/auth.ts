import { Hono } from "hono";
import { compare } from "bcryptjs";
import * as jose from "jose";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const auth = new Hono();

function getSecret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET || process.env.AUTH_SECRET || ""
  );
}

async function signToken(
  payload: { sub: string; email: string; name: string; role: string },
  expiresIn: string
) {
  return new jose.SignJWT({
    email: payload.email,
    name: payload.name,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

// POST /api/v1/auth/login - ログイン
auth.post("/api/v1/auth/login", async (c) => {
  const body = await c.req.json();
  const { email, password } = body as { email: string; password: string };

  if (!email || !password) {
    return c.json({ error: "email and password are required" }, 400);
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const isValid = await compare(password, user.hashedPassword);
  if (!isValid) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const tokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const accessToken = await signToken(tokenPayload, "15m");
  const refreshToken = await signToken(tokenPayload, "7d");

  return c.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});

// POST /api/v1/auth/refresh - トークンリフレッシュ
auth.post("/api/v1/auth/refresh", async (c) => {
  const body = await c.req.json();
  const { refreshToken } = body as { refreshToken: string };

  if (!refreshToken) {
    return c.json({ error: "refreshToken is required" }, 400);
  }

  try {
    const { payload } = await jose.jwtVerify(refreshToken, getSecret());

    const tokenPayload = {
      sub: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
    };

    const accessToken = await signToken(tokenPayload, "15m");
    const newRefreshToken = await signToken(tokenPayload, "7d");

    return c.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch {
    return c.json({ error: "Invalid refresh token" }, 401);
  }
});

// GET /api/v1/auth/me - 現在のユーザー情報を返す
auth.get("/api/v1/auth/me", authMiddleware, async (c) => {
  const user = c.get("user");
  return c.json(user);
});

export default auth;
