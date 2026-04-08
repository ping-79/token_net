import { subscriptions } from "@/lib/config";
import { insertTokenSnapshot } from "@/lib/db";
import { launchBrowser, takeScreenshot } from "./screenshotter";
import { extractTokenDataFromScreenshot } from "./extractor";
import { checkOpenClawInstances } from "./openclaw-checker";
import { chatgptConfig } from "./sites/chatgpt";
import { claudeConfig } from "./sites/claude";
import { alibabaConfig } from "./sites/alibaba";

const siteConfigs: Record<string, { url: string; waitSelector: string; getCookies: (s: string) => Array<{ name: string; value: string; domain: string }> }> = {
  chatgpt: chatgptConfig,
  claude: claudeConfig,
  alibaba: alibabaConfig,
};

// Cookie env var names per subscription
const cookieEnvKeys: Record<string, string> = {
  "chatgpt-1": "COOKIES_CHATGPT_1",
  "chatgpt-2": "COOKIES_CHATGPT_2",
  "claude-1": "COOKIES_CLAUDE_1",
  "alibaba-1": "COOKIES_ALIBABA_1",
};

export async function collectTokenData() {
  console.log("[Collector] Starting token data collection...");
  let browser;

  try {
    browser = await launchBrowser();

    for (const sub of subscriptions) {
      const config = siteConfigs[sub.provider];
      if (!config) {
        console.warn(`[Collector] No config for provider: ${sub.provider}`);
        continue;
      }

      const cookieEnv = cookieEnvKeys[sub.id] || "";
      const cookieJson = process.env[cookieEnv] || "[]";
      const cookies = config.getCookies(cookieJson);

      if (cookies.length === 0) {
        console.warn(`[Collector] No cookies for ${sub.id}, skipping screenshot`);
        continue;
      }

      try {
        const { buffer, filePath } = await takeScreenshot(
          browser,
          config.url,
          cookies,
          sub.id,
          config.waitSelector
        );

        const extracted = await extractTokenDataFromScreenshot(buffer, sub.provider);

        insertTokenSnapshot({
          subscription_id: sub.id,
          used: extracted.used,
          total: extracted.total,
          unit: extracted.unit,
          reset_at: extracted.resetDate,
          screenshot_path: filePath,
          raw_response: JSON.stringify(extracted),
        });

        console.log(`[Collector] ${sub.id}: ${JSON.stringify(extracted)}`);
      } catch (error) {
        console.error(`[Collector] Failed for ${sub.id}:`, error);
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function runAllCollectors() {
  await Promise.all([
    collectTokenData().catch((e) => console.error("[Collector] Token collection failed:", e)),
    checkOpenClawInstances().catch((e) => console.error("[Collector] OpenClaw check failed:", e)),
  ]);
}
