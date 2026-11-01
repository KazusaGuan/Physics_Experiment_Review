/** Host half: document parsing + AI question-bank generation over a localhost route. */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractText, extractImages, ExtractError } from './lib/extract.js'
import { buildFigureAnalysisPrompt, parseFigureAnalysis, buildGenerationPrompt, parseGeneratedBank } from './lib/prompt.js'
import { buildFigureCheckPrompt, parseFigureCheck, readingsMatch } from './lib/prompt.js'

const VERSION = '1.4.2'
const GENERATE_PATH = '/physics-lab/generate'
const PING_PATH = '/physics-lab/ping'
const ASSETS_PATH = '/physics-lab/assets/'
const ROOT_DIR = dirname(fileURLToPath(import.meta.url))
const ASSETS_DIR = join(ROOT_DIR, 'assets', 'figures')
const USER_ASSETS_DIR = join(homedir(), '.dsh', 'physics-lab-assets')
const MAX_BODY = 24 * 1024 * 1024
const MAX_TEXT = 30000
const MAX_IMAGES = 6
const SYSTEM_PROMPT = [
  '你是大学物理实验课程的命题老师，擅长把实验讲义转化为笔试复习题。',
  '你只输出一个合法的 JSON 对象，不输出 Markdown 代码块、解释、前后缀或注释。',
  '所有题目必须严格依据给定讲义，不能编造讲义中没有的数据、仪器型号或结论。',
].join('\n')
const VERIFY_SYSTEM = [
  '你是读图复核员，只依据用户提供的图片判断题目选项是否成立。',
  '不要参考讲义文字、题目解析或“正确选项”这个身份本身。',
  '看不清、需要猜测、图中读数与选项不一致时，判 match=false。',
  '只输出一个合法的 JSON 对象，不输出其他文字。',
].join('\n')

