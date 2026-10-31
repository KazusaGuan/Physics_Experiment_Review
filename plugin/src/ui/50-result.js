/* Result report and the shared answer/explanation block. */

function AnswerSection(props) {
  const q = props.q;
  const selected = props.selected;
  const paragraphs = String(q.explain || '').split('\n');
  return h(
    React.Fragment,
    null,
    q.type === 'numeric'
      ? h(
          'div',
          { className: 'pl-formula' },
          '你的答案：' + (isAnswered(q, selected) ? String(selected) + (q.unit ? ' ' + q.unit : '') : '未作答') +
            '\n正确答案：' + correctAnswerText(q)
        )
      : h(OptionList, { q, selection: selected, submitted: true, disabled: true }),
    h(
      'div',
      { className: 'pl-explain' },
      paragraphs.map((line, i) => h('p', { key: i }, line))
    ),
    q.formula ? h('div', { className: 'pl-formula' }, q.formula) : null,
    q.tip ? h('div', { className: 'pl-tip' }, h('b', null, '易错点　'), q.tip) : null
  );
}

function QuestionReview(props) {
  const q = props.q;
  const exp = expMeta(q.exp);
  const dim = dimMeta(q.dim);
  const [askOpen, setAskOpen] = useState(false);
  return h(
    'div',
    { className: 'pl-wrong-item' },
    h(
      'div',
      { className: 'pl-wrong-head', onClick: props.onToggle },
      h('span', { className: 'pl-badge pl-badge-sm pl-acc-' + exp.accent }, exp.badge),
      h(
        'div',
        { className: 'pl-wrong-stem' },
        h('div', null, q.stem.length > 92 ? q.stem.slice(0, 92) + '…' : q.stem),
        h('div', { className: 'pl-sub' }, exp.name + ' · ' + dim.name)
      ),
      props.extra ? h('span', { className: 'pl-chip pl-chip-error' }, props.extra) : null,
      h('span', { className: 'pl-chevron' }, props.expanded ? '收起 ▾' : '展开解析 ▸')
    ),
    props.expanded
      ? h(
          'div',
          { className: 'pl-wrong-body' },
          h('p', { className: 'pl-qstem', style: { fontSize: 13.5, marginTop: 12 } }, q.stem),
          h(AnswerSection, { q, selected: props.selected }),
          h(
            'div',
            { className: 'pl-row', style: { marginTop: 12 } },
            h(
              'button',
              { type: 'button', className: 'pl-btn pl-btn-sm', onClick: () => setAskOpen(true) },
              '✦ 追问 AI'
            ),
            props.actions
          )
        )
      : null,
    askOpen
      ? h(AskDialog, {
          q,
          selected: props.selected,
          ok: props.ok,
          onClose: () => setAskOpen(false),
        })
      : null
  );
}

