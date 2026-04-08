"use client";

import useSWR from "swr";
import { useState } from "react";
import Header from "./Header";
import TokenCard from "./TokenCard";
import OpenClawCard from "./OpenClawCard";
import UsageChart from "./UsageChart";
import { subscriptions, openclawInstances } from "@/lib/config";
import type { TokenSnapshot, OpenClawStatus } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface TokensResponse {
  data: Record<string, TokenSnapshot | null>;
  updatedAt: string | null;
}

interface OpenClawResponse {
  data: OpenClawStatus[];
}

interface HistoryResponse {
  data: { date: string; [key: string]: string | number }[];
}

export default function Dashboard() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: tokensData, mutate: mutateTokens } = useSWR<TokensResponse>(
    "/api/tokens",
    fetcher,
    { refreshInterval: 60000 }
  );

  const { data: openclawData, mutate: mutateOpenClaw } = useSWR<OpenClawResponse>(
    "/api/openclaw",
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: historyData, mutate: mutateHistory } = useSWR<HistoryResponse>(
    "/api/history",
    fetcher,
    { refreshInterval: 60000 }
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch("/api/trigger", { method: "POST" });
      await Promise.all([mutateTokens(), mutateOpenClaw(), mutateHistory()]);
    } finally {
      setRefreshing(false);
    }
  };

  const chartSubs = [
    { id: "chatgpt-1", name: "ChatGPT #1", color: "#22c55e" },
    { id: "chatgpt-2", name: "ChatGPT #2", color: "#3b82f6" },
    { id: "claude-1", name: "Claude", color: "#f97316" },
    { id: "alibaba-1", name: "阿里 Code Plan", color: "#8b5cf6" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header
        lastUpdated={tokensData?.updatedAt ?? null}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subscriptions.map((sub) => (
            <TokenCard
              key={sub.id}
              subscription={sub}
              latest={tokensData?.data?.[sub.id] ?? null}
            />
          ))}
        </div>

        <OpenClawCard
          instances={openclawInstances}
          statuses={openclawData?.data ?? []}
        />

        <UsageChart
          data={historyData?.data ?? []}
          subscriptionNames={chartSubs}
        />
      </main>
    </div>
  );
}
