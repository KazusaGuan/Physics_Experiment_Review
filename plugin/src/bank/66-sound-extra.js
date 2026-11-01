BANK.push(
  {
    id: 'sound-rd5',
    exp: 'sound',
    dim: 'reading',
    type: 'single',
    stem: '图示为声速测定仪。移动接收换能器 S2 时，用来读取其位置的是哪种量具？',
    figure: 'sound-apparatus.png',
    figureAlt: '声速测定仪与移动滑块',
    figureCaption: '图 1-4 声速测定仪及专用信号源',
    options: ['游标卡尺', '螺旋测微器', '钢直尺', '千分表'],
    answer: 0,
    figureEvidence: '仪器导轨下方装有游标卡尺，移动滑块的位置由主尺和游标读出。',
    explain:
      '声速测定仪的移动滑块上装有游标卡尺，移动 S2 时用主尺和游标读出位置。\n例如 50 分度游标卡尺分度值 0.02 mm，主尺 12 mm、游标第 24 格对齐时为 12.48 mm。\n螺旋测微器用于更小的尺寸，钢直尺精度不够。',
    formula: '游标卡尺读数 = 主尺 + n × 0.02 mm',
    tip: '50 分度游标卡尺是 0.02 mm，20 分度才是 0.05 mm。',
    tags: ['游标卡尺', '仪器识别', '声速'],
  }
);
