"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const roleLabels: Record<string, string> = {
  EDITOR: "編集者",
  APPROVER: "承認者",
  ADMIN: "管理者",
};

export function Header() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const role = user.role;

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/sheets" className="text-lg font-bold text-gray-900">
            Spread
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/sheets"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              シート一覧
            </Link>
            {role === "ADMIN" && (
              <Link
                href="/admin/users"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ユーザー管理
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user.name}</span>
          {role && (
            <Badge variant="secondary">{roleLabels[role] ?? role}</Badge>
          )}
          <Link
            href="/profile/password"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            パスワード変更
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout()}
          >
            ログアウト
          </Button>
        </div>
      </div>
    </header>
  );
}
