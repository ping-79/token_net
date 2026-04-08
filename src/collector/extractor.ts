import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

export interface ExtractedTokenData {
  used: number | null;
  total: number | null;
  unit: string | null;
  resetDate: string | null;
}

export async function extractTokenDataFromScreenshot(
  screenshotBuffer: Buffer,
  provider: string
): Promise<ExtractedTokenData> {
  if (!ANTHROPIC_API_KEY) {
    console.error("[Extractor] ANTHROPIC_API_KEY not set");
    return { used: null, total: null, unit: null, resetDate: null };
  }

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const base64Image = screenshotBuffer.toString("base64");

  const providerHints: Record<string, string> = {
    chatgpt:
      "This is a ChatGPT settings/usage page. Look for message limits, GPT-4 usage counts, or quota information.",
    claude:
      "This is a Claude AI usage page. Look for message counts, token usage, or plan limits.",
    alibaba:
      "This is an Alibaba Cloud / 阿里云 Code Plan page. Look for token/调用次数 usage, quota remaining, or credit balance. Text may be in Chinese.",
  };

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: base64Image,
              },
            },
            {
              type: "text",
              text: `Analyze this screenshot of a subscription usage page.
${providerHints[provider] || ""}

Extract the following information:
- used: number of tokens/messages/credits used (numeric value)
- total: total available tokens/messages/credits (numeric value)
- unit: the unit of measurement (e.g., "messages", "tokens", "credits", "次")
- resetDate: when the quota resets (ISO 8601 date format if possible, otherwise the raw text)

Return ONLY a valid JSON object with these fields. If a field cannot be determined, use null.
Example: {"used": 150, "total": 500, "unit": "messages", "resetDate": "2026-04-15"}`,
            },
          ],
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      console.error("[Extractor] No JSON found in response:", text);
      return { used: null, total: null, unit: null, resetDate: null };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      used: typeof parsed.used === "number" ? parsed.used : null,
      total: typeof parsed.total === "number" ? parsed.total : null,
      unit: typeof parsed.unit === "string" ? parsed.unit : null,
      resetDate: typeof parsed.resetDate === "string" ? parsed.resetDate : null,
    };
  } catch (error) {
    console.error("[Extractor] Failed:", error);
    return { used: null, total: null, unit: null, resetDate: null };
  }
}
