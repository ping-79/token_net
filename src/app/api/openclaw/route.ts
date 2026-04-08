import { NextResponse } from "next/server";
import { getLatestOpenClawStatuses } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = getLatestOpenClawStatuses();
    const data = rows.map((r) => ({
      ...r,
      is_online: r.is_online === 1,
    }));
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to get OpenClaw data:", error);
    return NextResponse.json({ data: [] });
  }
}
