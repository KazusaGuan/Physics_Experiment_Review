/* Test runner: one question at a time with immediate explanation. */

const MODE_LABELS = { mock: '模拟测试', drill: '专项练习', wrong: '错题重练' };

function OptionList(props) {
  const q = props.q;
  return h(
    'div',
    { className: 'pl-options' },
    q.options.map((opt, i) =>
      h(
        'button',
        {
          key: i,
          type: 'button',
          className: 'pl-option ' + optionVerdict(q, i, props.selection, props.submitted),
          disabled: !!props.disabled || !!props.submitted,
          onClick: () => props.onChoose && props.onChoose(i),
        },
        h('span', { className: 'pl-option-key' }, letterOf(i)),
        h('span', { className: 'pl-option-text' }, opt)
      )
    )
  );
}

function QuestionMedia(props) {
  const q = props.q;
  const figure = q.figure
    ? h(
        'figure',
        { className: 'pl-figure' },
        h('img', {
          src: '/physics-lab/assets/' + encodeURIComponent(q.figure) + '?v=' + encodeURIComponent(APP_VERSION),
          alt: q.figureAlt || '题图',
          loading: 'lazy',
        }),
        q.figureCaption ? h('figcaption', null, q.figureCaption) : null
      )
    : null;
  let table = null;
  if (q.table && Array.isArray(q.table.rows) && q.table.rows.length) {
    table = h(
      'div',
      { className: 'pl-table-wrap' },
      q.table.caption ? h('div', { className: 'pl-table-caption' }, q.table.caption) : null,
      h(
        'table',
        { className: 'pl-table' },
        q.table.headers
          ? h(
              'thead',
              null,
              h(
                'tr',
                null,
                q.table.headers.map((cell, i) => h('th', { key: i }, String(cell)))
              )
            )
          : null,
        h(
          'tbody',
          null,
          q.table.rows.map((row, ri) =>
            h(
              'tr',
              { key: ri },
              row.map((cell, ci) => h('td', { key: ci }, String(cell)))
            )
          )
        )
      )
    );
  }
  if (!figure && !table) return null;
  return h(React.Fragment, null, figure, table);
}

function QuestionCard(props) {
  const q = props.q;
  const submitted = props.submitted;
  const selection = props.selection;
  const ok = submitted ? checkAnswer(q, selection) : false;
  const answered = isAnswered(q, selection);
  const [askOpen, setAskOpen] = useState(false);
  const exp = expMeta(q.exp);
  const dim = dimMeta(q.dim);
  const typeLabel = q.type === 'multi' ? '多选题' : q.type === 'numeric' ? '计算题' : '单选题';

  return h(
    'div',
    { className: 'pl-card pl-qcard pl-anim' },
    h(
      'div',
      { className: 'pl-qmeta' },
      h('span', { className: 'pl-badge pl-badge-sm pl-acc-' + exp.accent }, exp.badge),
      h('span', { className: 'pl-chip' }, exp.name),
      h('span', { className: 'pl-chip pl-chip-brand' }, dim.name),
      h('span', { className: 'pl-chip' }, typeLabel),
      q.type === 'multi' ? h('span', { className: 'pl-chip' }, '全部选对才得分') : null
    ),
    h('p', { className: 'pl-qstem' }, q.stem),
    h(QuestionMedia, { q }),

    q.type === 'numeric'
      ? h(
          'div',
          null,
          h(
            'div',
            { className: 'pl-num-row' },
            h('input', {
              type: 'text',
              value: selection === undefined || selection === null ? '' : selection,
              readOnly: submitted,
              placeholder: '输入数值，支持 6.32e-4 写法',
              onChange: (e) => props.onNumeric(e.target.value),
              onKeyDown: (e) => {
                if (e.key === 'Enter' && !submitted) props.onSubmit();
              },
            }),
            q.unit ? h('span', { className: 'pl-unit' }, q.unit) : null
          ),
          q.hint ? h('p', { className: 'pl-sub', style: { marginTop: 6 } }, q.hint) : null
        )
      : h(OptionList, {
          q,
          selection,
          submitted,
          disabled: submitted,
          onChoose: props.onChoose,
        }),

    submitted
      ? h(
          'div',
          { className: 'pl-feedback ' + (ok ? 'ok' : 'bad') },
          h(
            'div',
            { className: 'pl-feedback-title' },
            h('span', null, ok ? '✓ 回答正确' : '✗ 回答错误'),
            h('span', { className: 'pl-chip ' + (ok ? 'pl-chip-success' : 'pl-chip-error') }, ok ? '保持住' : '记入错题本')
          ),
          h(
            'div',
            { className: 'pl-answerline' },
            '正确答案：' + correctAnswerText(q),
            '　你的答案：' + selectionText(q, selection)
          ),
          h(
            'div',
            { className: 'pl-explain' },
            String(q.explain || '').split('\n').map((line, i) => h('p', { key: i }, line))
          ),
          q.formula ? h('div', { className: 'pl-formula' }, q.formula) : null,
          q.figureEvidence ? h('div', { className: 'pl-tip' }, h('b', null, '读图要点　'), q.figureEvidence) : null,
          q.tip ? h('div', { className: 'pl-tip' }, h('b', null, '易错点　'), q.tip) : null,
          h(
            'div',
            { className: 'pl-ask-row' },
            h(
              'button',
              { type: 'button', className: 'pl-btn pl-btn-sm', onClick: () => setAskOpen(true) },
              '✦ 追问 AI'
            ),
            h('span', { className: 'pl-sub' }, '就这道题继续问：为什么、公式怎么来、最容易错在哪')
          )
        )
      : null,

    h(
      'div',
      { className: 'pl-qfooter' },
      h(
        'span',
        { className: 'pl-sub' },
        submitted
          ? '看懂解析后再进入下一题，效果更好。'
          : q.type === 'multi'
            ? '多选题：点击选项可多选，选全后再提交。'
            : q.type === 'numeric'
              ? '先自己在纸上算一遍，再提交答案。'
              : '选择一个你认为正确的选项。'
      ),
      h('span', { className: 'pl-spacer' }),
      submitted
        ? h(
            'button',
            { type: 'button', className: 'pl-btn pl-btn-primary', onClick: props.onNext },
            props.isLast ? '查看本轮报告' : '下一题 →'
          )
        : h(
            'button',
            {
              type: 'button',
              className: 'pl-btn pl-btn-primary',
              disabled: !answered,
              onClick: props.onSubmit,
            },
            '提交答案'
          )
    ),
    askOpen
      ? h(AskDialog, {
          q,
          selected: selection,
          ok,
          onClose: () => setAskOpen(false),
        })
      : null
  );
}

