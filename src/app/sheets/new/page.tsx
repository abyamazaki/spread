"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewSheetPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [columns, setColumns] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [allRows, setAllRows] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!name) setName(file.name.replace(/\.csv$/i, ""));

      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete(results) {
          if (results.errors.length > 0) {
            setError(`CSV パースエラー: ${results.errors[0].message}`);
            return;
          }
          const fields = results.meta.fields ?? [];
          setColumns(fields);
          setAllRows(results.data);
          setPreviewRows(results.data.slice(0, 10));
          setError("");
        },
      });
    },
    [name]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!columns.length || !allRows.length) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, columns, rows: allRows }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "シートの作成に失敗しました");
      }

      const sheet = await res.json();
      router.push(`/sheets/${sheet.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">CSV インポート</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="file">CSV ファイル</Label>
          <Input
            id="file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">シート名</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="シート名を入力"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {columns.length > 0 && (
          <div>
            <p className="mb-2 text-sm text-gray-600">
              {columns.length} カラム / {allRows.length} 行（プレビュー:
              先頭 10 行）
            </p>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-500"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {previewRows.map((row, i) => (
                    <tr key={i}>
                      {columns.map((col) => (
                        <td
                          key={col}
                          className="whitespace-nowrap px-4 py-2 text-gray-700"
                        >
                          {row[col] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Button type="submit" disabled={loading || !columns.length}>
          {loading ? "インポート中..." : "インポート"}
        </Button>
      </form>
    </div>
  );
}
