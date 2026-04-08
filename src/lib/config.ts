import type { Subscription, OpenClawInstance } from "./types";

export const subscriptions: Subscription[] = [
  {
    id: "chatgpt-1",
    name: "ChatGPT #1",
    provider: "chatgpt",
    url: "https://chatgpt.com/settings",
  },
  {
    id: "chatgpt-2",
    name: "ChatGPT #2",
    provider: "chatgpt",
    url: "https://chatgpt.com/settings",
  },
  {
    id: "claude-1",
    name: "Claude",
    provider: "claude",
    url: "https://claude.ai/settings/usage",
  },
  {
    id: "alibaba-1",
    name: "阿里 Code Plan",
    provider: "alibaba",
    url: "https://bailian.console.aliyun.com/",
  },
];

export const openclawInstances: OpenClawInstance[] = [
  { id: "openclaw-1", name: "OpenClaw #1", url: process.env.OPENCLAW_URL_1 || "" },
  { id: "openclaw-2", name: "OpenClaw #2", url: process.env.OPENCLAW_URL_2 || "" },
  { id: "openclaw-3", name: "OpenClaw #3", url: process.env.OPENCLAW_URL_3 || "" },
];

export const CRON_TOKEN_SCHEDULE = "0 */6 * * *"; // every 6 hours
export const CRON_OPENCLAW_SCHEDULE = "*/5 * * * *"; // every 5 minutes
