const CSS = `
.pl-root {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-bg-base);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  font-size: 13px;
  line-height: 1.62;
  -webkit-font-smoothing: antialiased;
}
.pl-root * { box-sizing: border-box; }
.pl-page { height: 100%; min-height: 0; display: flex; flex-direction: column; position: relative; }
.pl-top {
  flex: none; display: flex; align-items: center; gap: 16px;
  padding: 12px 22px; border-bottom: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1); flex-wrap: wrap;
}
.pl-brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
.pl-brand-mark {
  width: 34px; height: 34px; border-radius: 10px; flex: none;
  display: grid; place-items: center; color: var(--dsw-alias-brand-primary);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent);
}
.pl-brand h1 { margin: 0; font-size: 15px; font-weight: 650; letter-spacing: .01em; }
.pl-brand p { margin: 0; font-size: 11px; color: var(--dsw-alias-label-secondary); }
.pl-tabs {
  display: flex; gap: 3px; padding: 3px; margin-left: auto;
  border-radius: 9px; background: var(--dsw-alias-bg-layer-2);
}
.pl-tab {
  padding: 5px 13px; border: 0; border-radius: 7px; background: transparent;
  color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; cursor: pointer;
  transition: background .15s, color .15s;
}
.pl-tab:hover { color: var(--dsw-alias-label-primary); }
.pl-tab.is-active {
  background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary);
  font-weight: 600; box-shadow: 0 1px 2px rgba(0, 0, 0, .08);
}
.pl-topstats { display: flex; gap: 14px; align-items: center; font-size: 11px; color: var(--dsw-alias-label-secondary); }
.pl-topstats b { display: block; font-size: 14px; color: var(--dsw-alias-label-primary); font-variant-numeric: tabular-nums; }
.pl-scroll { flex: 1; min-height: 0; overflow: auto; padding: 22px; }
.pl-wrap { max-width: 1120px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px; }
.pl-card {
  background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 12px; padding: 16px; min-width: 0;
}
.pl-card-tight { padding: 12px 14px; }
.pl-h2 { margin: 0; font-size: 14px; font-weight: 650; }
.pl-h3 { margin: 0; font-size: 13px; font-weight: 600; }
.pl-sub { margin: 2px 0 0; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
.pl-muted { color: var(--dsw-alias-label-secondary); }
.pl-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.pl-row-between { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.pl-grow { flex: 1; min-width: 0; }
.pl-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; }
.pl-num { font-variant-numeric: tabular-nums; }

.pl-hero {
  position: relative; overflow: hidden; border-radius: 14px; padding: 22px;
  border: 1px solid var(--dsw-alias-border-l1);
  background:
    radial-gradient(120% 140% at 100% 0%, color-mix(in srgb, var(--dsw-alias-brand-primary) 16%, transparent), transparent 55%),
    var(--dsw-alias-bg-layer-1);
}
.pl-hero-grid { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(220px, 1fr); gap: 20px; align-items: center; }
.pl-kicker {
  display: inline-flex; align-items: center; gap: 6px; font-size: 10.5px; font-weight: 700;
  letter-spacing: .12em; color: var(--dsw-alias-brand-primary); text-transform: uppercase;
}
.pl-hero h2 { margin: 8px 0 6px; font-size: 21px; line-height: 1.35; font-weight: 700; letter-spacing: -.01em; }
.pl-hero p { margin: 0; color: var(--dsw-alias-label-secondary); max-width: 52ch; }
.pl-start-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
.pl-scope { margin-top: 16px; padding-top: 12px; border-top: 1px dashed var(--dsw-alias-border-l1); }
.pl-scope-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.pl-scope-title { font-size: 10.5px; font-weight: 700; letter-spacing: .08em; color: var(--dsw-alias-label-secondary); }
.pl-scope-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.pl-scope-chip {
  display: inline-flex; align-items: center; gap: 6px; height: 27px; padding: 0 8px 0 5px;
  max-width: 190px; border-radius: 7px; border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-secondary);
  font: inherit; font-size: 11.5px; cursor: pointer;
  transition: border-color .15s, background .15s, color .15s;
}
.pl-scope-chip:hover { border-color: var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); }
.pl-scope-chip.is-on {
  border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, transparent);
  color: var(--dsw-alias-label-primary);
}
.pl-scope-dot { width: 19px; height: 19px; border-radius: 5px; display: grid; place-items: center; font-size: 10.5px; font-weight: 700; flex: none; }
.pl-scope-chip:not(.is-on) .pl-scope-dot { opacity: .45; filter: grayscale(1); }
.pl-scope-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pl-scope-check { width: 10px; text-align: center; font-size: 10px; font-weight: 700; color: var(--dsw-alias-brand-primary); }
.pl-hero-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.pl-stat {
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; padding: 10px 12px;
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-2) 70%, transparent);
}
.pl-stat span { display: block; font-size: 11px; color: var(--dsw-alias-label-secondary); }
.pl-stat b { font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; }
.pl-stat small { font-size: 11px; color: var(--dsw-alias-label-secondary); }

.pl-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 32px; padding: 0 14px; border-radius: 8px; cursor: pointer;
  border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary); font: inherit; font-size: 12.5px; font-weight: 500;
  transition: background .15s, border-color .15s, opacity .15s;
}
.pl-btn:hover { background: var(--dsw-alias-bg-layer-2); }
.pl-btn:disabled { opacity: .45; cursor: not-allowed; }
.pl-btn-primary { background: var(--dsw-alias-brand-primary); border-color: transparent; color: #fff; font-weight: 600; }
.pl-btn-primary:hover { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 88%, #000); }
.pl-btn-ghost { background: transparent; border-color: transparent; color: var(--dsw-alias-label-secondary); padding: 0 8px; }
.pl-btn-ghost:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2); }
.pl-btn-sm { height: 27px; padding: 0 10px; font-size: 11.5px; }
.pl-btn-danger { color: var(--dsw-alias-state-error-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 40%, transparent); }

.pl-chip {
  display: inline-flex; align-items: center; gap: 5px; height: 21px; padding: 0 8px;
  border-radius: 6px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary);
  font-size: 11px; white-space: nowrap;
}
.pl-chip-brand { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent); color: var(--dsw-alias-brand-primary); }
.pl-chip-success { background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 13%, transparent); color: var(--dsw-alias-state-success-primary); }
.pl-chip-warn { background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 14%, transparent); color: var(--dsw-alias-state-warn-primary); }
.pl-chip-error { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent); color: var(--dsw-alias-state-error-primary); }

.pl-badge {
  width: 34px; height: 34px; border-radius: 10px; flex: none;
  display: grid; place-items: center; font-size: 14px; font-weight: 700;
}
.pl-badge-sm { width: 26px; height: 26px; border-radius: 8px; font-size: 12px; }
.pl-acc-brand { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 13%, transparent); color: var(--dsw-alias-brand-primary); }
.pl-acc-success { background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 14%, transparent); color: var(--dsw-alias-state-success-primary); }
.pl-acc-warn { background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 15%, transparent); color: var(--dsw-alias-state-warn-primary); }
.pl-acc-error { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 13%, transparent); color: var(--dsw-alias-state-error-primary); }
.pl-acc-idle { background: color-mix(in srgb, var(--dsw-alias-state-idle-primary) 18%, transparent); color: var(--dsw-alias-state-idle-primary); }

.pl-exps { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; }
.pl-exp-card { display: flex; flex-direction: column; gap: 12px; }
.pl-exp-head { display: flex; align-items: center; gap: 10px; }
.pl-exp-head h3 { margin: 0; font-size: 13.5px; font-weight: 650; }
.pl-exp-head p { margin: 0; font-size: 11px; color: var(--dsw-alias-label-secondary); }
.pl-dim-list { display: flex; flex-direction: column; gap: 6px; }
.pl-dim-row {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 7px 9px; border-radius: 8px; border: 1px solid transparent;
  background: var(--dsw-alias-bg-base); color: inherit; font: inherit; font-size: 12px;
  cursor: pointer; text-align: left; transition: border-color .15s, background .15s;
}
.pl-dim-row:hover { border-color: var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-2); }
.pl-dim-row .pl-dim-name { flex: none; width: 52px; font-weight: 500; }
.pl-dim-row .pl-dim-count { flex: none; width: 48px; text-align: right; font-size: 11px; color: var(--dsw-alias-label-secondary); }
.pl-bar { flex: 1; height: 5px; border-radius: 99px; background: var(--dsw-alias-bg-layer-2); overflow: hidden; min-width: 40px; }
.pl-bar > i { display: block; height: 100%; border-radius: 99px; background: var(--dsw-alias-brand-primary); transition: width .35s ease; }

.pl-weak-list { display: flex; flex-direction: column; gap: 8px; }
.pl-weak-row {
  display: flex; align-items: center; gap: 12px; padding: 9px 12px;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 9px;
  background: var(--dsw-alias-bg-base);
}
.pl-weak-row .pl-bar { max-width: 160px; }
.pl-weak-row .pl-bar > i { background: var(--dsw-alias-state-warn-primary); }

.pl-test-head {
  flex: none; display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  padding: 10px 22px; border-bottom: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
}
.pl-test-title { font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.pl-test-meta { margin-left: auto; display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.pl-test-meta .pl-clock { font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-primary); font-weight: 600; }
.pl-progress { flex: none; height: 3px; background: var(--dsw-alias-bg-layer-2); }
.pl-progress > i { display: block; height: 100%; background: var(--dsw-alias-brand-primary); transition: width .25s ease; }
.pl-test-body { padding: 20px 22px 32px; }
.pl-test-grid { max-width: 1080px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1fr) 208px; gap: 18px; align-items: start; }
.pl-qcard { padding: 20px; }
.pl-qmeta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.pl-qstem { font-size: 15px; line-height: 1.7; font-weight: 500; margin: 0 0 16px; white-space: pre-wrap; }
.pl-options { display: flex; flex-direction: column; gap: 8px; }
.pl-option {
  display: flex; align-items: flex-start; gap: 10px; width: 100%; text-align: left;
  padding: 10px 12px; border-radius: 9px; border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-base); color: inherit; font: inherit; font-size: 13px; line-height: 1.55;
  cursor: pointer; transition: border-color .15s, background .15s;
}
.pl-option:hover { border-color: var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-2); }
.pl-option.is-selected {
  border-color: var(--dsw-alias-brand-primary);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 11%, transparent);
  box-shadow: inset 0 0 0 1px var(--dsw-alias-brand-primary);
}
.pl-option.is-correct { border-color: var(--dsw-alias-state-success-primary); background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 10%, transparent); }
.pl-option.is-wrong { border-color: var(--dsw-alias-state-error-primary); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 9%, transparent); }
.pl-option.is-dim { opacity: .62; }
.pl-option:disabled { cursor: default; }
.pl-option-key {
  flex: none; width: 22px; height: 22px; border-radius: 6px; display: grid; place-items: center;
  font-size: 11px; font-weight: 600; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary);
}
.pl-option.is-selected .pl-option-key { background: var(--dsw-alias-brand-primary); color: #fff; }
.pl-option.is-correct .pl-option-key { background: var(--dsw-alias-state-success-primary); color: #fff; }
.pl-option.is-wrong .pl-option-key { background: var(--dsw-alias-state-error-primary); color: #fff; }
.pl-option-text { padding-top: 1px; }

.pl-num-row { display: flex; align-items: stretch; gap: 8px; max-width: 420px; }
.pl-num-row input {
  flex: 1; min-width: 0; height: 40px; padding: 0 12px; border-radius: 9px;
  border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary); font: inherit; font-size: 15px; font-variant-numeric: tabular-nums;
  outline: none; transition: border-color .15s;
}
.pl-num-row input:focus { border-color: var(--dsw-alias-brand-primary); }
.pl-unit {
  display: grid; place-items: center; min-width: 52px; padding: 0 12px; border-radius: 9px;
  background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); font-size: 13px;
}

.pl-feedback { margin-top: 16px; border-radius: 10px; border: 1px solid; padding: 12px 14px; }
.pl-feedback.ok { border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 45%, transparent); background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 7%, transparent); }
.pl-feedback.bad { border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 45%, transparent); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 6%, transparent); }
.pl-feedback-title { display: flex; align-items: center; gap: 8px; font-weight: 650; font-size: 13px; }
.pl-feedback.ok .pl-feedback-title { color: var(--dsw-alias-state-success-primary); }
.pl-feedback.bad .pl-feedback-title { color: var(--dsw-alias-state-error-primary); }
.pl-answerline { margin-top: 4px; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.pl-explain { margin-top: 10px; font-size: 12.5px; line-height: 1.72; }
.pl-explain p { margin: 0 0 6px; }
.pl-explain p:last-child { margin-bottom: 0; }
.pl-formula {
  margin-top: 10px; padding: 9px 12px; border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2); border-left: 2px solid var(--dsw-alias-brand-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px;
  color: var(--dsw-alias-label-primary); white-space: pre-wrap; overflow-x: auto;
}
.pl-tip {
  margin-top: 9px; padding: 8px 11px; border-radius: 8px; font-size: 12px;
  color: var(--dsw-alias-label-secondary);
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 9%, transparent);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary) 24%, transparent);
}
.pl-tip b { color: var(--dsw-alias-state-warn-primary); font-weight: 600; }
.pl-qfooter { display: flex; align-items: center; gap: 10px; margin-top: 18px; flex-wrap: wrap; }
.pl-qfooter .pl-spacer { flex: 1; }

.pl-sheet { position: sticky; top: 0; padding: 14px; }
.pl-sheet-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-top: 10px; }
.pl-sheet-dot {
  height: 30px; border-radius: 7px; border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-secondary);
  font: inherit; font-size: 11.5px; font-variant-numeric: tabular-nums; cursor: pointer;
  display: grid; place-items: center; transition: all .15s;
}
.pl-sheet-dot:hover { border-color: var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); }
.pl-sheet-dot.is-current { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); font-weight: 700; }
.pl-sheet-dot.is-ok { background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 15%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 45%, transparent); color: var(--dsw-alias-state-success-primary); }
.pl-sheet-dot.is-bad { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 13%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 42%, transparent); color: var(--dsw-alias-state-error-primary); }
.pl-sheet-legend { display: flex; flex-direction: column; gap: 5px; margin-top: 12px; font-size: 11px; color: var(--dsw-alias-label-secondary); }
.pl-sheet-legend span { display: flex; align-items: center; gap: 6px; }
.pl-dot { width: 9px; height: 9px; border-radius: 3px; display: inline-block; }

.pl-result-hero { display: flex; align-items: center; gap: 26px; flex-wrap: wrap; padding: 22px; }
.pl-score { font-size: 40px; font-weight: 750; line-height: 1; font-variant-numeric: tabular-nums; letter-spacing: -.02em; }
.pl-score small { font-size: 16px; font-weight: 500; color: var(--dsw-alias-label-secondary); margin-left: 4px; }
.pl-score-label { font-size: 12px; color: var(--dsw-alias-label-secondary); margin-top: 6px; }
.pl-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.pl-stat-row { display: flex; align-items: center; gap: 10px; margin-top: 9px; font-size: 12px; }
.pl-stat-row .pl-stat-name { width: 92px; flex: none; }
.pl-stat-row .pl-bar { flex: 1; }
.pl-stat-row .pl-stat-val { width: 46px; text-align: right; flex: none; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }

.pl-wrong-item { border: 1px solid var(--dsw-alias-border-l1); border-radius: 9px; overflow: hidden; background: var(--dsw-alias-bg-base); }
.pl-wrong-head { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; cursor: pointer; }
.pl-wrong-head:hover { background: var(--dsw-alias-bg-layer-2); }
.pl-wrong-stem { flex: 1; min-width: 0; font-size: 12.5px; line-height: 1.55; }
.pl-wrong-body { padding: 0 12px 12px; border-top: 1px solid var(--dsw-alias-border-l1); }
.pl-chevron { flex: none; color: var(--dsw-alias-label-secondary); font-size: 11px; margin-top: 2px; }

.pl-cheat { display: flex; flex-direction: column; gap: 10px; }
.pl-cheat-card { padding: 0; overflow: hidden; }
.pl-cheat-head {
  display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 14px;
  background: transparent; border: 0; color: inherit; font: inherit; cursor: pointer; text-align: left;
}
.pl-cheat-head:hover { background: color-mix(in srgb, var(--dsw-alias-bg-layer-2) 60%, transparent); }
.pl-cheat-body { padding: 0 16px 16px 16px; display: flex; flex-direction: column; gap: 14px; }
.pl-cheat-section-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.pl-cheat-section-head h4 { flex: 1; min-width: 0; margin: 0; font-size: 12.5px; font-weight: 650; color: var(--dsw-alias-brand-primary); }
.pl-ai-btn {
  flex: none; height: 23px; padding: 0 8px; font-size: 10.5px; color: var(--dsw-alias-brand-primary);
  border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 30%, transparent);
  background: transparent;
}
.pl-ai-btn:hover { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent); }
.pl-cheat-section ul { margin: 0; padding-left: 18px; }
.pl-cheat-section li { margin: 3px 0; font-size: 12.5px; color: var(--dsw-alias-label-primary); }
.pl-cheat-formulas {
  margin-top: 8px; padding: 8px 11px; border-radius: 8px; background: var(--dsw-alias-bg-layer-2);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11.5px;
  white-space: pre-wrap; color: var(--dsw-alias-label-primary); line-height: 1.75;
}

.pl-calc {
  position: absolute; right: 22px; bottom: 22px; width: 300px; z-index: 30;
  background: var(--dsw-alias-bg-overlay); border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 14px; padding: 12px; box-shadow: 0 16px 40px rgba(0, 0, 0, .22);
  animation: plIn .16s ease-out;
}
.pl-calc-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.pl-calc-head b { font-size: 12px; font-weight: 650; }
.pl-calc-input {
  width: 100%; height: 38px; border-radius: 9px; border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary);
  padding: 0 10px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px; outline: none;
}
.pl-calc-input:focus { border-color: var(--dsw-alias-brand-primary); }
.pl-calc-out {
  min-height: 26px; margin: 6px 2px 10px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 16px; font-weight: 600; text-align: right; color: var(--dsw-alias-brand-primary);
  overflow-x: auto; white-space: nowrap;
}
.pl-calc-out.is-error { font-size: 12px; font-weight: 500; color: var(--dsw-alias-state-error-primary); }
.pl-calc-keys { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
.pl-calc-key {
  height: 32px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary);
  font: inherit; font-size: 12.5px; cursor: pointer; transition: background .12s;
  display: grid; place-items: center;
}
.pl-calc-key:hover { background: var(--dsw-alias-bg-layer-2); }
.pl-calc-key.fn { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.pl-calc-key.op { background: var(--dsw-alias-bg-layer-2); }
.pl-calc-key.eq { background: var(--dsw-alias-brand-primary); color: #fff; border-color: transparent; font-weight: 700; }
.pl-calc-note { margin-top: 8px; font-size: 10.5px; color: var(--dsw-alias-label-secondary); line-height: 1.5; }

.pl-empty { padding: 42px 20px; text-align: center; color: var(--dsw-alias-label-secondary); }
.pl-empty b { display: block; color: var(--dsw-alias-label-primary); font-size: 14px; margin-bottom: 4px; }

.pl-ask-row {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--dsw-alias-border-l1);
}
.pl-ask-overlay {
  position: absolute; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center;
  padding: 24px; background: rgba(0, 0, 0, .42);
}
.pl-ask {
  width: 100%; max-width: 620px; max-height: 86%; overflow: auto;
  background: var(--dsw-alias-bg-overlay); border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 14px; padding: 18px; box-shadow: 0 24px 70px rgba(0, 0, 0, .35);
  animation: plIn .16s ease-out;
}
.pl-ask-head { display: flex; align-items: center; gap: 10px; }
.pl-ask-context {
  display: flex; flex-direction: column; gap: 4px; margin-top: 12px; padding: 10px 12px;
  border-radius: 9px; background: var(--dsw-alias-bg-base); border: 1px solid var(--dsw-alias-border-l1);
  font-size: 12px; line-height: 1.55;
}
.pl-ask-label { margin-top: 14px; font-size: 12px; font-weight: 600; }
.pl-ask-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.pl-ask-chip {
  height: 26px; padding: 0 10px; border-radius: 7px; cursor: pointer;
  border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-secondary); font: inherit; font-size: 11.5px;
  transition: border-color .15s, color .15s;
}
.pl-ask-chip:hover { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }
.pl-ask textarea {
  width: 100%; min-height: 76px; margin-top: 8px; padding: 10px 12px; resize: vertical;
  border-radius: 9px; border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary);
  font: inherit; font-size: 13px; line-height: 1.6; outline: none;
}
.pl-ask textarea:focus { border-color: var(--dsw-alias-brand-primary); }
.pl-ask-note { margin: 10px 0 0; font-size: 11px; line-height: 1.55; color: var(--dsw-alias-label-secondary); }
.pl-ask-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
.pl-ask-error { margin-top: 8px; font-size: 12px; color: var(--dsw-alias-state-error-primary); }
.pl-ask-ok { margin-top: 8px; font-size: 12px; color: var(--dsw-alias-state-success-primary); }

.pl-add-card {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  min-height: 178px; text-align: center; cursor: pointer;
  border-style: dashed; border-color: var(--dsw-alias-border-l2);
  background: transparent; transition: border-color .15s, background .15s;
}
.pl-add-card:hover { border-color: var(--dsw-alias-brand-primary); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 5%, transparent); }
.pl-add-card:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.pl-add-card h3 { margin: 0; font-size: 13.5px; font-weight: 650; }
.pl-add-card p { margin: 0; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
.pl-add-icon {
  width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center;
  font-size: 22px; font-weight: 300; color: var(--dsw-alias-brand-primary);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent);
}
.pl-icon-btn {
  width: 24px; height: 24px; border-radius: 7px; border: 1px solid transparent; background: transparent;
  color: var(--dsw-alias-label-secondary); font: inherit; font-size: 14px; line-height: 1; cursor: pointer;
}
.pl-icon-btn:hover { color: var(--dsw-alias-state-error-primary); border-color: var(--dsw-alias-border-l1); }

.pl-upload { max-width: 640px; }
.pl-upload-tabs { display: flex; gap: 6px; margin: 14px 0 10px; }
.pl-drop {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  min-height: 130px; padding: 16px; border-radius: 10px; cursor: pointer;
  border: 1px dashed var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-base);
  text-align: center; transition: border-color .15s, background .15s;
}
.pl-drop:hover { border-color: var(--dsw-alias-brand-primary); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 5%, transparent); }
.pl-drop b { font-size: 13px; font-weight: 600; word-break: break-all; }
.pl-drop-icon { font-size: 20px; color: var(--dsw-alias-brand-primary); }
.pl-upload-text {
  width: 100%; min-height: 150px; padding: 10px 12px; resize: vertical;
  border-radius: 9px; border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary);
  font: inherit; font-size: 12.5px; line-height: 1.6; outline: none;
}
.pl-upload-text:focus { border-color: var(--dsw-alias-brand-primary); }
.pl-upload-name {
  width: 100%; height: 34px; margin-top: 10px; padding: 0 10px; border-radius: 9px;
  border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary); font: inherit; font-size: 12.5px; outline: none;
}
.pl-upload-name:focus { border-color: var(--dsw-alias-brand-primary); }
.pl-upload-working { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 26px 10px 8px; text-align: center; }
.pl-upload-working b { font-size: 14px; }
.pl-spinner {
  width: 30px; height: 30px; border-radius: 50%;
  border: 3px solid var(--dsw-alias-bg-layer-2); border-top-color: var(--dsw-alias-brand-primary);
  animation: plSpin .9s linear infinite;
}
.pl-upload-ok {
  width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center;
  font-size: 20px; font-weight: 700;
  color: var(--dsw-alias-state-success-primary);
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 14%, transparent);
}
@keyframes plSpin { to { transform: rotate(360deg); } }


.pl-filter { display: flex; gap: 6px; flex-wrap: wrap; }
.pl-filter-btn {
  height: 26px; padding: 0 10px; border-radius: 7px; border: 1px solid var(--dsw-alias-border-l1);
  background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 11.5px; cursor: pointer;
}
.pl-filter-btn:hover { color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-border-l2); }
.pl-filter-btn.is-active { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-border-l2); font-weight: 600; }
.pl-anim { animation: plIn .2s ease-out; }
@keyframes plIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
.pl-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
.pl-scroll::-webkit-scrollbar-thumb { background: var(--dsw-alias-border-l2); border-radius: 6px; border: 3px solid transparent; background-clip: content-box; }
.pl-scroll::-webkit-scrollbar-track { background: transparent; }

@media (max-width: 980px) {
  .pl-hero-grid { grid-template-columns: 1fr; }
  .pl-grid2 { grid-template-columns: 1fr; }
  .pl-test-grid { grid-template-columns: 1fr; }
  .pl-sheet { position: static; order: 2; }
  .pl-calc { right: 12px; bottom: 12px; }
}
@media (max-width: 640px) {
  .pl-top { padding: 10px 14px; }
  .pl-scroll { padding: 14px; }
  .pl-tabs { margin-left: 0; width: 100%; }
  .pl-tab { flex: 1; }
  .pl-hero h2 { font-size: 18px; }
  .pl-topstats { display: none; }
}
`;
