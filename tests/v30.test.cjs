// 시험판 30: 누르면 나오는 칸은 누른 자리에서(규칙 12), 빈 공간 줄이기, 일정 넣는 입구·마이크, 고르는 칸 규칙(규칙 11)
const { openApp, settings, checker } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
function data(extra) {
  return [
    ['settings', settings(Object.assign({ bxReport: { on: true, at: '07:30' } }, extra || {}))],
    ['it_1', { type: 'item', title: '치과', date: '2026-11-02', start: '15:00', remind: '10', createdAt: old, updatedAt: old }],
    ['it_2', { type: 'item', title: '장보기', date: '2026-11-02', createdAt: old, updatedAt: old }],
    ['it_3', { type: 'item', title: '보고서 마감', date: '2026-11-03', start: '10:00', createdAt: old, updatedAt: old }],
    ['rt_m', { type: 'routine', name: '아침 준비', days: [0, 1, 2, 3, 4, 5, 6], mode: 'start', target: '07:30', times: 6, every: 5, on: true,
      steps: [{ id: 'a', name: '씻기', min: 15 }, { id: 'b', name: '옷 입기', min: 10 }], createdAt: old, updatedAt: old }],
    ['tt_a', { type: 'tt', name: '경영학원론', days: [1, 3], start: '10:30', end: '12:00', remind: '10', on: true, createdAt: old, updatedAt: old }]
  ];
}
const rect = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, r: r.right }; }, sel);

