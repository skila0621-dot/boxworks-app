#!/usr/bin/env node
// 단추 · 글자 모으기(대표 11/5 01:30 '글자와 간격의 공통 기준 · 단추를 공통 부품으로'): 원인을 먼저 확인한다
//   node tests/layout/inventory.cjs [--widths 384] [--themes light] [--only 홈]
//   → tests/layout/out/inventory/<폭>-<테마>/inv.json · 처음 본 모양마다 잘라 낸 사진 s<번호>.png
// 정렬 점검(run.cjs)과 같은 화면(scenario.cjs)을 열고, 화면마다 누르는 것 · 글자의 계산된 모양을 모은다
const { fork } = require('child_process');
const fs = require('fs');
const path = require('path');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const OUT = path.resolve(arg('out', path.join(__dirname, 'out-inv')));

// 브라우저 안에서 돈다: 보이는 누르는 것(맨 위 층만) · 글자 조각
function collect(opts) {
  opts = opts || {};
  const W = innerWidth, H = innerHeight;
  const cs = e => getComputedStyle(e);
  const srOnly = e => { for (let x = e; x && x !== document.body; x = x.parentElement) { const r = x.getBoundingClientRect(); if ((r.width <= 1.5 || r.height <= 1.5) && cs(x).overflow !== 'visible') return true; if (x.classList && x.classList.contains('sr')) return true; } return false; };
  const vis = e => { const r = e.getBoundingClientRect(); if (r.width <= 0.5 || r.height <= 0.5 || r.bottom <= 0 || r.top >= H || r.right <= 0 || r.left >= W) return false; const s = cs(e); return s.visibility !== 'hidden' && +s.opacity > 0.05 && s.display !== 'contents'; };
  const hidden = e => { for (let x = e; x; x = x.parentElement) { if (x.hidden) return true; const s = cs(x); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity <= 0.05) return true; } return false; };
  const name = x => x.tagName.toLowerCase() + (x.id ? '#' + x.id : '') + (typeof x.className === 'string' && x.className.trim() ? '.' + x.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
  const pth = e => { const a = []; for (let x = e; x && x !== document.body && a.length < 4; x = x.parentElement) a.unshift(name(x)); return a.join('>'); };
  let all = Array.from(document.body.querySelectorAll('*')).filter(e => !e.closest('svg,script,style,#bx-splash,template') && vis(e) && !hidden(e));
  const big = all.filter(e => { const q = cs(e).position; if (q !== 'fixed' && q !== 'absolute') return false; const r = e.getBoundingClientRect(); return r.width * r.height >= W * H * 0.45; });
  const tp = document.elementFromPoint(W / 2, H * 0.6);
  const modal = big.filter(m => tp && (m === tp || m.contains(tp))).sort((a, b) => (a.contains(b) ? 1 : b.contains(a) ? -1 : 0))[0] || null;
  if (modal) all = all.filter(e => modal.contains(e) || (/fixed/.test(cs(e).position) && !big.includes(e) && !e.contains(modal) && +cs(e).zIndex >= +cs(modal).zIndex));
  const SEL = 'button,a[href],input:not([type=hidden]),select,textarea,[role=button],[role=switch],[role=checkbox],[role=radio],[role=tab],label[for]';
  const tapsAll = all.filter(e => e.matches(SEL) && !srOnly(e));
  const taps = tapsAll.filter(e => !tapsAll.some(o => o !== e && o.contains(e)));
  const R = r => ({ l: Math.round(r.left * 2) / 2, t: Math.round(r.top * 2) / 2, r: Math.round(r.right * 2) / 2, b: Math.round(r.bottom * 2) / 2 });
  const textBox = e => {
    const rng = document.createRange(); let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity, s = ''; const tops = new Set();
    const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) {
      if (!n.textContent.trim() || n.parentElement.closest('svg') || hidden(n.parentElement)) continue;
      rng.selectNodeContents(n);
      for (const q of rng.getClientRects()) { if (q.width < 0.5) continue; l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom); tops.add(Math.round(q.top / 4)); }
      s += n.textContent;
    }
    return l === Infinity ? null : { l, t, r, b, s: s.replace(/\s+/g, ' ').trim(), lines: tops.size };
  };
  const iconsOf = e => Array.from(e.querySelectorAll('svg,img,.bx-ic')).filter(x => !x.parentElement.closest('svg') && !hidden(x)).map(x => ({ x, q: x.getBoundingClientRect() })).filter(o => o.q.width > 2 && o.q.height > 2)
    .filter((o, i, a) => !a.some(p => p !== o && p.x.contains(o.x)) || o.x.tagName.toLowerCase() === 'svg').filter((o, i, a) => !a.some(p => p !== o && o.x.contains(p.x)));
  const own = e => { const t = Array.from(e.childNodes).filter(c => c.nodeType === 3).map(c => c.textContent).join('').replace(/\s+/g, ' ').trim(); return t; };
  const taprec = e => {
    const s = cs(e), r = e.getBoundingClientRect(), tb = textBox(e), ics = iconsOf(e);
    const icon = ics.length ? (() => { const o = ics[0]; const sv = o.x.tagName.toLowerCase() === 'svg' ? o.x : o.x.querySelector('svg'); return { w: Math.round(o.q.width * 2) / 2, h: Math.round(o.q.height * 2) / 2, l: o.q.left, r: o.q.right, t: o.q.top, b: o.q.bottom, sw: sv ? cs(sv).strokeWidth : '', n: ics.length }; })() : null;
    let gap = null;
    if (icon && tb) gap = icon.r <= tb.l + 1 ? Math.round((tb.l - icon.r) * 2) / 2 : (tb.r <= icon.l + 1 ? Math.round((icon.l - tb.r) * 2) / 2 : null);
    const cl = Math.min(tb ? tb.l : Infinity, icon ? icon.l : Infinity), cr = Math.max(tb ? tb.r : -Infinity, icon ? icon.r : -Infinity);
    const ct = Math.min(tb ? tb.t : Infinity, icon ? icon.t : Infinity), cb = Math.max(tb ? tb.b : -Infinity, icon ? icon.b : -Infinity);
    return {
      p: pth(e), tag: e.tagName.toLowerCase(), type: e.type || '', role: e.getAttribute('role') || '', cls: typeof e.className === 'string' ? e.className : '',
      act: e.getAttribute('data-act') || '', aria: e.getAttribute('aria-label') || '', dis: !!e.disabled || e.getAttribute('aria-disabled') === 'true',
      on: e.getAttribute('aria-pressed') || e.getAttribute('aria-selected') || e.getAttribute('aria-checked') || (e.classList.contains('on') ? 'on' : ''),
      text: tb ? tb.s.slice(0, 40) : '', lines: tb ? tb.lines : 0,
      box: R(r), w: Math.round(r.width * 2) / 2, h: Math.round(r.height * 2) / 2,
      fs: s.fontSize, fw: s.fontWeight, lh: s.lineHeight, ls: s.letterSpacing, ff: s.fontFamily.split(',')[0].replace(/"/g, ''),
      col: s.color, bg: s.backgroundColor, bgi: s.backgroundImage !== 'none', bd: s.borderTopWidth + ' ' + s.borderTopStyle + ' ' + s.borderTopColor, bdl: s.borderLeftWidth,
      br: s.borderTopLeftRadius, pad: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].join(' '), minh: s.minHeight, sh: s.boxShadow !== 'none',
      disp: s.display, jc: s.justifyContent, ai: s.alignItems, gapc: s.columnGap, ws: s.whiteSpace, to: s.textOverflow, pos: s.position, op: s.opacity,
      icon, gap,
      // 내용(글자 · 아이콘)이 상자 안에서 가운데에 있는지: 위아래 · 왼쪽 오른쪽 남는 폭
      sl: cl === Infinity ? null : Math.round((cl - r.left) * 2) / 2, sr: cr === -Infinity ? null : Math.round((r.right - cr) * 2) / 2,
      st: ct === Infinity ? null : Math.round((ct - r.top) * 2) / 2, sb: cb === -Infinity ? null : Math.round((r.bottom - cb) * 2) / 2,
      tdy: tb ? Math.round(((tb.t + tb.b) / 2 - (r.top + r.bottom) / 2) * 2) / 2 : null,
      idy: icon && tb ? Math.round(((icon.t + icon.b) / 2 - (tb.t + tb.b) / 2) * 2) / 2 : null
    };
  };
  const tapsOut = taps.map(taprec);
  if (opts.rules) {
    const PROPS = ['height', 'min-height', 'padding', 'padding-left', 'padding-right', 'padding-top', 'padding-bottom', 'border-radius', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'background', 'background-color', 'border', 'border-color', 'border-width', 'gap', 'column-gap', 'color', 'width', 'min-width'];
    if (!window.__bxRules) {
      const list = []; let si = 0;
      const walk = (rules, sheet, media) => { for (const ru of rules) { if (ru.cssRules && !ru.selectorText) { walk(ru.cssRules, sheet, (ru.conditionText || ru.media && ru.media.mediaText || '')); continue; } if (!ru.selectorText || !ru.style) continue; const set = PROPS.filter(k => ru.style.getPropertyValue(k)); if (set.length) list.push({ sel: ru.selectorText, set, sheet, media, imp: PROPS.some(k => ru.style.getPropertyPriority(k) === 'important') }); } };
      for (const sh of document.styleSheets) { const id = (sh.ownerNode && (sh.ownerNode.id || ('style' + (si++)))) || 'x'; try { walk(sh.cssRules, id, ''); } catch (e) {} }
      window.__bxRules = list;
    }
    const cache = new Map();
    taps.forEach((e, i) => {
      const key = tapsOut[i].p; if (cache.has(key)) { tapsOut[i].rules = cache.get(key); return; }
      const hit = []; window.__bxRules.forEach((ru, j) => { try { if (e.matches(ru.sel)) hit.push(j); } catch (x) {} });
      cache.set(key, hit); tapsOut[i].rules = hit;
    });
    return { taps: tapsOut, texts: [], fonts: {}, rules: window.__bxRulesSent ? null : (window.__bxRulesSent = 1, window.__bxRules) };
  }
  // 글자 조각: 자기 글자를 가진 요소마다(누르는 것 안 · 밖 모두)
  const texts = [];
  for (const e of all) {
    const t = own(e); if (!t) continue;
    const s = cs(e);
    texts.push({ p: pth(e), t: t.slice(0, 30), fs: s.fontSize, fw: s.fontWeight, lh: s.lineHeight, ls: s.letterSpacing, ff: s.fontFamily.split(',')[0].replace(/"/g, ''), num: s.fontVariantNumeric, inTap: !!e.closest(SEL) });
  }
  return { taps: tapsOut, texts, fonts: { status: document.fonts.status, ok: document.fonts.check('16px "BX Pretendard"') } };
}

if (process.argv[2] === '--worker') {
  const W = +process.argv[3], theme = process.argv[4], only = arg('only', '');
  const scenario = require('./scenario.cjs');
  const dir = path.join(OUT, W + '-' + theme); fs.mkdirSync(dir, { recursive: true });
  const res = { W, theme, states: {}, fails: [], shots: {} };
  const seen = new Map(); let idx = 0, shot = 0;
  const sig = x => [x.tag === 'a' ? 'a' : 'b', x.fs, x.fw, x.lh, x.ls, Math.round(x.h / 2) * 2, x.br, x.pad, x.col, x.bg, x.bgi, x.bd, x.sh, x.icon ? x.icon.w + 'x' + x.icon.h + '/' + x.icon.sw : '-', x.gap, x.gapc, x.jc].join('|');
  const grab = async (p, list) => {
    for (const x of list) {
      const k = sig(x); if (seen.has(k)) { seen.get(k).n++; continue; }
      const id = 's' + String(++shot).padStart(4, '0'); seen.set(k, { id, n: 1 });
      const pad = 8, b = x.box; const cx = Math.max(0, b.l - pad), cy = Math.max(0, b.t - pad), cw = Math.min(W, b.r + pad) - cx, ch = Math.min(1000, b.b + pad) - cy;
      if (cw > 4 && ch > 4) await p.screenshot({ path: path.join(dir, id + '.png'), clip: { x: cx, y: cy, width: cw, height: ch } }).catch(() => {});
      x.shot = id;
    }
  };
  const scrollers = p => p.evaluate(() => {
    const list = [];
    for (const e of document.querySelectorAll('*')) { const s = getComputedStyle(e); if (/(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 4 && e.getBoundingClientRect().height > 40) list.push(e); }
    const d = document.scrollingElement; if (d.scrollHeight > innerHeight + 4) list.push(d);
    window.__bxSc = list; return list.length;
  });
  const state = async (label, p) => {
    const nm = String(++idx).padStart(2, '0') + '_' + label.replace(/[\s/·:()›]+/g, '_');
    const rec = res.states[nm] = { taps: [], texts: [] };
    const take = async where => { const r = await p.evaluate('(' + collect.toString() + ')(' + JSON.stringify({ rules: arg('rules', '') === '1' }) + ')'); if (r.rules) res.rules = (res.rules || []).concat([r.rules]); r.taps.forEach(x => { x.at = where; }); await grab(p, r.taps); rec.taps.push(...r.taps); rec.texts.push(...r.texts); rec.fonts = r.fonts; };
    await take('위');
    const n = await scrollers(p);
    if (n) for (let k = 1; k <= 6; k++) {
      const more = await p.evaluate(() => { let m = false; for (const e of window.__bxSc) { const b = e.scrollTop, step = (e === document.scrollingElement ? innerHeight : e.clientHeight) - 80; e.scrollTop = b + step; if (e.scrollTop > b + 2) m = true; } return m; });
      if (!more) break; await p.waitForTimeout(250); await take('내림 ' + k);
    }
    await p.evaluate(() => { for (const e of window.__bxSc || []) e.scrollTop = 0; });
    await p.waitForTimeout(150);
  };
  const fail = (label, msg) => { res.fails.push({ label, msg }); };
  scenario({ W, theme, state, fail, only }).then(errs => {
    res.errors = errs || []; res.sigs = Array.from(seen.entries()).map(([k, v]) => ({ k, id: v.id, n: v.n }));
    fs.writeFileSync(path.join(dir, 'inv.json'), JSON.stringify(res)); process.exit(0);
  }).catch(e => { res.fails.push({ label: '시나리오', msg: String(e && e.stack || e).slice(0, 400) }); fs.writeFileSync(path.join(dir, 'inv.json'), JSON.stringify(res)); process.exit(0); });
} else {
  const widths = arg('widths', '384').split(',').map(Number), themes = arg('themes', 'light').split(',');
  const combos = []; widths.forEach(w => themes.forEach(t => combos.push([w, t])));
  const pass = process.argv.slice(2).filter((x, i, a) => !['--widths', '--themes'].includes(a[i - 1]) && !['--widths', '--themes'].includes(x));
  const t0 = Date.now();
  Promise.all(combos.map(([w, t]) => new Promise(ok => { const c = fork(__filename, ['--worker', String(w), t].concat(pass), { stdio: 'inherit' }); c.on('exit', ok); })))
    .then(() => console.log('모음: ' + OUT + ' (' + Math.round((Date.now() - t0) / 1000) + '초)'));
}
module.exports = { collect };
