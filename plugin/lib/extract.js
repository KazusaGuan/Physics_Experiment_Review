// Document text extraction for the physics-lab bundle (Host side).
import { inflateRawSync } from 'node:zlib'
import { existsSync, readdirSync } from 'node:fs'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'

export class ExtractError extends Error {
  constructor(message, code = 'extract-failed') {
    super(message)
    this.name = 'ExtractError'
    this.code = code
  }
}

const PDF_SCRIPT = [
  'import sys',
  'path = sys.argv[1]',
  'try:',
  '    from pypdf import PdfReader',
  'except Exception:',
  '    try:',
  '        from PyPDF2 import PdfReader',
  '    except Exception:',
  "        sys.stderr.write('NO_PDF_LIBRARY')",
  '        sys.exit(3)',
  'try:',
  '    reader = PdfReader(path)',
  "    parts = []",
  '    for page in reader.pages:',
  "        parts.append(page.extract_text() or '')",
  "    sys.stdout.buffer.write(('\\n'.join(parts)).encode('utf-8', 'replace'))",
  'except Exception as exc:',
  "    sys.stderr.buffer.write(('PDF_ERROR:' + str(exc)).encode('utf-8', 'replace'))",
  '    sys.exit(4)',
].join('\n')

function decodeEntities(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&amp;/g, '&')
}

function normalize(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function decodeBytes(buffer) {
  let text = buffer.toString('utf8')
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
  const bad = (text.match(/\ufffd/g) || []).length
  if (text.length && bad / text.length > 0.02) {
    try {
      text = new TextDecoder('gbk').decode(buffer)
    } catch (err) {
      /* keep utf8 */
    }
  }
  return text
}

function stripHtml(html) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
  )
}

function findEocd(buffer) {
  const min = Math.max(0, buffer.length - 22 - 0xffff)
  for (let i = buffer.length - 22; i >= min; i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) return i
  }
  return -1
}

function readZipEntries(buffer) {
  const eocd = findEocd(buffer)
  if (eocd < 0) throw new ExtractError('文件不是有效的 docx（未找到 ZIP 目录）', 'bad-docx')
  const count = buffer.readUInt16LE(eocd + 10)
  const start = buffer.readUInt32LE(eocd + 16)
  const entries = {}
  let pos = start
  for (let i = 0; i < count; i += 1) {
    if (pos + 46 > buffer.length || buffer.readUInt32LE(pos) !== 0x02014b50) break
    const method = buffer.readUInt16LE(pos + 10)
    const compressedSize = buffer.readUInt32LE(pos + 20)
    const nameLength = buffer.readUInt16LE(pos + 28)
    const extraLength = buffer.readUInt16LE(pos + 30)
    const commentLength = buffer.readUInt16LE(pos + 32)
    const localOffset = buffer.readUInt32LE(pos + 42)
    const name = buffer.toString('utf8', pos + 46, pos + 46 + nameLength)
    if (
      localOffset + 30 <= buffer.length &&
      buffer.readUInt32LE(localOffset) === 0x04034b50
    ) {
      const localNameLength = buffer.readUInt16LE(localOffset + 26)
      const localExtraLength = buffer.readUInt16LE(localOffset + 28)
      const dataStart = localOffset + 30 + localNameLength + localExtraLength
      const raw = buffer.subarray(dataStart, dataStart + compressedSize)
      entries[name] = { method, raw }
    }
    pos += 46 + nameLength + extraLength + commentLength
  }
  return entries
}

function extractDocx(buffer) {
  const entries = readZipEntries(buffer)
  const entry = entries['word/document.xml']
  if (!entry) throw new ExtractError('docx 中缺少正文（word/document.xml）', 'bad-docx')
  let xml
  try {
    xml = entry.method === 8 ? inflateRawSync(entry.raw).toString('utf8') : entry.raw.toString('utf8')
  } catch (err) {
    throw new ExtractError('docx 正文解压失败', 'bad-docx')
  }
  const text = xml
    .replace(/<w:tab\b[^>]*\/>/g, '\t')
    .replace(/<w:br\b[^>]*\/>/g, '\n')
    .replace(/<w:cr\b[^>]*\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<\/w:tr>/g, '\n')
    .replace(/<w:t\b[^>]*>/g, '')
    .replace(/<[^>]+>/g, '')
  return normalize(decodeEntities(text))
}

