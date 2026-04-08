export const alibabaConfig = {
  url: "https://bailian.console.aliyun.com/",
  waitSelector: "[class*='console'], [class*='dashboard']",
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
