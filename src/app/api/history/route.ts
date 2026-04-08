import { NextResponse } from "next/server";
import { getHistoryData } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = getHistoryData(7);

    // Group by date, pivot subscription_id as columns with usage percentage
    const dateMap = new Map<string, Record<string, string | number>>();

    for (const row of rows) {
      const date = (row.collected_at as string).slice(0, 10);
      if (!dateMap.has(date)) {
        dateMap.set(date, { date });
      }
      const entry = dateMap.get(date)!;
      const used = row.used as number;
      const total = row.total as number;
      if (total > 0) {
        entry[row.subscription_id as string] = Math.round((used / total) * 100);
      }
    }

    const data = Array.from(dateMap.values());
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to get history data:", error);
    return NextResponse.json({ data: [] });
  }
}
