export const claudeConfig = {
  url: "https://claude.ai/settings/usage",
  waitSelector: "[class*='usage'], [class*='settings']",
  getCookies: (cookieJson: string) => {
    try {
      return JSON.parse(cookieJson) as Array<{
        name: string;
        value: string;
        domain: string;
      }>;
    } catch {
      return [];
    }
  },
};
