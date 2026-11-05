// 시험판 63(자료집 점검 · 선택실 8에서 '묻지 않고 고친다'고 한 것): 명암 대비 · 큰 글자
// (1) 명암 대비: 글자 4.5:1(큰 글자 3:1). 흐린 글자(ink-3)는 카드 위 카드(가장 진한 바탕)에서도, 다크에서도. 쓸 수 없는 단추는 따로(ink-off, WCAG 예외)
//     주황 바탕 위 글자(아래 메뉴 숫자 · 확인 필요 단추)는 warn-bg + on-warn, 빨간 단추 on-danger, 색 막대 글자는 그 색에서 대비가 큰 쪽(모자라면 바탕을 조금 어둡게)
//     투명도로 흐리게 하던 것(다른 달 날짜 · 끝낸 줄 · 지난 일 · 확인 필요 줄 · 끝낸 막대)은 글자색으로
// (2) 큰 글자: 휴대폰 글꼴 크기를 키우면(안드로이드 웹뷰 textZoom) 시각 칸도 함께 커진다(rem) · 날짜 빠른 칸은 두 줄로
// (3) 정렬 점검에 low(대비) · big(글자 1.3배 잘림) — 일부러 만든 것을 잡는지
const { openApp, settings, checker } = require('./harness.cjs');
const audit = require('./layout/checks.js');
const zoomText = require('./layout/zoom.cjs');
const old = '2026-10-29T00:00:00.000Z';

// 브라우저 안: 색 · 대비 도구
const TOOLS = `(() => {
  const rgb = c => { const m = String(c).match(/^rgba?\\(([^)]+)\\)/); if (!m) return null; const v = m[1].split(/[\\s,\\/]+/).filter(Boolean).map(parseFloat); return {r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1}; };
  const hex = h => { h = String(h).trim(); const n = parseInt(h.slice(1), 16); return {r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255, a: 1}; };
  const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const over = (top, b) => ({r: top.r * top.a + b.r * (1 - top.a), g: top.g * top.a + b.g * (1 - top.a), b: top.b * top.a + b.b * (1 - top.a), a: 1});
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return Math.round((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) * 100) / 100; };
  const v = k => getComputedStyle(document.documentElement).getPropertyValue(k).trim();
  window.__c = { rgb, hex, lum, over, ratio, v };
})()`;

