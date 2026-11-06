// 시험판 66(선택실 7 C '돌아온 날 한 장', 결정 사안 d20261106-return · 대표 메모 11/6 02:31):
// 3일 넘게 열지 않다가 열면 '오늘 할 일' 맨 위에 한 장 — 'N일 만이에요 · 확인이 필요한 지난 일이 N개 있어요. 오늘부터 다시 시작할까요, 지난 일을 확인해 볼까요?'
// [오늘부터 시작] 지난 일은 확인 필요에서 빼고(그대로 두기) 캘린더 그날에 그대로, 그날은 맨 위 회색 한 줄 · [지난 일 확인] 확인 필요 창
const { openApp, settings, checker } = require('./harness.cjs');
const old = '2026-10-29T00:00:00.000Z';
const NOW = '2026-11-06T08:10:00+09:00';
const PAST = [
  ['it_a', { type: 'item', title: '은행 서류 내기', date: '2026-11-03', start: '11:00', createdAt: old, updatedAt: old }],
  ['it_b', { type: 'item', title: '택배 보내기', date: '2026-11-03', createdAt: old, updatedAt: old }],
  ['it_c', { type: 'item', title: '세탁소 맡기기', date: '2026-11-04', createdAt: old, updatedAt: old }]];
const TODAY = [['it_t1', { type: 'item', title: '치과', date: '2026-11-06', start: '15:00', end: '16:00', createdAt: old, updatedAt: old }]];
const seed = (items) => [['settings', settings({ bxStart: { at: old, mods: { routines: true } } })]].concat(items || PAST.concat(TODAY));
const doc = (p, id) => p.evaluate(id => (window.BX_T.docs().find(([k]) => k === id) || [0, null])[1], id);
async function openWith(o) {
  const app = await openApp({ width: o.width || 384, height: 832, colorScheme: o.theme || 'light', now: o.now || NOW, data: seed(o.items) });
  const p = app.page;
  await p.waitForTimeout(600);
  await p.evaluate(s => { if (s === null) localStorage.removeItem('bx:seen'); else localStorage.setItem('bx:seen', s); localStorage.removeItem('bx:ret'); }, o.seen === undefined ? null : o.seen);
  await p.reload(); await p.waitForFunction(() => window.BX_T && document.querySelector('.dock')); await p.waitForTimeout(1100);
  return app;
}
const look = p => p.evaluate(() => {
  const tl = document.querySelector('#tcard2 .bx-tl'), card = document.querySelector('#tcard2 .bx-ret'), tile = document.querySelector('[data-act="bx-late-open"]');
  const line = document.querySelector('#tcard2 .bx-ret-line'), tog = document.querySelector('#tcard2 .bx-past-tog:not(.bx-ret-line)'), badge = document.getElementById('dock-badge');
  return { card: !!card, first: !!(card && tl && tl.firstElementChild === card), title: card ? card.querySelector('b').textContent : '', text: card ? card.querySelector('p').textContent : '',
    btns: card ? Array.from(card.querySelectorAll('.btn')).map(b => b.textContent + (b.classList.contains('primary') ? '*' : '')) : [], line: line ? line.textContent : '', lineFirst: !!(line && tl && tl.firstElementChild === line),
    tog: tog ? tog.textContent : '', tile: tile ? tile.textContent.replace(/\s+/g, '') : '', badge: badge ? (badge.hidden ? '' : badge.textContent) : '',
    seen: localStorage.getItem('bx:seen'), st: (JSON.parse(localStorage.getItem('bx:ret') || 'null') || {}).st || '' };
});

