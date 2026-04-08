# 即梦自动化流水线

把 Gemini 输出的分镜 JSON → 即梦批量生图 → 本地画廊挑图 → 即梦批量生视频的全流程工具链。

## 一、环境安装

```bash
cd textbook/video/automation
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
```

要求：Python ≥ 3.10。

## 二、首次登录（只做一次）

```bash
python jimeng_batch.py --login-only
```

会打开浏览器，手动扫码登录即梦，登录成功后回终端按回车。Cookies 保存到 `.auth/jimeng_state.json`，后续脚本自动复用。

> ⚠️ `.auth/` 已默认忽略，请勿提交到 git。

## 三、完整流程

```
┌──────────────┐   ┌──────────────┐   ┌─────────────┐   ┌──────────────┐
│  Gemini 出   │ → │ jimeng_batch │ → │ gallery.html│ → │ jimeng_video │
│  scene JSON  │   │  批量生图    │   │  人工挑图   │   │  批量生视频  │
└──────────────┘   └──────────────┘   └─────────────┘   └──────────────┘
```

### Step 1 · 批量生图

```bash
python jimeng_batch.py \
  --input ../generated/E02.json \
  --output ../generated/E02_keyframes/
```

参数：
- `--only V-05,V-06` 只生成部分分镜（调试用）
- `--debug` 以 headed 模式打开浏览器，便于定位选择器

输出：`../generated/E02_keyframes/V-01_K1.png` ... `V-32_K4.png`，约 128 张。

若某张失败，重跑即可——已存在的图会自动跳过。

### Step 2 · 本地画廊挑图

**直接双击 `gallery.html`** 在浏览器中打开（或用 `python -m http.server 8000` 跑一个本地服务器，访问 `http://localhost:8000/gallery.html`）。

操作：
1. 点击 **📂 加载分镜 JSON** → 选择 `../generated/E02.json`
2. 页面会自动从 `../generated/{episode}_keyframes/` 目录加载图片
3. 点击图片切换选中状态（选中的带橙色描边）
4. 快捷键 **⚡ 一键全选 K1+K4** 可批量勾选所有首尾帧模式分镜的起止图
5. 点击 **💾 导出挑选清单** 下载 `E02_selected.json`

> 如果某张图显示"未生成"，说明 Step 1 漏了——回去 `--only V-XX` 补生成。

### Step 3 · 批量生视频

```bash
python jimeng_video.py \
  --input ../generated/E02.json \
  --keyframes ../generated/E02_keyframes/ \
  --output ../generated/E02_videos/
```

- `first_last_frame` 模式：用 K1 + K4 生成 15 秒过渡
- `image_to_video` 模式：用 K1 作为起始图 + video_prompt 生成动作
- `digital_human` 模式：**需要人工操作**（数字人要上传角色参考，本脚本暂不支持），脚本会打印提示跳过
- `text_to_image_only` 模式：直接跳过，这类分镜用于剪映拼接静态信息图

输出：`../generated/E02_videos/V-01.mp4` ... `V-32.mp4`。

视频生成慢，32 段约需 1-2 小时。可以开头加 `screen` / `tmux` 挂后台。

### Step 4 · 剪映合成

导入 `E02_videos/` 全部 mp4 到剪映，按 scene id 顺序排列，加入真人录制的旁白（小雷）+ 豆包 TTS 旁白（雷公）+ BGM + 字幕，导出 1920×1080 / 30fps。

## 四、常见问题

### Q1 · 选择器失效（即梦改版）
即梦网页 DOM 变更时，`jimeng_batch.py` 里的 `SEL_*` 常量需要更新：
1. `--debug` 模式打开
2. 在 `generate_one` 函数里加一行 `await page.pause()`
3. Playwright Inspector 会暂停，用它选中新元素获取选择器
4. 更新常量后重跑

### Q2 · 触发风控被要求验证
降低并发、加大 `page.wait_for_timeout(1500)` 间隔。本脚本已是串行+1.5秒节流。

### Q3 · 图片一致性不够
- 检查 Gemini 输出的每条 prompt 是否都拼接了角色锚定字符串
- 在即梦站内先上传 3 张角色参考图（雷公/小雷/小筑），后续自动生图会自动引用
- 若仍不稳定，改用火山引擎 Seedream API（付费但模型一致性更好）

### Q4 · 想全自动调用 API 而不是浏览器自动化
见 `../ai_studio_usage_guide.md` 第六节「可选·进阶」——用 `google-generativeai` SDK + 火山方舟 Seedream/Seedance API 可以做到完全无浏览器。

## 五、目录结构

```
textbook/video/
├── automation/
│   ├── jimeng_batch.py       # 批量生图
│   ├── jimeng_video.py       # 批量生视频
│   ├── gallery.html          # 本地挑图画廊
│   ├── requirements.txt
│   ├── README.md             # 本文件
│   └── .auth/                # 登录态 cookies（已忽略）
├── generated/
│   ├── E02.json              # Gemini 输出
│   ├── E02_keyframes/        # 关键帧图
│   ├── E02_selected.json     # 挑图清单
│   └── E02_videos/           # 视频片段
├── E01_雷公穿越记_剧情版脚本.md
├── 角色形象锚定提示词卡.md
├── scene_schema.json
├── ai_studio_system_prompt.md
└── ai_studio_usage_guide.md
```

## 六、合规声明

本脚本通过 Playwright 模拟真实用户浏览器操作，不调用任何非公开 API，不破解登录。使用时请遵守即梦服务条款，合理控制生成频率，仅用于教育教材制作目的。
