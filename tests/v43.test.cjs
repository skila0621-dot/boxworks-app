// 시험판 43: 캘린더 보기 바꾸기를 왼쪽 아래 '일 · 주 · 월'로(대표 아이디어 11/4 0:46 · 결정 0:55 '가', '작게'),
// 위 줄을 빼고 캘린더를 당김, 칸이 크면 3줄, 캘린더 안 하루 보기(‹ › · 오늘 · 뒤로 · 거름망 · 메모 · + 단추)
const { openApp, settings, checker } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
function seed() {
  const it = (id, date, start, title, cat) => [id, { type: 'item', title, date, start, end: '', categoryId: cat || null, createdAt: old, updatedAt: old }];
  return [['settings', settings()],
    ['c_w', { type: 'category', name: '일·공부', color: '#2a78d6', order: 0, createdAt: old }],
    ['c_p', { type: 'category', name: '개인', color: '#1baf7a', order: 1, createdAt: old }],
    it('a1', '2026-11-02', '09:00', '병원 예약', 'c_p'), it('a2', '2026-11-02', '11:00', '팀 회의', 'c_w'), it('a3', '2026-11-02', '15:00', '은행', 'c_p'), it('a4', '2026-11-02', '19:30', '헬스', 'c_p'),
    it('b1', '2026-11-03', '10:00', '거래처 미팅', 'c_w'),
    it('d1', '2026-12-10', '09:00', '건강검진', 'c_p'), it('d2', '2026-12-10', '12:00', '점심 모임', 'c_p'), it('d3', '2026-12-10', '15:00', '회의', 'c_w'), it('d4', '2026-12-10', '19:00', '송년회', 'c_p'),
    ['mm_1', { type: 'memo', date: '2026-11-02', text: '은행 서류 챙기기', at: '06:20', createdAt: '2026-11-01T21:20:00.000Z' }]];
}
const chipsIn = (p, ds) => p.evaluate(ds => { const c = Array.from(document.querySelectorAll('.cal .cell')).find(x => x.dataset.date === ds); return c ? [c.querySelectorAll('.c-chips .bx-chip, .c-chips .chip, .c-chips > span:not(.c-gap):not(.c-more)').length, (c.querySelector('.c-more') || {}).textContent || ''] : null; }, ds);
const pressed = p => p.evaluate(() => Array.from(document.querySelectorAll('#bx-vsw [data-bxvsw]')).filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.textContent));

