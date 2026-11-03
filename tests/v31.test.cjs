// 시험판 31: 루틴마다 '공휴일에는 쉬기'(대표 요청·결정 11/2), 쉬는 루틴 줄은 홈 목록의 그 시각 자리에,
// 켜고 끄는 칸은 스위치 하나(설정 · 명상 호흡 안내)
const { openApp, settings, checker } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
const kst = ms => new Date(ms + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');
function data(extra) {
  return [
    ['settings', settings(Object.assign({}, extra || {}))],
    ['it_1', { type: 'item', title: '가족 저녁', date: '2026-12-25', start: '18:00', createdAt: old, updatedAt: old }],
    ['it_2', { type: 'item', title: '치과', date: '2026-11-02', start: '15:00', createdAt: old, updatedAt: old }],
    ['rt_w', { type: 'routine', name: '출근 준비', days: [1, 2, 3, 4, 5], mode: 'start', target: '07:30', times: 6, every: 5, on: true, skipHol: true,
      steps: [{ id: 'a', name: '씻기', min: 15 }, { id: 'b', name: '옷 입기', min: 10 }], createdAt: old, updatedAt: old }],
    ['rt_m', { type: 'routine', name: '아침 약', days: [0, 1, 2, 3, 4, 5, 6], mode: 'start', target: '08:00', times: 2, every: 5, on: true,
      steps: [{ id: 'a', name: '물 마시기', min: 2 }], createdAt: old, updatedAt: old }]
  ];
}
const plan = p => p.evaluate(() => window.BX_alarmPlan(5).filter(a => a.kind === 'routine').map(a => ({ at: a.at, g: a.group })));
const tl = p => p.evaluate(() => Array.from(document.querySelectorAll('.bx-tl > *')).map(e => ({
  t: e.classList.contains('now-line') ? '지금' : (e.querySelector('.row-title, .rt-h > b, .row-main') || e).textContent.replace(/\s+/g, ' ').trim().slice(0, 8),
  off: e.classList.contains('off'), next: e.classList.contains('bx-next') || e.classList.contains('bx-next-soft'),
  note: ((e.querySelector('.rt-note') || {}).textContent || '').trim(), btn: ((e.querySelector('.rt-h [data-act]') || {}).textContent || '').trim()
})));

module.exports = async function () {
  const c = checker('시험판 31 · 공휴일 쉬기 · 스위치');

  // 1) 공휴일(12/25 성탄절, 금): '공휴일에는 쉬기'를 켠 루틴은 알람이 없고, 홈에는 그 시각 자리에 흐리게
  let app = await openApp({ now: '2026-12-25T06:50:00+09:00', data: data() });
  try {
    const p = app.page;
    const a = await plan(p);
    const day = (g, ds) => a.filter(x => x.g === g && kst(x.at).startsWith(ds)).length;
    c.eq(day('출근 준비', '2026-12-25'), 0, '공휴일에는 쉬는 루틴: 그날 알람 없음');
    c.ok(day('출근 준비', '2026-12-28') > 0, '다음 평일(12/28 월)에는 울림');
    c.ok(day('아침 약', '2026-12-25') > 0, "'공휴일에는 쉬기'를 켜지 않은 루틴은 공휴일에도 울림");
    const rows = await tl(p);
    const w = rows.find(r => r.t.indexOf('출근 준비') >= 0), wi = rows.indexOf(w), mi = rows.findIndex(r => r.t.indexOf('아침 약') >= 0);
    c.ok(w && w.off && w.note === '오늘은 성탄절이라 쉬어요.' && w.btn === '오늘은 하기', "홈: 쉬는 루틴 줄에 '오늘은 성탄절이라 쉬어요.'와 '오늘은 하기' " + JSON.stringify(w));
    c.ok(wi >= 0 && mi > wi && !w.next && rows[mi].next, "쉬는 줄은 07:30 자리, '다음'은 그다음 08:00 루틴에 " + JSON.stringify(rows));
    // 그날만 하기
    await p.click('[data-act="bx-holrun"]'); await p.waitForTimeout(600);
    const a2 = await plan(p);
    c.ok(a2.some(x => x.g === '출근 준비' && kst(x.at).startsWith('2026-12-25')), "'오늘은 하기'를 누르면 그날 알람이 다시 잡힘");
    const w2 = (await tl(p)).find(r => r.t.indexOf('출근 준비') >= 0);
    c.ok(w2 && !w2.off && w2.next, "'오늘은 하기' 뒤에는 보통 루틴 줄(다음 할 일) " + JSON.stringify(w2));
    // 루틴 목록 글자
    await p.click('.dock [data-view="routines"]'); await p.waitForTimeout(600);
    const sums = await p.evaluate(() => Array.from(document.querySelectorAll('.rt-item .rt-open')).map(e => e.textContent.replace(/\s+/g, ' ').trim()));
    c.ok(sums.some(s => /^출근 준비평일\(공휴일 빼고\)/.test(s)) && sums.some(s => /^아침 약매일 ·/.test(s)), "루틴 목록: '평일(공휴일 빼고)' " + JSON.stringify(sums));
    // 고치기 창: 요일 바로 아래 스위치(처음엔 꺼짐), 켜면 바로 아래 안내, 저장된다
    await p.locator('.rt-item .rt-open', { hasText: '아침 약' }).first().click(); await p.waitForTimeout(600);
    const s0 = await p.evaluate(() => { const b = document.querySelector('#sheet-root [data-rhol]'), d = document.querySelector('#sheet-root .rdays'); if (!b || !d) return null; const rb = b.getBoundingClientRect(), rd = d.getBoundingClientRect(); return { on: b.getAttribute('aria-checked'), role: b.getAttribute('role'), gap: Math.round(rb.top - rd.bottom), note: document.querySelector('#sheet-root .bx-hol-note').hidden }; });
    c.ok(s0 && s0.on === 'false' && s0.role === 'switch' && s0.gap >= 0 && s0.gap < 40 && s0.note, "고치기 창: 요일 바로 아래 '공휴일에는 쉬기' 스위치, 처음엔 꺼짐 " + JSON.stringify(s0));
    await p.click('#sheet-root [data-rhol]'); await p.waitForTimeout(300);
    c.eq(await p.evaluate(() => [document.querySelector('#sheet-root [data-rhol]').getAttribute('aria-checked'), document.querySelector('#sheet-root .bx-hol-note').hidden]), ['true', false], '스위치를 켜면 바로 아래 안내 한 줄');
    await p.click('#sheet-root [data-act="rt-save"]'); await p.waitForTimeout(500);
    c.eq(await p.evaluate(() => (window.BX_T.docs().find(([id]) => id === 'rt_m') || [0, {}])[1].skipHol), true, '저장하면 루틴에 남음');
    // 앞의 알림('오늘은 … 해요')이 사라진 뒤에 나온다
    const want = '아침 약을 저장했어요. 매일(공휴일 빼고) 08:00에 시작해요.';
    await p.waitForFunction(w => Array.from(document.querySelectorAll('.toast')).some(t => t.textContent === w), want, { timeout: 8000 }).catch(() => {});
    c.eq(await p.evaluate(w => Array.from(document.querySelectorAll('.toast')).map(t => t.textContent).find(t => t === w) || Array.from(document.querySelectorAll('.toast')).map(t => t.textContent).join(' / '), want), want, '저장 알림 글자(조사 · 공휴일 빼고)');
    c.eq(app.errors, [], '화면 오류(공휴일)');
  } finally { await app.close(); }

  // 2) 평일(11/2 월): 공휴일이 아니면 그대로 울림. '오늘 쉬기'로 쉬는 루틴 줄도 목록 맨 아래가 아니라 그 시각 자리에
  app = await openApp({ data: data().concat([['rl_rt_m_20261102', { type: 'rlog', rid: 'rt_m', date: '2026-11-02', done: {}, started: {}, extra: {}, skip: true, createdAt: old, updatedAt: old }]]) });
  try {
    const p = app.page;
    const a = await plan(p);
    c.ok(a.some(x => x.g === '출근 준비' && kst(x.at).startsWith('2026-11-02')), '공휴일이 아닌 날에는 그대로 울림');
    const rows = await tl(p);
    const order = rows.map(r => r.t);
    const mi = order.findIndex(t => t.indexOf('아침 약') >= 0), di = order.findIndex(t => t.indexOf('치과') >= 0);
    c.ok(mi >= 0 && di > mi && rows[mi].off && !rows[mi].next && rows[mi].note === '오늘은 건너뛰어요.', "'오늘 쉬기'한 루틴: 08:00 자리에 흐리게, '다음' 없음 " + JSON.stringify(rows));
    c.eq(app.errors, [], '화면 오류(쉬는 루틴)');
  } finally { await app.close(); }

  // 3) 켜고 끄는 칸은 스위치 하나: 설정과 명상 호흡 안내
  app = await openApp({ data: data({ defaultRemind: 10 }) });
  try {
    const p = app.page;
    await p.click('[data-act="more"]'); await p.waitForTimeout(400);
    await p.locator('#sheet-root button', { hasText: '설정' }).first().click(); await p.waitForTimeout(600);
    // 시험판 32: 설정은 묶음 목록. 묶음마다 들어가 '끄기 | 켜기' 두 칸이 없는지 본다
    const segs = [];
    // 시험판 38: 묶음 화면 → 자세한 화면까지 모두 들어가 본다
    const offOn = () => p.evaluate(() => Array.from(document.querySelectorAll('.set-sec .seg')).map(s => Array.from(s.querySelectorAll('button')).map(b => b.textContent.trim()).join('|')).filter(t => t === '끄기|켜기'));
    for (const k of await p.evaluate(() => Array.from(document.querySelectorAll('[data-bxset]')).map(b => b.dataset.bxset).filter(Boolean))) {
      await p.click('[data-bxset="' + k + '"]'); await p.waitForTimeout(300);
      segs.push(...await offOn());
      for (const d of await p.evaluate(() => Array.from(document.querySelectorAll('[data-bxset*="/"]')).map(b => b.dataset.bxset))) {
        await p.click('[data-bxset="' + d + '"]'); await p.waitForTimeout(250);
        segs.push(...await offOn());
        await p.click('.bx-set-back'); await p.waitForTimeout(250);
      }
      await p.click('[data-bxset=""]'); await p.waitForTimeout(300);
    }
    c.eq(segs, [], "설정에 '끄기 | 켜기' 두 칸 단추가 남지 않음");
    await p.click('[data-bxset="alarm"]'); await p.waitForTimeout(400);
    // 아침 요약은 묶음 화면 줄에서 바로, 일정 알림 · 종일 일정은 자세한 화면에서(시험판 38)
    const sw0 = await p.evaluate(() => Array.from(document.querySelectorAll('.set-sec .tog[role="switch"]')).map(b => b.getAttribute('aria-label')));
    await p.click('[data-bxset="alarm/rem"]'); await p.waitForTimeout(400);
    const sw = sw0.concat(await p.evaluate(() => Array.from(document.querySelectorAll('.set-sec .set-row > .tog[role="switch"]')).map(b => b.getAttribute('aria-label'))));
    c.ok(['아침 요약', '일정 알림', '종일 일정 알림 시각'].every(x => sw.includes(x)), '설정의 켜고 끄기는 스위치 ' + JSON.stringify(sw));
    const pre = () => p.evaluate(() => (window.BX_T.docs().find(([id]) => id === 'settings') || [0, {}])[1].defaultRemind);
    await p.click('.set-row > .tog[aria-label="일정 알림"]'); await p.waitForTimeout(400);
    const off = await pre();
    await p.click('.set-row > .tog[aria-label="일정 알림"]'); await p.waitForTimeout(400);
    c.ok(off == null && (await pre()) === 10, '일정 시작 전 알림 스위치: 끄면 없음, 켜면 10분 전 ' + JSON.stringify([off, await pre()]));
    await p.evaluate(() => { const c = document.querySelector('#sheet-root [data-act="sheet-close"]'); if (c) c.click(); }); await p.waitForTimeout(300);
    await p.click('.dock [data-view="med"]'); await p.waitForTimeout(600);
    await p.click('.bx-med-more summary'); await p.waitForTimeout(200);
    const br = () => p.evaluate(() => { const b = document.querySelector('.bx-med-set [data-med-breath]'); return b ? b.getAttribute('role') + ':' + b.getAttribute('aria-checked') : null; });
    const b0 = await br();
    await p.click('.bx-med-set [data-med-breath]'); await p.waitForTimeout(300);
    const b1 = await br();
    c.ok(/^switch:/.test(b0 || '') && b0 !== b1, '명상 호흡 안내도 스위치, 누르면 바뀜 ' + JSON.stringify([b0, b1]));
    c.eq(app.errors, [], '화면 오류(스위치)');
  } finally { await app.close(); }
  return c.done();
};
