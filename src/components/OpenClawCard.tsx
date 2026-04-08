"use client";

import type { OpenClawStatus, OpenClawInstance } from "@/lib/types";

interface OpenClawCardProps {
  instances: OpenClawInstance[];
  statuses: OpenClawStatus[];
}

export default function OpenClawCard({ instances, statuses }: OpenClawCardProps) {
  const statusMap = new Map<string, OpenClawStatus>();
  for (const s of statuses) {
    statusMap.set(s.instance_id, s);
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
      <div className="h-1.5 bg-gradient-to-r from-purple-500 to-purple-600" />
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🦀</span>
          <h3 className="font-semibold text-gray-900 dark:text-white">OpenClaw 智能体</h3>
        </div>
        <div className="space-y-3">
          {instances.map((inst) => {
            const status = statusMap.get(inst.id);
            const isOnline = status?.is_online ?? false;
            const responseMs = status?.response_ms;
            const hasData = !!status;

            return (
              <div
                key={inst.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-750 dark:bg-opacity-50"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      !hasData ? "bg-gray-300 dark:bg-gray-600" : isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {inst.name}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {!hasData
                    ? "等待检测"
                    : isOnline
                      ? `在线 ${responseMs !== null ? `(${responseMs}ms)` : ""}`
                      : "离线"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