module.exports = async function () {
  const c = checker('시험판 63 · 명암 대비 · 큰 글자');
  const data = () => [['settings', settings({ bxStart: { at: old, mods: { report: true, routines: true, tt: true, memo: true, med: true } } })],
    ['cat_b', { type: 'category', name: '일', color: '#2a78d6', createdAt: old, updatedAt: old }],
    ['cat_a', { type: 'category', name: '운동', color: '#1baf7a', createdAt: old, updatedAt: old }],
    ['it_bar', { type: 'item', title: '부산 출장', date: '2026-11-03', endDate: '2026-11-05', categoryId: 'cat_b', createdAt: old, updatedAt: old }],
    ['it_bar2', { type: 'item', title: '워크숍', date: '2026-11-10', endDate: '2026-11-11', categoryId: 'cat_a', createdAt: old, updatedAt: old }],
    ['it_bar3', { type: 'item', title: '지난 여행', date: '2026-11-01', endDate: '2026-11-02', categoryId: 'cat_b', done: true, createdAt: old, updatedAt: old }],
    ['it_late', { type: 'item', title: '은행 서류 내기', date: '2026-11-05', start: '11:00', end: '11:30', createdAt: old, updatedAt: old }],
    ['it_done', { type: 'item', title: '약국', date: '2026-11-06', start: '08:00', end: '08:30', done: true, createdAt: old, updatedAt: old }],
    ['it_next', { type: 'item', title: '노동부', date: '2026-11-06', start: '12:59', end: '14:00', createdAt: old, updatedAt: old }]];
  const NOW = '2026-11-06T09:20:00+09:00';

  for (const theme of ['light', 'dark']) {
    const app = await openApp({ width: 384, height: 832, colorScheme: theme, now: NOW, data: data() });
    const p = app.page;
    try {
      await p.waitForTimeout(1200); await p.evaluate(TOOLS);
      // (1) 흐린 글자: 가장 진한 바탕(카드 위 카드)에서도 4.5
      const ink = await p.evaluate(() => { const { hex, rgb, over, ratio, v } = window.__c;
        const bg = hex(v('--bg')), card = rgb(getComputedStyle(document.querySelector('.bx-grp') || document.body).backgroundColor) || {r: 0, g: 0, b: 0, a: 0};
        const cardC = v('--bx-card'), inC = v('--bx-card-in'), parse = s => { const m = s.match(/rgba?\(([^)]+)\)/); const x = m[1].split(/[\s,\/]+/).map(parseFloat); return {r: x[0], g: x[1], b: x[2], a: x[3] == null ? 1 : x[3]}; };
        const nested = over(parse(inC), over(parse(cardC), bg));
        return { ink3: ratio(hex(v('--ink-3')), nested), ink3bg: ratio(hex(v('--ink-3')), bg), ink2: ratio(hex(v('--ink-2')), nested), off: v('--ink-off'), i3: v('--ink-3'),
          warn: ratio(hex(v('--on-warn')), hex(v('--warn-bg'))), danger: ratio(hex(v('--on-danger')), hex(v('--danger'))) }; });
      c.ok(ink.ink3 >= 4.5 && ink.ink3bg >= 4.5 && ink.ink2 >= 4.5, theme + ': 흐린 글자는 카드 위 카드에서도 4.5:1 이상 ' + JSON.stringify(ink));
      c.ok(ink.off && ink.off.toLowerCase() !== ink.i3.toLowerCase(), theme + ': 쓸 수 없는 단추 글자는 따로(ink-off, 기준 사진의 모양 그대로) ' + JSON.stringify([ink.off, ink.i3]));
      c.ok(ink.warn >= 4.5 && ink.danger >= 4.5, theme + ': 주황 · 빨강 바탕 위 글자 4.5:1 이상 ' + JSON.stringify([ink.warn, ink.danger]));
      // 아래 메뉴 숫자(확인 필요 1)
      const bd = await p.evaluate(() => { const b = document.getElementById('dock-badge'); if (!b || b.hidden) return null; const s = getComputedStyle(b), { rgb, ratio } = window.__c; return { t: b.textContent, r: ratio(rgb(s.color), rgb(s.backgroundColor)) }; });
      c.ok(bd && bd.t === '1' && bd.r >= 4.5, theme + ': 아래 메뉴 확인 필요 숫자 대비 4.5:1 이상 ' + JSON.stringify(bd));
      // 홈: 끝낸 줄 · 확인 필요 줄은 투명도 없이
      const rows = await p.evaluate(() => { const row = id => { const m = document.querySelector('#tcard2 .row-main[data-id="' + id + '"]'); return m && m.closest('.row'); };
        const d = row('it_done'), cs = e => getComputedStyle(e);
        return { done: d ? [cs(d).opacity, cs(d.querySelector(':scope > .row-main')).opacity, cs(d.querySelector('.row-title')).color === cs(document.documentElement).getPropertyValue('--ink-3').trim() || cs(d.querySelector('.row-title')).color] : null }; });
      c.ok(rows.done && rows.done[0] === '1' && rows.done[1] === '1', theme + ': 끝낸 줄은 투명도 없이 글자색으로 흐리게 ' + JSON.stringify(rows));
      // 캘린더 월: 다른 달 날짜 · 색 막대 · 끝낸 막대
      await p.click('.dock [data-view="month"]'); await p.waitForTimeout(800); await p.evaluate(TOOLS);
      const mo = await p.evaluate(() => { const { rgb, hex, ratio, over, v } = window.__c, cs = e => getComputedStyle(e);
        const bgOf = e => { let b = hex(v('--bg')); const ls = []; for (let x = e; x && x !== document.documentElement; x = x.parentElement) { const q = rgb(cs(x).backgroundColor); if (q && q.a > 0) { ls.push(q); if (q.a >= 0.99) break; } } for (let i = ls.length - 1; i >= 0; i--) b = over(ls[i], b); return b; };
        const oth = Array.from(document.querySelectorAll('.cal .cell.other')).map(cell => { const n = cell.querySelector('.c-num'); let op = 1; for (let x = n; x && x !== cell.parentElement; x = x.parentElement) op *= +cs(x).opacity; return [n.textContent, op, ratio(rgb(cs(n).color), bgOf(n))]; });
        const bars = Array.from(document.querySelectorAll('.cal .c-bar')).map(b => { const s = cs(b); let op = 1; for (let x = b; x && !x.classList.contains('cal'); x = x.parentElement) op *= +cs(x).opacity; return [b.textContent.trim(), b.style.getPropertyValue('--c'), op, ratio(rgb(s.color), over(rgb(s.backgroundColor), bgOf(b.parentElement))), b.classList.contains('done')]; });
        return { oth, bars }; });
      c.ok(mo.oth.length >= 5 && mo.oth.every(x => x[1] === 1 && x[2] >= 4.5), theme + ': 다른 달 날짜는 흐린 글자색(투명도 없이 4.5:1 이상) ' + JSON.stringify(mo.oth.slice(0, 4)));
      c.ok(mo.bars.length >= 3 && mo.bars.every(x => x[2] === 1 && x[3] >= 4.5), theme + ': 색 막대 · 끝낸 막대 글자 4.5:1 이상 ' + JSON.stringify(mo.bars));
      const done = mo.bars.find(x => x[4]);
      c.ok(done && done[1] === 'var(--sunk)', theme + ': 끝낸 막대는 회색 바탕 + 흐린 글자 + 가로줄 ' + JSON.stringify(done));
      // 날짜 페이지 달력(새 일정 › 날짜): 다른 달 날짜
      await p.click('.bx-fab'); await p.waitForTimeout(700);
      await p.evaluate(() => { const b = document.querySelector('#sheet-root [data-bxmore]'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); const r = document.querySelector('#sheet-root [data-fpanel="date"]'); if (r) r.click(); });
      await p.waitForTimeout(800); await p.evaluate(TOOLS);
      const dc = await p.evaluate(() => { const { rgb, hex, ratio, over, v } = window.__c, cs = e => getComputedStyle(e);
        const bgOf = e => { let b = hex(v('--bg')); const ls = []; for (let x = e; x && x !== document.documentElement; x = x.parentElement) { const q = rgb(cs(x).backgroundColor); if (q && q.a > 0) { ls.push(q); if (q.a >= 0.99) break; } } for (let i = ls.length - 1; i >= 0; i--) b = over(ls[i], b); return b; };
        return Array.from(document.querySelectorAll('.bx-dc.other')).map(d => [d.textContent.trim(), cs(d).opacity, ratio(rgb(cs(d).color), bgOf(d))]); });
      c.ok(dc.length >= 3 && dc.every(x => x[1] === '1' && x[2] >= 4.5), theme + ': 날짜 페이지 달력의 다른 달 날짜도 4.5:1 이상 ' + JSON.stringify(dc.slice(0, 3)));
    } catch (e) { c.ok(false, theme + ' 대비: ' + (e && e.stack || e)); }
    finally { await app.close(); }
  }

  // 색 막대 글자: 캘린더 색 여덟 가지 × 라이트 · 다크
  for (const theme of ['light', 'dark']) {
    const app = await openApp({ width: 384, height: 832, colorScheme: theme, now: NOW, data: data() });
    try {
      const p = app.page; await p.waitForTimeout(900); await p.evaluate(TOOLS);
      const all = await p.evaluate(() => { const { hex, ratio } = window.__c; const ks = ['blue', 'aqua', 'yellow', 'magenta', 'violet', 'green', 'red', 'gray'];
        const F = window.BX_T.fn; return ks.map(k => { const o = F.onColor('var(--cat-' + k + ')'); const bg = /^#/.test(o.bg) ? o.bg : F.hexOf(o.bg); return [k, o.bg, o.on, ratio(hex(bg), hex(o.on === '#fff' ? '#ffffff' : o.on))]; }); });
      c.ok(all.every(x => x[3] >= 4.5), theme + ': 캘린더 색 여덟 가지 모두 막대 글자 4.5:1 이상 ' + JSON.stringify(all));
      c.ok(all.find(x => x[0] === 'violet')[1] === 'var(--cat-violet)', theme + ': 대비가 되는 색은 그 색 그대로(테마를 따라감)');
      const pc = await p.evaluate(() => window.BX_T.fn.onColor('#4caf50'));
      c.ok(pc.bg === '#4caf50' && pc.on === '#1d2127', theme + ': 휴대폰 캘린더 색(초록)은 진한 글자 ' + JSON.stringify(pc));
    } catch (e) { c.ok(false, theme + ' 막대: ' + (e && e.stack || e)); }
    finally { await app.close(); }
  }

  // (2) 큰 글자: 글꼴 1.3배에서 시각 칸이 함께 커지고 '오후 12:59'가 칸 안에
  for (const clock of ['', '24']) {
    const app = await openApp({ width: 360, height: 780, now: NOW, data: data().map(([k, v]) => k === 'settings' ? [k, Object.assign({}, v, { clock })] : [k, v]) });
    try {
      const p = app.page; await p.waitForTimeout(1100);
      const vis = () => Array.from(document.querySelectorAll('#tcard2 .row-time')).find(t => t.getBoundingClientRect().height > 0).getBoundingClientRect().width;
      const w0 = await p.evaluate(vis);
      await p.evaluate('(' + zoomText.toString() + ')(1.3)'); await p.waitForTimeout(250);
      const z = await p.evaluate(() => { const ts = Array.from(document.querySelectorAll('#tcard2 .row-time')).filter(t => t.getBoundingClientRect().height > 0);
        return { w: ts[0].getBoundingClientRect().width, over: ts.map(t => Array.from(t.children).map(b => [b.textContent, Math.round(b.scrollWidth - t.clientWidth)])).flat().filter(x => x[1] > 0) }; });
      c.ok(Math.abs(z.w - w0 * 1.3) < 1.5 && !z.over.length, (clock ? '24시간' : '오전 · 오후') + ': 글자 1.3배면 시각 칸도 1.3배, 넘치는 시각 없음 ' + JSON.stringify([w0, z]));
      await p.evaluate(() => window.__bxUnzoom && window.__bxUnzoom()); await p.waitForTimeout(150);
      c.ok(Math.abs(await p.evaluate(vis) - w0) < 0.5, '되돌리면 칸도 그대로');
      if (!clock) {
        // 날짜 빠른 칸('다음 주 월')은 두 줄로(잘리지 않음)
        await p.click('.bx-fab'); await p.waitForTimeout(700);
        await p.evaluate(() => { const b = document.querySelector('#sheet-root [data-bxmore]'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); const r = document.querySelector('#sheet-root [data-fpanel="date"]'); if (r) r.click(); });
        await p.waitForTimeout(800);
        await p.evaluate('(' + zoomText.toString() + ')(1.3)'); await p.waitForTimeout(250);
        const cut = (await p.evaluate('(' + audit.toString() + ')({top: true})')).filter(x => x.k === 'cut' || x.k === 'tap');
        c.ok(!cut.length, '글자 1.3배 날짜 페이지: 잘림 · 겹침 없음 ' + JSON.stringify(cut.slice(0, 3)));
      }
    } catch (e) { c.ok(false, '큰 글자 ' + clock + ': ' + (e && e.stack || e)); }
    finally { await app.close(); }
  }

  // (3) 정렬 점검이 일부러 만든 낮은 대비 · 큰 글자 잘림을 잡는지
  {
    const app = await openApp({ width: 384, height: 832, now: NOW, data: data() });
    try {
      const p = app.page; await p.waitForTimeout(900);
      await p.evaluate(() => { const box = document.createElement('div'); box.id = 'bx-t63'; box.style.cssText = 'position:relative;z-index:1;background:#fff;padding:8px';
        // 흰 바탕 3.2:1(보통 글은 걸리고 큰 글자는 통과) · 흰 바탕에선 4.65:1이지만 겹친 회색 바탕 위에선 3.6:1(겹쳐 섞어야 잡힘)
        box.innerHTML = '<p id="t63a" style="color:#8a9099;font-size:14px;margin:0">흐린 안내 글</p><p id="t63b" style="color:#8a9099;font-size:28px;font-weight:700;margin:0">큰 제목</p>'
          + '<button id="t63c" disabled style="color:#c0c4ca;background:#fff;border:0;font-size:14px">못 누름</button>'
          + '<div style="background:rgba(17,20,24,.06)"><div style="background:rgba(17,20,24,.06)"><span id="t63d" style="color:#6e7581;font-size:13px">겹친 바탕 위 회색</span></div></div>'
          + '<span id="t63e" style="display:inline-block;width:86px;overflow:hidden;white-space:nowrap;font-size:16px;font-weight:700">오후 12:59</span>';
        document.querySelector('.screen.today').prepend(box); });
      await p.waitForTimeout(200);
      const r = await p.evaluate('(' + audit.toString() + ')({top: true})');
      const low = r.filter(x => x.k === 'low').map(x => x.t);
      c.ok(low.includes('흐린 안내 글') && low.includes('겹친 바탕 위 회색') && !low.includes('큰 제목') && !low.includes('못 누름'), '대비 점검: 흐린 글 · 겹친 바탕 위 회색은 걸리고, 큰 글자(3:1) · 쓸 수 없는 단추는 빼고 ' + JSON.stringify(low));
      c.ok(!r.filter(x => x.k === 'cut').some(x => x.t === '오후 12:59'), '글자 1배에서는 86px 칸에 들어감');
      await p.evaluate('(' + zoomText.toString() + ')(1.3)'); await p.waitForTimeout(200);
      const r2 = await p.evaluate('(' + audit.toString() + ')({top: true})');
      c.ok(r2.some(x => x.k === 'cut' && x.t === '오후 12:59'), '글자 1.3배에서는 px로 정한 칸이 잘림으로 걸림(정렬 점검 big)');
    } catch (e) { c.ok(false, '점검 시험: ' + (e && e.stack || e)); }
    finally { await app.close(); }
  }
  return c.done();
};
