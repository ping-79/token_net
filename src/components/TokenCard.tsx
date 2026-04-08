"use client";

import type { TokenCardData } from "@/lib/types";

const providerColors: Record<string, string> = {
  chatgpt: "from-green-500 to-green-600",
  claude: "from-orange-500 to-orange-600",
  alibaba: "from-blue-500 to-blue-600",
};

const providerIcons: Record<string, string> = {
  chatgpt: "🤖",
  claude: "🧠",
  alibaba: "☁️",
};

function getProgressColor(percent: number): string {
  if (percent < 60) return "bg-green-500";
  if (percent < 85) return "bg-yellow-500";
  return "bg-red-500";
}

function formatResetDate(dateStr: string | null): string {
  if (!dateStr) return "未知";
  try {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  } catch {
    return dateStr;
  }
}

export default function TokenCard({ subscription, latest }: TokenCardData) {
  const used = latest?.used ?? 0;
  const total = latest?.total ?? 1;
  const unit = latest?.unit ?? "tokens";
  const percent = total > 0 ? Math.round((used / total) * 100) : 0;
  const hasData = latest !== null;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className={`h-1.5 bg-gradient-to-r ${providerColors[subscription.provider] || "from-gray-400 to-gray-500"}`} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{providerIcons[subscription.provider] || "📦"}</span>
            <h3 className="font-semibold text-gray-900 dark:text-white">{subscription.name}</h3>
          </div>
          <span className={`text-2xl font-bold ${percent >= 85 ? "text-red-500" : percent >= 60 ? "text-yellow-500" : "text-green-500"}`}>
            {hasData ? `${percent}%` : "--"}
          </span>
        </div>

        {hasData ? (
          <>
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(percent)}`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>{used.toLocaleString()} / {total.toLocaleString()} {unit}</span>
              <span>重置: {formatResetDate(latest?.reset_at ?? null)}</span>
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-gray-400 dark:text-gray-500 text-sm">
            暂无数据，等待首次采集
          </div>
        )}
      </div>
    </div>
  );
}
