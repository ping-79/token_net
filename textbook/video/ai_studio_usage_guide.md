# Google AI Studio 使用指南

> 目标：在 Google AI Studio 搭建"建筑AIGC教程视频编剧大脑"，用 Gemini 2.5 Pro 把教材章节自动转为结构化分镜 JSON，送入 Playwright 自动化流水线。

---

## 一、前置准备

- Google 账号（可访问 https://aistudio.google.com ）
- 网络可达 Google（国内需自备）
- 本地已准备好文件：
  - `ai_studio_system_prompt.md`（System Instruction 内容）
  - `scene_schema.json`（输出结构定义）
  - 教材章节 Markdown（例如 `模块一_AIGC概要与建筑行业应用.md`）
  - `E01_雷公穿越记_剧情版脚本.md`（作为 Few-shot 示例）
  - `角色形象锚定提示词卡.md`（作为背景知识）

---

## 二、搭建步骤

### Step 1 · 新建 Prompt

1. 打开 https://aistudio.google.com/
2. 左上角点击 **Create Prompt** → 选择 **Chat Prompt**
3. 模型选择 **Gemini 2.5 Pro**（右侧 Run settings → Model）

### Step 2 · 配置 System Instructions

1. 左侧栏展开 **System instructions** 区块
2. 打开 `ai_studio_system_prompt.md`，**把 `## System Instruction` 下的全部内容**复制粘贴进去
3. 保存

### Step 3 · 配置结构化输出

1. 右侧 Run settings 面板：
   - **Temperature**：0.8（保留创意）
   - **Top P**：0.95
   - **Max output tokens**：8192（或更高）
   - **Response MIME Type**：`application/json`
   - **Response schema**：上传 `scene_schema.json`（或把 JSON 内容整段粘贴进 Response schema 编辑器）
2. 保存

### Step 4 · 挂载知识库（关键）

Gemini 2.5 Pro 原生支持大文件上下文。把下列文件作为 Context 上传：

1. 点击对话输入框左侧的 **+** → **Upload file**（或直接拖拽）
2. 依次上传：
   - `角色形象锚定提示词卡.md`（让模型记住锚定字符串）
   - `E01_雷公穿越记_剧情版脚本.md`（作为风格锚点示例）
   - 本次要改编的教材章节 Markdown
3. 文件上传完成后，它们将自动进入 Context，模型可直接引用。

### Step 5 · 首次触发（生成 E02）

在对话框中输入如下**调用指令**：

```
generate_episode(
  chapter_markdown=已上传的《模块一_AIGC概要与建筑行业应用.md》第1课时内容,
  episode_id="E02",
  target_duration_min=7,
  knowledge_points=[
    "AI四大发展时代的详细原理",
    "Transformer 架构的通俗解释",
    "文字生成的概率预测机制",
    "图像生成的扩散去噪过程",
    "DeepSeek 与科技自立自强"
  ]
)

请输出严格符合 scene_schema.json 的 JSON，不要任何解释文字。
```

按 **Run**。

### Step 6 · 迭代优化

收到初版 JSON 后常见问题及处理：

| 问题 | 迭代指令 |
|------|---------|
| 某 scene 提示词过短 | `expand_prompt("V-05", 3, "雷公表情要更夸张，加漫画式晕眩符号")` |
| 某段不够有趣 | `refine_scene({...V-10完整JSON...}, "把这里改成雷公和小雷抢着说话的相声节奏")` |
| 整集思政偏硬 | `整集保持剧情流畅的前提下，把DeepSeek提及改为雷公主动发问"汝华夏可有此等才子"的形式` |

### Step 7 · 导出 JSON

1. 右上角复制最终 JSON
2. 保存到本地 `textbook/video/generated/E02.json`
3. 送入下一步：`automation/jimeng_batch.py` 批量生图

---

## 三、Few-shot 示例的使用

把 `E01_雷公穿越记_剧情版脚本.md` 上传到 Context 后，首次调用时可以追加一句：

> "本集风格、节奏、角色语气请严格对齐已上传的 E01 脚本。E01 中雷公/小雷的对话密度与吐槽频率即为标准。"

这会显著提升 E02–E10 的风格一致性。

---

## 四、常见坑

1. **JSON 输出被截断**：Max output tokens 调到最大；如果仍截断，分两次请求（"先输出前16个scene，我说继续你再输出剩下的"）。
2. **关键帧不是4张**：在 System Instruction 中已强调，若仍违反，追加一句"上次输出 V-07 只有 3 张关键帧，请补齐为 4 张并重新输出该 scene"。
3. **忘记拼接角色锚定字符串**：让模型"自检"——"请检查所有含雷公/小雷/小筑的 prompt 是否已完整拼接对应锚定字符串，未拼接的请补齐后重新输出整个 JSON"。
4. **文件上传超限**：Gemini 2.5 Pro Context 上限约 2M token，单次上传的 Markdown 全部一般没问题。如果教材整本上传，分模块上传即可。
5. **Response schema 校验失败**：AI Studio 会报红。常见原因是枚举字段拼错（如 `jimeng_mode` 写成 `firstlast_frame`）。按错误提示让模型修正即可。

---

## 五、从 AI Studio 到 Playwright 的桥

生成 JSON 后：

```bash
cd textbook/video/automation
python jimeng_batch.py --input ../generated/E02.json --output ../generated/E02_keyframes/
```

Playwright 会打开即梦，按 JSON 中 scene 顺序批量粘贴提示词、下载图片。详见 `automation/README.md`。

---

## 六、推荐的 API Key 方案（可选·进阶）

如果想把整个流程真正全自动（跳过 AI Studio 网页界面），可以：

1. 在 AI Studio 点 **Get API key**
2. 免费额度足够每天生成 5-10 集
3. 用 `google-generativeai` Python SDK 直接调用

```python
import google.generativeai as genai
genai.configure(api_key="YOUR_KEY")
model = genai.GenerativeModel(
    "gemini-2.5-pro",
    system_instruction=open("ai_studio_system_prompt.md").read(),
    generation_config={
        "response_mime_type": "application/json",
        "response_schema": json.load(open("scene_schema.json"))
    }
)
response = model.generate_content([
    genai.upload_file("角色形象锚定提示词卡.md"),
    genai.upload_file("E01_雷公穿越记_剧情版脚本.md"),
    genai.upload_file("模块一_AIGC概要与建筑行业应用.md"),
    "generate_episode(..., episode_id='E02', ...)"
])
with open("generated/E02.json", "w") as f:
    f.write(response.text)
```

这一步不是必需的——AI Studio 网页界面也可以跑完整工作流。
