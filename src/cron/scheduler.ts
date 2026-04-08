import cron from "node-cron";
import { collectTokenData } from "@/collector";
import { checkOpenClawInstances } from "@/collector/openclaw-checker";
import { CRON_TOKEN_SCHEDULE, CRON_OPENCLAW_SCHEDULE } from "@/lib/config";

export function startScheduler() {
  console.log("[Scheduler] Starting cron jobs...");

  // Token collection: every 6 hours
  cron.schedule(CRON_TOKEN_SCHEDULE, async () => {
    console.log("[Scheduler] Running token collection...");
    try {
      await collectTokenData();
    } catch (error) {
      console.error("[Scheduler] Token collection failed:", error);
    }
  });

  // OpenClaw check: every 5 minutes
  cron.schedule(CRON_OPENCLAW_SCHEDULE, async () => {
    console.log("[Scheduler] Running OpenClaw check...");
    try {
      await checkOpenClawInstances();
    } catch (error) {
      console.error("[Scheduler] OpenClaw check failed:", error);
    }
  });

  console.log(`[Scheduler] Token collection: ${CRON_TOKEN_SCHEDULE}`);
  console.log(`[Scheduler] OpenClaw check: ${CRON_OPENCLAW_SCHEDULE}`);
}
