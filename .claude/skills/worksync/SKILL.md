---
name: worksync
description: 跨电脑工作会话的 git 同步管理。TRIGGER when 用户说"开工"/"开工了"(拉取仓库最新内容)、"收工"/"收工了"(保存并推送所有变更到仓库)、或需要在 token 耗尽前紧急保存工作进度。也适用于用户提到 start work / end work / 下班了 / 上班了 等同义表达。
---

# worksync — 工作会话 Git 同步

这是一个跨多台电脑共享仓库 `ping-79/token_net` 的工作流 skill。核心目的:让用户在任何一台电脑上"开工"就能拿到最新代码,"收工"就能把当天成果安全同步到远端,另一台电脑第二天接着干。

---

## 触发条件速查

| 用户说的话 | 执行流程 |
|---|---|
| 开工 / 开工了 / 上班了 / start work | **【开工流程 · Pull】** |
| 收工 / 收工了 / 下班了 / end work / 保存一下 | **【收工流程 · Push】** |
| token 不够了 / 快没 token 了 / 上下文快满了 | **【紧急保存流程】** |

---

## 前置:代理检查

仓库在 GitHub,国内直连会 SSL 握手失败。本项目已配置 Clash 代理:
- 端口:`http://127.0.0.1:7897`
- git 全局配置已写入 `http.proxy` / `https.proxy`

每次执行 git 网络操作前,若失败且报 `schannel` 或 `Could not connect to server`,先做:

```bash
git config --global http.proxy http://127.0.0.1:7897
git config --global https.proxy http://127.0.0.1:7897
```

然后让用户确认 Clash 正在运行,端口是否仍是 7897(可能换过)。

---

## 【开工流程 · Pull】

用户说"开工"时,按顺序做:

1. **先看本地状态** —— `git status`
   - 若有未提交变更:**停下来**,提示"本地有未保存的改动,是先保存(收工)还是先拉取(可能冲突)?"让用户选
   - 若干净:继续
2. **拉取远端** —— `git pull origin main`
3. **汇报结果**:
   - 若 `Already up to date`:告诉用户"已经是最新的,可以开工了"
   - 若拉下了新 commit:用 `git log --oneline HEAD@{1}..HEAD` 列出新 commits,简短告诉用户"另一台电脑昨天做了 X、Y、Z"
4. **不要自动启动 dev server 或任何后续动作**,等用户发指令

---

## 【收工流程 · Push】

用户说"收工"时,按顺序做:

1. **查看状态** —— `git status` 和 `git diff --stat`,确认有什么要提交
2. **无变更**:告诉用户"今天没改动,不用收工",结束
3. **有变更**:
   - 用 `git diff` 快速扫一遍所有改动,判断大致内容
   - **安全检查**:绝不提交 `.env`、含密钥的文件、`data/*.db`、截图目录(这些已在 .gitignore 但还是手动核一次)
   - 若发现可疑文件(如新的 `secrets.json`、`cookies.txt`),**停下来问用户**
4. **暂存文件** —— 优先 `git add <具体文件>`,避免 `git add -A` 误伤
5. **写提交信息** —— 按仓库现有风格(`feat:` / `fix:` / `chore:` / `docs:`),中英文皆可,尾部加:
   ```
   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
   ```
6. **提交 + 推送**:
   ```bash
   git commit -m "$(cat <<'EOF'
   <type>: <简要说明>

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
   EOF
   )"
   git push origin main
   ```
7. **汇报**:"已推送到 origin/main,commit 是 `<hash>`,收工!"

---

## 【紧急保存流程】—— token 低于 10% 时

### Claude 侧主动触发

当 Claude 感知到以下信号之一,**立即主动提醒用户**:
- 上下文压缩警告出现
- 会话已经非常长(多次工具调用、大量文件读取)
- 用户反馈"token 不够了"

提醒话术:
> ⚠️ token 快用完了,建议立即执行收工保存。要我现在就跑【收工流程】吗?

若用户同意,**立刻**执行收工流程(跳过冗长确认),优先保证代码推上远端。

### 超快速收工(token 紧张时的精简版)

```bash
cd "d:/Desktop/works/课程视频"
git add -A
git commit -m "wip: emergency save before token runs out

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
git push origin main
```

一次性三连,不做额外检查(因为 .gitignore 已经挡住了敏感文件)。

---

## 【如果 token 彻底用完了】—— 用户手动操作指南

**这一节是给用户自己看的,不是给 Claude 的。** 如果 Claude 已经无法响应(token 耗尽、会话崩了),用户按以下步骤手动保存并推送,避免丢工作。

### Step 1 · 打开终端

在项目目录打开 PowerShell 或 Git Bash:
```bash
cd "d:/Desktop/works/课程视频"
```

### Step 2 · 确认 Clash 在跑

看系统托盘是否有 Clash 图标,若没开先开。确认代理端口(本机是 7897)。

### Step 3 · 检查改动

```bash
git status
```
看看哪些文件改了、哪些是新增的。

### Step 4 · 暂存所有改动

```bash
git add -A
```

⚠️ 若看到 `.env`、`cookies` 或其他敏感文件出现在改动列表,先手动移除:
```bash
git reset HEAD <敏感文件路径>
```

### Step 5 · 提交

```bash
git commit -m "wip: manual save <今天日期>"
```

### Step 6 · 推送

```bash
git push origin main
```

若报 SSL 错误:
```bash
git config --global http.proxy http://127.0.0.1:7897
git config --global https.proxy http://127.0.0.1:7897
git push origin main
```

若报"non-fast-forward"(远端有新提交):
```bash
git pull --rebase origin main
# 解决冲突后
git push origin main
```

### Step 7 · 验证

```bash
git log --oneline -3
```
能看到最新 commit 且前面没有 `(HEAD -> main)` 落后标记即 OK。

---

## 协作约定(两台电脑共用此仓库)

1. **每次开工先 pull**,不然容易冲突
2. **每次收工必 push**,不留脏工作区过夜
3. **不要在两台电脑同时改同一文件** —— 如果非要这样,先在其中一台收工推上去,另一台再开工拉下来
4. **分支**:目前统一在 `main` 干活,不开 feature 分支(简化流程)
5. **提交粒度**:一次收工 = 一次 commit 就够了,不强求拆得很细

---

## 这个 skill 本身的维护

- 文件位置:`.claude/skills/worksync/SKILL.md`
- 已随仓库同步,两台电脑共享
- 修改后也要走收工流程推上去,另一台电脑下次开工才能拿到新版本
