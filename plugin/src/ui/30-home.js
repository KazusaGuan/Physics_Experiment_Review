/* Home: start a mock round, drill by experiment x dimension, weak spots. */

function Home(props) {
  const store = props.store;
  const stats = overallStats(store);
  const weak = weakSpots(store);
  const sessions = store.sessions || [];
  const last = sessions.length ? sessions[sessions.length - 1] : null;
  const [uploadOpen, setUploadOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const exps = allExps();
  const totalQuestions = allQuestions().length;
  const scopeExcluded = props.scopeExcluded || [];
  const selectedExps = exps.filter((exp) => scopeExcluded.indexOf(exp.id) === -1);
  const canStart = selectedExps.length > 0;
  const scopeQuestions = selectedExps.reduce((sum, exp) => sum + questionsForExp(exp.id).length, 0);

  const heroStats = [
    { label: '累计答题', value: String(stats.attempts), sub: '次作答' },
    { label: '总正确率', value: stats.rate === null ? '—' : Math.round(stats.rate * 100) + '%', sub: stats.correct + ' / ' + stats.attempts },
    { label: '待复习错题', value: String(stats.wrongLeft), sub: '道' },
    { label: '题库总量', value: String(totalQuestions), sub: '道 · ' + exps.length + ' 个实验 × 4 方向' },
  ];

  return h(
    React.Fragment,
    null,
    h(
      'section',
      { className: 'pl-hero' },
      h(
        'div',
        { className: 'pl-hero-grid' },
        h(
          'div',
          null,
          h('span', { className: 'pl-kicker' }, 'MOCK EXAM · 以练带学'),
          h('h2', null, '用一轮模拟，把各个实验串起来'),
          h(
            'p',
            null,
            '每轮按「实验 × 考点」均衡抽题，覆盖实验原理、现象与操作、不确定度与有效数字。每题提交后立即给出解析、关键公式与易错点，练完再看薄弱项强化。'
          ),
          h(
            'div',
            { className: 'pl-start-row' },
            h('button', { type: 'button', className: 'pl-btn pl-btn-primary', disabled: !canStart, onClick: () => props.onStart(12) }, '开始 12 题模拟'),
            h('button', { type: 'button', className: 'pl-btn', disabled: !canStart, onClick: () => props.onStart(18) }, '18 题'),
            h('button', { type: 'button', className: 'pl-btn', disabled: !canStart, onClick: () => props.onStart(24) }, '24 题')
          ),
          h(
            'div',
            { className: 'pl-scope' },
            h(
              'div',
              { className: 'pl-scope-head' },
              h('span', { className: 'pl-scope-title' }, '模拟范围'),
              h('span', { className: 'pl-sub' }, '已选 ' + selectedExps.length + ' / ' + exps.length + ' · ' + scopeQuestions + ' 题'),
              h('span', { className: 'pl-grow' }),
              h(
                'button',
                {
                  type: 'button',
                  className: 'pl-btn pl-btn-ghost pl-btn-sm',
                  disabled: selectedExps.length === exps.length,
                  onClick: props.onSelectAllScope,
                },
                '全选'
              )
            ),
            h(
              'div',
              { className: 'pl-scope-chips' },
              exps.map((exp) => {
                const on = scopeExcluded.indexOf(exp.id) === -1;
                return h(
                  'button',
                  {
                    key: exp.id,
                    type: 'button',
                    className: 'pl-scope-chip' + (on ? ' is-on' : ''),
                    title: on ? '点击从模拟范围中移除' : '点击加入模拟范围',
                    onClick: () => props.onToggleScope(exp.id),
                  },
                  h('span', { className: 'pl-scope-dot pl-acc-' + exp.accent }, exp.badge),
                  h('span', { className: 'pl-scope-name' }, exp.name),
                  h('span', { className: 'pl-scope-check' }, on ? '✓' : '')
                );
              })
            ),
            canStart
              ? null
              : h(
                  'p',
                  { className: 'pl-sub', style: { marginTop: 6, color: 'var(--dsw-alias-state-warn-primary)' } },
                  '至少选择一个实验才能开始模拟。'
                )
          ),
          last
            ? h(
                'p',
                { className: 'pl-sub', style: { marginTop: 10 } },
                '上一轮：' + last.total + ' 题 · 正确 ' + last.correct + ' 题 · 用时 ' + fmtTime(last.duration || 0)
              )
            : h('p', { className: 'pl-sub', style: { marginTop: 10 } }, '第一次来？先做一轮 12 题，系统会记录你的薄弱考点。')
        ),
        h(
          'div',
          { className: 'pl-hero-stats' },
          heroStats.map((s) =>
            h(
              'div',
              { className: 'pl-stat', key: s.label },
              h('span', null, s.label),
              h('b', null, s.value),
              h('small', null, s.sub)
            )
          )
        )
      )
    ),

    weak.length
      ? h(
          'section',
          { className: 'pl-card' },
          h(
            'div',
            { className: 'pl-row-between', style: { marginBottom: 10 } },
            h('div', null, h('h2', { className: 'pl-h2' }, '薄弱考点'), h('p', { className: 'pl-sub' }, '正确率低于 85%，建议逐个强化')),
            h('span', { className: 'pl-chip pl-chip-warn' }, weak.length + ' 项待加强')
          ),
          h(
            'div',
            { className: 'pl-weak-list' },
            weak.map((w) => {
              const exp = expMeta(w.exp);
              const dim = dimMeta(w.dim);
              return h(
                'div',
                { className: 'pl-weak-row', key: w.exp + '-' + w.dim },
                h('span', { className: 'pl-badge pl-badge-sm pl-acc-' + exp.accent }, exp.badge),
                h(
                  'div',
                  { className: 'pl-grow' },
                  h('div', { style: { fontSize: 12.5, fontWeight: 600 } }, exp.name + ' · ' + dim.name),
                  h('div', { className: 'pl-sub' }, '已作答 ' + w.seen + ' 次 · 正确率 ' + Math.round(w.rate * 100) + '%')
                ),
                h('span', { className: 'pl-bar', style: { maxWidth: 140 } }, h('i', { style: { width: Math.round(w.rate * 100) + '%' } })),
                h('button', { type: 'button', className: 'pl-btn pl-btn-sm', onClick: () => props.onDrill(w.exp, w.dim) }, '强化')
              );
            })
          )
        )
      : null,

    h(
      'section',
      null,
      h(
        'div',
        { className: 'pl-row-between', style: { marginBottom: 10 } },
        h('div', null, h('h2', { className: 'pl-h2' }, '按实验专项练习'), h('p', { className: 'pl-sub' }, '选择一个实验的一个考点，集中突破；也可以上传讲义生成新的专项')),
        h(
          'div',
          { className: 'pl-row' },
          h('span', { className: 'pl-chip' }, '点击任意一行开始'),
          h(
            'button',
            { type: 'button', className: 'pl-btn pl-btn-sm', onClick: () => setUploadOpen(true) },
            '＋ 添加专项'
          )
        )
      ),
      h(
        'div',
        { className: 'pl-exps' },
        exps.map((exp) => {
          const total = questionsForExp(exp.id).length;
          return h(
            'div',
            { className: 'pl-card pl-exp-card', key: exp.id },
            h(
              'div',
              { className: 'pl-exp-head' },
              h('span', { className: 'pl-badge pl-acc-' + exp.accent }, exp.badge),
              h(
                'div',
                { className: 'pl-grow' },
                h('h3', null, exp.name),
                h('p', null, total + ' 道题 · 4 个考点' + (exp.custom ? ' · 自定义（AI 生成）' : ''))
              ),
              exp.custom
                ? confirmId === exp.id
                  ? h(
                      'div',
                      { className: 'pl-row', style: { gap: 4 } },
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'pl-btn pl-btn-sm pl-btn-danger',
                          onClick: () => {
                            setConfirmId(null);
                            props.onRemoveCustom(exp.id);
                          },
                        },
                        '删除'
                      ),
                      h(
                        'button',
                        { type: 'button', className: 'pl-btn pl-btn-sm', onClick: () => setConfirmId(null) },
                        '取消'
                      )
                    )
                  : h(
                      'button',
                      {
                        type: 'button',
                        className: 'pl-icon-btn',
                        title: '删除这个专项',
                        onClick: () => setConfirmId(exp.id),
                      },
                      '×'
                    )
                : null,
              h('button', {
                type: 'button',
                className: 'pl-btn pl-btn-sm',
                onClick: () => props.onDrill(exp.id, null),
                title: '随机练习该实验全部考点',
              }, '全部')
            ),
            h(
              'div',
              { className: 'pl-dim-list' },
              DIMS.map((dim) => {
                const st = cellStats(store, exp.id, dim.id);
                return h(
                  'button',
                  {
                    key: dim.id,
                    type: 'button',
                    className: 'pl-dim-row',
                    onClick: () => props.onDrill(exp.id, dim.id),
                    title: dim.desc,
                  },
                  h('span', { className: 'pl-dim-name' }, dim.short),
                  h('span', { className: 'pl-bar' }, h('i', { style: { width: (st.rate === null ? 0 : Math.round(st.rate * 100)) + '%' } })),
                  h('span', { className: 'pl-dim-count' }, st.rate === null ? st.total + ' 题' : Math.round(st.rate * 100) + '%')
                );
              })
            )
          );
        }),
        h(
          'div',
          {
            className: 'pl-card pl-add-card',
            role: 'button',
            tabIndex: 0,
            onClick: () => setUploadOpen(true),
            onKeyDown: (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setUploadOpen(true);
              }
            },
          },
          h('div', { className: 'pl-add-icon' }, '+'),
          h('h3', null, '添加实验专项'),
          h('p', null, '上传讲义或粘贴文本，AI 生成 12 道题'),
          h('span', { className: 'pl-chip' }, '支持 .docx / .pdf / .txt / .md')
        )
      )
    ),

    h(
      'section',
      { className: 'pl-card pl-card-tight' },
      h(
        'div',
        { className: 'pl-row', style: { gap: 14 } },
        h('span', { className: 'pl-badge pl-badge-sm pl-acc-brand' }, 'i'),
        h(
          'p',
          { className: 'pl-sub', style: { margin: 0, flex: 1, minWidth: 220 } },
          '提示：每道题都配有“解题思路 + 关键公式 + 易错点”。不确定度题可以直接打开右上角计算器，支持 sin/cos/√/ln 与科学计数法。'
        ),
        h('button', { type: 'button', className: 'pl-btn pl-btn-sm', onClick: () => props.onTab && props.onTab('cheatsheet') }, '打开速查手册')
      )
    ),

    uploadOpen
      ? h(UploadDialog, {
          onClose: () => setUploadOpen(false),
          onCreated: (bank) => {
            props.onAddCustom(bank);
          },
          onStartDrill: props.onDrill,
        })
      : null
  );
}
