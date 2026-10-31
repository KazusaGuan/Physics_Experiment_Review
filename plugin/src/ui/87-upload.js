/* Upload a lab handout and let the Host + model build a new experiment drill. */

const UPLOAD_LIMIT = 12 * 1024 * 1024;
const UPLOAD_ACCEPT = '.docx,.pdf,.txt,.md,.markdown,.html,.htm';

function readFileBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });
}

function UploadDialog(props) {
  const [mode, setMode] = useState('file');
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [bank, setBank] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const abortRef = useRef(null);
  const autoNameRef = useRef('');

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        if (abortRef.current) abortRef.current.abort();
        props.onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (status !== 'working') return undefined;
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  function close() {
    if (abortRef.current) abortRef.current.abort();
    props.onClose();
  }

  function pickFile(next) {
    if (!next) return;
    if (next.size > UPLOAD_LIMIT) {
      setError('文件超过 12 MB，请压缩或拆分后再上传。');
      return;
    }
    const stem = next.name.replace(/\.[^.]+$/, '');
    if (!name || name === autoNameRef.current) {
      autoNameRef.current = stem;
      setName(stem);
    }
    setFile(next);
    setError('');
  }

  async function generate() {
    if (status === 'working') return;
    setError('');
    setElapsed(0);
    setStatus('working');
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 200000);
    try {
      let payload;
      if (mode === 'file') {
        if (!file) throw new Error('请先选择一个讲义文件。');
        const data = await readFileBase64(file);
        payload = { filename: file.name, name: name.trim(), data };
      } else {
        if (text.trim().length < 80) throw new Error('请至少粘贴 80 字以上的讲义内容。');
        payload = { filename: 'pasted.txt', name: name.trim(), text };
      }
      const response = await fetch('/physics-lab/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-physics-lab': '1' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data || data.ok !== true) {
        const message =
          data && data.error && data.error.message
            ? data.error.message
            : '生成失败（HTTP ' + response.status + '）';
        throw new Error(message);
      }
      if (!data.bank || !Array.isArray(data.bank.questions) || !data.bank.questions.length) {
        throw new Error('生成结果不完整，请重试。');
      }
      setBank(data.bank);
      setStatus('done');
      props.onCreated(data.bank);
    } catch (err) {
      if (err && err.name === 'AbortError') {
        setError('已取消或超时。可以重试，或改用「粘贴文本」。');
      } else {
        setError(err && err.message ? err.message : '生成失败，请重试。');
      }
      setStatus('idle');
    } finally {
      clearTimeout(timeout);
      abortRef.current = null;
    }
  }

  let body
  if (status === 'done' && bank) {
    const counts = {};
    bank.questions.forEach((q) => { counts[q.dim] = (counts[q.dim] || 0) + 1; });
    body = h(
      'div',
      { className: 'pl-upload-working' },
      h('div', { className: 'pl-upload-ok' }, '✓'),
      h('b', null, '「' + bank.name + '」已添加'),
      h(
        'p',
        { className: 'pl-sub' },
        bank.questions.length + ' 道题 · 原理 ' + (counts.principle || 0) +
          ' · 操作 ' + (counts.phenomenon || 0) +
          ' · 不确定度 ' + (counts.uncertainty || 0)
      ),
      h('p', { className: 'pl-sub' }, '现在可以在「按实验专项练习」里看到这个新专项。'),
      h('p', { className: 'pl-sub' }, 'AI 生成内容可能有误，请对照讲义核对；发现不合适可以直接删除这个专项。'),
      h(
        'div',
        { className: 'pl-ask-actions' },
        h('button', { type: 'button', className: 'pl-btn', onClick: close }, '完成'),
        h(
          'button',
          {
            type: 'button',
            className: 'pl-btn pl-btn-primary',
            onClick: () => {
              close();
              if (props.onStartDrill) props.onStartDrill(bank.id, 'principle');
            },
          },
          '开始练习'
        )
      )
    )
  } else if (status === 'working') {
    body = h(
      'div',
      { className: 'pl-upload-working' },
      h('div', { className: 'pl-spinner' }),
      h('b', null, '正在解析文档并生成题目'),
      h('p', { className: 'pl-sub' }, '已用时 ' + elapsed + ' 秒 · 通常需要 20~60 秒'),
      h('p', { className: 'pl-sub' }, '生成完成后会自动保存；请保持这个面板打开。'),
      h(
        'button',
        {
          type: 'button',
          className: 'pl-btn pl-btn-sm',
          onClick: () => {
            if (abortRef.current) abortRef.current.abort();
          },
        },
        '取消'
      )
    )
  } else {
    body = h(
      React.Fragment,
      null,
      h(
        'div',
        { className: 'pl-upload-tabs' },
        h(
          'button',
          {
            type: 'button',
            className: 'pl-filter-btn' + (mode === 'file' ? ' is-active' : ''),
            onClick: () => setMode('file'),
          },
          '上传文件'
        ),
        h(
          'button',
          {
            type: 'button',
            className: 'pl-filter-btn' + (mode === 'text' ? ' is-active' : ''),
            onClick: () => setMode('text'),
          },
          '粘贴文本'
        )
      ),
      mode === 'file'
        ? h(
            'label',
            {
              className: 'pl-drop',
              onDragOver: (event) => event.preventDefault(),
              onDrop: (event) => {
                event.preventDefault();
                pickFile(event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]);
              },
            },
            h('input', {
              type: 'file',
              accept: UPLOAD_ACCEPT,
              style: { display: 'none' },
              onChange: (event) => pickFile(event.target.files && event.target.files[0]),
            }),
            h('div', { className: 'pl-drop-icon' }, '↑'),
            file
              ? h('b', null, file.name)
              : h('b', null, '点击选择文件，或拖拽到这里'),
            h(
              'span',
              { className: 'pl-sub' },
              file
                ? (file.size / 1024).toFixed(0) + ' KB · 点击可更换'
                : '支持 .docx / .pdf / .txt / .md，最大 12 MB'
            )
          )
        : h('textarea', {
            className: 'pl-upload-text',
            value: text,
            placeholder: '把实验讲义的文字粘贴到这里（至少 80 字）…',
            onChange: (event) => setText(event.target.value),
          }),
      h('input', {
        className: 'pl-upload-name',
        value: name,
        placeholder: '实验名称（默认取文件名）',
        onChange: (event) => setName(event.target.value),
      }),
      h(
        'p',
        { className: 'pl-ask-note' },
        '生成会调用当前默认模型，约 20~60 秒；题目会保存为新的实验专项，可随时删除。' +
          'AI 生成内容可能有误，请对照讲义核对。' +
          (mode === 'file' ? ' PDF 若解析失败，可改用「粘贴文本」。' : '')
      ),
      error ? h('div', { className: 'pl-ask-error' }, error) : null,
      h(
        'div',
        { className: 'pl-ask-actions' },
        h('button', { type: 'button', className: 'pl-btn', onClick: close }, '取消'),
        h('button', { type: 'button', className: 'pl-btn pl-btn-primary', onClick: generate }, '生成专项')
      )
    )
  }

  return h(
    'div',
    {
      className: 'pl-ask-overlay',
      onMouseDown: (event) => {
        if (event.target === event.currentTarget) close();
      },
    },
    h(
      'div',
      { className: 'pl-ask pl-upload', role: 'dialog', 'aria-modal': 'true', 'aria-label': '添加实验专项' },
      h(
        'div',
        { className: 'pl-ask-head' },
        h('span', { className: 'pl-badge pl-badge-sm pl-acc-brand' }, '+'),
        h(
          'div',
          { className: 'pl-grow' },
          h('b', { style: { fontSize: 13.5 } }, '添加实验专项'),
          h('p', { className: 'pl-sub' }, '上传新的实验讲义，AI 生成一套可练习的题目')
        ),
        h('button', { type: 'button', className: 'pl-btn pl-btn-ghost pl-btn-sm', onClick: close }, '×')
      ),
      body
    )
  )
}