module.exports = async function () {
  const c = checker('시험판 66 · 돌아온 날 한 장(쉬운 복귀)');
  for (const theme of ['light', 'dark']) {
    // 3일 만(화 → 금), 확인이 필요한 지난 일 셋
    const app = await openWith({ theme, seen: '2026-11-03' });
    const p = app.page;
    try {
      const a = await look(p);
      c.ok(a.card && a.first && a.title === '3일 만이에요' && /확인이 필요한 지난 일이 3개 있어요/.test(a.text) && /오늘부터 다시 시작할까요, 지난 일을 확인해 볼까요\?/.test(a.text), theme + ": '오늘 할 일' 맨 위에 한 장 — 3일 만이에요 · 지난 일 3개 · 선택지 두 가지 " + JSON.stringify(a));
      c.eq(a.btns, ['오늘부터 시작*', '지난 일 확인'], theme + ': 단추 둘(오늘부터 시작이 보라)');
      c.ok(!a.tog && a.seen === '2026-11-06' && a.st === 'card', theme + ": 한 장이 있는 동안 '지난 일 N개' 줄은 넣어 둠 · 연 날은 오늘로 " + JSON.stringify(a));
      const bb = await p.evaluate(() => Array.from(document.querySelectorAll('#tcard2 .bx-ret .btn')).map(b => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), b.scrollWidth <= b.clientWidth + 1]; }));
      c.ok(bb.length === 2 && bb[0][0] === bb[1][0] && bb.every(x => x[1] >= 48 && x[2]), theme + ': 단추 둘은 반씩 · 높이 48 이상 · 글이 넘치지 않음 ' + JSON.stringify(bb));
      // 다시 열어도 그날은 그대로(누르기 전)
      await p.reload(); await p.waitForFunction(() => window.BX_T && document.querySelector('.dock')); await p.waitForTimeout(1000);
      c.ok((await look(p)).card, theme + ': 그날 다시 열어도 한 장은 그대로(아직 고르지 않음)');
      // 오늘부터 시작: 지난 일은 확인 필요에서 빠지고 캘린더 그날에 그대로, 맨 위 회색 한 줄
      await p.click('#tcard2 [data-act="bx-ret-fresh"]'); await p.waitForTimeout(800);
      const b = await look(p), kept = await Promise.all(['it_a', 'it_b', 'it_c'].map(id => doc(p, id)));
      c.ok(!b.card && b.lineFirst && b.line === '지난 일 3개는 캘린더 그날에 그대로 있어요' && b.tile === '확인필요0' && !b.badge && b.st === 'kept', theme + ': 오늘부터 시작 → 한 장 대신 회색 한 줄 · 확인 필요 0 · 아래 메뉴 숫자 없음 ' + JSON.stringify(b));
      c.ok(kept.every(d => d && d.lateKeep && d.date < '2026-11-06' && !d.done), theme + ': 지난 일은 그날 그대로(날짜 · 완료 안 바뀜, 그대로 두기) ' + JSON.stringify(kept.map(d => [d.date, !!d.lateKeep])));
      c.ok(!b.tog && await p.evaluate(() => !document.querySelector('#tcard2 .bx-past .row')), theme + ": 홈 '지난 일'에도 넣지 않음(캘린더 그날에만)");
      const toast = await p.evaluate(() => { const t = document.querySelector('#toasts .toast'); return t ? t.textContent : ''; });
      c.ok(/지난 일 3개는 캘린더 그날에 그대로 둘게요/.test(toast) && /되돌리기/.test(toast), theme + ': 알림 글 · 되돌리기 ' + toast);
      // 되돌리기 → 한 장이 다시, 지난 일도 다시 확인 필요
      await p.click('#toasts .toast button'); await p.waitForTimeout(800);
      const u = await look(p), back = await doc(p, 'it_a');
      c.ok(u.card && /3개/.test(u.text) && u.tile === '확인필요3' && !back.lateKeep && u.st === 'card', theme + ': 되돌리기 → 한 장 · 확인 필요 3 ' + JSON.stringify({ u, k: back.lateKeep }));
      // 지난 일 확인 → 확인 필요 창
      await p.click('#tcard2 [data-act="bx-ret-see"]'); await p.waitForTimeout(700);
      const sh = await p.evaluate(() => { const h = document.querySelector('#sheet-root .sheet-h h2, #sheet-root .sheet-h .sheet-t, #sheet-root [id^="sheet-t"]'); return { t: h ? h.textContent : (document.querySelector('#sheet-root .sheet') || {}).textContent || '', cards: document.querySelectorAll('#sheet-root .bx-lc').length }; });
      c.ok(/확인 필요/.test(sh.t) && sh.cards === 3, theme + ': 지난 일 확인 → 확인 필요 창(일정 셋) ' + JSON.stringify(sh));
      await p.evaluate(() => window.BX_back && window.BX_back()); await p.waitForTimeout(500);
      const s2 = await look(p);
      c.ok(!s2.card && !s2.line && s2.st === 'seen' && /지난 일 3개/.test(s2.tog), theme + ": 창을 닫으면 한 장 없이 평소처럼('지난 일 3개' 줄) " + JSON.stringify(s2));
      c.eq(app.errors, [], theme + ': 화면 오류 없음');
    } catch (e) { c.ok(false, theme + ': ' + (e && e.stack || e)); }
    finally { await app.close(); }
  }
  // 회색 한 줄을 누르면 캘린더
  {
    const app = await openWith({ seen: '2026-11-02' });
    const p = app.page;
    try {
      const a = await look(p);
      c.ok(a.card && a.title === '4일 만이에요', '4일 만이면 4일 만이에요 ' + a.title);
      await p.click('#tcard2 [data-act="bx-ret-fresh"]'); await p.waitForTimeout(700);
      await p.click('#tcard2 .bx-ret-line'); await p.waitForTimeout(700);
      c.eq(await p.evaluate(() => window.BX_T.fn.view()), 'month', '회색 한 줄을 누르면 캘린더');
      c.eq(app.errors, [], '화면 오류(회색 한 줄)');
    } catch (e) { c.ok(false, '회색 한 줄: ' + (e && e.stack || e)); }
    finally { await app.close(); }
  }
  // 한 장이 나오지 않는 때: 처음 연 날 · 이틀 만 · 지난 일 없음 · 다음 날
  for (const [name, o, want] of [['처음 연 날(연 날 기록 없음)', { seen: null }, false], ['이틀 만', { seen: '2026-11-04' }, false],
    ['3일 만이어도 확인이 필요한 지난 일이 없으면', { seen: '2026-11-03', items: TODAY }, false], ['전날 열었으면', { seen: '2026-11-05' }, false]]) {
    const app = await openWith(o);
    try {
      const a = await look(app.page);
      c.ok(a.card === want && a.seen === '2026-11-06', name + ': 한 장 없음 · 연 날은 오늘로 ' + JSON.stringify({ card: a.card, seen: a.seen }));
    } catch (e) { c.ok(false, name + ': ' + (e && e.stack || e)); }
    finally { await app.close(); }
  }
  // 폭 360: 단추 글이 넘치지 않음
  {
    const app = await openWith({ width: 360, seen: '2026-11-03' });
    try {
      const bb = await app.page.evaluate(() => Array.from(document.querySelectorAll('#tcard2 .bx-ret .btn')).map(b => [b.scrollWidth <= b.clientWidth + 1, Math.round(b.getBoundingClientRect().height)]));
      c.ok(bb.length === 2 && bb.every(x => x[0] && x[1] >= 48), '폭 360: 단추 글이 넘치지 않음 ' + JSON.stringify(bb));
    } catch (e) { c.ok(false, '폭 360: ' + (e && e.stack || e)); }
    finally { await app.close(); }
  }
  return c.done();
};
