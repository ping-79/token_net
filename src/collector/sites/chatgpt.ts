export const chatgptConfig = {
  url: "https://chatgpt.com/settings",
  waitSelector: "[class*='settings']",
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
