/** Host half: document parsing + AI question-bank generation over a localhost route. */
import { readFile } from 'node:fs/promises'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractText, ExtractError } from './lib/extract.js'
import { buildGenerationPrompt, parseGeneratedBank } from './lib/prompt.js'

const VERSION = '1.2.0'
const GENERATE_PATH = '/physics-lab/generate'
const PING_PATH = '/physics-lab/ping'
const ASSETS_PATH = '/physics-lab/assets/'
const ROOT_DIR = dirname(fileURLToPath(import.meta.url))
const ASSETS_DIR = join(ROOT_DIR, 'assets', 'figures')
const MAX_BODY = 24 * 1024 * 1024
const MAX_TEXT = 30000
const SYSTEM_PROMPT = [
  '你是大学物理实验课程的命题老师，擅长把实验讲义转化为笔试复习题。',
  '你只输出一个合法的 JSON 对象，不输出 Markdown 代码块、解释、前后缀或注释。',
  '所有题目必须严格依据给定讲义，不能编造讲义中没有的数据、仪器型号或结论。',
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

async function callModel(ctx, prompt) {
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
    const stream = llm.stream({
      provider: selection.provider,
      model: selection.model,
      reasoningEffort: 'off',
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
      maxTokens: 8000,
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
    let text = typeof body.text === 'string' ? body.text : ''
    if (!text && typeof body.data === 'string' && body.data) {
      let buffer
      try {
        buffer = Buffer.from(body.data, 'base64')
      } catch (err) {
        throw new Error('文件内容解码失败')
      }
      text = await extractText(buffer, filename)
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
    const expId = 'custom-' + Date.now().toString(36)
    let prompt = buildGenerationPrompt(clipped, fallbackName)
    let raw = await callModel(ctx, prompt)
    let parsed
    try {
      parsed = parseGeneratedBank(raw, fallbackName, expId)
    } catch (firstError) {
      prompt = prompt + '\n\n注意：上一次输出不是合法 JSON 或题目不完整。请严格只输出 JSON 对象，不要代码块或解释。'
      raw = await callModel(ctx, prompt)
      parsed = parseGeneratedBank(raw, fallbackName, expId)
    }
    if (userName) parsed.name = userName
    const bank = {
      id: expId,
      name: parsed.name,
      badge: parsed.badge,
      accent: 'brand',
      custom: true,
      source: filename,
      createdAt: Date.now(),
      questions: parsed.questions,
    }
    sendJson(res, 200, { ok: true, bank })
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
    const data = await readFile(join(ASSETS_DIR, name))
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
