# 大物实验 · 笔试冲刺

一个运行在 DeepSeek Harness Web UI 里的学习插件：把工作区里六个大物实验讲义整理成
「实验原理 / 现象与操作 / 读图与仪器 / 数据处理」四类考点，用模拟测试的方式以练带学。

## 使用

安装后，左侧图标栏会出现「物理冲刺」图标（监听器图标旁），点击打开全页面面板：

- **练习**：12 / 18 / 24 题整卷模拟（按实验 × 考点均衡抽题），开始前可在「模拟范围」里勾选参与整卷的实验专项（默认全选），
  或按实验、按考点专项练习；
- **答题**：单选、多选、数值计算三种题型；每题提交后立即显示解题思路、关键公式、易错点；
- **读图题**：按“看图 → 抽读数 → 挖空单选”出题；题干只问读出，选项是候选读数，正确项来自图中；封面/面板/刻度盘/示波器/曲线均用讲义原图；
- **数据处理题**：R–t、d–N、I–φ、ν–B、U–I、声速 12 组位置等表格题，练逐差、最小二乘与公式计算；
- **追问 AI**：答完题后点「追问 AI」，对话框会把题目、选项、正确答案、你的答案、解析和你的问题一起打包，
  发送后打开新对话并填入输入框，按 Enter 即可让 Harness 里的助手结合上下文讲解（也可先复制问题）；
- **报告**：本轮得分、按考点/按实验正确率、错题逐题展开复盘，可重做本轮错题；
- **断点续做**：进行中的测试会自动保存，切到对话问 AI 再回来会接着上次的题号、答案和计时继续；
- **上传讲义生成专项**：在「按实验专项练习」里点「添加实验专项」，上传 `.docx / .pdf / .txt / .md`（或粘贴文本），
  Host 会抽取文档插图（最多 6 张）并交给多模态模型，模型先逐图分析再出题，题目可引用文档原图；
- **错题本**：答错自动收录，重做答对自动移出，也可标记已掌握；
- **速查手册**：通用不确定度与有效数字规则 + 每个实验的公式、操作要点、易错提醒；每个板块标题旁有「✦ AI 讲解」，
  点击后把该板块的要点和公式填入新对话，按 Enter 让 AI 讲解；
- **计算器**：面板内右下角，支持 `sin/cos/tan/√/ln/log/^/π/e`，DEG/RAD 切换，科学计数法。

学习记录保存在浏览器 `localStorage`（键 `dsh.physics-lab-sprint.v1`），换设备不同步。
上传生成的专项保存在 `dsh.physics-lab-sprint.custom.v1`，模拟范围保存在 `dsh.physics-lab-sprint.scope.v1`。

## 上传讲义生成专项

在首页「按实验专项练习」里点「＋ 添加专项」或末尾的虚线卡片：

1. 选择 `.docx / .pdf / .txt / .md` 文件（≤ 12 MB），或切到「粘贴文本」；
2. 点「生成专项」，Host 半会提取文本（PDF 通过本机 Python + pypdf；docx 直接解压读取）和文档插图；
   第一遍逐图输出描述、可用性和可读数值，第二遍把「附图1..N」清单、读数与正文交给多模态模型，读图题做成挖空单选；
3. 题目只引用本次附图编号，图注用模型对图片的实际描述，避免文档图号错配；生成结果保存为新的实验专项。

要求与限制：

- 需要先配置好可用的默认模型（设置 → 模型）；生成通常消耗约两次模型调用（逐图分析 + 出题）。
- PDF 解析依赖本机 Python 环境里的 `pypdf`（或 `PyPDF2`）；没有时请用 Word 另存为 `.docx`，
  或改用「粘贴文本」。扫描版 PDF 没有文字层，无法提取。
- 旧版 `.doc` 不支持，请先另存为 `.docx`。
- 上传文档会抽取插图（docx 的 `word/media`、PDF 内嵌图，最多 6 张），AI 先逐图描述再出题；若没有可用图片，读图题会退化为文字描述。
- 数据处理题在提交前不显示解题公式，公式只出现在提交后的解析里。
- AI 生成内容可能有误，请对照讲义核对后再使用；卡片上会标注「AI 生成」。

## 结构

```
physics-lab-sprint/
├─ package.json          bundle 清单 + dsh.client 声明
├─ cordis.patch.yml      Loader patch（插入 Host 行）
├─ index.js              Host half：本地路由 + 图片服务 + 文档解析 + AI 出题
├─ lib/
│  ├─ extract.js         DOCX / PDF / TXT 文本提取
│  └─ prompt.js          出题提示词与结果校验
├─ assets/figures/       从讲义抽取的题图（PNG）
├─ client.js             构建产物：单文件 Client 模块
├─ locale/{zh,en}.json   Plugin Manager 显示标题与描述
├─ icon.svg              原始图标
├─ build.mjs             把 src/ 片段拼成 client.js
└─ src/
   ├─ bank/              题库与速查数据
   │  ├─ 00-head.js      BANK 数组
   │  ├─ 10-bridge.js    交直流电桥
   │  ├─ 20-michelson.js 迈克尔逊干涉仪
   │  ├─ 30-polar.js     偏振光与双折射
   │  ├─ 40-nmr.js       核磁共振
   │  ├─ 50-solar.js     多功能太阳能电池
   │  ├─ 60-reading.js   五个实验的读图题
   │  ├─ 65-sound.js     声速与光速测量
   │  ├─ 66-sound-extra.js
   │  ├─ 70-data.js      表格数据处理题
   │  ├─ 75-concepts.js  方法名称/基础概念
   │  ├─ 78-multi.js     多选题
   │  ├─ 80-gaps.js      覆盖补漏（γ、Cx/Lx、FF、白光）
   │  └─ 90-meta.js      实验/方向元数据、速查手册
   └─ ui/                样式、工具、首页、测试、报告、错题本、速查、计算器、追问、上传
```

## 加题 / 改题

在 `src/bank/` 对应实验文件里 `BANK.push({...})`，字段：

```js
{
  id: 'bridge-x1',        // 全局唯一
  exp: 'bridge',          // bridge | michelson | polar | nmr | solar
  dim: 'principle',       // principle | phenomenon | uncertainty
  type: 'single',         // single | multi | numeric
  stem: '题干',
  options: ['A', 'B', 'C', 'D'],   // 选择题
  answer: 1,                       // single: 下标；multi: 下标数组；numeric: 数值
  // numeric 额外字段：
  // answer: 50.4, tol: 0.01, unit: 'Ω', sigfig: 3, hint: '保留 3 位有效数字',
  explain: '解析，用 \\n 分段',
  formula: '关键公式',
  tip: '易错点',
  tags: ['知识点'],
}
```

改完后重新构建并让 Harness 重新加载插件：

```powershell
node build.mjs
node --check client.js
```

> 注意：数值题的判分使用相对容差 `tol`，例如 `tol: 0.01` 表示 ±1%。

## 安装

```text
plugin_manager action=install_bundle target=<绝对路径>/physics-lab-sprint
```

本插件只注册两个 Slot：`sidebar.panellist`（id `physics-lab`）与 `main`（key `physics-lab`），
不依赖任何 Harness Client 包，样式全部使用 `--dsw-alias-*` 主题 token。
