/* Mistake notebook: aggregated wrong answers with drill / retire actions. */

function ReviewView(props) {
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState({});
  const all = reviewQuestions(props.store);
  const counts = {};
  all.forEach((q) => { counts[q.exp] = (counts[q.exp] || 0) + 1; });
  const list = filter === 'all' ? all : all.filter((q) => q.exp === filter);

  function toggle(id) {
    setOpen(Object.assign({}, open, { [id]: !open[id] }));
  }

  return h(
    React.Fragment,
    null,
    h(
      'div',
      { className: 'pl-row-between' },
      h(
        'div',
        null,
        h('h2', { className: 'pl-h2' }, '错题本'),
        h('p', { className: 'pl-sub' }, '答错的题自动收进来；重做答对后自动移出，也可以手动标记已掌握。')
      ),
      h(
        'div',
        { className: 'pl-row' },
        h('span', { className: 'pl-chip ' + (all.length ? 'pl-chip-error' : '') }, all.length + ' 道待复习'),
        h(
          'button',
          {
            type: 'button',
            className: 'pl-btn pl-btn-primary',
            disabled: !all.length,
            onClick: props.onWrong,
          },
          '重做全部错题'
        )
      )
    ),

    all.length
      ? h(
          'div',
          { className: 'pl-filter' },
          h(
            'button',
            {
              type: 'button',
              className: 'pl-filter-btn' + (filter === 'all' ? ' is-active' : ''),
              onClick: () => setFilter('all'),
            },
            '全部 ' + all.length
          ),
          allExps().map((exp) =>
            h(
              'button',
              {
                key: exp.id,
                type: 'button',
                className: 'pl-filter-btn' + (filter === exp.id ? ' is-active' : ''),
                onClick: () => setFilter(exp.id),
              },
              exp.short + ' ' + (counts[exp.id] || 0)
            )
          )
        )
      : null,

    list.length
      ? h(
          'div',
          { className: 'pl-cheat' },
          list.map((q) => {
            const rec = props.store.q[q.id] || { w: 0 };
            return h(QuestionReview, {
              key: q.id,
              q,
              selected: undefined,
              expanded: !!open[q.id],
              onToggle: () => toggle(q.id),
              extra: '错 ' + (rec.w || 1) + ' 次',
              actions: h(
                React.Fragment,
                null,
                h(
                  'button',
                  { type: 'button', className: 'pl-btn pl-btn-sm', onClick: () => props.onPractice([q.id]) },
                  '单独练这道'
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'pl-btn pl-btn-sm pl-btn-danger',
                    onClick: () => props.onRemove(q.id),
                  },
                  '标记已掌握'
                )
              ),
            });
          })
        )
      : h(
          'div',
          { className: 'pl-card pl-empty' },
          h('b', null, all.length ? '这个实验没有错题' : '错题本是空的'),
          h(
            'span',
            null,
            all.length
              ? '换个实验看看，或者开始新一轮模拟测试。'
              : '做一轮模拟测试，答错的题会自动收集到这里，并保留完整解析。'
          )
        )
  );
}
