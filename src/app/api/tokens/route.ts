import { NextResponse } from "next/server";
import { getLatestSnapshots } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = getLatestSnapshots();
    const timestamps = Object.values(data)
      .map((s) => (s as Record<string, unknown>)?.collected_at as string)
      .filter(Boolean)
      .sort();
    const updatedAt = timestamps.length > 0 ? timestamps[timestamps.length - 1] : null;

    return NextResponse.json({ data, updatedAt });
  } catch (error) {
    console.error("Failed to get token data:", error);
    return NextResponse.json({ data: {}, updatedAt: null });
  }
}
