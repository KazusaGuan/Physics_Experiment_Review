/* Root application, sidebar icon and the shell (header + tabs). */

let appCtx = null;

function PhysicsLabIcon(props) {
  const size = props && props.size ? props.size : 20;
  return h(
    'svg',
    { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': 'true' },
    h('path', {
      d: 'M2.8 15.6c2.7-7.2 5.5-7.2 8.2 0s5.5 7.2 8.2 0',
      stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round',
    }),
    h('circle', { cx: 12, cy: 6.2, r: 1.9, fill: 'currentColor' }),
    h('circle', { cx: 5.4, cy: 19.2, r: 1.15, fill: 'currentColor' }),
    h('circle', { cx: 18.6, cy: 19.2, r: 1.15, fill: 'currentColor' })
  );
}

function PhysicsLabApp() {
  const [customBanks, setCustomBanksState] = useState(() => {
    const list = loadCustomBanks();
    setCustomBanks(list);
    return list;
  });
  const [scopeExcluded, setScopeExcluded] = useState(loadScopeExcluded);
  const [store, setStore] = useState(loadStore);
  const [tab, setTab] = useState('home');
  const [session, setSession] = useState(() => {
    const saved = loadActive();
    if (!saved) return null;
    const byId = {};
    allQuestions().forEach((q) => { byId[q.id] = q; });
    const questions = (saved.ids || []).map((id) => byId[id]).filter(Boolean);
    if (!questions.length || questions.length !== saved.ids.length) {
      clearActive();
      return null;
    }
    return {
      key: saved.key || Date.now() + Math.random(),
      questions,
      mode: saved.mode || 'mock',
      resume: saved,
    };
  });

  const recordAnswer = useCallback((question, good) => {
    setStore((prev) => {
      const rec = prev.q[question.id] || { s: 0, c: 0, w: 0, last: null };
      const q = Object.assign({}, prev.q);
      q[question.id] = {
        s: (rec.s || 0) + 1,
        c: (rec.c || 0) + (good ? 1 : 0),
        w: (rec.w || 0) + (good ? 0 : 1),
        last: !!good,
      };
      const next = { v: 1, q, sessions: prev.sessions };
      persistStore(next);
      return next;
    });
  }, []);

  const recordSession = useCallback((summary) => {
    setStore((prev) => {
      const next = {
        v: 1,
        q: prev.q,
        sessions: prev.sessions.concat([summary]).slice(-40),
      };
      persistStore(next);
      return next;
    });
  }, []);

  const startSession = useCallback((count, ids, mode, scope) => {
    const questions = pickQuestions(count, ids, scope);
    if (!questions.length) return;
    clearActive();
    setSession({ key: Date.now() + Math.random(), questions, mode: mode || 'mock' });
  }, []);

  const scopeIds = allExps()
    .filter((exp) => scopeExcluded.indexOf(exp.id) === -1)
    .map((exp) => exp.id);

  const startMock = useCallback((n) => {
    if (!scopeIds.length) return;
    startSession(n, null, 'mock', scopeIds);
  }, [scopeIds, startSession]);

  const toggleScope = useCallback((id) => {
    setScopeExcluded((prev) => {
      const next = prev.indexOf(id) === -1 ? prev.concat([id]) : prev.filter((item) => item !== id);
      saveScopeExcluded(next);
      return next;
    });
  }, []);

  const selectAllScope = useCallback(() => {
    setScopeExcluded([]);
    saveScopeExcluded([]);
  }, []);
  const startDrill = useCallback((exp, dim) => {
    const list = dim
      ? questionsOf(exp, dim)
      : questionsForExp(exp);
    const ids = list.map((q) => q.id);
    startSession(ids.length, ids, 'drill');
  }, [startSession]);
  const startPractice = useCallback((ids) => {
    if (ids && ids.length) startSession(ids.length, ids, 'drill');
  }, [startSession]);

  const startWrong = useCallback(() => {
    const ids = reviewQuestions(store).map((q) => q.id);
    if (ids.length) startSession(ids.length, ids, 'wrong');
  }, [store, startSession]);

  const removeWrong = useCallback((id) => {
    setStore((prev) => {
      const rec = prev.q[id];
      if (!rec) return prev;
      const q = Object.assign({}, prev.q);
      q[id] = Object.assign({}, rec, { last: true });
      const next = { v: 1, q, sessions: prev.sessions };
      persistStore(next);
      return next;
    });
  }, []);

  const addCustomBank = useCallback((bank) => {
    setCustomBanksState((prev) => {
      const next = prev.concat([bank]);
      saveCustomBanks(next);
      setCustomBanks(next);
      return next;
    });
  }, []);

  const removeCustomBank = useCallback((id) => {
    setCustomBanksState((prev) => {
      const next = prev.filter((bank) => bank.id !== id);
      saveCustomBanks(next);
      setCustomBanks(next);
      return next;
    });
    setScopeExcluded((prev) => {
      if (prev.indexOf(id) === -1) return prev;
      const next = prev.filter((item) => item !== id);
      saveScopeExcluded(next);
      return next;
    });
  }, []);

  const home = useCallback(() => {
    setSession(null);
    setTab('home');
  }, []);

  let body;
  if (session) {
    body = h(TestRunner, {
      key: session.key,
      sessionKey: session.key,
      resume: session.resume,
      questions: session.questions,
      mode: session.mode,
      onRecord: recordAnswer,
      onSession: recordSession,
      onRestart: () => {
        if (session.mode === 'mock') {
          startSession(session.questions.length, null, 'mock');
        } else {
          startSession(session.questions.length, session.questions.map((q) => q.id), session.mode);
        }
      },
      onRetryWrong: (ids) => startSession(ids.length, ids, 'wrong'),
      onHome: home,
      onReview: () => {
        setSession(null);
        setTab('review');
      },
    });
  } else {
    body = h(
      Shell,
      {
        store,
        tab,
        onTab: setTab,
        onStart: startMock,
        onDrill: startDrill,
        onWrong: startWrong,
        onRemoveWrong: removeWrong,
        onPractice: startPractice,
        customBanks,
        onAddCustom: addCustomBank,
        onRemoveCustom: removeCustomBank,
        scopeExcluded,
        onToggleScope: toggleScope,
        onSelectAllScope: selectAllScope,
      }
    );
  }

  return h('div', { className: 'pl-root' }, h('style', null, CSS), body);
}

function Shell(props) {
  const stats = overallStats(props.store);
  const tabs = [
    { id: 'home', label: '练习' },
    { id: 'review', label: '错题本' },
    { id: 'cheatsheet', label: '速查手册' },
  ];
  let content;
  if (props.tab === 'review') {
    content = h(ReviewView, {
      store: props.store,
      onWrong: props.onWrong,
      onRemove: props.onRemoveWrong,
      onPractice: props.onPractice,
    });
  } else if (props.tab === 'cheatsheet') {
    content = h(CheatSheet, null);
  } else {
    content = h(Home, {
      store: props.store,
      onStart: props.onStart,
      onDrill: props.onDrill,
      onTab: props.onTab,
      customBanks: props.customBanks,
      onAddCustom: props.onAddCustom,
      onRemoveCustom: props.onRemoveCustom,
      scopeExcluded: props.scopeExcluded,
      onToggleScope: props.onToggleScope,
      onSelectAllScope: props.onSelectAllScope,
    });
  }
  return h(
    'div',
    { className: 'pl-page' },
    h(
      'header',
      { className: 'pl-top' },
      h(
        'div',
        { className: 'pl-brand' },
        h('div', { className: 'pl-brand-mark' }, PhysicsLabIcon({ size: 19 })),
        h(
          'div',
          null,
          h('h1', null, '大物实验 · 笔试冲刺'),
          h('p', null, '6 个实验 + 自建专项 · 原理 / 操作 / 读图 / 数据处理 · v' + APP_VERSION)
        )
      ),
      h(
        'nav',
        { className: 'pl-tabs' },
        tabs.map((t) =>
          h(
            'button',
            {
              key: t.id,
              type: 'button',
              className: 'pl-tab' + (props.tab === t.id ? ' is-active' : ''),
              onClick: () => props.onTab(t.id),
            },
            t.label
          )
        )
      ),
      h(
        'div',
        { className: 'pl-topstats' },
        h('div', null, '累计答题', h('b', null, stats.attempts)),
        h('div', null, '正确率', h('b', null, stats.rate === null ? '—' : Math.round(stats.rate * 100) + '%')),
        h('div', null, '待复习', h('b', null, stats.wrongLeft))
      )
    ),
    h('div', { className: 'pl-scroll' }, h('div', { className: 'pl-wrap' }, content))
  );
}
