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

function normalizeReading(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[约≈~]/g, '')
    .replace(/[º°]/g, '°')
    .replace(/[′’']/g, "'")
    .replace(/[″”"]/g, '"')
}

function validateReading(question, images) {
  if (question.dim !== 'reading') return true
  if (question.type !== 'single') return false
  if (!question.figure) return images.length === 0
  const image = images.filter((item) => item.filename === question.figure)[0]
  if (!image) return false
  if (!question.figureEvidence) return false
  const option = normalizeReading(question.options[question.answer])
  if (!option) return false
  const stem = normalizeReading(question.stem)
  if (stem.indexOf(option) !== -1) return false
  const readings = image.readings || []
  if (readings.length) {
    const values = readings.map((reading) => normalizeReading(reading.value)).filter(Boolean)
    const matched = values.some((value) => option.indexOf(value) !== -1 || value.indexOf(option) !== -1)
    if (!matched) return false
    if (values.some((value) => stem.indexOf(value) !== -1)) return false
  }
  return true
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
    figureEvidence: str(item.figureEvidence, 400),
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
    if (!base.figureEvidence) base.figureEvidence = image.description || ''
  }
  if (type === 'numeric') {
    if (dim === 'reading') return null
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
    if (dim === 'reading') return null
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
  const question = Object.assign({}, base, { options, answer })
  return validateReading(question, images) ? question : null
}

export function buildFigureAnalysisPrompt(text, name, count) {
  return [
    '你会收到 ' + count + ' 张实验讲义插图，按消息中的顺序编号为 附图1..附图' + count + '。',
    '请只根据你实际看到的画面逐图描述，不要根据文字推测图中不存在的内容。',
    '只输出 JSON：{"figures":[{"index":1,"description":"...","suitable":true,"readings":[{"label":"...","value":"...","how":"...","confidence":"high"}]}]}',
    '- index：1 到 ' + count + '；',
    '- description：1~2 句，写清图中实际可见的仪器、读数、刻度、曲线、电路、光路、表格或装置连接；',
    '- suitable：这张图是否适合出题；公式截图、图标、装饰图、模糊不清或与实验无关的图填 false；',
    '- readings：你从图中实际读出的值或可辨认部件，没有就填 []；每项包含：',
    '  label：读的是什么（如“刻度盘角度”“读数窗示值”“短路电流”“部件名称”）；',
    '  value：按图上显示写，保留单位和度分符号（如“271°28′”“0.00048 mm”“58 mA”“检流计”）；',
    '  how：你依据图中哪个刻度、游标、指针、曲线交点或标记读出来的；',
    '  confidence：high / medium / low；看不清或只能猜的填 low。',
    '- 如果图是刻度盘/表盘，先判断主刻度每一格代表多少、细分刻度怎么读，再读数；',
    '- 绝对不要根据讲义文字补一个图中没有的读数；读不出就不写，或 confidence 填 low。',
    '',
    '【讲义文字，只用于理解图和刻度含义，不得照抄其中的读数】',
    '"""',
    String(text || '').slice(0, 12000),
    '"""'
  ].join('\n')
}

export function parseFigureAnalysis(raw, count) {
  const data = JSON.parse(extractJson(raw))
  const list = Array.isArray(data && data.figures) ? data.figures : []
  const map = {}
  list.forEach((item) => {
    const index = Number(item && item.index)
    if (!Number.isInteger(index) || index < 1 || index > count) return
    const description = str(item.description, 400)
    const readings = Array.isArray(item.readings)
      ? item.readings
          .map((reading) => {
            const value = str(reading && reading.value, 60)
            const placeholder = /^8{3,}/.test(value.replace(/\s+/g, ''))
            return {
              label: str(reading && reading.label, 40),
              value,
              how: str(reading && reading.how, 300),
              confidence: placeholder ? 'low' : str(reading && reading.confidence, 10) || 'medium',
            }
          })
          .filter((reading) => reading.value)
      : []
    map[index] = {
      index,
      description,
      suitable: item.suitable !== false && !!description,
      readings,
    }
  })
  const result = []
  for (let i = 1; i <= count; i += 1) {
    result.push(map[i] || { index: i, description: '', suitable: false, readings: [] })
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
      '- figure（可选）：附图编号（1..' + figures.length + ' 的整数），只有确实需要看图的题才填；figureNote：图中看到什么、为什么必须看图；figureEvidence：图中哪个刻度/游标/曲线/部件决定答案、怎么读；figureCaption：用附图清单里的 description，不要写文档图号。'
    )
  }
  lines.push('', '【硬性要求】', '1. 共 12 题：principle 3 题、phenomenon 3 题、reading 3 题、data 3 题。')
  lines.push('2. 题型混合：至少 3 道 numeric，至少 3 道 multi，其余 single。')
  lines.push('3. 所有内容必须来自讲义：公式、仪器、步骤、注意事项、数据处理方法。不能出现“以上都对”“以上都不对”这类选项。')
  if (usable.length) {
    lines.push(
      '4. 本题附带 ' + figures.length + ' 张文档插图，必须先看附图清单，再按“读图 = 挖空单选”出题：'
    )
    figures.forEach((figure) => {
      lines.push(
        '   附图' + figure.index + '：' + (figure.description || '（无法识别）') +
          (figure.suitable === false ? '（不适合出题，不要使用）' : '')
      )
      ;(figure.readings || []).forEach((reading) => {
        lines.push(
          '      可读答案（禁止写进题干/hint，只能用于正确选项、figureEvidence、explain）：' +
            (reading.label || '读数') + ' = ' + reading.value +
            '（读法：' + (reading.how || '按图中刻度读出') + '；置信度：' + (reading.confidence || 'medium') + '）'
        )
      })
    })
    lines.push(
      '   - reading 只出 single；正确选项必须等于附图清单中某个 reading 的 value，不能写换算值；',
      '   - 题干和 hint 不得出现该 value；题干只问“读出/指出/判断”，不要写“读数为 X”；',
      '   - 4 个选项 = 1 个正确读数 + 3 个常见误读（相邻刻度、游标错位、分度值/量程用错、度分换算错误）；',
      '   - 每道 reading 必须填 figure 和 figureEvidence；figureCaption 用附图 description，不写文档图号；',
      '   - 至少 2 道 reading 使用附图；confidence=low 的 reading 不要用；',
      '   - 图中没有可读值时不要硬编数值；可以出“认器材/认部件”的 reading 单选，但必须给 figureEvidence；',
      '   - 看图认器材/操作也可放 phenomenon；看图理解原理/曲线放 principle 或 data；不要为了凑 reading 硬塞。'
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
    const readingWithFigure = questions.filter(
      (question) => question.dim === 'reading' && question.figure
    ).length
    if (withFigure < 2 || readingWithFigure < 2) {
      throw new Error(
        '模型没有按要求从文档图片出读图题（带图 ' + withFigure + ' 道，读图带图 ' + readingWithFigure + ' 道），请重试'
      )
    }
  }
  return {
    name,
    badge,
    questions: questions.slice(0, 16),
  }
}

export { DIMS }
