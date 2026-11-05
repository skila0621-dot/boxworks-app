#!/usr/bin/env node
// 앱디자인 패턴 규정(대표 11/6 04:09 자료집, claude/앱디자인_패턴_규정.md) 점검: 화면마다 재서 규칙과 어긋난 곳을 센다.
// 정렬 점검(run.cjs)과 같은 화면(scenario.cjs)을 폭 384 · 라이트 · 오전 · 오후로 연다. 시험판을 막지는 않고(아직 기준을 정하는 중) 보고서만 만든다
//   node tests/layout/rules.cjs [--out DIR] [--zoom 1.3,2]
// 재는 것
//   R01 간격: 안쪽 여백 · 사이(gap) · 바깥 여백이 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 토큰 밖인 값
//   R03 · R05 글자 역할: 글이 있는 요소의 크기 · 굵기 · 줄 높이 묶음(규정의 다섯 역할 24/32·600, 20/28·600, 16/24·400, 14/20·500, 14/20·400)
//   R06 · R08 누르는 영역: 누르는 것의 크기(48 · 44 미만), 모서리(R08 단추 12)
//   R12 대비: 글 4.5:1(큰 글 24 이상 · 굵은 18.66 이상은 3:1)
//   R13(접근성) 큰 글자: 글자 크기를 1.3배 · 2배로 키웠을 때 잘림(cut) · 누르는 것 겹침(tap) — 정렬 점검의 같은 잣대
const fs = require('fs');
const path = require('path');
const H = require('../harness.cjs');
const audit = require('./checks.js');
const scenario = require('./scenario.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const OUT = path.resolve(arg('out', path.join(__dirname, 'out-rules')));
const ZOOMS = arg('zoom', '1.3,2').split(',').map(Number).filter(x => x > 1);

// 브라우저 안: 한 화면을 잰다(정렬 점검 checks.js와 같은 '보이는 것 · 맨 위 층' 고르기)
function collect(){
  const W = innerWidth, Hh = innerHeight, cs = e => getComputedStyle(e);
  const vis = e => { const r = e.getBoundingClientRect(); if (r.width <= 0.5 || r.height <= 0.5 || r.bottom <= 0 || r.top >= Hh || r.right <= 0 || r.left >= W) return false; const s = cs(e); return s.visibility !== 'hidden' && +s.opacity > 0.05 && s.display !== 'none'; };
  const hidden = e => { for (let x = e; x; x = x.parentElement) { if (x.hidden) return true; const s = cs(x); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity <= 0.05) return true; } return false; };
  const srOnly = e => { for (let x = e; x && x !== document.body; x = x.parentElement) { const r = x.getBoundingClientRect(); if ((r.width <= 1.5 || r.height <= 1.5) && cs(x).overflow !== 'visible') return true; if (x.classList && x.classList.contains('sr')) return true; } return false; };
  const name = x => x.tagName.toLowerCase() + (x.id ? '#' + x.id : '') + (typeof x.className === 'string' && x.className.trim() ? '.' + x.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  const pth = e => { const a = []; for (let x = e; x && x !== document.body && a.length < 3; x = x.parentElement) a.unshift(name(x)); return a.join('>'); };
  const txt = e => (e.textContent || (e.getAttribute && e.getAttribute('aria-label')) || '').replace(/\s+/g, ' ').trim().slice(0, 24);
  let all = Array.from(document.body.querySelectorAll('*')).filter(e => !e.closest('svg,script,style,#bx-splash,template') && vis(e) && !hidden(e));
  const big = all.filter(e => { const q = cs(e).position; if (q !== 'fixed' && q !== 'absolute') return false; const r = e.getBoundingClientRect(); return r.width * r.height >= W * Hh * 0.45; });
  const tp = document.elementFromPoint(W / 2, Hh * 0.6);
  const modal = big.filter(m => tp && (m === tp || m.contains(tp))).sort((a, b) => (a.contains(b) ? 1 : b.contains(a) ? -1 : 0))[0] || null;
  if (modal) all = all.filter(e => modal.contains(e) || (/fixed/.test(cs(e).position) && !big.includes(e) && !e.contains(modal) && +cs(e).zIndex >= +cs(modal).zIndex));
  const ownText = e => Array.from(e.childNodes).some(c => c.nodeType === 3 && c.textContent.trim());
  const isTap = e => e.matches('button,a[href],input:not([type=hidden]),select,textarea,[role=button],[role=switch],[role=checkbox],[role=radio],[role=tab],[role=option],label[for]') && !e.disabled && cs(e).pointerEvents !== 'none';
  const rgb = c => { c = String(c); let m = c.match(/^rgba?\(([^)]+)\)/); if (m) { const v = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat); return {r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1}; }
    m = c.match(/^color\(srgb\s+([^)]+)\)/); if (m) { const v = m[1].split(/[\s\/]+/).filter(Boolean).map(parseFloat); return {r: v[0] * 255, g: v[1] * 255, b: v[2] * 255, a: v.length > 3 ? v[3] : 1}; } return null; };
  const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  // 바탕: 위로 올라가며 반투명 바탕을 겹쳐 섞는다(상자 바탕이 반투명이라)
  const bgOf = e => { const layers = []; for (let x = e; x; x = x.parentElement) { const c = rgb(cs(x).backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= 0.99) break; } if (x === document.documentElement) break; }
    let b = {r: 255, g: 255, b: 255}; const root = rgb(cs(document.body).backgroundColor); if (root && root.a > 0.5) b = root;
    for (let i = layers.length - 1; i >= 0; i--) { const c = layers[i]; b = {r: c.r * c.a + b.r * (1 - c.a), g: c.g * c.a + b.g * (1 - c.a), b: c.b * c.a + b.b * (1 - c.a)}; } return b; };
  const res = {text: [], space: [], radius: [], touch: [], contrast: []};
  for (const e of all) {
    const s = cs(e);
    if (ownText(e) && !srOnly(e) && !e.closest('input,textarea,select')) {
      const fz = parseFloat(s.fontSize), fw = +s.fontWeight || 400, lh = s.lineHeight === 'normal' ? 'normal' : Math.round(parseFloat(s.lineHeight) * 10) / 10;
      res.text.push([fz, fw, lh, pth(e), txt(e)]);
      const c = rgb(s.color);
      if (c && c.a >= 0.2) {
        const b = bgOf(e), mix = {r: c.r * c.a + b.r * (1 - c.a), g: c.g * c.a + b.g * (1 - c.a), b: c.b * c.a + b.b * (1 - c.a)};
        const l1 = lum(mix), l2 = lum(b), ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        const large = fz >= 24 || (fz >= 18.66 && fw >= 700);
        res.contrast.push([Math.round(ratio * 100) / 100, large, fz, fw, pth(e), txt(e), s.color]);
      }
    }
    // 간격: 안쪽 여백 · 사이 · 바깥 여백(가운데 맞춤 auto는 뺌: 0~64만)
    for (const k of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'rowGap', 'columnGap', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight']) {
      const v = parseFloat(s[k]); if (!(v > 0) || v > 64 || (/^margin/.test(k) && /auto/.test(e.style && e.style[k] || ''))) continue;
      if ((k === 'rowGap' || k === 'columnGap') && !/flex|grid/.test(s.display)) continue;
      res.space.push([k, Math.round(v * 10) / 10, pth(e)]);
    }
    const rd = parseFloat(s.borderTopLeftRadius); if (rd > 0 && rd < 100 && !/%/.test(s.borderTopLeftRadius)) res.radius.push([Math.round(rd * 10) / 10, pth(e), isTap(e)]);
    if (isTap(e) && !srOnly(e) && !(e.tagName === 'INPUT' && +s.opacity < 0.1)) { const r = e.getBoundingClientRect(); res.touch.push([Math.round(r.width), Math.round(r.height), pth(e), txt(e)]); }
  }
  return res;
}
const zoomText = require('./zoom.cjs');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const screens = [], fails = [];
  await scenario({ W: 384, theme: 'light', clock: '12', only: '', fail: (l, e) => fails.push([l, e]),
    state: async (label, p) => {
      const m = await p.evaluate('(' + collect.toString() + ')()');
      const z = {};
      for (const k of ZOOMS) {
        await p.evaluate('(' + zoomText.toString() + ')(' + k + ')'); await p.waitForTimeout(120);
        const r = await p.evaluate('(' + audit.toString() + ')({})');
        z[k] = { cut: r.filter(x => x.k === 'cut').map(x => x.p + ' · ' + (x.t || '')).slice(0, 40), tap: r.filter(x => x.k === 'tap').map(x => x.t).slice(0, 20), n: { cut: r.filter(x => x.k === 'cut').length, tap: r.filter(x => x.k === 'tap').length } };
        await p.evaluate(() => window.__bxUnzoom && window.__bxUnzoom()); await p.waitForTimeout(80);
      }
      screens.push({ label, m, z });
    } });
  fs.writeFileSync(path.join(OUT, 'raw.json'), JSON.stringify({ screens, fails }));
  // 모아 세기
  const TOK = [4, 8, 12, 16, 24, 32, 48, 64];
  const ROLES = [[24, 600, 32, '화면 제목'], [20, 600, 28, '섹션 제목'], [16, 400, 24, '본문'], [14, 500, 20, '필드 이름 · 단추'], [14, 400, 20, '보조 설명']];
  const tally = (rows, key, ex) => { const m = new Map(); rows.forEach(r => { const k = key(r); const o = m.get(k) || { n: 0, ex: [] }; o.n++; if (o.ex.length < 4) o.ex.push(ex(r)); m.set(k, o); }); return Array.from(m.entries()).map(([k, o]) => Object.assign({ k }, o)).sort((a, b) => b.n - a.n); };
  const flat = f => screens.flatMap(s => s.m[f].map(r => Object.assign({ scr: s.label }, { r })));
  const sp = flat('space'), tx = flat('text'), rd = flat('radius'), tc = flat('touch'), ct = flat('contrast');
  const off = sp.filter(x => !TOK.includes(Math.round(x.r[1])) && x.r[1] >= 3);
  const role = r => { const hit = ROLES.find(q => q[0] === r[0] && q[1] === r[1]); return hit ? hit[3] : r[0] + ' · ' + r[1]; };
  const sum = {
    screens: screens.length, fails,
    space: { all: sp.length, off: off.length, byValue: tally(off, x => x.r[1], x => x.scr + ' · ' + x.r[2] + ' · ' + x.r[0]).slice(0, 20) },
    text: { all: tx.length, combos: tally(tx, x => x.r[0] + ' · ' + x.r[1] + ' · ' + x.r[2], x => x.scr + ' · ' + x.r[4]).slice(0, 40), sizes: tally(tx, x => x.r[0], x => x.r[4]), roleHit: tx.filter(x => ROLES.some(q => q[0] === x.r[0] && q[1] === x.r[1])).length, byRole: tally(tx, x => role(x.r), x => x.scr + ' · ' + x.r[4]).slice(0, 30) },
    radius: tally(rd, x => x.r[0], x => x.scr + ' · ' + x.r[1]).slice(0, 20),
    touch: { all: tc.length, lt48: tc.filter(x => x.r[0] < 48 || x.r[1] < 48).length, lt44: tc.filter(x => x.r[0] < 44 || x.r[1] < 44).length, lt36: tc.filter(x => x.r[0] < 36 || x.r[1] < 36).length,
      bySize: tally(tc.filter(x => x.r[0] < 48 || x.r[1] < 48), x => x.r[0] + '×' + x.r[1], x => x.scr + ' · ' + x.r[3] + ' · ' + x.r[2]).slice(0, 30) },
    contrast: { all: ct.length, low: ct.filter(x => x.r[0] < (x.r[1] ? 3 : 4.5)).length, byColor: tally(ct.filter(x => x.r[0] < (x.r[1] ? 3 : 4.5)), x => x.r[6] + ' (' + x.r[0] + ')', x => x.scr + ' · ' + x.r[5] + ' · ' + x.r[2] + 'px').slice(0, 20) },
    zoom: Object.fromEntries(ZOOMS.map(k => [k, { screensCut: screens.filter(s => s.z[k].n.cut).length, cut: screens.reduce((a, s) => a + s.z[k].n.cut, 0), tap: screens.reduce((a, s) => a + s.z[k].n.tap, 0), worst: screens.map(s => [s.label, s.z[k].n.cut, s.z[k].n.tap, s.z[k].cut.slice(0, 3)]).sort((a, b) => (b[1] + b[2]) - (a[1] + a[2])).slice(0, 12) }]))
  };
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(sum, null, 1));
  console.log('화면 ' + sum.screens + ' · 간격 토큰 밖 ' + sum.space.off + '/' + sum.space.all + ' · 글 ' + sum.text.all + '(역할 맞음 ' + sum.text.roleHit + ') · 누르는 것 ' + sum.touch.all + '(48 미만 ' + sum.touch.lt48 + ', 44 미만 ' + sum.touch.lt44 + ') · 대비 낮음 ' + sum.contrast.low + '/' + sum.contrast.all);
  ZOOMS.forEach(k => console.log('글자 ' + k + '배: 잘림 ' + sum.zoom[k].cut + '(화면 ' + sum.zoom[k].screensCut + ') · 겹침 ' + sum.zoom[k].tap));
  if (fails.length) console.log('못 연 화면 ' + fails.length + ': ' + fails.map(f => f[0]).join(', '));
})();
