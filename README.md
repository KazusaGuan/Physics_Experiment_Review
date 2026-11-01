# 大物实验 · 笔试冲刺

<img src="plugin/icon.svg" width="72" alt="Physics Lab Sprint">

一个运行在 **DeepSeek Harness（DSH）** Web UI 里的物理实验复习插件。把大学物理实验（下）的讲义整理成
「实验原理 / 现象与操作 / 读图与仪器 / 数据处理」四类考点，用**模拟测试 + 即时解析 + 错题复盘**的方式以练带学。

内置 6 个实验、140 道题；读图题的图片全部从讲义原文抽取，不是自绘示意图。也支持上传新的实验讲义，由 AI 生成一套新的实验专项。

## 功能

- **整卷模拟**：12 / 18 / 24 题，按「实验 × 考点」均衡抽题；开始前可在「模拟范围」里勾选参与整卷的实验专项，**默认全选**。
- **专项练习**：按实验、按考点（原理 / 操作 / 读图 / 数据处理）单独刷题，进度实时显示。
- **即时解析**：单选、多选、数值计算三种题型；提交后立刻给出解题思路、关键公式、易错点，而不是只报对错。
- **读图题**：按“看图 → 抽读数 → 挖空单选”出题。题干只问“读出/指出”，选项是候选读数，正确项来自图中实际读数；提交后显示「读图要点」。覆盖偏振片刻度盘、迈克尔逊读数窗/鼓轮、电桥面板、示波器波形、I–V 曲线、声速仪等，图片均取自讲义原图。
- **数据处理题**：R–t、d–N、I–φ、ν–B、U–I、12 组声速位置等表格题，练逐差法、最小二乘、作图与公式计算；不确定度保留为数据处理的一部分。
- **本轮报告**：得分、按考点 / 按实验的正确率、错题逐题展开复盘，可一键重做本轮错题。
- **错题本**：答错自动收录，重做答对自动移出；可标记已掌握、单独练某一道。
- **薄弱考点**：正确率低于 85% 的实验×考点会自动置顶，一键强化。
- **追问 AI**：答完题点「追问 AI」，对话框会把题目、选项、正确答案、你的答案、解析、易错点和你的问题一起打包，填入新对话，按 Enter 即可让 Harness 里的助手结合上下文讲解。
- **速查手册 AI 讲解**：每个板块标题旁有「✦ AI 讲解」，点击后把该板块的要点、公式和讲解要求填入新对话，按 Enter 就能让 AI 带着上下文讲这个知识点。
- **上传讲义生成专项**：上传 `.docx / .pdf / .txt / .md` 或粘贴文本；Host 会抽取文档插图（最多 6 张）并交给多模态模型，模型先逐图抽取读数，再把读数挖空成单选选项，保存为新的实验专项。
- **断点续做**：进行中的测试自动保存，切到对话再回来可以接着做。
- **速查手册 + 计算器**：考前公式 / 操作要点 / 易错提醒；内置支持 `sin/cos/tan/√/ln/log/^/π/e` 的计算器。
- **主题适配**：全部使用 DSH 的 `--dsw-alias-*` 主题 token，跟随明暗主题。

## 内置题库

| 实验 | 题量 | 原理 | 现象与操作 | 读图与仪器 | 数据处理 |
|---|---:|---:|---:|---:|---:|
| 交直流电桥 | 25 | 6 | 7 | 4 | 8 |
| 迈克尔逊干涉仪 | 24 | 6 | 8 | 4 | 6 |
| 偏振光与双折射 | 24 | 7 | 6 | 4 | 7 |
| 核磁共振 | 22 | 6 | 7 | 4 | 5 |
| 多功能太阳能电池 | 27 | 8 | 8 | 4 | 7 |
| 声速与光速测量 | 18 | 7 | 3 | 5 | 3 |
| **合计** | **140** | **40** | **39** | **25** | **36** |

题目内容来自仓库作者使用的实验讲义；读图题的图片从讲义原图抽取，每道题都带解析、公式和易错点。
读图题统一为“挖空单选”：题干不写读数，选项是候选读数，正确项来自图中；提交后额外显示「读图要点」。

## 仓库结构

