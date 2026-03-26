import { Hono } from "hono";
import { hash } from "bcryptjs";
import { prisma } from "../lib/prisma";
import { authMiddleware, adminMiddleware } from "../middleware/auth";

const admin = new Hono();

// すべての管理者ルートに認証 + 管理者権限を適用
admin.use("/api/v1/admin/*", authMiddleware, adminMiddleware);

// GET /api/v1/admin/users - ユーザー一覧
admin.get("/api/v1/admin/users", async (c) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  return c.json(users);
});

// POST /api/v1/admin/users - ユーザー作成
admin.post("/api/v1/admin/users", async (c) => {
  const body = await c.req.json();
  const { name, email, password, role: userRole } = body as {
    name: string;
    email: string;
    password: string;
    role: string;
  };

  if (!name || !email || !password) {
    return c.json({ error: "name, email, password are required" }, 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return c.json(
      { error: "このメールアドレスは既に使用されています" },
      400
    );
  }

  const hashedPassword = await hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      hashedPassword,
      role: (userRole as "EDITOR" | "APPROVER" | "ADMIN") ?? "EDITOR",
    },
    select: { id: true, email: true, name: true, role: true },
  });

  return c.json(user, 201);
});

// GET /api/v1/admin/users/:userId - ユーザー取得
admin.get("/api/v1/admin/users/:userId", async (c) => {
  const userId = c.req.param("userId");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return c.json({ error: "ユーザーが見つかりません" }, 404);
  }

  return c.json(user);
});

// PATCH /api/v1/admin/users/:userId - ユーザー更新
admin.patch("/api/v1/admin/users/:userId", async (c) => {
  const userId = c.req.param("userId");
  const body = await c.req.json();
  const { name, role: newRole, password } = body as {
    name?: string;
    role?: string;
    password?: string;
  };

  const updateData: Record<string, unknown> = {};
  if (name) updateData.name = name;
  if (newRole) updateData.role = newRole;
  if (password) updateData.hashedPassword = await hash(password, 12);

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, email: true, name: true, role: true },
  });

  return c.json(user);
});

// DELETE /api/v1/admin/users/:userId - ユーザー削除
admin.delete("/api/v1/admin/users/:userId", async (c) => {
  const currentUser = c.get("user");
  const userId = c.req.param("userId");

  if (userId === currentUser.id) {
    return c.json({ error: "自分自身は削除できません" }, 400);
  }

  await prisma.user.delete({ where: { id: userId } });
  return c.json({ success: true });
});

export default admin;
