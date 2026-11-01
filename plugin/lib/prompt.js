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

function normalizeQuestion(item, expId, index) {
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

export function buildGenerationPrompt(text, name) {
  const docName = str(name, 40) || '实验讲义'
  return [
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
    '',
    '【硬性要求】',
    '1. 共 12 题：principle 3 题、phenomenon 3 题、reading 3 题、data 3 题。',
    '2. 题型混合：至少 3 道 numeric，至少 3 道 multi，其余 single。',
    '3. 所有内容必须来自讲义：公式、仪器、步骤、注意事项、数据处理方法。不能出现“以上都对”“以上都不对”这类选项。',
    '4. 读图题描述仪器读数、装置结构、曲线或数据表；数据处理题给出具体数据并计算；不确定度题给出明确的评定步骤。',
    '5. 计算题数据自洽、答案唯一，且能被计算器验证。',
    '6. 选项之间要有区分度，错误选项应是学生常见的错误理解。',
    '7. 不要输出 JSON 之外的任何文字。',
    '',
    '【实验名称建议】' + docName,
    '',
    '【讲义正文】',
    '"""',
    text,
    '"""',
  ].join('\n')
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

export function parseGeneratedBank(raw, fallbackName, expId) {
  const data = JSON.parse(extractJson(raw))
  if (!data || typeof data !== 'object') throw new Error('模型返回的内容不是对象')
  const name = cleanName(data.name, fallbackName)
  const badge = cleanBadge(data.badge, name)
  const list = Array.isArray(data.questions) ? data.questions : []
  const questions = []
  list.forEach((item, index) => {
    const normalized = normalizeQuestion(item, expId, questions.length)
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
  return {
    name,
    badge,
    questions: questions.slice(0, 16),
  }
}

export { DIMS }
