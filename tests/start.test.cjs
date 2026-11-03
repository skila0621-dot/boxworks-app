// 처음 설치한 날: 미리 골라 둔 칸이 없어야 한다(D-10 보완 11/2), 음성 인식이 없는 휴대폰, 알림이 꺼졌을 때 홈의 빨간 줄
const { openApp, settings, checker } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';

module.exports = async function () {
  const c = checker('처음 설치한 날 · 마이크 · 알림 꺼짐');

  // 1) 첫 실행: '일정·캘린더'만 켜져 있고 '추천 기본 기능' 표시, 나머지는 비어 있다
  let app = await openApp({ data: null });
  try {
    const p = app.page;
    await p.waitForSelector('#bx-start', { timeout: 5000 });
    const s1 = await p.evaluate(() => ({
      checked: Array.from(document.querySelectorAll('#bx-start [data-bxs-mod]')).map(b => b.getAttribute('aria-checked')),
      fixed: (document.querySelector('#bx-start .bxs-opt.fixed') || {}).innerText || '',
      go: (document.querySelector('#bx-start [data-bxs="next"]') || {}).innerText || ''
    }));
    c.eq(s1.checked, ['false', 'false', 'false', 'false'], '쓸 기능 네 개는 비어 있음');
    c.ok(/추천 기본 기능/.test(s1.fixed), "'일정·캘린더'에 '추천 기본 기능' 표시");
    c.eq(s1.go.replace(/\s+/g, ' ').trim(), '다음 · 1개 선택', '다음 단추');
    // 루틴만 고르고 시작하면 루틴만 켜진다
    await p.click('#bx-start [data-bxs-mod="routines"]');
    await p.click('#bx-start [data-bxs="next"]');
    await p.click('#bx-start [data-bxs="done"]');
    await p.waitForTimeout(500);
    const mods = await p.evaluate(() => (window.BX_T.docs().find(([id]) => id === 'settings') || [0, {}])[1].bxStart.mods);
    c.eq(mods, { report: false, routines: true, tt: false, med: false }, '고른 기능만 켜짐');
    // 루틴 도우미: 나가는 시각은 미리 고르지 않고, 단계도 비어 있다
    await p.click('.dock [data-view="routines"]');
    await p.waitForTimeout(700);
    const q1 = await p.evaluate(() => ({
      on: document.querySelectorAll('#bx-start .bxs-big.on').length,
      next: !!(document.querySelector('#bx-start [data-bxr-nav="next"]') || {}).disabled
    }));
    c.eq(q1, { on: 0, next: true }, '나가는 시각: 골라 둔 것 없음, 다음 단추 잠김');
    await p.click('#bx-start [data-bxr="08:00"]');
    await p.click('#bx-start [data-bxr-nav="next"]');
    await p.waitForTimeout(300);
    const q2 = await p.evaluate(() => ({
      on: document.querySelectorAll('#bx-start .bxr-st.on').length,
      make: !!(document.querySelector('#bx-start [data-bxr-nav="next"]') || {}).disabled
    }));
    c.eq(q2, { on: 0, make: true }, '넣을 단계: 골라 둔 것 없음, 루틴 만들기 잠김');
    c.eq(app.errors, [], '화면 오류(첫 실행)');
  } finally { await app.close(); }

  // 2) 건너뛰기: 고른 것이 없으니 '일정·캘린더'만
  app = await openApp({ data: null });
  try {
    const p = app.page;
    await p.waitForSelector('#bx-start [data-bxs="skip"]', { timeout: 5000 });
    await p.click('#bx-start [data-bxs="skip"]');
    await p.waitForTimeout(500);
    const st = await p.evaluate(() => (window.BX_T.docs().find(([id]) => id === 'settings') || [0, {}])[1]);
    c.eq(st.bxStart && st.bxStart.mods, { report: false, routines: false, tt: false, med: false }, '건너뛰면 기능을 켜지 않음');
    c.eq(st.bxReport && st.bxReport.on, false, '건너뛰면 아침 일정 알림도 꺼짐');
  } finally { await app.close(); }

  // 3) 음성 인식이 없는 휴대폰: 마이크를 숨긴다
  const data = [['settings', settings()], ['it_1', { type: 'item', title: '치과', date: '2026-11-02', start: '15:00', remind: '10', createdAt: old, updatedAt: old }]];
  app = await openApp({ data, speech: false });
  try {
    const p = app.page;
    await p.waitForTimeout(500);
    c.eq(await p.evaluate(() => window.BX_HAS_MIC), false, '음성 인식이 없으면 BX_HAS_MIC = false');
    await p.evaluate(() => { const b = document.querySelector('[data-act="new"]'); if (b) b.click(); });
    await p.waitForTimeout(600);
    c.eq(await p.evaluate(() => document.querySelectorAll('[data-act="bx-mic"]').length), 0, '새 일정 창에 마이크 단추가 없음');
  } finally { await app.close(); }
  app = await openApp({ data, speech: true });
  try {
    const p = app.page;
    await p.evaluate(() => { const b = document.querySelector('[data-act="new"]'); if (b) b.click(); });
    await p.waitForTimeout(600);
    c.ok(await p.evaluate(() => document.querySelectorAll('[data-act="bx-mic"]').length) > 0, '음성 인식이 있으면 마이크 단추가 있음');
  } finally { await app.close(); }

  // 4) 알림이 꺼져 있으면 홈 맨 위에 빨간 줄
  app = await openApp({ data, perms: { notifications: false, exact: true, fullScreen: true, battery: true } });
  try {
    const p = app.page;
    await p.waitForTimeout(1500);
    const bar = await p.evaluate(() => { const b = document.getElementById('bx-permbar'); return b ? b.innerText : ''; });
    c.ok(/알림이 꺼져 있어 알람이 울리지 않아요/.test(bar), '알림 꺼짐 빨간 줄: ' + JSON.stringify(bar));
    await p.evaluate(() => { window.__perm.notifications = true; window.BX_permCheck(); });
    await p.waitForTimeout(300);
    c.eq(await p.evaluate(() => !!document.getElementById('bx-permbar')), false, '알림을 켜면 빨간 줄이 사라짐');
    c.eq(app.errors, [], '화면 오류(알림 꺼짐)');
  } finally { await app.close(); }
  return c.done();
};