module.exports = async function () {
  const c = checker('시험판 30 · 시선 흐름 · 빈 공간');

  // 1) 홈: 한 목록, 시각 순서(종일 → 07:30 루틴 → 10:30 수업 → 15:00 일정), 칸 제목 없음
  let app = await openApp({ data: data() });
  try {
    const p = app.page;
    const s = await p.evaluate(() => ({
      order: Array.from(document.querySelectorAll('.bx-tl > *')).map(e => e.classList.contains('now-line') ? '지금' : (e.querySelector('.row-title, .rt-h > b, .row-main') || e).textContent.replace(/\s+/g, ' ').trim().slice(0, 8)),
      heads: Array.from(document.querySelectorAll('#tcard2 h2')).map(h => h.textContent.trim())
    }));
    c.eq(s.heads, ['오늘 할 일'], "홈에는 '오늘 할 일' 제목 하나(루틴·일정·수업 칸 제목 없음)");
    const want = ['장보기', '지금', '아침 준비', '10:30', '치과'];
    c.ok(s.order.length === want.length && want.every((w, i) => (s.order[i] || '').indexOf(w) >= 0), '시각 순서: ' + JSON.stringify(s.order));
    // 새 일정 창: 마이크에 '말하기', 칩을 눌러도 칩이 움직이지 않는다
    await p.click('.bx-fab'); await p.waitForTimeout(500);
    c.ok(/말하기/.test(await p.evaluate(() => (document.querySelector('#sheet-root [data-act="bx-mic"]') || {}).innerText || '')), "마이크 단추에 '말하기' 글자");
    c.ok(await p.evaluate(() => document.querySelectorAll('#f-panel [data-bx-fex]').length) === 3, '칩을 누르기 전 그 자리에 예문 셋');
    let moved = [];
    for (const k of ['date', 'time', 'rem', 'cat', 'more', 'go']) {
      const sel = '#f-chips [data-fpanel="' + k + '"]';
      const a = await rect(p, sel); if (!a) continue;
      await p.click(sel); await p.waitForTimeout(300);
      const b = await rect(p, sel);
      if (!b || Math.abs(b.y - a.y) > 2) moved.push(k + ' ' + Math.round(a.y) + '→' + (b ? Math.round(b.y) : '없음'));
    }
    c.eq(moved, [], '새 일정 창: 칩을 눌러도 칩이 제자리');
    // 일정 알림 고르는 칸(규칙 11): 시간을 정한 일정은 정시·10분 전·1시간 전 + 직접 입력, '알림 없이'는 아래 글자 단추
    await p.fill('#f-title', '내일 오후 3시 치과'); await p.waitForTimeout(300);
    await p.click('#f-chips [data-fpanel="rem"]'); await p.waitForTimeout(300);
    const q = await p.evaluate(() => Array.from(document.querySelectorAll('#f-rem .bx-rem-q .pick')).map(b => b.textContent.trim()));
    c.eq(q, ['정시', '10분 전', '1시간 전', '직접 입력'].map((x, i) => i < 3 ? x : q[3]), '일정 알림 칩: ' + JSON.stringify(q));
    await p.click('#f-rem [data-bx-rem="60"]'); await p.waitForTimeout(200);
    c.eq(await p.evaluate(() => (document.querySelector('#f-chips [data-fpanel="rem"]') || {}).textContent.trim()), '1시간 전', "칩 하나를 고르면 알림이 그 하나로");
    await p.click('#f-rem [data-bx-rem=""]'); await p.waitForTimeout(200);
    c.eq(await p.evaluate(() => (document.querySelector('#f-chips [data-fpanel="rem"]') || {}).textContent.trim()), '알림 없음', "'알림 없이'를 누르면 알림 없음");
    c.eq(app.errors, [], '화면 오류(홈·새 일정)');
  } finally { await app.close(); }

  // 2) 설정: 켜기를 누르면 시각 칩이 그 바로 아래 오른쪽에(오른쪽 끝이 켜기 단추와 같은 줄)
  app = await openApp({ data: data({ bxReport: { on: false, at: '07:30' } }) });
  try {
    const p = app.page;
    await p.click('[data-act="more"]'); await p.waitForTimeout(400);
    await p.locator('#sheet-root button', { hasText: '설정' }).first().click(); await p.waitForTimeout(600);
    await p.evaluate(() => document.querySelector('[data-bxrep="1"]').scrollIntoView({ block: 'center' })); await p.waitForTimeout(200);
    const seg = await rect(p, '[data-bxrep="1"]');
    await p.click('[data-bxrep="1"]'); await p.waitForTimeout(500);
    const chip = await rect(p, '.bx-tchip:has(#bx-rep-t)');
    c.ok(chip && Math.abs(chip.r - seg.r) < 6 && chip.y > seg.y && chip.y - (seg.y + seg.h) < 70, '아침 일정 시각: 켜기 바로 아래 오른쪽 ' + JSON.stringify({ seg, chip }));
    c.eq(await p.evaluate(() => document.querySelector('.bx-tchip:has(#bx-rep-t) .bx-tchip-v').textContent), '07:30', '시각은 24시간으로 보인다');
    await p.evaluate(() => { const i = document.getElementById('bx-rep-t'); i.value = '06:45'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
    await p.waitForTimeout(400);
    const rep = await p.evaluate(() => (window.BX_T.docs().find(([id]) => id === 'settings') || [0, {}])[1].bxReport);
    c.eq(rep && rep.at, '06:45', '시계 창에서 고른 시각이 저장된다');
  } finally { await app.close(); }

  // 3) 수업 추가: '직접 입력'이 그 칩 자리에서 입력칸이 되고, 저장된다
  app = await openApp({ data: data() });
  try {
    const p = app.page;
    await p.click('.dock [data-view="tt"]'); await p.waitForTimeout(600);
    await p.locator('button', { hasText: '수업 추가' }).filter({ visible: true }).first().click(); await p.waitForTimeout(500);
    const pills = await p.evaluate(() => Array.from(document.querySelectorAll('.tt-pills > *')).map(e => e.textContent.trim()));
    c.eq(pills, ['정시', '10분 전', '30분 전', '직접 입력'], '수업 알림: 셋 + 직접 입력');
    const cb = await rect(p, '[data-act="tt-rem"][data-v="custom"]');
    await p.click('[data-act="tt-rem"][data-v="custom"]'); await p.waitForTimeout(300);
    const inp = await rect(p, '#tt-rem-c');
    c.ok(inp && Math.abs(inp.y - cb.y) < 12 && inp.x > cb.x - 40, "'직접 입력' 자리에서 입력칸이 열림 " + JSON.stringify({ cb, inp }));
    await p.fill('#tt-name', '통계학'); await p.fill('#tt-rem-c', '20');
    if (await p.evaluate(() => !document.querySelector('[data-act="tt-day"][aria-pressed="true"]'))) await p.click('[data-act="tt-day"][data-d="2"]');
    await p.click('#sheet-root [data-act="tt-save"]'); await p.waitForTimeout(500);
    const tt = await p.evaluate(() => (window.BX_T.docs().find(([, d]) => d && d.type === 'tt' && d.name === '통계학') || [0, null])[1]);
    c.eq(tt && tt.remind, '20', '직접 입력한 20분 전이 저장됨');
    c.eq(app.errors, [], '화면 오류(시간표)');
  } finally { await app.close(); }

  // 4) 주간·월간: 일정 없는 날은 한 줄, 월간은 날짜를 누르면 아래 목록이 그날로
  app = await openApp({ data: data() });
  try {
    const p = app.page;
    await p.click('.dock [data-view="month"]'); await p.waitForTimeout(600);
    c.ok(await p.evaluate(() => !!document.querySelector('#agenda')), '월간 아래에 고른 날 목록');
    await p.evaluate(() => Array.from(document.querySelectorAll('.cal [data-date="2026-11-03"]')).find(e => e.getBoundingClientRect().width > 20).click());
    await p.waitForTimeout(600);
    const ag = await p.evaluate(() => ({ sheet: !!document.querySelector('#sheet-root .sheet'), h: (document.querySelector('#h-agenda') || {}).textContent, rows: Array.from(document.querySelectorAll('#agenda .row-title')).map(e => e.textContent.trim()) }));
    c.ok(!ag.sheet && /11월 3일/.test(ag.h || '') && ag.rows.includes('보고서 마감'), '날짜를 누르면 창 대신 아래 목록이 그날로 ' + JSON.stringify(ag));
    await p.locator('button', { hasText: '주간' }).filter({ visible: true }).first().click(); await p.waitForTimeout(600);
    const wk = await p.evaluate(() => Array.from(document.querySelectorAll('.day-g')).map(e => [e.id.slice(-2), e.classList.contains('bx-wk-empty'), Math.round(e.getBoundingClientRect().height)]));
    const empty = wk.filter(x => x[1]);
    c.ok(empty.length >= 3 && empty.every(x => x[2] <= 52), '일정 없는 날은 한 줄 ' + JSON.stringify(wk));
    c.eq(app.errors, [], '화면 오류(캘린더)');
  } finally { await app.close(); }

  // 5) 명상: 5·10·20분 + 직접 입력, 직접 입력은 그 자리에서
  app = await openApp({ data: data() });
  try {
    const p = app.page;
    await p.click('.dock [data-view="med"]'); await p.waitForTimeout(600);
    const mins = await p.evaluate(() => Array.from(document.querySelector('.bx-med-set .picks').children).map(e => e.textContent.trim()));
    c.eq(mins, ['5분', '10분', '20분', '직접 입력'], '명상 시간: 셋 + 직접 입력');
    await p.click('[data-med-custom]'); await p.waitForTimeout(300);
    c.ok(await p.evaluate(() => !!document.querySelector('.bx-med-set .picks #bx-med-cmin')), '직접 입력이 칩 줄 안에서 입력칸으로');
    c.eq(app.errors, [], '화면 오류(명상)');
  } finally { await app.close(); }
  return c.done();
};