function sendJson(res, status, payload) {
  if (res.writableEnded) return
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error('上传内容过大（上限 24 MB）'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function pickSelection(ctx) {
  const defaultModel = ctx.get('agentDefaultModel')
  if (!defaultModel || typeof defaultModel.currentSelection !== 'function') return null
  try {
    const selection = defaultModel.currentSelection()
    if (!selection || !selection.provider || !selection.model) return null
    return selection
  } catch (err) {
    return null
  }
}

async function callModel(ctx, prompt, imageRefs = [], maxTokens = 8000, systemPrompt = SYSTEM_PROMPT) {
  const llm = ctx.get('llm')
  if (!llm || typeof llm.stream !== 'function') {
    const error = new Error('LLM 服务不可用，无法生成题目')
    error.status = 503
    throw error
  }
  const selection = pickSelection(ctx)
  if (!selection) {
    const error = new Error('没有找到默认模型，请先在设置里选择一个模型')
    error.status = 503
    throw error
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 180000)
  let text = ''
  let blockText = ''
  let failure = ''
  let finishKind = ''
  try {
    const content = [{ type: 'text', text: prompt }]
    imageRefs.forEach((ref) => content.push({ type: 'image', attachment: ref }))
    const stream = llm.stream({
      provider: selection.provider,
      model: selection.model,
      reasoningEffort: 'off',
      system: systemPrompt,
      messages: [{ role: 'user', content }],
      maxTokens,
      temperature: 0.35,
      signal: controller.signal,
    })
    for await (const chunk of stream) {
      if (chunk.type === 'text-delta') {
        text += chunk.text
      } else if (chunk.type === 'block-end' && chunk.block && chunk.block.type === 'text') {
        blockText += chunk.block.text
      } else if (chunk.type === 'finish') {
        const reason = chunk.reason || {}
        finishKind = reason.kind || ''
        if (reason.kind === 'error') {
          failure = (reason.failure && reason.failure.message) || '模型调用失败'
        } else if (reason.kind === 'aborted') {
          failure = '模型调用超时或被取消'
        }
      }
    }
  } catch (err) {
    failure = err && err.message ? err.message : '模型调用失败'
  } finally {
    clearTimeout(timer)
  }
  if (!text.trim() && blockText.trim()) text = blockText
  if (failure) {
    const error = new Error(failure)
    error.status = 502
    throw error
  }
  if (!text.trim()) {
    const error = new Error('模型没有返回内容' + (finishKind ? '（finish: ' + finishKind + '）' : '') + '，请重试')
    error.status = 502
    throw error
  }
  return text
}

function cleanFileName(filename) {
  const base = String(filename || 'document.docx').split(/[\\/]/).pop() || 'document.docx'
  return base.slice(0, 160)
}

function stemName(filename) {
  return cleanFileName(filename).replace(/\.[^.]+$/, '') || '新实验专项'
}

async function verifyReadingQuestions(ctx, questions, imageFiles, imageRefs) {
  const kept = []
  for (const question of questions) {
    if (question.dim !== 'reading' || !question.figure) {
      kept.push(question)
      continue
    }
    const index = imageFiles.findIndex((file) => file.filename === question.figure)
    if (index < 0 || !imageRefs[index]) continue
    try {
      const raw = await callModel(ctx, buildFigureCheckPrompt(question), [imageRefs[index]], 1200, VERIFY_SYSTEM)
      const check = parseFigureCheck(raw)
      const correct = question.options[question.answer]
      if (check.match && readingsMatch(check.reading, correct)) {
        question.verified = true
        if (!question.figureEvidence) question.figureEvidence = check.reason
        kept.push(question)
      }
    } catch (err) {
      console.warn('[physics-lab] reading verify failed:', err && err.message ? err.message : err)
    }
  }
  return kept
}

async function handleGenerate(ctx, req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: { code: 'method', message: '只接受 POST' } })
    return
  }
  if (req.headers['x-physics-lab'] !== '1') {
    sendJson(res, 403, { ok: false, error: { code: 'forbidden', message: '缺少请求标识' } })
    return
  }
  try {
    const rawBody = await readBody(req, MAX_BODY)
    let body
    try {
      body = JSON.parse(rawBody.toString('utf8') || '{}')
    } catch (err) {
      sendJson(res, 400, { ok: false, error: { code: 'bad-json', message: '请求体不是合法 JSON' } })
      return
    }
    const filename = cleanFileName(body.filename)
    const userName = typeof body.name === 'string' ? body.name.trim().slice(0, 20) : ''
    const expId = 'custom-' + Date.now().toString(36)
    let text = typeof body.text === 'string' ? body.text : ''
    let images = []
    if (!text && typeof body.data === 'string' && body.data) {
      let buffer
      try {
        buffer = Buffer.from(body.data, 'base64')
      } catch (err) {
        throw new Error('文件内容解码失败')
      }
      text = await extractText(buffer, filename)
      images = await extractImages(buffer, filename)
    }
    text = String(text || '')
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t\u00a0]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    if (text.replace(/\s/g, '').length < 80) {
      const error = new Error('没有从文档中提取到足够的文字（可能是扫描件或空文档）')
      error.status = 422
      throw error
    }
    const clipped = text.slice(0, MAX_TEXT)
    const fallbackName = userName || stemName(filename)

    const selected = images.slice(0, MAX_IMAGES)
    let imageRefs = []
    let imageFiles = []
    const attachments = ctx.get('attachments')
    if (attachments && selected.length) {
      try {
        const limits = attachments.imageLimits || {}
        const limit = Math.min(MAX_IMAGES, Number(limits.maxImagesPerMessage) || MAX_IMAGES)
        const usable = selected.slice(0, limit)
        imageRefs = await attachments.saveImages(
          usable.map((image) => ({
            data: new Uint8Array(image.data),
            mediaType: image.mediaType,
            name: image.name,
          }))
        )
        if (imageRefs.length !== usable.length) {
          imageRefs = []
        } else {
          await mkdir(USER_ASSETS_DIR, { recursive: true })
          for (let i = 0; i < usable.length; i += 1) {
            const image = usable[i]
            const ext = image.mediaType === 'image/png' ? 'png' : image.mediaType === 'image/jpeg' ? 'jpg' : 'gif'
            const outName = expId + '-' + (i + 1) + '.' + ext
            await writeFile(join(USER_ASSETS_DIR, outName), image.data)
            imageFiles.push({ filename: outName, width: image.width, height: image.height })
          }
        }
      } catch (err) {
        imageRefs = []
        imageFiles = []
        console.warn('[physics-lab] image attach failed:', err && err.message ? err.message : err)
      }
    }

    if (imageRefs.length) {
      try {
        const analysisPrompt = buildFigureAnalysisPrompt(clipped, fallbackName, imageRefs.length)
        const analysisRaw = await callModel(ctx, analysisPrompt, imageRefs, 2500)
        const analysis = parseFigureAnalysis(analysisRaw, imageRefs.length)
        imageFiles = imageFiles.map((file, index) =>
          Object.assign({}, file, {
            description: analysis[index].description,
            suitable: analysis[index].suitable,
            readings: (analysis[index].readings || []).filter((reading) => reading.confidence !== 'low'),
          })
        )
        const usable = imageFiles.filter((file) => file.suitable !== false && file.description)
        if (!usable.length) {
          imageRefs = []
          imageFiles = []
        }
      } catch (err) {
        imageRefs = []
        imageFiles = []
        console.warn('[physics-lab] image analysis failed:', err && err.message ? err.message : err)
      }
    }

    let prompt = buildGenerationPrompt(clipped, fallbackName, imageFiles)
    let raw = await callModel(ctx, prompt, imageRefs)
    let parsed
    try {
      parsed = parseGeneratedBank(raw, fallbackName, expId, imageFiles)
    } catch (firstError) {
      prompt =
        prompt +
        '\n\n注意：上一次输出不是合法 JSON，或没有按要求从文档图片出题。请严格只输出 JSON 对象；' +
        (imageRefs.length ? '必须至少有 1 道 reading 题使用所附图片，并填写 figure 图号与 figureEvidence。' : '')
      raw = await callModel(ctx, prompt, imageRefs)
      parsed = parseGeneratedBank(raw, fallbackName, expId, imageFiles)
    }
    if (userName) parsed.name = userName
    if (imageRefs.length) {
      parsed.questions = await verifyReadingQuestions(ctx, parsed.questions, imageFiles, imageRefs)
      if (!parsed.questions.some((question) => question.dim === 'reading')) {
        const error = new Error('读图题复核未通过，请重试')
        error.status = 422
        throw error
      }
    }
    const bank = {
      id: expId,
      name: parsed.name,
      badge: parsed.badge,
      accent: 'brand',
      custom: true,
      source: filename,
      sourceImages: imageFiles.length,
      createdAt: Date.now(),
      questions: parsed.questions,
    }
    const payload = { ok: true, bank }
    sendJson(res, 200, payload)
  } catch (err) {
    const status = err && err.status ? err.status : err instanceof ExtractError ? 422 : 500
    const message = err && err.message ? err.message : '生成失败'
    if (!(err instanceof ExtractError)) {
      console.warn('[physics-lab] generate failed:', message)
    }
    sendJson(res, status, {
      ok: false,
      error: { code: (err && err.code) || 'generate-failed', message },
    })
  }
}

