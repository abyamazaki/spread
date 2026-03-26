import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const users = new Hono();

// 認証を適用
users.use("/api/v1/users", authMiddleware);

// GET /api/v1/users - ユーザー一覧（行管理者割り当て用）
users.get("/api/v1/users", async (c) => {
  const userList = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return c.json(userList);
});

export default users;
