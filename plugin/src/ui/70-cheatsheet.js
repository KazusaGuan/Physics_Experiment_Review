/* Quick-reference handbook. */

function CheatSheet() {
  const [open, setOpen] = useState({ general: true });

  function toggle(id) {
    setOpen(Object.assign({}, open, { [id]: !open[id] }));
  }

  return h(
    React.Fragment,
    null,
    h(
      'div',
      null,
      h('h2', { className: 'pl-h2' }, '速查手册'),
      h('p', { className: 'pl-sub' }, '考前过一遍：核心公式、操作要点、易错提醒。点标题展开或收起。')
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
                    h('h4', null, section.title),
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
    )
  );
}
