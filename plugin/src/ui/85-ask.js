/* "Ask AI" dialog: packages the question context into a conversation draft. */

function buildAskPrompt(q, selected, ok, question) {
  const exp = expMeta(q.exp);
  const dim = dimMeta(q.dim);
  const lines = [];
  lines.push('我在用「大物实验 · 笔试冲刺」复习，遇到一道想深入理解的问题。');
  lines.push('');
  lines.push('【实验】' + exp.name);
  lines.push('【考点】' + dim.name);
  lines.push('【题目】' + q.stem);
  if (q.figure) lines.push('【题图】' + (q.figureCaption || q.figure));
  if (q.table && Array.isArray(q.table.rows) && q.table.rows.length) {
    lines.push('【数据表】' + (q.table.caption || ''));
    if (q.table.headers) lines.push(q.table.headers.join('\t'));
    q.table.rows.forEach((row) => lines.push(row.join('\t')));
  }
  if (q.options && q.options.length) {
    lines.push('【选项】' + q.options.map((opt, i) => letterOf(i) + '. ' + opt).join('；'));
  }
  lines.push('【正确答案】' + correctAnswerText(q));
  lines.push('【我的答案】' + selectionText(q, selected) + '（' + (ok ? '答对' : '答错') + '）');
  lines.push('【题目解析】' + String(q.explain || '').replace(/\n/g, ' '));
  if (q.formula) lines.push('【关键公式】' + q.formula);
  if (q.tip) lines.push('【易错点】' + q.tip);
  lines.push('');
  lines.push('我的问题：' + (question || '请把这道题背后的知识点讲透，并再举一个类似的易错情形。'));
  lines.push('');
  lines.push('请用中文回答：先给结论，再分点解释；涉及计算时写清代入过程；如果我的理解有误，请直接指出。');
  return lines.join('\n');
}

function askInChat(promptText) {
  const ctx = appCtx;
  if (!ctx || typeof ctx.get !== 'function') return false;
  const workspace = ctx.get('uiWorkspace');
  if (!workspace || typeof workspace.startSession !== 'function') return false;
  try {
    workspace.startSession(undefined, {
      prompt: promptText,
      whenDraftExists: 'append',
    });
    return true;
  } catch (err) {
    return false;
  }
}

function AskDialog(props) {
  const q = props.q;
  const exp = expMeta(q.exp);
  const dim = dimMeta(q.dim);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle');
  const inputRef = useRef(null);
  const chips = [
    '为什么正确答案是这些？',
    '关键公式是怎么来的？',
    '这道题最容易错在哪？',
    '再举一个类似的情形',
  ];

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') props.onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function promptText() {
    return buildAskPrompt(q, props.selected, !!props.ok, text.trim());
  }

  function send() {
    if (askInChat(promptText())) {
      props.onClose();
    } else {
      setStatus('failed');
    }
  }

  async function copyPrompt() {
    const value = promptText();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
        setStatus('copied');
        return;
      }
      throw new Error('clipboard-unavailable');
    } catch (err) {
      setStatus('failed');
    }
  }

  return h(
    'div',
    {
      className: 'pl-ask-overlay',
      onMouseDown: (event) => {
        if (event.target === event.currentTarget) props.onClose();
      },
    },
    h(
      'div',
      { className: 'pl-ask', role: 'dialog', 'aria-modal': 'true', 'aria-label': '追问 AI' },
      h(
        'div',
        { className: 'pl-ask-head' },
        h('span', { className: 'pl-badge pl-badge-sm pl-acc-' + exp.accent }, exp.badge),
        h(
          'div',
          { className: 'pl-grow' },
          h('b', { style: { fontSize: 13.5 } }, '追问 AI'),
          h('p', { className: 'pl-sub' }, exp.name + ' · ' + dim.name)
        ),
        h(
          'button',
          { type: 'button', className: 'pl-btn pl-btn-ghost pl-btn-sm', onClick: props.onClose },
          '×'
        )
      ),
      h(
        'div',
        { className: 'pl-ask-context' },
        h(
          'div',
          null,
          h('span', { className: 'pl-muted' }, '正确答案：'),
          correctAnswerText(q)
        ),
        h(
          'div',
          null,
          h('span', { className: 'pl-muted' }, '你的答案：'),
          selectionText(q, props.selected),
          h(
            'span',
            { className: 'pl-chip ' + (props.ok ? 'pl-chip-success' : 'pl-chip-error'), style: { marginLeft: 8 } },
            props.ok ? '答对' : '答错'
          )
        )
      ),
      h('div', { className: 'pl-ask-label' }, '你想深入了解什么？'),
      h(
        'div',
        { className: 'pl-ask-chips' },
        chips.map((chip, i) =>
          h(
            'button',
            {
              key: i,
              type: 'button',
              className: 'pl-ask-chip',
              onClick: () => {
                setText(chip);
                if (inputRef.current) inputRef.current.focus();
              },
            },
            chip
          )
        )
      ),
      h('textarea', {
        ref: inputRef,
        value: text,
        placeholder: '例如：为什么这里必须同时满足幅值和相位条件？',
        onChange: (event) => {
          setText(event.target.value);
          if (status !== 'idle') setStatus('idle');
        },
        onKeyDown: (event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            send();
          }
        },
      }),
      status === 'failed'
        ? h(
            'div',
            { className: 'pl-ask-error' },
            '当前页面无法直接打开对话，请点击「复制问题」后粘贴到输入框里提问。'
          )
        : null,
      status === 'copied'
        ? h('div', { className: 'pl-ask-ok' }, '已复制到剪贴板，粘贴到对话即可提问。')
        : null,
      h(
        'p',
        { className: 'pl-ask-note' },
        '点击「填入对话」会打开新对话，并自动把题目、选项、正确答案、你的答案和解析写进输入框；确认无误后按 Enter 发送，我就能结合这些上下文回答。'
      ),
      h(
        'div',
        { className: 'pl-ask-actions' },
        h('button', { type: 'button', className: 'pl-btn pl-btn-sm', onClick: copyPrompt }, status === 'copied' ? '已复制' : '复制问题'),
        h('button', { type: 'button', className: 'pl-btn pl-btn-primary', onClick: send }, '填入对话')
      )
    )
  );
}