function ResultView(props) {
  const results = props.results;
  const total = results.length;
  const correct = results.filter((r) => r.ok).length;
  const rate = total ? correct / total : 0;
  const wrong = results.filter((r) => !r.ok);
  const [open, setOpen] = useState({});
  const [allOpen, setAllOpen] = useState(false);

  const dimStats = DIMS.map((d) => {
    const rs = results.filter((r) => r.q.dim === d.id);
    return { meta: d, seen: rs.length, correct: rs.filter((r) => r.ok).length };
  });
  const expIds = [];
  results.forEach((r) => {
    if (expIds.indexOf(r.q.exp) === -1) expIds.push(r.q.exp);
  });
  const expStats = expIds.map((id) => {
    const rs = results.filter((r) => r.q.exp === id);
    return { meta: expMeta(id), seen: rs.length, correct: rs.filter((r) => r.ok).length };
  });

  function toggle(id) {
    setOpen(Object.assign({}, open, { [id]: !open[id] }));
  }
  function toggleAll() {
    const next = {};
    if (!allOpen) wrong.forEach((r) => { next[r.q.id] = true; });
    setOpen(next);
    setAllOpen(!allOpen);
  }

  return h(
    'div',
    { className: 'pl-page' },
    h(
      'header',
      { className: 'pl-test-head' },
      h('button', { type: 'button', className: 'pl-btn pl-btn-ghost', onClick: props.onHome }, '← 返回首页'),
      h(
        'div',
        { className: 'pl-test-title' },
        '本轮报告',
        h('span', { className: 'pl-chip' }, MODE_LABELS[props.mode] || '练习')
      ),
      h(
        'div',
        { className: 'pl-test-meta' },
        h('span', null, '用时 ', h('span', { className: 'pl-clock' }, fmtTime(props.seconds))),
        h('span', null, '正确率 ', h('span', { className: 'pl-clock' }, Math.round(rate * 100) + '%'))
      )
    ),
    h(
      'div',
      { className: 'pl-scroll pl-test-body' },
      h(
        'div',
        { className: 'pl-wrap' },
        h(
          'section',
          { className: 'pl-card pl-result-hero' },
          h(
            'div',
            null,
            h('div', { className: 'pl-score' }, correct, h('small', null, '/ ' + total)),
            h('div', { className: 'pl-score-label' }, '答对题数')
          ),
          h(
            'div',
            null,
            h('div', { className: 'pl-score' }, Math.round(rate * 100) + '%'),
            h('div', { className: 'pl-score-label' }, '正确率')
          ),
          h(
            'div',
            null,
            h('div', { className: 'pl-score' }, String(wrong.length)),
            h('div', { className: 'pl-score-label' }, '待巩固')
          ),
          h('span', { className: 'pl-grow' }),
          h(
            'div',
            { className: 'pl-row' },
            h('button', { type: 'button', className: 'pl-btn pl-btn-primary', onClick: props.onRestart }, '再来一轮'),
            h(
              'button',
              {
                type: 'button',
                className: 'pl-btn',
                disabled: !wrong.length,
                onClick: () => props.onRetryWrong(wrong.map((r) => r.q.id)),
              },
              '重做本轮错题'
            ),
            h('button', { type: 'button', className: 'pl-btn pl-btn-ghost', onClick: props.onReview }, '去错题本')
          )
        ),

        h(
          'div',
          { className: 'pl-grid2' },
          h(
            'section',
            { className: 'pl-card' },
            h('h2', { className: 'pl-h2' }, '按考点'),
            dimStats.map((s) =>
              h(
                'div',
                { className: 'pl-stat-row', key: s.meta.id },
                h('span', { className: 'pl-stat-name' }, s.meta.short),
                h('span', { className: 'pl-bar' }, h('i', { style: { width: (s.seen ? Math.round((s.correct / s.seen) * 100) : 0) + '%' } })),
                h('span', { className: 'pl-stat-val' }, s.seen ? Math.round((s.correct / s.seen) * 100) + '%' : '—'),
                h('span', { className: 'pl-stat-val' }, s.correct + '/' + s.seen)
              )
            )
          ),
          h(
            'section',
            { className: 'pl-card' },
            h('h2', { className: 'pl-h2' }, '按实验'),
            expStats.map((s) =>
              h(
                'div',
                { className: 'pl-stat-row', key: s.meta.id },
                h('span', { className: 'pl-stat-name' }, s.meta.short),
                h('span', { className: 'pl-bar' }, h('i', { style: { width: (s.seen ? Math.round((s.correct / s.seen) * 100) : 0) + '%' } })),
                h('span', { className: 'pl-stat-val' }, s.seen ? Math.round((s.correct / s.seen) * 100) + '%' : '—'),
                h('span', { className: 'pl-stat-val' }, s.correct + '/' + s.seen)
              )
            )
          )
        ),

        wrong.length
          ? h(
              'section',
              { className: 'pl-card' },
              h(
                'div',
                { className: 'pl-row-between', style: { marginBottom: 10 } },
                h('div', null, h('h2', { className: 'pl-h2' }, '本轮错题与解析'), h('p', { className: 'pl-sub' }, '点开逐题复盘，把易错点补上')),
                h('button', { type: 'button', className: 'pl-btn pl-btn-sm', onClick: toggleAll }, allOpen ? '收起全部' : '展开全部解析')
              ),
              h(
                'div',
                { className: 'pl-cheat' },
                wrong.map((r) =>
                  h(QuestionReview, {
                    key: r.q.id,
                    q: r.q,
                    selected: r.selected,
                    expanded: !!open[r.q.id],
                    onToggle: () => toggle(r.q.id),
                  })
                )
              )
            )
          : h(
              'section',
              { className: 'pl-card', style: { textAlign: 'center', padding: '28px 20px' } },
              h('div', { style: { fontSize: 26, marginBottom: 6 } }, '✓'),
              h('h2', { className: 'pl-h2' }, '本轮全对'),
              h('p', { className: 'pl-sub' }, '可以再来一轮换换题，或者去速查手册把公式再过一遍。')
            )
      )
    )
  );
}
