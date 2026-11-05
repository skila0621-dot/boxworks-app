// 시험판 64(선택실 6 · B, 결정 사안 s26): 말하는 동안 마이크 고리 — 보라 마이크 둘레가 소리만큼 커지고, 조용하면 마이크 크기로
// 휴대폰(BxSpeech)이 1초에 열 번쯤 'level'(0~1)을 알린다. 여기서는 그 알림을 흉내 낸다
const { openApp, settings, checker } = require('./harness.cjs');
const old = '2026-10-29T00:00:00.000Z';

module.exports = async function () {
  const c = checker('시험판 64 · 말하는 동안 마이크 고리');
  for (const theme of ['light', 'dark']) {
    const app = await openApp({ width: 384, height: 832, colorScheme: theme, now: '2026-11-06T09:20:00+09:00', data: [['settings', settings({ bxStart: { at: old, mods: { routines: true } } })]] });
    const p = app.page;
    try {
      await p.waitForTimeout(1000);
      // 듣기를 끝내지 않는 휴대폰 흉내: 알림 받는 곳을 모아 두고, 끝은 window.__spEnd()로
      await p.evaluate(() => {
        const sp = window.Capacitor.Plugins.BxSpeech; window.__spL = {};
        sp.addListener = (ev, cb) => { (window.__spL[ev] = window.__spL[ev] || []).push(cb); return { remove() { window.__spL[ev] = (window.__spL[ev] || []).filter(x => x !== cb); } }; };
        sp.listenLong = () => new Promise(ok => { window.__spEnd = () => ok({ text: '내일 3시 치과' }); });
        window.__lv = v => (window.__spL.level || []).forEach(cb => cb({ v }));
      });
      await p.click('.bx-fab'); await p.waitForTimeout(600);
      await p.click('#sheet-root [data-act="bx-mic"]'); await p.waitForTimeout(400);
      const ui = await p.evaluate(() => { const m = document.querySelector('.bx-listen .bx-ls-mic'), s = window.BX_ICONSRC.app.mic;
        const core = m && m.querySelector('.bx-ls-core'), cs = core && getComputedStyle(core), ring = m && m.querySelector('.bx-ls-ring');
        const t = document.createElement('template'); t.innerHTML = s; const want = t.content.querySelector('svg').innerHTML;   // 같은 식으로 그린 아이콘끼리 견줌
        return m ? { w: m.getBoundingClientRect().width, h: m.getBoundingClientRect().height, svg: !!core.querySelector('svg') && core.querySelector('svg').innerHTML === want, bg: cs.backgroundColor, ring: !!ring, dot: !!document.querySelector('.bx-ls-dot'), subs: (window.__spL.level || []).length } : null; });
      c.ok(ui && ui.w === 28 && ui.h === 28 && ui.svg && ui.ring && !ui.dot && ui.subs === 1, theme + ": '듣는 중' 앞에 보라 마이크(28, 앱 아이콘 세트의 마이크) · 고리, 깜박이던 점은 없음 " + JSON.stringify(ui));
      const scale = () => p.evaluate(() => { const r = document.querySelector('.bx-listen .bx-ls-ring'); const m = getComputedStyle(r).transform; const k = /matrix\(([^,]+)/.exec(m); return k ? Math.round(parseFloat(k[1]) * 100) / 100 : 1; });
      c.ok(Math.abs(await scale() - 1) < 0.02, theme + ': 조용할 때 고리는 마이크 크기');
      // 큰 소리: 0.1초마다 1 → 고리가 1.75배 가까이
      for (let i = 0; i < 6; i++) { await p.evaluate(() => window.__lv(1)); await p.waitForTimeout(100); }
      const big = await scale();
      c.ok(big > 1.6 && big <= 1.76, theme + ': 소리가 크면 고리가 1.75배까지 ' + big);
      // 중간 소리 0.4 → 1.3배 가까이
      for (let i = 0; i < 12; i++) { await p.evaluate(() => window.__lv(0.4)); await p.waitForTimeout(100); }
      const mid = await scale();
      c.ok(mid > 1.22 && mid < 1.4, theme + ': 소리만큼(0.4 → 1.3배쯤) ' + mid);
      // 알림이 끊기면(듣기를 다시 시작하는 사이) 줄어든다
      await p.waitForTimeout(1200);
      const back = await scale();
      c.ok(back < 1.05, theme + ': 알림이 끊기면 고리가 마이크 크기로 ' + back);
      // 끝: 막대가 사라지고 들은 글이 칸에, 알림 받던 것은 거둠
      await p.evaluate(() => window.__spEnd()); await p.waitForTimeout(500);
      const end = await p.evaluate(() => ({ bar: !!document.querySelector('.bx-listen'), val: document.getElementById('f-title').value, subs: (window.__spL.level || []).length }));
      c.ok(!end.bar && /내일 3시 치과/.test(end.val) && end.subs === 0, theme + ': 끝나면 막대가 사라지고 들은 글은 제목 칸에 · 소리 크기 알림도 그만 받음 ' + JSON.stringify(end));
      c.eq(app.errors, [], theme + ': 화면 오류 없음');
    } catch (e) { c.ok(false, theme + ': ' + (e && e.stack || e)); }
    finally { await app.close(); }
  }
  // 창이 열린 동안 위에 뜨는 알림 글은 창 머리(× · 완료)를 가리지 않는다(폭 360 캘린더 목록 — 정렬 점검 cover로 찾음)
  for (const [w, h] of [[360, 780], [384, 832]]) {
    const app = await openApp({ width: w, height: h, insets: { top: 32, bottom: 48 }, now: '2026-11-06T09:20:00+09:00', data: [['settings', settings({ bxStart: { at: old, mods: { routines: true } } })],
      ...Array.from({ length: 9 }, (_, i) => ['c_' + i, { type: 'category', name: '캘린더 ' + (i + 1), color: '#2a78d6', order: i, createdAt: old }])] });
    const p = app.page;
    try {
      await p.waitForTimeout(1000);
      await p.click('.dock [data-view="month"]'); await p.waitForTimeout(600);
      await p.click('.bx-cchip-add'); await p.waitForTimeout(700);
      await p.evaluate(() => window.BX_toast('‘개인’ 캘린더를 뺐어요 · 알림은 울려요'));
      await p.waitForTimeout(500);
      const g = await p.evaluate(() => { const t = document.querySelector('#toasts .toast'), sh = document.querySelector('#sheet-root .sheet'); const a = t.getBoundingClientRect(), b = sh.getBoundingClientRect(), x = sh.querySelector('.sheet-h button'); return { toastB: Math.round(a.bottom), sheetT: Math.round(b.top), x: x ? Math.round(x.getBoundingClientRect().top) : null, tall: Math.round(b.height) }; });
      c.ok(g.toastB <= g.sheetT && (g.x == null || g.toastB <= g.x), w + ': 키가 큰 창 위에 알림 글 자리가 있어 창 머리를 가리지 않음 ' + JSON.stringify(g));
    } catch (e) { c.ok(false, '알림 글 자리 ' + w + ': ' + (e && e.stack || e)); }
    finally { await app.close(); }
  }
  return c.done();
};
