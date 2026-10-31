/* Quick-reference handbook with per-section AI explanation. */

function buildCheatPrompt(sheet, section) {
  const lines = [
    '我在复习大学物理实验（下），想通过对话弄懂速查手册里的这个知识板块。',
    '',
    '【主题】' + sheet.name,
    '【板块】' + section.title,
    '【要点】',
  ];
  (section.items || []).forEach((item, index) => {
    lines.push(index + 1 + '. ' + item);
  });
  if (section.formulas && section.formulas.length) {
    lines.push('', '【公式】');
    section.formulas.forEach((formula) => lines.push(formula));
  }
  lines.push(
    '',
    '请先：',
    '1. 用 3~5 句话总结这个板块的核心；',
    '2. 结合一个具体实验场景解释这些公式/规则怎么用；',
    '3. 指出考试里最容易错的 2 个点。',
    '然后针对我接下来的追问继续讲解，必要时给出计算示例。'
  );
  return lines.join('\n');
}

function CheatSheet() {
  const [open, setOpen] = useState({ general: true });
  const [fallback, setFallback] = useState('');
  const [copied, setCopied] = useState(false);

  function toggle(id) {
    setOpen(Object.assign({}, open, { [id]: !open[id] }));
  }

  function explain(sheet, section) {
    const prompt = buildCheatPrompt(sheet, section);
    if (askInChat(prompt)) return;
    setFallback(prompt);
    setCopied(false);
  }

  async function copyFallback() {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fallback);
        setCopied(true);
        return;
      }
      throw new Error('clipboard-unavailable');
    } catch (err) {
      setCopied(false);
    }
  }

  return h(
    React.Fragment,
    null,
    h(
      'div',
      null,
      h('h2', { className: 'pl-h2' }, '速查手册'),
      h(
        'p',
        { className: 'pl-sub' },
        '考前过一遍：核心公式、操作要点、易错提醒。点板块标题旁的「AI 讲解」可以把该板块带进新对话，按 Enter 让 AI 讲。'
      )
    ),
    h(
      'div',
      { className: 'pl-cheat' },
      CHEATS.map((sheet) =>
        h(
          'section',
          { className: 'pl-card pl-cheat-card', key: sheet.id },
          h(
            'button',
            { type: 'button', className: 'pl-cheat-head', onClick: () => toggle(sheet.id) },
            h('span', { className: 'pl-badge pl-badge-sm pl-acc-' + sheet.accent }, sheet.badge),
            h(
              'div',
              { className: 'pl-grow' },
              h('h3', { style: { margin: 0, fontSize: 13.5, fontWeight: 650 } }, sheet.name),
              h('p', { className: 'pl-sub' }, sheet.sections.length + ' 个板块 · ' + (sheet.id === 'general' ? '通用规则' : '本实验重点'))
            ),
            h('span', { className: 'pl-chevron' }, open[sheet.id] ? '收起 ▾' : '展开 ▸')
          ),
          open[sheet.id]
            ? h(
                'div',
                { className: 'pl-cheat-body' },
                sheet.sections.map((section, si) =>
                  h(
                    'div',
                    { className: 'pl-cheat-section', key: si },
                    h(
                      'div',
                      { className: 'pl-cheat-section-head' },
                      h('h4', null, section.title),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'pl-btn pl-btn-sm pl-ai-btn',
                          title: '把这一板块带进新对话，让 AI 讲解',
                          onClick: () => explain(sheet, section),
                        },
                        '✦ AI 讲解'
                      )
                    ),
                    h(
                      'ul',
                      null,
                      section.items.map((item, ii) => h('li', { key: ii }, item))
                    ),
                    section.formulas
                      ? h('div', { className: 'pl-cheat-formulas' }, section.formulas.join('\n'))
                      : null
                  )
                )
              )
            : null
        )
      )
    ),

    fallback
      ? h(
          'div',
          {
            className: 'pl-ask-overlay',
            onMouseDown: (event) => {
              if (event.target === event.currentTarget) setFallback('');
            },
          },
          h(
            'div',
            { className: 'pl-ask', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'AI 讲解' },
            h(
              'div',
              { className: 'pl-ask-head' },
              h('span', { className: 'pl-badge pl-badge-sm pl-acc-brand' }, 'AI'),
              h(
                'div',
                { className: 'pl-grow' },
                h('b', { style: { fontSize: 13.5 } }, 'AI 讲解'),
                h('p', { className: 'pl-sub' }, '当前页面无法直接打开对话')
              ),
              h('button', { type: 'button', className: 'pl-btn pl-btn-ghost pl-btn-sm', onClick: () => setFallback('') }, '×')
            ),
            h(
              'p',
              { className: 'pl-ask-note' },
              '复制下面这段内容，粘贴到对话输入框里按 Enter，就能让 AI 结合这个板块讲解。'
            ),
            h('textarea', { className: 'pl-upload-text', readOnly: true, value: fallback }),
            h(
              'div',
              { className: 'pl-ask-actions' },
              h('button', { type: 'button', className: 'pl-btn', onClick: () => setFallback('') }, '关闭'),
              h(
                'button',
                { type: 'button', className: 'pl-btn pl-btn-primary', onClick: copyFallback },
                copied ? '已复制' : '复制内容'
              )
            )
          )
        )
      : null
  );
}