function AnswerSheet(props) {
  const submittedCount = Object.keys(props.submitted).length;
  return h(
    'aside',
    { className: 'pl-card pl-sheet' },
    h(
      'div',
      { className: 'pl-row-between' },
      h('b', { style: { fontSize: 12 } }, '答题卡'),
      h('span', { className: 'pl-chip' }, submittedCount + ' / ' + props.questions.length)
    ),
    h(
      'div',
      { className: 'pl-sheet-grid' },
      props.questions.map((q, i) => {
        const sub = props.submitted[q.id];
        const ok = sub ? checkAnswer(q, props.answers[q.id]) : false;
        const cls =
          'pl-sheet-dot' +
          (i === props.idx ? ' is-current' : '') +
          (sub ? (ok ? ' is-ok' : ' is-bad') : '');
        return h(
          'button',
          { key: q.id, type: 'button', className: cls, onClick: () => props.onJump(i) },
          i + 1
        );
      })
    ),
    h(
      'div',
      { className: 'pl-sheet-legend' },
      h('span', null, h('i', { className: 'pl-dot', style: { background: 'var(--dsw-alias-state-success-primary)' } }), '答对'),
      h('span', null, h('i', { className: 'pl-dot', style: { background: 'var(--dsw-alias-state-error-primary)' } }), '答错'),
      h('span', null, h('i', { className: 'pl-dot', style: { border: '1px solid var(--dsw-alias-border-l2)' } }), '未作答')
    ),
    h('p', { className: 'pl-sub', style: { marginTop: 10 } }, '点击题号可跳转；未作答的题最后也可以回来补。')
  );
}

