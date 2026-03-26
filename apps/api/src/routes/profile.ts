import { Hono } from "hono";
import { compare, hash } from "bcryptjs";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const profile = new Hono();

// 認証を適用
profile.use("/api/v1/profile/*", authMiddleware);

// PATCH /api/v1/profile/password - 自分のパスワードを変更
profile.patch("/api/v1/profile/password", async (c) => {
  const currentUser = c.get("user");
  const body = await c.req.json();
  const { currentPassword, newPassword } = body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return c.json(
      { error: "現在のパスワードと新しいパスワードを入力してください" },
      400
    );
  }

  if (newPassword.length < 6) {
    return c.json(
      { error: "新しいパスワードは6文字以上にしてください" },
      400
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
  });

  if (!user) {
    return c.json({ error: "ユーザーが見つかりません" }, 404);
  }

  const isValid = await compare(currentPassword, user.hashedPassword);
  if (!isValid) {
    return c.json(
      { error: "現在のパスワードが正しくありません" },
      400
    );
  }

  await prisma.user.update({
    where: { id: currentUser.id },
    data: { hashedPassword: await hash(newPassword, 12) },
  });

  return c.json({ success: true });
});

export default profile;
