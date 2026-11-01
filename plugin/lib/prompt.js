// Prompt construction and strict validation for AI-generated question banks.
const DIMS = ['principle', 'phenomenon', 'reading', 'data']

const DIM_ALIAS = {
  principle: 'principle',
  phenomenon: 'phenomenon',
  reading: 'reading',
  data: 'data',
  uncertainty: 'data',
  原理: 'principle',
  实验原理: 'principle',
  操作: 'phenomenon',
  现象: 'phenomenon',
  现象与操作: 'phenomenon',
  读图: 'reading',
  仪器: 'reading',
  读数: 'reading',
  读图与仪器: 'reading',
  数据处理: 'data',
  数据: 'data',
  不确定度: 'data',
  误差: 'data',
  有效数字: 'data',
}

const TYPE_ALIAS = {
  single: 'single',
  multi: 'multi',
  numeric: 'numeric',
  单选: 'single',
  多选: 'multi',
  计算: 'numeric',
  数值: 'numeric',
  计算题: 'numeric',
  判断题: 'single',
}

const SYSTEM_PROMPT = [
  '你是大学物理实验课程的命题老师，擅长把实验讲义转化为笔试复习题。',
  '你只输出一个合法的 JSON 对象，不输出 Markdown 代码块、解释、前后缀或注释。',
  '所有题目必须严格依据给定讲义，不能编造讲义中没有的数据、仪器型号或结论。',
].join('\n')

function str(value, max) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max || 1000)
}

function toIndex(value, length) {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < length) return value
  if (typeof value === 'string') {
    const text = value.trim()
    if (/^[A-Za-z]$/.test(text)) {
      const index = text.toUpperCase().charCodeAt(0) - 65
      return index >= 0 && index < length ? index : -1
    }
    const parsed = Number(text)
    if (Number.isInteger(parsed) && parsed >= 0 && parsed < length) return parsed
  }
  return -1
}

function cleanBadge(value, name) {
  const text = str(value, 4)
  if (text) return Array.from(text)[0]
  const chars = Array.from(name || '')
  return chars.length ? chars[0] : '验'
}

function cleanName(value, fallback) {
  const text = str(value, 30) || fallback || '新实验专项'
  return Array.from(text).slice(0, 20).join('')
}

function normalizeQuestion(item, expId, index, images) {
  if (!item || typeof item !== 'object') return null
  const stem = str(item.stem, 600)
  if (stem.length < 6) return null
  const rawDim = typeof item.dim === 'string' ? item.dim.trim() : ''
  const dim = DIM_ALIAS[rawDim] || (DIMS.indexOf(rawDim) !== -1 ? rawDim : 'principle')
  const rawType = typeof item.type === 'string' ? item.type.trim().toLowerCase() : ''
  const type = TYPE_ALIAS[rawType] || (['single', 'multi', 'numeric'].indexOf(rawType) !== -1 ? rawType : 'single')
  const explain = str(item.explain, 1500)
  if (!explain) return null
  const base = {
    id: expId + '-' + (index + 1),
    exp: expId,
    dim,
    type,
    stem,
    explain,
    formula: str(item.formula, 400),
    tip: str(item.tip, 400),
    tags: Array.isArray(item.tags)
      ? item.tags.map((tag) => str(tag, 30)).filter(Boolean).slice(0, 4)
      : [],
  }
  if (item.figure !== undefined && item.figure !== null && item.figure !== '') {
    const figIndex = Number(item.figure)
    if (!Number.isInteger(figIndex) || figIndex < 1 || figIndex > images.length) return null
    const image = images[figIndex - 1]
    if (image.suitable === false) return null
    base.figure = image.filename
    base.figureAlt = str(item.figureNote, 300) || image.description || '附图 ' + figIndex
    base.figureCaption = str(item.figureCaption, 200) || image.description || '附图 ' + figIndex
  }
  if (type === 'numeric') {
    const answer = Number(item.answer)
    if (!isFinite(answer)) return null
    const rawTol = Number(item.tol)
    const tol = isFinite(rawTol) && rawTol > 0 && rawTol < 0.5 ? rawTol : 0.02
    const rawSig = Number(item.sigfig)
    const sigfig = Number.isInteger(rawSig) && rawSig >= 1 && rawSig <= 6 ? rawSig : 3
    return Object.assign({}, base, {
      answer,
      tol,
      unit: str(item.unit, 20),
      sigfig,
      hint: str(item.hint, 120),
    })
  }
  const options = Array.isArray(item.options)
    ? item.options.map((option) => str(option, 200)).filter(Boolean)
    : []
  if (options.length < 3 || options.length > 6) return null
  if (type === 'multi') {
    const raw = Array.isArray(item.answer) ? item.answer : [item.answer]
    const indexes = []
    raw.forEach((value) => {
      const indexValue = toIndex(value, options.length)
      if (indexValue >= 0 && indexes.indexOf(indexValue) === -1) indexes.push(indexValue)
    })
    if (indexes.length < 2 || indexes.length >= options.length) return null
    return Object.assign({}, base, { options, answer: indexes.sort((a, b) => a - b) })
  }
  const answer = toIndex(item.answer, options.length)
  if (answer < 0) return null
  return Object.assign({}, base, { options, answer })
}