```text
.
├─ README.md              本说明
├─ plugin/                可安装的 DSH bundle
│  ├─ package.json        bundle 清单 + dsh.client 声明
│  ├─ cordis.patch.yml    Loader patch
│  ├─ index.js            Host half：本地路由 + 文档解析 + AI 出题
│  ├─ lib/                DOCX/PDF 文本提取、出题提示词与校验
│  ├─ client.js           构建产物：单文件 Client 模块
│  ├─ assets/figures/     从讲义抽取的题图（PNG，25 张在用）
│  ├─ src/                题库与界面源码
│  ├─ build.mjs           把 src/ 片段拼成 client.js
│  ├─ locale/             插件显示标题与描述
│  ├─ icon.svg            图标
│  └─ README.md           插件内部结构与加题说明
└─ .gitignore
```

## 安装

### 方式一：让 AI 部署（推荐）

把下面整段提示词发给一个具备 `plugin_manager` 工具、权限为 `danger-full-access` 的 DSH 会话：

```text
你是一名 DSH（DeepSeek Harness）插件部署助手。请把下面这个仓库里的插件安装到当前 DSH profile，并完成验证。

仓库：https://github.com/KazusaGuan/Physics_Experiment_Review.git
插件目录：plugin/
插件包名：@local/physics-lab-sprint
版本：1.4.0

步骤：
1. 确认当前会话有 plugin_manager 工具，且权限为 danger-full-access；若没有，先让用户开启，不要自行绕过审批。
2. 把仓库克隆到工作区（例如 <workspace>/Physics_Experiment_Review）：
   git clone https://github.com/KazusaGuan/Physics_Experiment_Review.git
   如果 TLS 报错，改用：
   git -c http.sslBackend=openssl clone https://github.com/KazusaGuan/Physics_Experiment_Review.git
   如果仍然失败，让用户下载 ZIP 并解压到工作区，然后继续。
3. 检查 plugin/package.json、plugin/cordis.patch.yml、plugin/client.js、plugin/lib/ 是否存在；缺一不可，不要现场重新构建。
4. 如果已经安装过 @local/physics-lab-sprint：
   先调用 plugin_manager action=remove_bundle target=@local/physics-lab-sprint，
   再安装；否则客户端模块可能仍然是旧版。
5. 调用 plugin_manager action=install_bundle，target 为 <仓库绝对路径>/plugin。
6. 检查返回：application 必须是 "applied"，warnings 应为空；失败时原样报告 error 与日志路径。
7. 用 cordis_inspect_query（platform=client, provider=Slots, method=listSubTree, input={"root":"sidebar.panellist"}）
   确认 id=physics-lab 的 active=true；
   再检查 {"root":"main"} 中 key=physics-lab 的 active=true。
8. 不要修改仓库源码，不要清空用户的 localStorage（学习记录、错题、上传的专项都在里面）。
9. 报告：安装绝对路径、版本、两处 Slot 状态，以及需要用户手动刷新页面的提示。

完成后告诉用户：打开左侧「物理冲刺」图标，标题下方应显示 v1.4.0；
若没有，按 Ctrl+R 刷新，仍不行则重启 Harness。
```

### 方式二：手动安装

```bash
git clone https://github.com/KazusaGuan/Physics_Experiment_Review.git
```

然后在 DSH 会话里让 agent 执行（或直接调用对应工具）：

```text
plugin_manager action=install_bundle target=<绝对路径>/Physics_Experiment_Review/plugin
```

安装后打开左侧 **物理冲刺** 图标；标题下方显示 `v1.4.0` 即成功。
如果之前装过旧版，需要先 `remove_bundle` 再 `install_bundle`，否则浏览器可能缓存旧的客户端模块；装完刷新一次页面。

> 安装插件等于在本机执行仓库中的 Host 代码（`index.js` / `lib/`）；请先阅读源码。插件只注册一个本机路由
> `/physics-lab/generate` 用于 AI 出题，学习数据全部保存在浏览器 `localStorage`。

## 使用

打开左侧「物理冲刺」图标后有三个标签：

### 练习

- **开始 12 / 18 / 24 题模拟**：按实验×考点均衡抽题；
- **模拟范围**：开始前勾选参与整卷的实验，默认全选，选择会记住；一个都不选时开始按钮会禁用；
- **按实验专项练习**：每个实验一张卡片，点「原理 / 操作 / 读图 / 数据处理」直接刷该考点，点「全部」随机刷该实验；
- 底部虚线卡片 **添加实验专项**：上传讲义生成新专项（见下）。

### 答题

- 单选 / 多选 / 计算三种题型；多选题需全部选对才得分；
- 点击选项即可看到选中高亮；提交后正确项变绿、错项变红，并展开解析、公式、易错点；
- 右侧答题卡可跳题，计时与正确率实时显示；
- 答完可看本轮报告；中途切走会自动保存，回来接着做。

