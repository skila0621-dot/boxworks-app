#!/usr/bin/env node
// 정렬 점검(대표 상시 규칙 11/4 22:59를 B에도): 모든 화면 · 창을 폭 360 · 384 · 412 × 라이트 · 다크 × 오전·오후 · 24시간으로 열어
// 겹침 · 가림 · 잘림 · 가로 넘침 · NaN · 시각 표시 · 작은 단추 · 안 보이는 글 · 아이콘 세트 · 화면 오류를 잰다. 하나라도 걸리면 1로 끝난다(설치 파일을 내지 않음)
//   node tests/gate.cjs [--only 이름] [--widths 384] [--themes light] [--clocks 12] [--shots 1]
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const serve = require('./serve.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const WIDTHS = arg('widths', '360,384,412').split(',').map(Number), THEMES = arg('themes', 'light,dark').split(','), CLOCKS = arg('clocks', '12,24').split(','), ONLY = arg('only', ''), SHOTS = arg('shots', '0') === '1', DSF = +arg('dsf', '1');
const OUT = path.join(__dirname, 'out', 'gate'); fs.mkdirSync(OUT, { recursive: true });

const D = (h, m = 0, day = 0) => { const d = new Date(2026, 10, 6 + day, h, m); return d.getTime(); };
const EV = {
  meet: { id: '101', begin: D(11), end: D(12), title: '팀 회의', location: 'Zoom', allDay: false, calId: '1', calName: '내 캘린더' },
  dent: { id: '102', begin: D(15), end: D(16), title: '치과', location: '강남역 3번 출구', allDay: false, calId: '1', calName: '내 캘린더' },
  din: { id: '103', begin: D(19), end: D(21), title: '친구랑 저녁', location: '', allDay: false, calId: '1', calName: '내 캘린더' },
  bday: { id: '104', begin: D(0, 0, 1), end: D(0, 0, 2), title: '엄마 생신', location: '', allDay: true, calId: '2', calName: '가족' },
  mov: { id: '105', begin: D(13, 0, 1), end: D(15, 0, 1), title: '영화', location: '용산 CGV', allDay: false, calId: '1', calName: '내 캘린더' },
  lunch: { id: '106', begin: D(13), end: D(14), title: '점심 약속', location: '홍대입구역 9번 출구', allDay: false, calId: '1', calName: '내 캘린더' },
  meet2: { id: '107', begin: D(14, 30), end: D(15, 30), title: '아주 긴 이름의 거래처 분기 실적 정리 미팅(2차)', location: '서울특별시 강남구 테헤란로 152 강남파이낸스센터 21층', allDay: false, calId: '1', calName: '내 캘린더' }
};
const K = e => 'c:' + e.id + ':' + e.begin;
const base = [EV.meet, EV.dent, EV.din, EV.bday, EV.mov];
const SC = {
  '오늘': { now: D(13, 20), events: base },
  '오늘 · 지금 준비 시작': { now: D(14, 0), events: base },
  '오늘 · 준비 중(출발까지)': { now: D(14, 0), events: base, log: [{ key: K(EV.dent), act: 'start', t: D(13, 52) }] },
  '오늘 · 지금 출발(늦음)': { now: D(14, 34), events: base, log: [{ key: K(EV.dent), act: 'rang', kind: 'prep', t: D(13, 50) }, { key: K(EV.dent), act: 'snooze', kind: 'prep', n: 5, t: D(13, 50) }, { key: K(EV.dent), act: 'snooze', kind: 'leave', n: 3, t: D(14, 25) }] },
  '오늘 · 남은 약속 없음': { now: D(21, 30), events: base },
  '오늘 · 일정 없음': { now: D(9, 0), events: [] },
  '오늘 · 돌아온 날': { now: D(9, 0), events: base, lastOpen: D(9, 0) - 4 * 864e5 },
  '오늘 · 캘린더 · 알람 권한 없음': { now: D(9, 0), events: [], perms: { calendar: 'no', notif: 'no', exact: 'no' } },
  '오늘 · 빠듯함 · 긴 글': { now: D(9, 0), events: [EV.lunch, EV.meet2, EV.din] },
  '오늘 · 이 앱에만 넣은 것': { now: D(9, 0), events: [], items: [{ id: 'x1', title: '약 먹기', at: D(21, 0), place: '' }, { id: 'x2', title: '택배 맡기기', at: D(17, 0), place: '편의점', out: true }], perms: { calendar: 'no' } },
  '약속 · 나가는 약속': { now: D(13, 20), events: base, hash: '#/e/' + encodeURIComponent(K(EV.dent)) },
  '약속 · 묻기만': { now: D(13, 20), events: base, hash: '#/e/' + encodeURIComponent(K(EV.din)) },
  '약속 · 종일': { now: D(13, 20), events: base, hash: '#/e/' + encodeURIComponent(K(EV.bday)) },
  '약속 · 긴 글': { now: D(9, 0), events: [EV.lunch, EV.meet2], hash: '#/e/' + encodeURIComponent(K(EV.meet2)) },
  '약속 · 이 앱 알림': { now: D(9, 0), events: [], items: [{ id: 'x1', title: '약 먹기', at: D(21, 0), place: '' }], hash: '#/e/' + encodeURIComponent('o:x1') },
  '넣기': { now: D(13, 20), events: base, act: 'add' },
  '넣기 · 풀린 문장': { now: D(13, 20), events: base, act: 'add', type: '금요일 7시 홍대에서 동창 저녁' },
  '넣기 · 시각 고치기': { now: D(13, 20), events: base, act: 'add', type: '17일 오후 3시 늘푸른 병원 예약', edit: 'time' },
  '넣기 · 시각 없음': { now: D(13, 20), events: base, act: 'add', type: '다음 주 화요일 거래처 미팅' },
  '설정': { now: D(13, 20), events: base, hash: '#/settings' },
  '설정 · 권한 없음': { now: D(13, 20), events: base, hash: '#/settings', perms: { notif: 'no', exact: 'no', fullscreen: 'no', battery: 'no', calendar: 'no' } },
  '준비 기록': { now: D(13, 20), events: base, hash: '#/record', log: [
    { key: 'p1', act: 'rang', kind: 'prep', t: D(9, 0, -3) }, { key: 'p1', act: 'start', t: D(9, 4, -3) }, { key: 'p1', act: 'left', t: D(9, 46, -3) },
    { key: 'p2', act: 'rang', kind: 'prep', t: D(9, 0, -2) }, { key: 'p2', act: 'snooze', kind: 'prep', n: 5, t: D(9, 0, -2) }, { key: 'p2', act: 'start', t: D(9, 7, -2) }, { key: 'p2', act: 'left', t: D(9, 57, -2) },
    { key: 'p3', act: 'start', t: D(9, 0, -1) }, { key: 'p3', act: 'left', t: D(9, 47, -1) }] },
  '처음 1': { now: D(13, 20), events: base, firstRun: true, perms: { calendar: 'no', notif: 'no', exact: 'no', fullscreen: 'no', battery: 'no' } },
  '처음 2': { now: D(13, 20), events: base, firstRun: true, onb: 1 },
  '처음 3': { now: D(13, 20), events: base, firstRun: true, onb: 2 },
  '알림 글': { now: D(13, 20), events: base, click: '[data-start]' }
};

// 브라우저 안에서 도는 점검
function audit(o) {
  const out = [], vis = e => { const s = getComputedStyle(e); if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const R = e => e.getBoundingClientRect(), txt = e => (e.innerText || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  const add = (k, e, extra) => out.push(Object.assign({ k, t: e ? txt(e) || e.tagName + '.' + (e.className && e.className.baseVal === undefined ? e.className : '') : '' }, extra || {}));
  const W = innerWidth;
  const layerRoot = document.querySelector('.scrim') || document;
  const taps = [...layerRoot.querySelectorAll('button, a[href], input, select, textarea, [role="switch"]')].filter(vis);
  // ① 누르는 것끼리 겹침
  for (let i = 0; i < taps.length; i++) for (let j = i + 1; j < taps.length; j++) {
    const a = taps[i], b = taps[j]; if (a.contains(b) || b.contains(a)) continue;
    const fa = getComputedStyle(a).position === 'fixed' || a.closest('.fab,.toast'), fb = getComputedStyle(b).position === 'fixed' || b.closest('.fab,.toast'); if (!!fa !== !!fb) continue;
    const p = R(a), q = R(b), x = Math.min(p.right, q.right) - Math.max(p.left, q.left), y = Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top);
    if (x > 1 && y > 1) add('tap', a, { with: txt(b) });
  }
  // ② 떠 있는 것(넣기 단추 · 알림 글)이 가림 — 맨 아래까지 민 상태에서 잰다
  if (o.bottom) {
    // 창(.scrim)이 열려 있으면 그 밑의 넣기 단추는 안 보이니 빼고, 창 위에 뜨는 알림 글만 본다
    const floats = [...document.querySelectorAll(document.querySelector('.scrim') ? '.toast' : '.fab, .toast')].filter(vis);
    const things = [...layerRoot.querySelectorAll('button, a[href], input, select, .row .m b, .row .m span, p, h1, h2, .big, .what, .why')].filter(e => vis(e) && !e.closest('.fab,.toast'));
    for (const f of floats) { const fr = R(f); for (const e of things) { const r = R(e); if (r.bottom > fr.top + 1 && r.top < fr.bottom - 1 && r.right > fr.left + 1 && r.left < fr.right - 1) add('cover', e, { by: txt(f) }); } }
  }
  // ③ 글자 잘림(…로 줄인 것 빼고) · 화면 밖으로 나감
  for (const e of layerRoot.querySelectorAll('*')) {
    if (!vis(e) || e.closest('svg')) continue;
    const s = getComputedStyle(e);
    const hasText = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (hasText && e.scrollWidth > e.clientWidth + 1 && s.overflowX !== 'visible' && s.textOverflow !== 'ellipsis' && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName)) add('cut', e, { sw: e.scrollWidth, cw: e.clientWidth });
    const r = R(e); if (r.right > W + 0.5 || r.left < -0.5) { if (!e.closest('.scrim') || e.closest('.sheet')) add('out', e, { l: Math.round(r.left), r: Math.round(r.right) }); }
  }
  if (document.documentElement.scrollWidth > W + 0.5) add('hscroll', null, { sw: document.documentElement.scrollWidth });
  // NaN · undefined
  const all = (layerRoot.innerText || document.body.innerText);
  const bad = all.match(/NaN|undefined|Invalid Date|\[object|null(?![가-힣])/); if (bad) add('nan', null, { t: bad[0] });
  // 시각 표시: 12시간이면 '3:00' 앞에 오전 · 오후, 24시간이면 오전 · 오후가 없어야
  for (const e of layerRoot.querySelectorAll('*')) {
    if (!vis(e) || e.children.length > 2) continue;
    const t = (e.textContent || '').replace(/\s+/g, ' ');
    if (!/\d{1,2}:\d{2}/.test(t) || [...e.children].some(c => /\d{1,2}:\d{2}/.test(c.textContent) && c.children.length === 0 && c.tagName !== 'SMALL')) continue;
    if (o.h24) { if (/(오전|오후)\s*\d{1,2}:\d{2}/.test(t)) add('time24', e); }
    else for (const m of t.matchAll(/(\d{1,2}):(\d{2})/g)) { const pre = t.slice(Math.max(0, m.index - 4), m.index); if (!/(오전|오후)\s*$/.test(pre) && !/^\d+:\d{2}:\d{2}/.test(t.slice(m.index))) add('time12', e, { at: m[0] }); }
  }
  // 작은 단추(40px 미만)
  for (const e of taps) { const r = R(e); if ((r.width < 40 || r.height < 40) && !e.closest('.track')) add('small', e, { w: Math.round(r.width), h: Math.round(r.height) }); }
  // 안 보이는 글(바탕과 대비 3:1 미만)
  const rgb = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const bgOf = e => { for (let x = e; x; x = x.parentElement) { const c = rgb(getComputedStyle(x).backgroundColor); if (c && c.a > 0.5) return c; } return rgb(getComputedStyle(document.body).backgroundColor); };
  for (const e of layerRoot.querySelectorAll('*')) {
    if (!vis(e) || !e.childNodes.length || ![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
    const c = rgb(getComputedStyle(e).color), b = bgOf(e); if (!c || !b) continue;
    const L1 = lum(c), L2 = lum(b), cr = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    if (cr < 3) add('ink', e, { cr: Math.round(cr * 10) / 10 });
  }
  // 아이콘 세트: 모든 아이콘은 한 세트(data-icon)
  for (const s of layerRoot.querySelectorAll('svg')) if (vis(s) && !s.dataset.icon) add('icon', s.parentElement);
  return out;
}

(async () => {
  const srv = await serve(path.join(__dirname, '..', 'web'));
  const b = await chromium.launch();
  const report = { checked: 0, fails: [] };
  const names = Object.keys(SC).filter(n => !ONLY || n.includes(ONLY));
  for (const W of WIDTHS) for (const theme of THEMES) for (const clock of CLOCKS) {
    const ctx = await b.newContext({ viewport: { width: W, height: 800 }, colorScheme: theme, deviceScaleFactor: DSF });
    for (const name of names) {
      const sc = SC[name];
      const p = await ctx.newPage(); const errs = [];
      p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
      const scen = Object.assign({}, sc, { settings: Object.assign({}, sc.settings, { h24: clock === '24' }) });
      await p.addInitScript(s => { window.__B_SCENARIO = s; }, scen);
      await p.goto(srv.url + (sc.hash || '#/'));
      await p.waitForTimeout(250);
      if (sc.onb) for (let i = 0; i < sc.onb; i++) { await p.click('[data-skip]'); await p.waitForTimeout(120); }
      if (sc.act === 'add') { await p.click('[data-add]'); await p.waitForTimeout(150); if (sc.type) { await p.fill('#addT', sc.type); await p.waitForTimeout(120); } if (sc.edit) { await p.click('[data-edit="' + sc.edit + '"]'); await p.waitForTimeout(120); } }
      if (sc.click) { await p.click(sc.click); await p.waitForTimeout(250); }
      const issues = [];
      for (const pos of ['top', 'bottom']) {
        await p.evaluate(pos => { const s = document.querySelector('.sheet'); if (s) s.scrollTop = pos === 'bottom' ? s.scrollHeight : 0; window.scrollTo(0, pos === 'bottom' ? document.documentElement.scrollHeight : 0); }, pos);
        await p.waitForTimeout(60);
        const r = await p.evaluate('(' + audit.toString() + ')(' + JSON.stringify({ h24: clock === '24', bottom: pos === 'bottom' }) + ')');
        r.forEach(x => { if (!issues.some(y => y.k === x.k && y.t === x.t)) issues.push(Object.assign({ pos }, x)); });
      }
      errs.forEach(e => issues.push({ k: 'error', t: e.slice(0, 120) }));
      report.checked++;
      const tag = W + '-' + theme + '-' + clock + ' ' + name;
      if (issues.length) { report.fails.push({ tag, issues }); await p.screenshot({ path: path.join(OUT, tag.replace(/[\s/·()]+/g, '_') + '.png'), fullPage: true }); }
      else if (SHOTS) await p.screenshot({ path: path.join(OUT, tag.replace(/[\s/·()]+/g, '_') + '.png'), fullPage: true });
      await p.close();
    }
    await ctx.close();
  }
  await b.close(); srv.close();
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
  const kinds = {}; report.fails.forEach(f => f.issues.forEach(i => { kinds[i.k] = (kinds[i.k] || 0) + 1; }));
  console.log('화면 ' + report.checked + '곳 · 걸린 화면 ' + report.fails.length + (report.fails.length ? ' · ' + JSON.stringify(kinds) : ''));
  report.fails.slice(0, 12).forEach(f => console.log('  ✗ ' + f.tag + ': ' + f.issues.slice(0, 4).map(i => i.k + '(' + (i.t || '') + (i.with ? ' ↔ ' + i.with : '') + (i.by ? ' ← ' + i.by : '') + (i.cr ? ' ' + i.cr : '') + (i.w ? ' ' + i.w + '×' + i.h : '') + (i.at ? ' ' + i.at : '') + ')').join(' · ')));
  process.exit(report.fails.length ? 1 : 0);
})();
