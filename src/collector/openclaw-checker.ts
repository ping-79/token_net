import { openclawInstances } from "@/lib/config";
import { insertOpenClawStatus } from "@/lib/db";

export async function checkOpenClawInstances() {
  console.log("[OpenClaw] Checking instances...");

  for (const instance of openclawInstances) {
    if (!instance.url) {
      console.log(`[OpenClaw] ${instance.name}: no URL configured, skipping`);
      continue;
    }

    const start = Date.now();
    let isOnline = false;
    let responseMs: number | null = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(instance.url, {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(timeout);

      responseMs = Date.now() - start;
      isOnline = res.ok;
    } catch {
      responseMs = Date.now() - start;
      isOnline = false;
    }

    console.log(
      `[OpenClaw] ${instance.name}: ${isOnline ? "online" : "offline"} (${responseMs}ms)`
    );

    insertOpenClawStatus({
      instance_id: instance.id,
      instance_url: instance.url,
      is_online: isOnline,
      response_ms: responseMs,
    });
  }
}