export function buildFigureAnalysisPrompt(name, count) {
  return [
    '你会收到 ' + count + ' 张实验讲义插图，按消息中的顺序编号为 附图1..附图' + count + '。',
    '请只根据你实际看到的画面逐图描述，不要根据文字推测图中不存在的内容。',
    '只输出 JSON：{"figures":[{"index":1,"description":"...","suitable":true}, ...]}',
    '- index：1 到 ' + count + '；',
    '- description：1~2 句，写清图中实际可见的仪器、读数、刻度、曲线、电路、光路、表格或装置连接；',
    '- suitable：这张图是否适合出题；公式截图、图标、装饰图、模糊不清或与实验无关的图填 false。',
    '每张图都要有一项，不要遗漏。'
  ].join('\n')
}

export function parseFigureAnalysis(raw, count) {
  const data = JSON.parse(extractJson(raw))
  const list = Array.isArray(data && data.figures) ? data.figures : []
  const map = {}
  list.forEach((item) => {
    const index = Number(item && item.index)
    if (!Number.isInteger(index) || index < 1 || index > count) return
    map[index] = {
      index,
      description: str(item.description, 400),
      suitable: item.suitable !== false && !!str(item.description, 400),
    }
  })
  const result = []
  for (let i = 1; i <= count; i += 1) {
    result.push(map[i] || { index: i, description: '', suitable: false })
  }
  return result
}

