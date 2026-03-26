"use client";

export default function SheetError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h2 className="text-xl font-bold text-red-600">エラーが発生しました</h2>
      <p className="mt-2 text-sm text-gray-600">{error.message}</p>
      {error.digest && (
        <p className="mt-1 text-xs text-gray-400">Digest: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        再試行
      </button>
    </div>
  );
}
