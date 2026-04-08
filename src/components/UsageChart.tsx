"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface HistoryPoint {
  date: string;
  [key: string]: string | number;
}

interface UsageChartProps {
  data: HistoryPoint[];
  subscriptionNames: { id: string; name: string; color: string }[];
}

const COLORS = ["#22c55e", "#3b82f6", "#f97316", "#8b5cf6"];

export default function UsageChart({ data, subscriptionNames }: UsageChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">用量趋势 (7天)</h3>
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
          暂无历史数据
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">用量趋势 (7天)</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(0,0,0,0.8)",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "12px",
            }}
          />
          <Legend />
          {subscriptionNames.map((sub, i) => (
            <Line
              key={sub.id}
              type="monotone"
              dataKey={sub.id}
              name={sub.name}
              stroke={sub.color || COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
