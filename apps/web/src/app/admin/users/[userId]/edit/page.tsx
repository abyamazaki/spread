"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function UserEditPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchUser = useCallback(async () => {
    try {
      const data = await apiClient.get<User>(`/api/v1/admin/users/${params.userId}`);
      setUser(data);
      setName(data.name);
      setRole(data.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, [params.userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const body: Record<string, string> = { name, role };
      if (password) {
        body.password = password;
      }

      await apiClient.patch(`/api/v1/admin/users/${params.userId}`, body);

      router.push("/admin/users");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">読み込み中...</p>;
  }

  if (!user) {
    return (
      <div>
        <p className="text-sm text-red-600">{error || "ユーザーが見つかりません"}</p>
        <Link href="/admin/users" className="mt-2 text-sm text-blue-600 hover:underline">
          ← ユーザー一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/users" className="text-sm text-blue-600 hover:underline">
          ← ユーザー一覧に戻る
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">ユーザー編集</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-4 space-y-4 rounded-lg border border-gray-200 bg-white p-6"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="email">メールアドレス</Label>
            <Input id="email" value={user.email} disabled />
          </div>
          <div className="space-y-1">
            <Label htmlFor="name">名前</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="role">ロール</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="EDITOR">編集者</option>
              <option value="APPROVER">承認者</option>
              <option value="ADMIN">管理者</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="変更する場合のみ入力"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/users")}>
            キャンセル
          </Button>
        </div>
      </form>
    </div>
  );
}