### 追问 AI

每题解析下方有 **「✦ 追问 AI」**：

- 显示正确答案与你自己的答案；
- 提供「为什么正确答案是这些 / 关键公式怎么来的 / 最容易错在哪 / 再举一个类似情形」快捷追问；
- 点「填入对话」会把完整上下文写进新对话的输入框，按 Enter 发送即可；也可以「复制问题」。

### 错题本 / 速查手册

- 错题本按实验筛选，展开看完整解析，可「单独练这道」或「标记已掌握」；
- 速查手册包含通用不确定度与有效数字规则，以及每个实验的公式、操作要点、易错提醒；
  每个板块标题旁有 **「✦ AI 讲解」**，点击会把该板块内容带进新对话，按 Enter 让 AI 讲解并继续追问；
- 右下角计算器支持 `sin/cos/tan/√/ln/log/^/π/e`、DEG/RAD 切换与科学计数法。

## 上传讲义生成专项

在「按实验专项练习」点 **＋ 添加专项** 或末尾虚线卡片：

1. 选择 `.docx / .pdf / .txt / .md`（≤ 12 MB），或切到「粘贴文本」；
2. 点「生成专项」，Host 半提取文本和文档插图后调用**当前默认模型**：第一遍逐图输出描述、可用性和可读数值，第二遍把「附图1..N」清单、读数与正文交给模型；读图题做成挖空单选（题干不写读数，选项是候选读数）；
3. 题目只引用本次附图编号，图注使用模型对图片的实际描述，避免“文档图5”与实际图片错配；生成结果保存为新的实验专项，可练习、可删除。

要求与限制：

- 需要先在 DSH 里配置可用的默认模型；生成通常消耗约两次模型调用（逐图分析 + 出题）。
- `.docx`、`.txt`、`.md` 无需额外依赖；`.pdf` 需要本机 Python + `pypdf`（或 `pdftotext`）；
  扫描版 PDF 没有文字层，无法提取。
- 旧版 `.doc` 不支持，请先另存为 `.docx`。
- 上传文档会抽取插图（docx 的 `word/media`、PDF 内嵌图，最多 6 张），AI 先逐图描述再出题；若没有可用图片，读图题会退化为文字描述。
- 数据处理题在提交前不显示解题公式，公式只出现在提交后的解析里。
- AI 生成内容可能有误，请对照讲义核对；卡片会标「AI 生成」。

## 数据存储

所有学习数据都在浏览器 `localStorage`，不会上传：

| 键 | 内容 |
|---|---|
| `dsh.physics-lab-sprint.v1` | 答题记录、正确率、最近测试 |
| `dsh.physics-lab-sprint.active.v1` | 进行中的测试（断点续做） |
| `dsh.physics-lab-sprint.custom.v1` | 上传生成的自定义专项 |
| `dsh.physics-lab-sprint.scope.v1` | 模拟范围（排除项） |

换浏览器 / 换设备不同步；卸载插件不会删除这些记录。

## 构建

只有修改 `plugin/src/` 后需要重新构建：

```bash
cd plugin
node build.mjs        # 生成 client.js
node --check client.js
```

需要 Node.js 20+。Host 半（`index.js`、`lib/`）是普通 ESM，不需要构建。

## 加题 / 改题

题库在 `plugin/src/bank/`，字段说明见 [plugin/README.md](plugin/README.md)。
改完 `node build.mjs`，再按安装步骤重装插件即可。

## 常见问题

**左侧没有「物理冲刺」图标？**
确认插件已启用；刷新页面（Ctrl+R）；仍不行重启 Harness。

**版本号不是 v1.4.0？**
浏览器还在用旧的客户端模块。先 `remove_bundle` 再 `install_bundle`，然后刷新页面。

**点「填入对话」没反应？**
当前页面可能没有可用的 `uiWorkspace` 服务。用对话框里的「复制问题」粘贴到对话即可。

**上传 PDF 报“PDF 解析失败”？**
本机缺少 PDF 解析器。用 Word 把 PDF 另存为 `.docx`，或改用「粘贴文本」。

**生成很慢 / 失败？**
生成走当前默认模型，通常 20~60 秒；失败会显示原因，可重试。确认模型在设置里可用。

**算出来的答案和解析不一致？**
内置题库经过作者核对，但 AI 生成的自定义专项可能有误；以讲义和你的计算为准，发现错误删掉该专项即可。

## 说明

本项目用于个人期末复习，题目与解析基于作者使用的实验讲义整理，不保证覆盖所有课程版本。