export function buildGenerationPrompt(text, name, figures = []) {
  const docName = str(name, 40) || '实验讲义'
  const usable = figures.filter((figure) => figure.suitable !== false && figure.description)
  const lines = [
    '请阅读下面的实验讲义，出一套用于期末笔试复习的题目。',
    '',
    '【输出格式】只输出一个 JSON 对象：',
    '{"name":"实验名称（不超过12字）","badge":"一个汉字","questions":[题目对象...]}',
    '',
    '【题目对象】',
    '- dim：只能是 "principle"（实验原理）、"phenomenon"（现象与正确操作）、"reading"（读图与仪器）、"data"（数据处理）之一。',
    '- type："single"（单选）、"multi"（多选）、"numeric"（数值计算）之一。',
    '- stem：题干，中文，简洁准确。',
    '- 选择题：options 为 3~6 个选项字符串；single 的 answer 是正确选项下标（从 0 开始）；multi 的 answer 是下标数组（2 个及以上，且不能全选）。',
    '- 计算题：answer 为数字，unit 为单位字符串（可为空），tol 为相对容差（0.01~0.05），sigfig 为有效数字位数，hint 为一句提示。',
    '- 每题必须有 explain（2~4 句解题思路，含关键代入过程）、formula（关键公式，可为空字符串）、tip（最容易错的地方）、tags（1~3 个知识点标签）。',
  ]
  if (usable.length) {
    lines.push(
      '- figure（可选）：附图编号（1..' + figures.length + ' 的整数），只有确实需要看图的题才填；figureNote：图中看到什么、为什么必须看图；figureCaption：用附图清单里的 description，不要写文档图号。'
    )
  }
  lines.push('', '【硬性要求】', '1. 共 12 题：principle 3 题、phenomenon 3 题、reading 3 题、data 3 题。')
  lines.push('2. 题型混合：至少 3 道 numeric，至少 3 道 multi，其余 single。')
  lines.push('3. 所有内容必须来自讲义：公式、仪器、步骤、注意事项、数据处理方法。不能出现“以上都对”“以上都不对”这类选项。')
  if (usable.length) {
    lines.push(
      '4. 本题附带 ' + figures.length + ' 张文档插图，必须先看附图清单，再决定怎么出题：',
      ...figures.map(
        (figure) =>
          '   附图' + figure.index + '：' + (figure.description || '（无法识别）') +
          (figure.suitable === false ? '（不适合出题，不要使用）' : '')
      ),
      '   - 只能引用 suitable=true 的附图；figure 填附图编号，题干写“如附图k所示”；',
      '   - 至少 2 道题必须使用附图；题目必须真正依赖图（读数、认器材、看曲线、看电路/光路），不能只是“如图”然后问文字；',
      '   - figureCaption 用清单里的 description，不要写“图1/图5”这类文档图号，避免和附图编号混淆；',
      '   - 先想清楚“从这张图能问什么”，再决定 dim：看图读数 → reading；看图认器材/操作 → phenomenon；看图理解原理/曲线 → principle 或 data；',
      '   - 不要为了凑 reading 把纯文字题硬说成读图题；不依赖图片的题不要填 figure。'
    )
  } else {
    lines.push(
      '4. 如果没有可用图片，读图题用文字描述仪器读数、装置结构、曲线或数据表；不要编造图片，也不要填 figure。'
    )
  }
  lines.push(
    '5. 数据处理题的 stem 和 hint 不要直接给出解题公式；公式只能放在 explain 和 formula 字段里。',
    '6. 计算题数据自洽、答案唯一，且能被计算器验证。',
    '7. 选项之间要有区分度，错误选项应是学生常见的错误理解。',
    '8. 不要输出 JSON 之外的任何文字。',
    '',
    '【实验名称建议】' + docName,
    '',
    '【讲义正文】',
    '"""',
    text,
    '"""'
  )
  return lines.join('\n')
}

function extractJson(raw) {
  let text = String(raw || '').trim()
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('模型没有返回 JSON 对象')
  text = text.slice(start, end + 1)
  text = text.replace(/,\s*([}\]])/g, '$1')
  return text
}

export function parseGeneratedBank(raw, fallbackName, expId, images = []) {
  const data = JSON.parse(extractJson(raw))
  if (!data || typeof data !== 'object') throw new Error('模型返回的内容不是对象')
  const name = cleanName(data.name, fallbackName)
  const badge = cleanBadge(data.badge, name)
  const list = Array.isArray(data.questions) ? data.questions : []
  const questions = []
  list.forEach((item, index) => {
    const normalized = normalizeQuestion(item, expId, questions.length, images)
    if (normalized) questions.push(normalized)
  })
  if (questions.length < 6) {
    throw new Error('模型返回的有效题目不足（' + questions.length + ' 道），请重试')
  }
  const counts = { principle: 0, phenomenon: 0, reading: 0, data: 0 }
  questions.forEach((question) => { counts[question.dim] += 1 })
  const missing = DIMS.filter((dim) => counts[dim] === 0)
  if (missing.length) {
    throw new Error('模型返回的题目缺少考点：' + missing.join('、') + '，请重试')
  }
  if (images.length) {
    const withFigure = questions.filter((question) => question.figure).length
    if (withFigure < 2) {
      throw new Error('模型没有从文档图片出题（只有 ' + withFigure + ' 道带图），请重试')
    }
  }
  return {
    name,
    badge,
    questions: questions.slice(0, 16),
  }
}

export { DIMS }
