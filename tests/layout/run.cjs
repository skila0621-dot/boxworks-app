#!/usr/bin/env node
// 자동 정렬 점검(대표 상시 규칙 11/4 22:59, 결정 기록 D-27). 시험판을 내기 전에 매번 돌린다. 하나라도 걸리면 내지 않는다
//   node tests/layout/run.cjs                      폭 360 · 384 · 412 × 라이트 · 다크, 모든 화면
//   node tests/layout/run.cjs --only 홈 --widths 384 --themes light
//   node tests/layout/run.cjs --snap DIR           (덧칠 정리용) 화면마다 사진 · 계산된 모양을 DIR에 남긴다. 비교: compare.cjs A B
//   --clocks 12,24(기본): 시각 표시 오전 · 오후와 24시간 둘 다(시험판 58). 24시간 결과는 <폭>-<테마>-24/
// 걸린 것: tests/layout/out/report.json · 사진 tests/layout/out/<폭>-<테마>/
const { fork } = require('child_process');
const fs = require('fs');
const path = require('path');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const OUT = path.resolve(arg('out', path.join(__dirname, 'out')));
const GATE = ['tap', 'cover', 'cut', 'col', 'colx', 'nan', 'icon', 'gap', 'ink', 'midword', 'time24', 'time12', 'comp', 'fit', 'mid', 'lab', 'error'];