function TestRunner(props) {
  const questions = props.questions;
  const resume = props.resume || null;
  const [idx, setIdx] = useState(() => {
    const start = resume && typeof resume.idx === 'number' ? resume.idx : 0;
    return Math.min(Math.max(0, start), questions.length - 1);
  });
  const [answers, setAnswers] = useState(() => (resume && resume.answers ? resume.answers : {}));
  const [submitted, setSubmitted] = useState(() => (resume && resume.submitted ? resume.submitted : {}));
  const [seconds, setSeconds] = useState(() => (resume && resume.seconds ? resume.seconds : 0));
  const [done, setDone] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const finishedRef = useRef(false);
  const lastSaveRef = useRef(resume && resume.seconds ? resume.seconds : 0);

  useEffect(() => {
    if (done) return undefined;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [done]);

  useEffect(() => {
    if (done) return;
    saveActive({
      key: props.sessionKey,
      ids: questions.map((q) => q.id),
      mode: props.mode,
      idx,
      answers,
      submitted,
      seconds,
    });
  }, [idx, answers, submitted]);

  useEffect(() => {
    if (done) return;
    if (seconds > 0 && seconds % 5 === 0 && lastSaveRef.current !== seconds) {
      lastSaveRef.current = seconds;
      saveActive({
        key: props.sessionKey,
        ids: questions.map((q) => q.id),
        mode: props.mode,
        idx,
        answers,
        submitted,
        seconds,
      });
    }
  }, [seconds]);

  const current = questions[idx];
  const selection = answers[current.id];
  const isSubmitted = !!submitted[current.id];
  const submittedCount = Object.keys(submitted).length;
  const correctSoFar = questions.reduce((acc, q) => {
    return acc + (submitted[q.id] && checkAnswer(q, answers[q.id]) ? 1 : 0);
  }, 0);

  const results = questions.map((q) => {
    const selected = answers[q.id];
    const ok = !!submitted[q.id] && checkAnswer(q, selected);
    return { q, selected, ok };
  });

  function choose(index) {
    if (isSubmitted) return;
    if (current.type === 'multi') {
      const cur = Array.isArray(selection) ? selection : [];
      const next = cur.indexOf(index) === -1 ? cur.concat([index]) : cur.filter((x) => x !== index);
      setAnswers(Object.assign({}, answers, { [current.id]: next }));
    } else {
      setAnswers(Object.assign({}, answers, { [current.id]: index }));
    }
  }

  function setNumeric(value) {
    if (isSubmitted) return;
    setAnswers(Object.assign({}, answers, { [current.id]: value }));
  }

  function submit() {
    if (isSubmitted || !isAnswered(current, selection)) return;
    const good = checkAnswer(current, selection);
    setSubmitted(Object.assign({}, submitted, { [current.id]: true }));
    props.onRecord(current, good);
  }

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearActive();
    const finalResults = questions.map((q) => ({
      q,
      selected: answers[q.id],
      ok: !!submitted[q.id] && checkAnswer(q, answers[q.id]),
    }));
    props.onSession({
      ts: Date.now(),
      total: questions.length,
      correct: finalResults.filter((r) => r.ok).length,
      duration: seconds,
      mode: props.mode,
    });
    setDone(true);
  }

  function next() {
    if (idx < questions.length - 1) {
      setIdx(idx + 1);
    } else {
      finish();
    }
  }

  function exit() {
    clearActive();
    props.onHome();
  }

  if (done) {
    return h(ResultView, {
      results,
      seconds,
      mode: props.mode,
      onRestart: props.onRestart,
      onRetryWrong: (ids) => props.onRetryWrong(ids),
      onHome: exit,
      onReview: props.onReview,
    });
  }

  return h(
    'div',
    { className: 'pl-page' },
    h(
      'header',
      { className: 'pl-test-head' },
      h('button', { type: 'button', className: 'pl-btn pl-btn-ghost', onClick: exit }, '← 退出'),
      h(
        'div',
        { className: 'pl-test-title' },
        MODE_LABELS[props.mode] || '练习',
        h('span', { className: 'pl-chip' }, idx + 1 + ' / ' + questions.length)
      ),
      h(
        'div',
        { className: 'pl-test-meta' },
        h('span', null, '已答 ' + submittedCount + ' 题'),
        h(
          'span',
          null,
          '正确率 ',
          h('span', { className: 'pl-clock' }, submittedCount ? Math.round((correctSoFar / submittedCount) * 100) + '%' : '—')
        ),
        h('span', null, '用时 ', h('span', { className: 'pl-clock' }, fmtTime(seconds))),
        h(
          'button',
          {
            type: 'button',
            className: 'pl-btn pl-btn-sm' + (calcOpen ? ' pl-btn-primary' : ''),
            onClick: () => setCalcOpen(!calcOpen),
          },
          '计算器'
        )
      )
    ),
    h('div', { className: 'pl-progress' }, h('i', { style: { width: ((idx + 1) / questions.length) * 100 + '%' } })),
    h(
      'div',
      { className: 'pl-scroll pl-test-body' },
      h(
        'div',
        { className: 'pl-test-grid' },
        h(QuestionCard, {
          key: current.id,
          q: current,
          selection,
          submitted: isSubmitted,
          onChoose: choose,
          onNumeric: setNumeric,
          onSubmit: submit,
          onNext: next,
          isLast: idx === questions.length - 1,
        }),
        h(AnswerSheet, {
          questions,
          answers,
          submitted,
          idx,
          onJump: (i) => setIdx(i),
        })
      )
    ),
    calcOpen ? h(Calculator, { onClose: () => setCalcOpen(false) }) : null
  );
}
