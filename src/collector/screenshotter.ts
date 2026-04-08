import puppeteer, { type Browser } from "puppeteer-core";
import path from "path";
import fs from "fs";

const CHROMIUM_PATH =
  process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium";
const SCREENSHOTS_DIR = path.join(process.cwd(), "data", "screenshots");

function ensureScreenshotsDir() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
}

export async function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    executablePath: CHROMIUM_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--lang=zh-CN",
    ],
  });
}

export interface ScreenshotResult {
  buffer: Buffer;
  filePath: string;
}

export async function takeScreenshot(
  browser: Browser,
  url: string,
  cookies: Array<{ name: string; value: string; domain: string }>,
  subscriptionId: string,
  waitSelector?: string
): Promise<ScreenshotResult> {
  ensureScreenshotsDir();

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Set cookies for authentication
  if (cookies.length > 0) {
    await page.setCookie(...cookies);
  }

  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

  if (waitSelector) {
    try {
      await page.waitForSelector(waitSelector, { timeout: 10000 });
    } catch {
      console.warn(
        `[Screenshot] Selector "${waitSelector}" not found for ${subscriptionId}, continuing anyway`
      );
    }
  }

  // Wait a bit for dynamic content
  await new Promise((r) => setTimeout(r, 2000));

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `${subscriptionId}_${timestamp}.png`;
  const filePath = path.join(SCREENSHOTS_DIR, fileName);

  const buffer = (await page.screenshot({
    fullPage: true,
    type: "png",
  })) as Buffer;

  fs.writeFileSync(filePath, buffer);
  await page.close();

  console.log(`[Screenshot] Saved: ${fileName}`);
  return { buffer, filePath };
}
