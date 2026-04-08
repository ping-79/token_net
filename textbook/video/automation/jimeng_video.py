"""
即梦批量生视频脚本（挑图完成后运行）

读取分镜 JSON + 用户挑选后的关键帧目录，按每个 scene 的 jimeng_mode
（首尾帧 / 图生视频 / 数字人）调用即梦对应功能，生成 15 秒视频片段。

用法：
    python jimeng_video.py --input ../generated/E02.json --keyframes ../generated/E02_keyframes/ --output ../generated/E02_videos/

前置：
- 已通过 gallery.html 挑好图，每个 V-XX 至少保留 K1 和 K4（首尾帧模式必需）。
- 已在 jimeng_batch.py --login-only 保存过 cookies。

注意：
- 视频生成速度慢，每段约 1-3 分钟；本脚本串行执行，可能跑 1-2 小时。
- 即梦不同模式入口不同，下方选择器若失效需在 --debug 模式下更新。
"""
from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path

from playwright.async_api import async_playwright, Page

from jimeng_batch import ensure_login, AUTH_FILE  # 复用登录逻辑

URL_FIRST_LAST = "https://jimeng.jianying.com/ai-tool/video/generate?mode=first_last"
URL_IMG_TO_VIDEO = "https://jimeng.jianying.com/ai-tool/video/generate?mode=i2v"
URL_DIGITAL_HUMAN = "https://jimeng.jianying.com/ai-tool/digital-human"

SEL_FIRST_IMG_UPLOAD = "input[type='file'][data-role='first']"
SEL_LAST_IMG_UPLOAD = "input[type='file'][data-role='last']"
SEL_SINGLE_IMG_UPLOAD = "input[type='file']"
SEL_VIDEO_PROMPT = "textarea[placeholder*='描述']"
SEL_VIDEO_GENERATE = "button:has-text('生成视频')"
SEL_VIDEO_RESULT = "video[src*='jimeng']"
SEL_VIDEO_DOWNLOAD = "button:has-text('下载')"

VIDEO_TIMEOUT_MS = 300_000


async def gen_first_last(page: Page, k1: Path, k4: Path, prompt: str, out: Path) -> bool:
    try:
        await page.goto(URL_FIRST_LAST)
        await page.wait_for_selector(SEL_VIDEO_PROMPT, timeout=30_000)
        await page.set_input_files(SEL_FIRST_IMG_UPLOAD, str(k1))
        await page.set_input_files(SEL_LAST_IMG_UPLOAD, str(k4))
        await page.fill(SEL_VIDEO_PROMPT, prompt)
        await page.click(SEL_VIDEO_GENERATE)
        await page.wait_for_selector(SEL_VIDEO_RESULT, timeout=VIDEO_TIMEOUT_MS)
        async with page.expect_download(timeout=60_000) as dl_info:
            await page.click(SEL_VIDEO_DOWNLOAD)
        dl = await dl_info.value
        await dl.save_as(out)
        return True
    except Exception as e:
        print(f"  ✗ first_last_frame 失败：{e}")
        return False


async def gen_image_to_video(page: Page, img: Path, prompt: str, out: Path) -> bool:
    try:
        await page.goto(URL_IMG_TO_VIDEO)
        await page.wait_for_selector(SEL_VIDEO_PROMPT, timeout=30_000)
        await page.set_input_files(SEL_SINGLE_IMG_UPLOAD, str(img))
        await page.fill(SEL_VIDEO_PROMPT, prompt)
        await page.click(SEL_VIDEO_GENERATE)
        await page.wait_for_selector(SEL_VIDEO_RESULT, timeout=VIDEO_TIMEOUT_MS)
        async with page.expect_download(timeout=60_000) as dl_info:
            await page.click(SEL_VIDEO_DOWNLOAD)
        dl = await dl_info.value
        await dl.save_as(out)
        return True
    except Exception as e:
        print(f"  ✗ image_to_video 失败：{e}")
        return False


async def run(input_json: Path, keyframes_dir: Path, output_dir: Path, only, debug: bool):
    data = json.loads(input_json.read_text(encoding="utf-8"))
    scenes = data["scenes"]
    output_dir.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as p:
        ctx = await ensure_login(p, headless=not debug)
        page = await ctx.new_page()

        for scene in scenes:
            sid = scene["id"]
            if only and sid not in only:
                continue
            mode = scene["jimeng_mode"]
            if mode == "text_to_image_only":
                print(f"[{sid}] 仅出图模式，跳过")
                continue

            out = output_dir / f"{sid}.mp4"
            if out.exists():
                print(f"[{sid}] 已存在，跳过")
                continue

            vp = scene.get("video_prompt", "")
            print(f"\n[{sid}] mode={mode}")

            if mode == "first_last_frame":
                k1 = keyframes_dir / f"{sid}_K1.png"
                k4 = keyframes_dir / f"{sid}_K4.png"
                if not (k1.exists() and k4.exists()):
                    print(f"  ✗ 缺少 K1 或 K4，跳过")
                    continue
                ok = await gen_first_last(page, k1, k4, vp, out)
            elif mode == "image_to_video":
                # 默认用 K1 做起始帧
                k1 = keyframes_dir / f"{sid}_K1.png"
                if not k1.exists():
                    print(f"  ✗ 缺少 K1，跳过")
                    continue
                ok = await gen_image_to_video(page, k1, vp, out)
            elif mode == "digital_human":
                print(f"  ! digital_human 模式需人工操作，脚本暂不支持")
                continue
            else:
                print(f"  ! 未知模式 {mode}，跳过")
                continue

            if ok:
                print(f"  ✓ → {out.name}")

        await ctx.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", type=Path, required=True)
    ap.add_argument("--keyframes", type=Path, required=True)
    ap.add_argument("--output", type=Path, required=True)
    ap.add_argument("--only", type=str, default=None)
    ap.add_argument("--debug", action="store_true")
    args = ap.parse_args()

    only = set(s.strip() for s in args.only.split(",")) if args.only else None
    asyncio.run(run(args.input, args.keyframes, args.output, only, args.debug))


if __name__ == "__main__":
    main()
