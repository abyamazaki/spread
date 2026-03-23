import type { NextAuthConfig } from "next-auth";

// Edge Runtime 互換の設定（DB 依存なし）
// middleware.ts から使用される
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
  providers: [], // middleware では空。auth.ts で Credentials を追加
};
