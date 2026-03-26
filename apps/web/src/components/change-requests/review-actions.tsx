"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";

export function ReviewActions({
  requestId,
  sheetId,
  canReview,
  isRequester,
}: {
  requestId: string;
  sheetId: string;
  canReview: boolean;
  isRequester: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [approveComment, setApproveComment] = useState("");
  const [rejectComment, setRejectComment] = useState("");
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [error, setError] = useState("");

  async function handleApprove() {
    setLoading(true);
    setError("");

    try {
      await apiClient.post(
        `/api/v1/change-requests/${requestId}/approve`,
        { comment: approveComment || undefined }
      );

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
      await apiClient.post(
        `/api/v1/change-requests/${requestId}/reject`,
        { comment: rejectComment }
      );

      router.push(`/sheets/${sheetId}/requests`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "却下に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw() {
    if (!confirm("この変更リクエストを取り下げますか？")) return;
    setLoading(true);
    setError("");

    try {
      await apiClient.post(
        `/api/v1/change-requests/${requestId}/withdraw`
      );

      router.push(`/sheets/${sheetId}/requests`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "取り下げに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  if (!canReview && !isRequester) return null;

  return (
    <div className="mt-6 space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="font-semibold text-gray-900">アクション</h3>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        {canReview && (
          <>
            <Button
              onClick={() => {
                setShowApprove(!showApprove);
                setShowReject(false);
              }}
              disabled={loading}
            >
              承認する
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowReject(!showReject);
                setShowApprove(false);
              }}
              disabled={loading}
            >
              却下する
            </Button>
          </>
        )}
        {isRequester && (
          <Button
            variant="outline"
            onClick={handleWithdraw}
            disabled={loading}
          >
            {loading ? "処理中..." : "取り下げ"}
          </Button>
        )}
      </div>

      {showApprove && (
        <div className="space-y-2">
          <Input
            placeholder="承認コメント（任意）"
            value={approveComment}
            onChange={(e) => setApproveComment(e.target.value)}
          />
          <Button size="sm" onClick={handleApprove} disabled={loading}>
            {loading ? "処理中..." : "承認を確定"}
          </Button>
        </div>
      )}

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
            {loading ? "処理中..." : "却下を確定"}
          </Button>
        </div>
      )}
    </div>
  );
}
