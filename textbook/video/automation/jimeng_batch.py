"""
即梦批量生图脚本

读取 Gemini 输出的分镜 JSON，用 Playwright 打开即梦网站，
批量粘贴每张关键帧的 prompt、触发生成、等待完成、下载图片。

首次运行：需人工登录一次，cookies 保存在 .auth/jimeng_state.json。
后续运行：自动复用登录态。

用法：
    python jimeng_batch.py --input ../generated/E02.json --output ../generated/E02_keyframes/
    python jimeng_batch.py --input ../generated/E02.json --output ../generated/E02_keyframes/ --only V-05,V-06
    python jimeng_batch.py --login-only  # 仅登录保存 cookies

注意：
- 即梦网页 DOM 会变动，若选择器失效，用 --debug 打开 headed 模式，用 page.pause() 手动定位新选择器。
- 本脚本不调用任何非公开 API，全程模拟人工浏览器操作，遵守即梦 ToS。
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

from playwright.async_api import async_playwright, Page, BrowserContext

JIMENG_URL = "https://jimeng.jianying.com/ai-tool/image/generate"
AUTH_FILE = Path(__file__).parent / ".auth" / "jimeng_state.json"

# —— 选择器（若失效请在 --debug 模式下更新）————————————————
SEL_PROMPT_TEXTAREA = "textarea[placeholder*='描述'], textarea[placeholder*='prompt']"
SEL_GENERATE_BUTTON = "button:has-text('立即生成'), button:has-text('生成')"
SEL_RESULT_IMG = "img[src*='jimeng'][alt*='生成']"
SEL_DOWNLOAD_BUTTON = "button[aria-label*='下载'], button:has-text('下载')"
# ————————————————————————————————————————————————

GENERATION_TIMEOUT_MS = 120_000  # 每张图最多等 2 分钟


async def ensure_login(p, headless: bool) -> BrowserContext:
    AUTH_FILE.parent.mkdir(parents=True, exist_ok=True)
    browser = await p.chromium.launch(headless=headless)
    if AUTH_FILE.exists():
        ctx = await browser.new_context(storage_state=str(AUTH_FILE))
    else:
        ctx = await browser.new_context()
        page = await ctx.new_page()
        await page.goto(JIMENG_URL)
        print("[首次登录] 请在打开的浏览器中手动登录即梦，完成后回到终端按回车继续……")
        input()
        await ctx.storage_state(path=str(AUTH_FILE))
        await page.close()
    return ctx


async def generate_one(page: Page, prompt: str, out_path: Path) -> bool:
    """在即梦页面粘贴 prompt、生成、下载。成功返回 True。"""
    try:
        await page.fill(SEL_PROMPT_TEXTAREA, prompt)
        await page.click(SEL_GENERATE_BUTTON)
        # 等待结果图出现
        await page.wait_for_selector(SEL_RESULT_IMG, timeout=GENERATION_TIMEOUT_MS)
        await page.wait_for_timeout(2000)  # 等待图片 URL 稳定
        # 抓第一张结果图的 src 并下载
        img_src = await page.get_attribute(SEL_RESULT_IMG, "src")
        if not img_src:
            return False
        # 用 Playwright request context 直接下载，避免触发反爬
        async with page.expect_download(timeout=30_000) as dl_info:
            await page.click(SEL_DOWNLOAD_BUTTON)
        dl = await dl_info.value
        await dl.save_as(out_path)
        return True
    except Exception as e:
        print(f"  ✗ 失败：{e}")
        return False


async def run(input_json: Path, output_dir: Path, only: set[str] | None, debug: bool):
    data = json.loads(input_json.read_text(encoding="utf-8"))
    episode = data.get("episode", "EXX")
    scenes = data["scenes"]
    output_dir.mkdir(parents=True, exist_ok=True)

    total = sum(
        len(s["keyframes"]) for s in scenes if only is None or s["id"] in only
    )
    done = 0
    failed: list[str] = []

    async with async_playwright() as p:
        ctx = await ensure_login(p, headless=not debug)
        page = await ctx.new_page()
        await page.goto(JIMENG_URL)
        await page.wait_for_selector(SEL_PROMPT_TEXTAREA, timeout=30_000)

        for scene in scenes:
            sid = scene["id"]
            if only and sid not in only:
                continue
            print(f"\n[{episode} · {sid}] {scene.get('type', '')}")
            for kf in scene["keyframes"]:
                k = kf["k"]
                out = output_dir / f"{sid}_K{k}.png"
                if out.exists():
                    print(f"  · K{k} 已存在，跳过")
                    done += 1
                    continue
                print(f"  · K{k} 生成中……({done + 1}/{total})")
                ok = await generate_one(page, kf["prompt"], out)
                if ok:
                    print(f"  ✓ K{k} → {out.name}")
                else:
                    failed.append(f"{sid}_K{k}")
                done += 1
                # 节流，避免触发风控
                await page.wait_for_timeout(1500)

        await ctx.close()

    print(f"\n=== 完成 {done - len(failed)}/{total} ===")
    if failed:
        print("失败列表：")
        for f in failed:
            print(f"  - {f}")
        sys.exit(1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", type=Path, help="Gemini 输出的 scene JSON 文件")
    ap.add_argument("--output", type=Path, help="关键帧输出目录")
    ap.add_argument("--only", type=str, default=None, help="只生成指定分镜，如 V-05,V-06")
    ap.add_argument("--debug", action="store_true", help="headed 模式，用于调试选择器")
    ap.add_argument("--login-only", action="store_true", help="仅登录保存 cookies")
    args = ap.parse_args()

    if args.login_only:
        async def _login():
            async with async_playwright() as p:
                await ensure_login(p, headless=False)
        asyncio.run(_login())
        return

    if not args.input or not args.output:
        ap.error("--input 和 --output 必填（除非 --login-only）")

    only = set(s.strip() for s in args.only.split(",")) if args.only else None
    asyncio.run(run(args.input, args.output, only, args.debug))


if __name__ == "__main__":
    main()