const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

async function handleAsset(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { allow: 'GET, HEAD' })
    res.end()
    return
  }
  let name = ''
  try {
    const raw = (req.url || '').split('?')[0]
    const rel = raw.indexOf(ASSETS_PATH) === 0 ? raw.slice(ASSETS_PATH.length) : raw.replace(/^\/+/, '')
    name = decodeURIComponent(rel)
  } catch (err) {
    name = ''
  }
  if (!/^[A-Za-z0-9._-]+$/.test(name)) {
    res.writeHead(404)
    res.end()
    return
  }
  const type = MIME[extname(name).toLowerCase()]
  if (!type) {
    res.writeHead(404)
    res.end()
    return
  }
  try {
    let data
    try {
      data = await readFile(join(USER_ASSETS_DIR, name))
    } catch (err) {
      data = await readFile(join(ASSETS_DIR, name))
    }
    res.writeHead(200, {
      'content-type': type,
      'cache-control': 'public, max-age=3600',
      'content-length': data.length,
    })
    if (req.method === 'HEAD') res.end()
    else res.end(data)
  } catch (err) {
    res.writeHead(404)
    res.end()
  }
}

export function apply(ctx) {
  const web = ctx.get('webServer')
  if (!web) return
  ctx.effect(() =>
    web.register({
      kind: 'exact',
      path: PING_PATH,
      handler: (req, res) => {
        const selection = pickSelection(ctx)
        sendJson(res, 200, {
          ok: true,
          version: VERSION,
          llm: !!ctx.get('llm'),
          model: selection ? selection.provider + '/' + selection.model : null,
        })
      },
    })
  )
  ctx.effect(() =>
    web.register({
      kind: 'prefix',
      path: '/physics-lab/assets',
      handler: (req, res) => handleAsset(req, res),
    })
  )
  ctx.effect(() =>
    web.register({
      kind: 'exact',
      path: GENERATE_PATH,
      handler: (req, res) => handleGenerate(ctx, req, res),
    })
  )
}
