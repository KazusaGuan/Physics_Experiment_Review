/* Floating calculator with a safe expression parser (no eval). */

const CALC_KEYS = [
  { t: 'sin', v: 'sin(', cls: ' fn' },
  { t: 'cos', v: 'cos(', cls: ' fn' },
  { t: 'tan', v: 'tan(', cls: ' fn' },
  { t: '√', v: 'sqrt(', cls: ' fn' },
  { t: '⌫', act: 'back', cls: ' fn' },

  { t: '7', v: '7' },
  { t: '8', v: '8' },
  { t: '9', v: '9' },
  { t: '÷', v: '÷', cls: ' op' },
  { t: 'C', act: 'clear', cls: ' fn' },

  { t: '4', v: '4' },
  { t: '5', v: '5' },
  { t: '6', v: '6' },
  { t: '×', v: '×', cls: ' op' },
  { t: '(', v: '(' },

  { t: '1', v: '1' },
  { t: '2', v: '2' },
  { t: '3', v: '3' },
  { t: '−', v: '−', cls: ' op' },
  { t: ')', v: ')' },

  { t: '0', v: '0' },
  { t: '.', v: '.' },
  { t: 'π', v: 'π' },
  { t: '+', v: '+', cls: ' op' },
  { t: '=', act: 'eq', cls: ' eq' },

  { t: 'ln', v: 'ln(', cls: ' fn' },
  { t: 'log', v: 'log(', cls: ' fn' },
  { t: '^', v: '^', cls: ' fn' },
  { t: 'e', v: 'e', cls: ' fn' },
  { t: 'DEG', act: 'deg', cls: ' fn' },
];

function Calculator(props) {
  const [expr, setExpr] = useState('');
  const [deg, setDeg] = useState(true);

  let preview = '';
  let error = '';
  if (String(expr).trim()) {
    try {
      preview = formatNumber(calculatorEval(expr, deg));
    } catch (err) {
      error = err && err.message ? err.message : '表达式有误';
    }
  }

  function press(key) {
    if (key.act === 'clear') {
      setExpr('');
      return;
    }
    if (key.act === 'back') {
      setExpr(String(expr).slice(0, -1));
      return;
    }
    if (key.act === 'eq') {
      if (preview) setExpr(preview);
      return;
    }
    if (key.act === 'deg') {
      setDeg(!deg);
      return;
    }
    setExpr(String(expr) + key.v);
  }

  return h(
    'div',
    { className: 'pl-calc' },
    h(
      'div',
      { className: 'pl-calc-head' },
      h('b', null, '计算器'),
      h(
        'div',
        { className: 'pl-row', style: { gap: 6 } },
        h('span', { className: 'pl-chip' }, deg ? 'DEG' : 'RAD'),
        h('button', { type: 'button', className: 'pl-btn pl-btn-ghost pl-btn-sm', onClick: props.onClose }, '×')
      )
    ),
    h('input', {
      className: 'pl-calc-input',
      value: expr,
      placeholder: '如 400*cos(60)^2',
      onChange: (e) => setExpr(e.target.value),
      onKeyDown: (e) => {
        if (e.key === 'Enter') press({ act: 'eq' });
      },
    }),
    h('div', { className: 'pl-calc-out' + (error ? ' is-error' : '') }, error || preview || '0'),
    h(
      'div',
      { className: 'pl-calc-keys' },
      CALC_KEYS.map((key, i) =>
        h(
          'button',
          {
            key: i,
            type: 'button',
            className: 'pl-calc-key' + (key.cls || ''),
            onClick: () => press(key),
          },
          key.act === 'deg' ? (deg ? 'DEG' : 'RAD') : key.t
        )
      )
    ),
    h(
      'p',
      { className: 'pl-calc-note' },
      '支持 sin/cos/tan（按当前 DEG/RAD）、√、ln、log、^、π、e；按 = 把结果作为下一步输入。点击 × 关闭。'
    )
  );
}
