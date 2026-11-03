// 시험판 36: (1) 새 일정 창에서 달 없이 말한 날(대표 지적 11/3: "17일 오후 3시 늘푸른 병원 예약"이 오늘로 들어감).
// 지난 날이면 다음 달로 넣고 '11월 17일로' 한 번에 바꾸기, 지난 날짜면 '지난 날짜예요'.
// (2) 확인 필요 카드의 '날짜 고르기'(대표 지적 11/3: 다 했어요 · 그대로 두기 말고는 안 됨): 카드 안에 날짜 칸이 바로 열림
const { openApp, settings, checker } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
const items = p => p.evaluate(() => JSON.parse(localStorage.getItem('bx:data')).filter(([k, d]) => d.type === 'item' && !d.deletedAt).map(([k, d]) => ({ id: k, title: d.title, date: d.date, start: d.start || null })));
const hint = p => p.evaluate(() => (document.querySelector('#f-hint') || {}).innerText || '');

module.exports = async function () {
  const c = checker('시험판 36 · 달 없이 말한 날 · 지난 날짜 · 확인 필요 날짜 고르기');

  // (1) 11월 18일에 "17일 …"이라고 말하면 12월 17일(이번 달 17일은 지났음)
  let app = await openApp({ now: '2026-11-18T10:00:00+09:00', data: [['settings', settings()]] });
  try {
    const p = app.page;
    await p.click('.bx-fab'); await p.waitForTimeout(500);
    await p.fill('#f-title', '17일 오후 3시 늘푸른 병원 예약'); await p.waitForTimeout(300);
    let h = await hint(p);
    c.ok(/12월 17일/.test(h) && /15:00/.test(h) && /늘푸른 병원 예약/.test(h), '해석: 12월 17일 15:00 · ' + h);
    c.ok(/17일은 지나서 12월로 넣었어요/.test(h), '다음 달로 넣었다는 줄 · ' + h);
    c.eq(await p.evaluate(() => { const b = document.querySelector('[data-act="bx-date-alt"]'); return b ? [b.dataset.d, b.textContent] : null; }), ['2026-11-17', '11월 17일로'], '이번 달로 바꾸는 단추');
    await p.click('[data-act="bx-date-alt"]'); await p.waitForTimeout(300);
    h = await hint(p);
    c.ok(/11월 17일/.test(h) && /지난 날짜예요/.test(h), '바꾸면 11월 17일 · 지난 날짜예요 · ' + h);
    c.eq(await p.evaluate(() => { const b = document.querySelector('[data-act="bx-date-alt"]'); return b ? [b.dataset.d, b.textContent] : null; }), ['2026-12-17', '12월 17일로'], '다음 달로 되돌리는 단추');
    // 제목을 더 고쳐도 고른 날짜는 그대로
    await p.fill('#f-title', '17일 오후 3시 늘푸른 병원 예약 검진'); await p.waitForTimeout(300);
    c.ok(/11월 17일/.test(await hint(p)), '제목을 고쳐도 바꾼 날짜 유지');
    await p.click('[data-act="bx-date-alt"]'); await p.waitForTimeout(300);
    c.ok(/12월 17일/.test(await hint(p)) && /12월로 넣었어요/.test(await hint(p)), '다시 12월 17일로');
    await p.click('[data-act="save"]'); await p.waitForTimeout(500);
    const saved = (await items(p)).find(i => /늘푸른/.test(i.title));
    c.eq(saved && [saved.date, saved.start, saved.title], ['2026-12-17', '15:00', '늘푸른 병원 예약 검진'], '저장: 12월 17일 15:00');
    // 그냥 지난 날짜(달을 말함)
    await p.click('.bx-fab'); await p.waitForTimeout(500);
    await p.fill('#f-title', '11월 2일 은행'); await p.waitForTimeout(300);
    h = await hint(p);
    c.ok(/지난 날짜예요/.test(h) && !(await p.$('[data-act="bx-date-alt"]')), '달까지 말한 지난 날짜는 경고만 · ' + h);
    await p.fill('#f-title', '20일 은행'); await p.waitForTimeout(300);
    h = await hint(p);
    c.ok(/11월 20일/.test(h) && !/지난 날짜예요|넣었어요/.test(h), '아직 안 지난 날은 이번 달, 덧붙는 줄 없음 · ' + h);
    c.eq(app.errors, [], '화면 오류');
  } finally { await app.close(); }

  // (2) 확인 필요 카드: 날짜 고르기 → 카드 안 날짜 칸 → 이 날로 옮기기. 오늘로 옮기기 · 1시간 뒤로도 그대로
  app = await openApp({ now: '2026-11-02T14:20:00+09:00', data: [['settings', settings()],
    ['it_a', { type: 'item', title: '은행 서류 내기', date: '2026-11-01', start: '11:00', createdAt: old, updatedAt: old }],
    ['it_b', { type: 'item', title: '약국', date: '2026-11-02', start: '10:00', createdAt: old, updatedAt: old }],
    ['it_c', { type: 'item', title: '택배 맡기기', date: '2026-11-01', start: '09:00', createdAt: old, updatedAt: old }]] });
  try {
    const p = app.page;
    await p.click('[data-act="bx-late-open"]'); await p.waitForTimeout(500);
    await p.click('[data-bx-late="pick"][data-id="it_c"]'); await p.waitForTimeout(400);
    c.ok(!(await p.$('.bx-hid-date')), '숨긴 날짜 칸(휴대폰에서 안 열리던 방식)을 쓰지 않음');
    c.eq(await p.evaluate(() => { const f = document.querySelector('#bx-lc-date'); return f ? [f.value, f.min, f.closest('.bx-lc').textContent.includes('택배 맡기기')] : null; }), ['2026-11-03', '2026-11-02', true], '그 카드 안에 날짜 칸(내일이 골라져 있음)');
    c.eq(await p.getAttribute('[data-bx-late="pick"][data-id="it_c"]', 'aria-expanded'), 'true', '날짜 고르기 단추는 열림 표시');
    await p.click('[data-bx-late="pick"][data-id="it_c"]'); await p.waitForTimeout(300);
    c.ok(!(await p.$('#bx-lc-date')), '다시 누르면 닫힘');
    await p.click('[data-bx-late="pick"][data-id="it_c"]'); await p.waitForTimeout(300);
    await p.fill('#bx-lc-date', '2026-11-05');
    await p.click('[data-bx-late="move"][data-id="it_c"]'); await p.waitForTimeout(400);
    c.eq((await items(p)).find(i => i.id === 'it_c').date, '2026-11-05', '이 날로 옮기기 → 11월 5일');
    await p.click('[data-bx-late="today"][data-id="it_a"]'); await p.waitForTimeout(400);
    const a = (await items(p)).find(i => i.id === 'it_a');
    c.eq([a.date, a.start], ['2026-11-02', '15:20'], '오늘로 옮기기(시각이 지났으면 한 시간 뒤)');
    await p.click('[data-bx-late="later"][data-id="it_b"]'); await p.waitForTimeout(400);
    const b = (await items(p)).find(i => i.id === 'it_b');
    c.eq([b.date, b.start], ['2026-11-02', '15:20'], '1시간 뒤로');
    c.eq(app.errors, [], '화면 오류');
  } finally { await app.close(); }
  return c.done();
};