if (process.argv[2] === '--worker') {
  const W = +process.argv[3], theme = process.argv[4], clock = process.argv[5] === '24' ? '24' : '12', snapDir = arg('snap', ''), only = arg('only', ''), shots = arg('shots', '1') === '1';
  const audit = require('./checks.js'), scenario = require('./scenario.cjs');
  const sub = W + '-' + theme + (clock === '24' ? '-24' : '');
  const dir = snapDir ? path.join(snapDir, sub) : path.join(OUT, sub);
  fs.mkdirSync(dir, { recursive: true });
  const res = { W, theme, clock, states: {}, fails: [] };
  let idx = 0;
  const run = (p, o) => p.evaluate('(' + audit.toString() + ')(' + JSON.stringify(o || {}) + ')');
  // 계산된 모양(덧칠 정리 전후 비교용): 보이는 요소마다 자리 · 크기 · 글자 · 색
  const digest = p => p.evaluate(() => {
    const keys = ['display', 'position', 'color', 'backgroundColor', 'fontSize', 'fontWeight', 'lineHeight', 'borderTopWidth', 'borderBottomWidth', 'borderTopColor', 'borderRadius', 'boxShadow', 'opacity', 'textAlign', 'paddingLeft', 'paddingTop'];
    const out = [];
    // 보이는 요소마다: 자리 · 크기 + 모양에 드는 속성 거의 모두(위 16개는 읽기 쉽게 따로, 나머지는 한 줄 지문). 가상 요소(::before · ::after)도
    const more = ['top', 'right', 'bottom', 'left', 'zIndex', 'boxSizing', 'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingRight', 'paddingBottom',
      'borderLeftWidth', 'borderRightWidth', 'borderTopStyle', 'borderBottomStyle', 'borderLeftStyle', 'borderRightStyle', 'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'borderTopLeftRadius', 'borderBottomRightRadius',
      'backgroundImage', 'backgroundSize', 'backgroundPosition', 'visibility', 'overflowX', 'overflowY', 'fontFamily', 'fontStyle', 'letterSpacing', 'textDecorationLine', 'textDecorationColor', 'textTransform', 'whiteSpace', 'wordBreak', 'overflowWrap', 'textOverflow', 'verticalAlign',
      'flexDirection', 'flexWrap', 'flexGrow', 'flexShrink', 'flexBasis', 'gridTemplateColumns', 'gridTemplateRows', 'gridColumnStart', 'gridColumnEnd', 'gridRowStart', 'rowGap', 'columnGap', 'alignItems', 'alignContent', 'justifyContent', 'alignSelf', 'justifySelf', 'justifyItems', 'order',
      'transform', 'transformOrigin', 'transitionProperty', 'transitionDuration', 'animationName', 'animationDuration', 'pointerEvents', 'cursor', 'userSelect', 'fill', 'stroke', 'strokeWidth', 'filter', 'backdropFilter', 'outlineStyle', 'outlineWidth', 'outlineColor', 'outlineOffset',
      'listStyleType', 'objectFit', 'clipPath', 'maskImage', 'webkitLineClamp', 'textIndent', 'caretColor', 'accentColor', 'appearance', 'touchAction', 'scrollSnapType', 'contain', 'isolation', 'mixBlendMode', 'content'];
    const hash = t => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
    const fp = s => hash(more.map(k => s[k]).join(';') + '|' + keys.map(k => s[k]).join(';'));
    for (const e of document.body.querySelectorAll('*')) {
      if (e.closest('script,style,template')) continue;
      const r = e.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) continue;
      const s = getComputedStyle(e);
      const pb = getComputedStyle(e, '::before'), pa = getComputedStyle(e, '::after');
      const ps = (pb.content !== 'none' && pb.content !== 'normal' ? fp(pb) : '') + '/' + (pa.content !== 'none' && pa.content !== 'normal' ? fp(pa) : '');
      out.push(e.tagName + '|' + (typeof e.className === 'string' ? e.className : '') + '|' + [r.left, r.top, r.width, r.height].map(v => Math.round(v * 2) / 2).join(',') + '|' + keys.map(k => s[k]).join(';') + '|' + fp(s) + '|' + ps);
    }
    return out;
  });
  const scrollers = p => p.evaluate(() => {
    const list = [];
    for (const e of document.querySelectorAll('*')) { const s = getComputedStyle(e); if (/(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 4 && e.getBoundingClientRect().height > 40) list.push(e); }
    const d = document.scrollingElement; if (d.scrollHeight > innerHeight + 4) list.push(d);
    window.__bxSc = list; return list.length;
  });
  const state = async (label, p) => {
    const nm = String(++idx).padStart(2, '0') + '_' + label.replace(/[\s/·:()›]+/g, '_');
    const rec = res.states[nm] = { issues: [] };
    const add = (xs, where) => xs.forEach(x => rec.issues.push(Object.assign({ at: where }, x)));
    // 정리 전후 비교: 움직임(깜박임 · 호흡 원 · 넘어가기)을 멈춰서 찍는다(같은 판을 두 번 찍어도 같게)
    if (snapDir) await p.evaluate(() => { if (!document.getElementById('bx-snap-still')) { const s = document.createElement('style'); s.id = 'bx-snap-still'; s.textContent = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'; document.documentElement.appendChild(s); } });
    if (snapDir) { rec.top = await digest(p); await p.screenshot({ path: path.join(dir, nm + '.png') }); }
    else { add(await run(p, { top: true }), '위'); if (shots) await p.screenshot({ path: path.join(dir, nm + '.png') }); }
    // 내려 보며 아래쪽까지, 맨 아래에서 떠 있는 것이 가리는지
    const n = await scrollers(p);
    if (n) {
      for (let k = 1; k <= 6; k++) {
        const more = await p.evaluate(() => { let m = false; for (const e of window.__bxSc) { const b = e.scrollTop, step = (e === document.scrollingElement ? innerHeight : e.clientHeight) - 80; e.scrollTop = b + step; if (e.scrollTop > b + 2) m = true; } return m; });
        if (!more) break;
        await p.waitForTimeout(250);
        if (!snapDir) add(await run(p, {}), '내림 ' + k);
      }
    }
    await p.waitForTimeout(200);
    if (snapDir) { rec.bottom = await digest(p); await p.screenshot({ path: path.join(dir, nm + '__bottom.png') }); }
    else { add((await run(p, { bottom: true })).filter(x => x.k === 'cover' || x.k === 'tap'), '맨 아래'); if (shots && n) await p.screenshot({ path: path.join(dir, nm + '__bottom.png') }); }
    await p.evaluate(() => { for (const e of window.__bxSc || []) e.scrollTop = 0; });
    await p.waitForTimeout(150);
  };
  const fail = (label, msg) => { res.fails.push({ label, msg }); };
  scenario({ W, theme, state, fail, only, clock }).then(errs => {
    res.errors = errs || [];
    fs.writeFileSync(path.join(dir, 'result.json'), JSON.stringify(res));
    process.exit(0);
  }).catch(e => { res.fails.push({ label: '시나리오', msg: String(e && e.stack || e).slice(0, 400) }); fs.writeFileSync(path.join(dir, 'result.json'), JSON.stringify(res)); process.exit(0); });
} else {
  const widths = arg('widths', '360,384,412').split(',').map(Number), themes = arg('themes', 'light,dark').split(','), snap = arg('snap', '');
  // 덧칠 정리 사진(--snap)은 오전 · 오후만. 점검은 둘 다(시각 칸 폭 · 오전 · 오후가 남은 글을 24시간에서도 잰다)
  const clocks = arg('clocks', snap ? '12' : '12,24').split(',').filter(x => x === '12' || x === '24');
  const combos = []; clocks.forEach(k => widths.forEach(w => themes.forEach(t => combos.push([w, t, k]))));
  const t0 = Date.now();
  if (!snap) fs.rmSync(OUT, { recursive: true, force: true });
  const flags = ['--widths', '--themes', '--clocks'];
  const pass = process.argv.slice(2).filter((x, i, a) => !flags.includes(a[i - 1]) && !flags.includes(x));
  const runOne = ([w, t, k]) => new Promise(ok => { const c = fork(__filename, ['--worker', String(w), t, k].concat(pass), { stdio: 'inherit' }); c.on('exit', ok); });
  // 시각 표시마다 한 묶음씩(한꺼번에 12개를 띄우면 CI가 느려져 흔들림)
  clocks.reduce((q, k) => q.then(() => Promise.all(combos.filter(x => x[2] === k).map(runOne))), Promise.resolve()).then(() => {
    if (snap) { console.log('사진 · 모양을 남김: ' + snap + ' (' + Math.round((Date.now() - t0) / 1000) + '초)'); return; }
    const allow = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'allow.json'), 'utf8')); } catch (e) { return []; } })();
    const ok = x => allow.some(a => a.k === x.k && (!a.p || new RegExp(a.p).test(x.p || '')) && (!a.t || new RegExp(a.t).test(x.t || '')));
    const uniq = new Map(); let screens = 0;
    for (const [w, t, k] of combos) {
      const sub = w + '-' + t + (k === '24' ? '-24' : ''), wt = w + t[0] + (k === '24' ? '·24' : '');
      let r; try { r = JSON.parse(fs.readFileSync(path.join(OUT, sub, 'result.json'), 'utf8')); } catch (e) { r = { states: {}, fails: [{ label: '결과 없음', msg: '' }] }; }
      for (const f of r.fails) uniq.set('error|' + f.label, { k: 'error', p: f.label, t: f.msg, where: [wt] });
      (r.errors || []).forEach(m => uniq.set('error|js|' + m, { k: 'error', p: '화면 오류', t: m, where: [wt] }));
      for (const [nm, s] of Object.entries(r.states)) {
        screens++;
        for (const x of s.issues) {
          if (!GATE.includes(x.k) || ok(x)) continue;
          const key = x.k + '|' + x.p + '|' + (x.why || '') + '|' + x.t;
          const e = uniq.get(key) || Object.assign({}, x, { where: [] }); const tag = wt + ' ' + nm.slice(0, 2);
          if (!e.where.includes(tag)) e.where.push(tag); uniq.set(key, e);
        }
      }
    }
    const list = Array.from(uniq.values());
    const cnt = {}; list.forEach(x => { cnt[x.k] = (cnt[x.k] || 0) + 1; });
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ at: new Date().toISOString(), combos, screens, count: cnt, issues: list }, null, 1));
    console.log('화면 ' + screens + '장(폭 ' + widths.join(' · ') + ' × ' + themes.join(' · ') + ' × 시각 ' + clocks.map(k => k === '24' ? '24시간' : '오전 · 오후').join(' · ') + ') · ' + Math.round((Date.now() - t0) / 1000) + '초');
    if (!list.length) { console.log('통과: 걸린 것 없음'); process.exit(0); }
    console.log('걸린 것 ' + list.length + '가지 ' + JSON.stringify(cnt));
    list.slice(0, 80).forEach(x => console.log(' · ' + x.k + (x.why ? '(' + x.why + ')' : '') + '  ' + String(x.t || '').slice(0, 40) + '  — ' + String(x.p || '').slice(-80) + '  [' + x.where.slice(0, 4).join(', ') + (x.where.length > 4 ? ' 외 ' + (x.where.length - 4) : '') + ']'));
    process.exit(1);
  });
}
