BANK.push(
  {
    id: 'sound-rd5',
    exp: 'sound',
    dim: 'reading',
    type: 'numeric',
    stem: '图示声速测定仪的移动滑块位置由游标卡尺读出。所用游标卡尺为 50 分度（分度值 0.02 mm），主尺读数为 12 mm，游标尺第 24 条刻线与主尺刻线对齐。读数应为多少 mm？',
    figure: 'sound-apparatus.png',
    figureAlt: '声速测定仪与移动滑块',
    figureCaption: '图 1-4 声速测定仪及专用信号源',
    answer: 12.48,
    tol: 0.01,
    unit: 'mm',
    sigfig: 4,
    hint: '主尺读数 + 游标对齐格数 × 0.02 mm',
    explain:
      '50 分度游标卡尺的分度值为 0.02 mm。\n读数 = 主尺读数 + 对齐格数 × 分度值 = 12 mm + 24 × 0.02 mm = 12.48 mm。\n游标卡尺一般不需要再估读，最后一位就是 0.02 mm 的位。',
    formula: '读数 = 主尺 + n × 0.02 mm',
    tip: '50 分度是 0.02 mm，20 分度才是 0.05 mm；不要用错分度值。',
    tags: ['游标卡尺', '仪器读数', '声速'],
  }
);
