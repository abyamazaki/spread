"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";

const statusConfig = {
  PENDING: { label: "申請中", variant: "warning" as const },
  APPROVED: { label: "承認済み", variant: "success" as const },
  REJECTED: { label: "却下", variant: "destructive" as const },
  WITHDRAWN: { label: "取り下げ", variant: "secondary" as const },
};

interface SheetData {
  name: string;
}

interface ChangeRequest {
  id: string;
  status: keyof typeof statusConfig;
  createdAt: string;
  requester: { name: string };
  reviewer: { name: string } | null;
  _count: { cells: number };
}

export default function RequestsPage() {
  const { sheetId } = useParams<{ sheetId: string }>();
  const [sheetName, setSheetName] = useState("");
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get<SheetData>(`/api/v1/sheets/${sheetId}`),
      apiClient.get<ChangeRequest[]>(`/api/v1/change-requests?sheetId=${sheetId}`),
    ])
      .then(([sheetData, requestsData]) => {
        setSheetName(sheetData.name);
        setRequests(requestsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sheetId]);

  if (loading) {
    return <div className="py-12 text-center text-gray-500">読み込み中...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">変更リクエスト</h1>
          <p className="text-sm text-gray-500">{sheetName}</p>
        </div>
        <Link href={`/sheets/${sheetId}`}>
          <Button variant="outline">シートに戻る</Button>
        </Link>
      </div>

      {requests.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">
          変更リクエストはまだありません
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  変更セル数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  申請者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  レビュー者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  申請日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.map((req) => {
                const config = statusConfig[req.status];
                return (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {req._count.cells} 件
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {req.requester.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {req.reviewer?.name ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(req.createdAt).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/sheets/${sheetId}/requests/${req.id}`}
                      >
                        <Button variant="ghost" size="sm">
                          詳細
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
