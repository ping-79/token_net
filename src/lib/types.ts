export interface Subscription {
  id: string;
  name: string;
  provider: "chatgpt" | "claude" | "alibaba";
  url: string;
}

export interface TokenSnapshot {
  id: number;
  subscription_id: string;
  used: number | null;
  total: number | null;
  unit: string | null;
  reset_at: string | null;
  screenshot_path: string | null;
  raw_response: string | null;
  collected_at: string;
}

export interface OpenClawStatus {
  id: number;
  instance_id: string;
  instance_url: string;
  is_online: boolean;
  response_ms: number | null;
  checked_at: string;
}

export interface TokenCardData {
  subscription: Subscription;
  latest: TokenSnapshot | null;
}

export interface OpenClawInstance {
  id: string;
  name: string;
  url: string;
}
