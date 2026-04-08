import { NextResponse } from "next/server";
import { runAllCollectors } from "@/collector";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await runAllCollectors();
    return NextResponse.json({ success: true, message: "采集任务已触发" });
  } catch (error) {
    console.error("Trigger failed:", error);
    return NextResponse.json(
      { success: false, message: "采集失败: " + String(error) },
      { status: 500 }
    );
  }
}
