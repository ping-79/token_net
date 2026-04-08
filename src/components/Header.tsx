"use client";

interface HeaderProps {
  lastUpdated: string | null;
  onRefresh: () => void;
  refreshing: boolean;
}

export default function Header({ lastUpdated, onRefresh, refreshing }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Token Net</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {lastUpdated ? `最后更新: ${lastUpdated}` : "暂无数据"}
        </p>
      </div>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {refreshing ? "刷新中..." : "刷新"}
      </button>
    </header>
  );
}
