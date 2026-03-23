"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReviewActions({
  requestId,
  sheetId,
}: {
  requestId: string;
  sheetId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [error, setError] = useState("");

  async function handleApprove() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/change-requests/${requestId}/approve`,
        { method: "POST" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      router.push(`/sheets/${sheetId}/requests`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "承認に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/change-requests/${requestId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comment: rejectComment }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      router.push(`/sheets/${sheetId}/requests`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "却下に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="font-semibold text-gray-900">レビューアクション</h3>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <Button onClick={handleApprove} disabled={loading}>
          {loading ? "処理中..." : "承認する"}
        </Button>
        <Button
          variant="destructive"
          onClick={() => setShowReject(!showReject)}
          disabled={loading}
        >
          却下する
        </Button>
      </div>

      {showReject && (
        <div className="space-y-2">
          <Input
            placeholder="却下理由を入力（任意）"
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
          />
          <Button
            variant="destructive"
            size="sm"
            onClick={handleReject}
            disabled={loading}
          >
            却下を確定
          </Button>
        </div>
      )}
    </div>
  );
}