function pythonCandidates() {
  const list = []
  const push = (command, args) => {
    if (!command) return
    if (list.some((item) => item.command === command && item.args.join(' ') === args.join(' '))) return
    list.push({ command, args })
  }
  if (process.env.DSH_PYTHON) push(process.env.DSH_PYTHON, [])
  const roots = [
    join(homedir(), '.dsh', 'dsh-runtimes'),
    join(process.env.LOCALAPPDATA || '', 'dsh', 'dsh-runtimes'),
  ]
  for (const root of roots) {
    try {
      for (const dir of readdirSync(root)) {
        const win = join(root, dir, 'dependencies', 'python', 'python.exe')
        if (existsSync(win)) push(win, [])
        const nix = join(root, dir, 'dependencies', 'python', 'bin', 'python3')
        if (existsSync(nix)) push(nix, [])
      }
    } catch (err) {
      /* ignore */
    }
  }
  push('python', [])
  push('python3', [])
  push('py', ['-3'])
  return list
}

function runProcess(command, args, timeoutMs) {
  return new Promise((resolve) => {
    let child
    try {
      child = spawn(command, args, {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    } catch (err) {
      resolve({ code: -2, stdout: '', stderr: String(err) })
      return
    }
    let stdout = ''
    let stderr = ''
    let settled = false
    const finish = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(result)
    }
    const timer = setTimeout(() => {
      try { child.kill() } catch (err) { /* ignore */ }
      finish({ code: -1, stdout, stderr: 'timeout' })
    }, timeoutMs)
    child.stdout.on('data', (chunk) => { stdout += chunk.toString('utf8') })
    child.stderr.on('data', (chunk) => { stderr += chunk.toString('utf8') })
    child.on('error', (err) => finish({ code: -2, stdout, stderr: String(err) }))
    child.on('close', (code) => finish({ code, stdout, stderr }))
  })
}

function runCandidate(candidate, scriptPath, timeoutMs) {
  return runProcess(candidate.command, candidate.args.concat(['-c', PDF_SCRIPT, scriptPath]), timeoutMs)
}

async function extractPdf(buffer) {
  const path = join(tmpdir(), 'physics-lab-' + process.pid + '-' + Date.now() + '.pdf')
  await writeFile(path, buffer)
  try {
    let lastError = '未找到可用的 Python'
    for (const candidate of pythonCandidates()) {
      const result = await runCandidate(candidate, path, 45000)
      if (result.code === 0 && result.stdout.trim().length >= 20) {
        return normalize(result.stdout)
      }
      if (result.stderr.indexOf('NO_PDF_LIBRARY') !== -1) {
        lastError = 'Python 环境缺少 pypdf'
        continue
      }
      if (result.code === 0) {
        lastError = 'PDF 中没有可提取的文字（可能是扫描件）'
        continue
      }
      if (result.code !== -2) lastError = result.stderr.trim() || lastError
    }
    const poppler = await runProcess('pdftotext', [path, '-'], 45000)
    if (poppler.code === 0 && poppler.stdout.trim().length >= 20) {
      return normalize(poppler.stdout)
    }
    throw new ExtractError(
      'PDF 解析失败：' + lastError + '。请用 Word 打开 PDF 后另存为 .docx 再上传，或改用「粘贴文本」。',
      'pdf-unsupported'
    )
  } finally {
    try { await unlink(path) } catch (err) { /* ignore */ }
  }
}

export async function extractText(buffer, filename) {
  const name = String(filename || '')
  const ext = (name.split('.').pop() || '').toLowerCase()
  if (!buffer || !buffer.length) throw new ExtractError('文件内容为空', 'empty-file')
  if (ext === 'docx') return extractDocx(buffer)
  if (ext === 'pdf') return extractPdf(buffer)
  if (ext === 'doc') {
    throw new ExtractError('旧版 .doc 暂不支持，请用 Word 另存为 .docx 后上传。', 'doc-unsupported')
  }
  if (ext === 'html' || ext === 'htm') return normalize(stripHtml(decodeBytes(buffer)))
  if (['txt', 'md', 'markdown', 'text', 'csv', 'json'].indexOf(ext) !== -1) {
    return normalize(decodeBytes(buffer))
  }
  if (buffer.readUInt32LE(0) === 0x04034b50) return extractDocx(buffer)
  if (buffer.subarray(0, 4).toString('latin1') === '%PDF') return extractPdf(buffer)
  return normalize(decodeBytes(buffer))
}

export async function readDocumentTextFile(path) {
  const buffer = await readFile(path)
  return extractText(buffer, path)
}