module.exports = async function () {
  const c = checker('시험판 43 · 일 · 주 · 월(왼쪽 아래) · 캘린더 당기기 · 하루 보기');
  const app = await openApp({ data: seed() });
  try {
    const p = app.page;
    c.ok(await p.evaluate(() => !document.documentElement.classList.contains('bx-vsw-on')), '홈에는 일 · 주 · 월 없음');
    await p.click('.dock [data-view="month"]'); await p.waitForTimeout(800);
    // (1) 위의 월간 · 주간 줄이 없고, 왼쪽 아래 작은 일 · 주 · 월이 + 단추와 가운데가 맞음
    const geo = await p.evaluate(() => {
      const v = document.getElementById('bx-vsw').getBoundingClientRect(), f = document.querySelector('.bx-fab').getBoundingClientRect();
      return { top: !!document.querySelector('.bx-ch-top, .screen .seg'), btns: Array.from(document.querySelectorAll('#bx-vsw button')).map(b => b.textContent), left: Math.round(v.left), h: Math.round(v.height), w: Math.round(v.width), dy: Math.round((v.top + v.height / 2) - (f.top + f.height / 2)) };
    });
    c.ok(!geo.top && geo.btns.join() === '일,주,월' && geo.left < 40 && geo.h <= 46 && geo.w <= 140 && Math.abs(geo.dy) <= 2, '월간 · 주간 줄 없음, 왼쪽 아래 작은 일 · 주 · 월(+ 단추와 같은 높이) ' + JSON.stringify(geo));
    c.eq(await pressed(p), ['월'], '월 보기가 골라져 있음');
    c.ok(await p.evaluate(() => document.querySelector('.cal').getBoundingClientRect().top < 300), '캘린더가 위로 올라옴(전에는 307px) ' + await p.evaluate(() => Math.round(document.querySelector('.cal').getBoundingClientRect().top)));
    // (2) 칸 높이: 6주 달(11월)은 2줄 + '+2', 5주 달(12월)은 칸이 커져 3줄 + '+1'
    c.eq(await chipsIn(p, '2026-11-02'), [2, '+2'], '11월(6주): 칸마다 2줄');
    await p.click('.screen .page-head [data-act="month-nav"][data-d="1"]'); await p.waitForTimeout(800);
    c.eq(await chipsIn(p, '2026-12-10'), [3, '+1'], '12월(5주): 칸이 커져 3줄');
    c.ok(await p.evaluate(() => { const t = document.querySelector('.bx-ch-mid .bx-ch-today'); const m = document.querySelector('.bx-ch-mid').getBoundingClientRect(); return !!t && Math.abs(t.getBoundingClientRect().right - m.right) < 2; }), "다른 달이면 '오늘'은 '‹ 12월 ›' 줄 오른쪽 끝");
    // (3) 다른 달에서 '일' → 그 달 1일(고른 날이 없으면)
    await p.click('#bx-vsw [data-bxvsw="day"]'); await p.waitForTimeout(600);
    c.eq(await p.evaluate(() => (document.querySelector('.screen.day h1') || {}).textContent), '12월 1일 (화)', '다른 달에서 일 → 그 달 1일');
    await p.click('.screen.day [data-act="bx-dayv-today"]'); await p.waitForTimeout(500);
    const dv = await p.evaluate(() => ({ h: document.querySelector('.screen.day h1').textContent, p: document.querySelector('.screen.day .page-head p').textContent, rows: Array.from(document.querySelectorAll('.screen.day .bx-dayv .row-title')).map(e => e.textContent), memo: Array.from(document.querySelectorAll('.screen.day .bx-mm-x')).map(e => e.textContent), fab: (document.querySelector('.bx-fab') || {}).dataset.date, fabOn: document.documentElement.classList.contains('bx-fab-on'), today: !!document.querySelector('.screen.day [data-act="bx-dayv-today"]') }));
    c.ok(dv.h === '11월 2일 (월)' && /오늘 · 일정 4개 · 완료 0개/.test(dv.p) && !dv.today, "하루 보기: '오늘'을 누르면 오늘, 개수 한 줄 " + JSON.stringify(dv.p));
    c.eq(dv.rows, ['병원 예약', '팀 회의', '은행', '헬스'], '그날 일정(시각 순)');
    c.eq(dv.memo, ['은행 서류 챙기기'], '그날 메모도');
    c.ok(dv.fabOn && dv.fab === '2026-11-02', '+ 단추는 보고 있는 날로');
    c.eq(await pressed(p), ['일'], '일 보기가 골라져 있음');
    c.ok(await p.evaluate(() => !!document.querySelector('.dock [data-view="month"][aria-current="page"]')), '하루 보기에서도 아래 메뉴 캘린더가 켜짐');
    // (4) ‹ › 하루씩, 거름망(캘린더 칩)
    await p.click('.screen.day [data-act="bx-dayv-nav"][data-d="1"]'); await p.waitForTimeout(400);
    c.eq(await p.evaluate(() => [document.querySelector('.screen.day h1').textContent, Array.from(document.querySelectorAll('.screen.day .row-title')).map(e => e.textContent)]), ['11월 3일 (화)', ['거래처 미팅']], '› 다음 날');
    await p.click('.screen.day [data-act="bx-dayv-nav"][data-d="-1"]'); await p.waitForTimeout(400);
    await p.evaluate(() => { const b = Array.from(document.querySelectorAll('.screen.day .bx-cchip')).find(x => /개인/.test(x.textContent)); if (b) b.click(); }); await p.waitForTimeout(500);
    c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('.screen.day .bx-dayv .row-title')).map(e => e.textContent)), ['병원 예약', '은행', '헬스'], '하루 보기도 캘린더 칩으로 거르기');
    await p.evaluate(() => { const b = Array.from(document.querySelectorAll('.screen.day .bx-cchip')).find(x => /전체/.test(x.textContent)); if (b) b.click(); }); await p.waitForTimeout(400);
    // (5) 일 → 주 → 월(같은 날짜로 이어짐), 뒤로
    await p.click('#bx-vsw [data-bxvsw="week"]'); await p.waitForTimeout(600);
    c.eq(await pressed(p), ['주'], '주 보기');
    c.ok(await p.evaluate(() => /11월 2일/.test(document.querySelector('.screen.week .page-head p').textContent)), '주: 그날이 든 주');
    await p.click('#bx-vsw [data-bxvsw="day"]'); await p.waitForTimeout(500);
    await p.evaluate(() => window.BX_back()); await p.waitForTimeout(500);
    c.ok(await p.evaluate(() => !!document.querySelector('.screen.month .cal')), '하루 보기에서 뒤로 → 월');
    c.eq(await pressed(p), ['월'], '월로 돌아옴');
    await p.click('.dock [data-view="today"]'); await p.waitForTimeout(500);
    c.ok(await p.evaluate(() => !document.documentElement.classList.contains('bx-vsw-on')), '홈으로 가면 일 · 주 · 월 숨김');
    c.eq(app.errors, [], '화면 오류(일 · 주 · 월)');
  } finally { await app.close(); }
  return c.done();
};
