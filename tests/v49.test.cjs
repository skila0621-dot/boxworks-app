// 시험판 49(대표 11/4 14:12 ~ 14:30): 홈 '오늘 할 일' 줄 ②(두 줄 + 오른쪽 출발 칸) · 날짜 페이지 안 달력(두 번 눌러 기간) ·
// 일정 창 제목 옆 색 동그라미 · 아래 '취소 | 저장' · '삭제'는 줄 목록 맨 아래
const { openApp, settings, checker } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
const doc = (p, id) => p.evaluate(id => (window.BX_T.docs().find(([k]) => k === id) || [0, null])[1], id);

module.exports = async function () {
  const c = checker('시험판 49 · 홈 줄 ② · 날짜 달력 · 일정 창 취소 | 저장 · 색 동그라미');
  const data = [['settings', settings({ bxDock: ['routines', 'month', 'today', 'tt', 'memo'] })],
    ['c_p', { type: 'category', name: '개인', color: '#1baf7a', order: 0, createdAt: old }],
    ['it_0', { type: 'item', title: '약 먹기', date: '2026-11-02', start: '09:00', categoryId: 'c_p', done: true, doneAt: '2026-11-02T00:05:00.000Z', createdAt: old, updatedAt: old }],
    ['it_1', { type: 'item', title: '노동부 방문', date: '2026-11-02', start: '15:00', end: '16:00', remind: '10', travel: 20, location: '롯데마트 옆 고용복지센터', categoryId: 'c_p', createdAt: old, updatedAt: old }],
    ['it_2', { type: 'item', title: '저녁 약속', date: '2026-11-02', start: '18:30', end: '20:00', remind: '10', location: '강남역 2번 출구', categoryId: 'c_p', createdAt: old, updatedAt: old }]];
  const app = await openApp({ data, now: '2026-11-02T13:55:00+09:00' });
  try {
    const p = app.page;
    // (1) 홈 줄 ②: 시작 · 끝 | 제목 + 장소 한 줄 | 오른쪽 출발 칸(다음 일정은 채운 칸). 캘린더 이름 · 알림 · '다음 · N분 뒤'는 없음
    const rows = await p.evaluate(() => Array.from(document.querySelectorAll('#tcard2 .row.bx-r49')).filter(r => r.getBoundingClientRect().height > 0).map(r => ({
      t: Array.from(r.querySelectorAll('.row-time > *')).map(e => e.textContent), title: (r.querySelector('.row-title') || {}).textContent,
      meta: Array.from(r.querySelectorAll('.row-meta > .meta')).filter(m => getComputedStyle(m).display !== 'none').map(m => m.textContent),
      go: r.querySelector('.bx-r49-go') ? r.querySelector('.bx-r49-go').textContent : null, next: r.classList.contains('bx-next'),
      goBg: r.querySelector('.bx-r49-go') ? getComputedStyle(r.querySelector('.bx-r49-go')).backgroundColor : null })));
    const r1 = rows.find(r => r.title === '노동부 방문'), r2 = rows.find(r => r.title === '저녁 약속');
    c.ok(r1 && JSON.stringify(r1.t) === '["15:00","16:00"]' && JSON.stringify(r1.meta) === '["롯데마트 옆 고용복지센터"]' && r1.go === '14:40출발' && r1.next, "홈 줄 ②: 시작 · 끝 | 제목 + 장소 | '14:40 출발' 칸 " + JSON.stringify(r1));
    c.ok(r2 && JSON.stringify(r2.meta) === '["강남역 2번 출구"]' && r2.go === null, '출발 시각이 없는 일정은 오른쪽 칸 없음 ' + JSON.stringify(r2));
    c.ok(r1 && r1.goBg && r1.goBg !== 'rgba(0, 0, 0, 0)' && !/255, 255, 255/.test(r1.goBg), '다음 일정의 출발 칸은 채운 색 ' + (r1 && r1.goBg));
    // (2) 일정 창: 제목 옆 색 동그라미 · 아래 '취소 | 저장', 위 × 숨김
    await p.click('#tcard2 .row-main[data-id="it_1"]'); await p.waitForTimeout(600);
    const ed = await p.evaluate(() => ({ dot: !!document.querySelector('#sheet-root .bx-tdot'), dotC: document.querySelector('#sheet-root .bx-tdot').style.getPropertyValue('--c'),
      pill: Array.from(document.querySelectorAll('#sheet-root .bx-pill49 button')).map(b => b.textContent.trim()), x: getComputedStyle(document.querySelector('#sheet-root .sheet-h [data-act="sheet-close"]')).display,
      del: (document.querySelector('#f-chips > .bx-er-del') || {}).textContent, last: document.querySelector('#f-chips').lastElementChild.classList.contains('bx-er-del') }));
    c.ok(ed.dot && /--c-green|1baf7a|var\(/i.test(ed.dotC) && JSON.stringify(ed.pill) === '["취소","저장"]' && ed.x === 'none' && ed.del === '일정 삭제' && ed.last, "일정 창: 색 동그라미(캘린더 색) · '취소 | 저장' · 위 × 없음 · '일정 삭제'는 맨 아래 " + JSON.stringify(ed));
    await p.click('#sheet-root .bx-tdot'); await p.waitForTimeout(400);
    c.eq(await p.evaluate(() => (document.getElementById('bx-ep-t') || {}).textContent), '캘린더', '색 동그라미 → 캘린더 · 색 페이지');
    await p.click('#bx-ep [data-bxep="back"]'); await p.waitForTimeout(300);
    await p.click('#sheet-root .bx-pill49 [data-act="sheet-close"]'); await p.waitForTimeout(400);
    c.ok(await p.evaluate(() => !document.querySelector('#sheet-root .sheet')), "'취소' → 창 닫힘");
    // (3) 날짜 페이지 달력: 한 번 → 그날, 이어서 뒤의 날 → 그날까지(여러 날), 세 번째는 다시 그날
    await p.click('.bx-fab'); await p.waitForTimeout(600);
    await p.fill('#f-title', '제주 여행'); await p.waitForTimeout(200);
    await p.click('#f-chips [data-fpanel="date"]'); await p.waitForTimeout(500);
    const cal = await p.evaluate(() => ({ head: document.querySelector('.bx-dcal-h b').textContent, w: Array.from(document.querySelectorAll('.bx-dcal-w span')).map(s => s.textContent).join(''),
      s: (document.querySelector('.bx-dc.s') || {}).dataset ? document.querySelector('.bx-dc.s').dataset.bxdcd : null, inp: getComputedStyle(document.querySelector('#f-date > .inline')).display }));
    c.eq(cal, { head: '2026년 11월', w: '월화수목금토일', s: '2026-11-02', inp: 'none' }, '날짜 페이지: 달력(‹ 2026년 11월 ›, 월요일부터), 고른 날 동그라미, 날짜 칸은 숨김');
    await p.click('[data-bxdcd="2026-11-27"]'); await p.waitForTimeout(150);
    await p.click('[data-bxdcd="2026-11-29"]'); await p.waitForTimeout(150);
    const rg = await p.evaluate(() => ({ s: document.querySelector('.bx-dc.s').dataset.bxdcd, e: (document.querySelector('.bx-dc.e') || { dataset: {} }).dataset.bxdcd, inn: Array.from(document.querySelectorAll('.bx-dc.in')).map(b => b.dataset.bxdcd), sw: document.querySelector('[data-fmulti]').getAttribute('aria-checked'), n: document.getElementById('bx-dcal-n').textContent }));
    c.eq(rg, { s: '2026-11-27', e: '2026-11-29', inn: ['2026-11-28'], sw: 'true', n: '11월 27일 ~ 29일 · 3일간' }, '27일 → 29일: 27~29일 기간(띠), 여러 날 켜짐');
    await p.click('[data-bxdcd="2026-12-01"]'); await p.waitForTimeout(150);
    c.eq(await p.evaluate(() => [document.querySelector('.bx-dc.s') && document.querySelector('.bx-dc.s').dataset.bxdcd, !!document.querySelector('.bx-dc.e'), document.querySelector('.bx-dcal-h b').textContent, document.querySelector('[data-fmulti]').getAttribute('aria-checked')]),
      ['2026-12-01', false, '2026년 12월', 'false'], '세 번째 누름: 다시 그날 하나(다음 달 칸을 누르면 그 달로)');
    await p.click('[data-bxdcal="-1"]'); await p.waitForTimeout(150);
    c.eq(await p.evaluate(() => document.querySelector('.bx-dcal-h b').textContent), '2026년 11월', '‹ : 지난달');
    await p.click('[data-bxdcd="2026-11-27"]'); await p.waitForTimeout(150);
    await p.click('[data-bxdcd="2026-11-29"]'); await p.waitForTimeout(150);
    await p.click('#bx-ep [data-bxep="done"]'); await p.waitForTimeout(400);
    await p.click('#sheet-root .bx-pl-save'); await p.waitForTimeout(600);
    const it = await p.evaluate(() => (window.BX_T.docs().find(([, d]) => d && d.type === 'item' && d.title === '제주 여행') || [0, null])[1]);
    c.ok(it && it.date === '2026-11-27' && it.endDate === '2026-11-29', "'저장' → 11월 27~29일 여러 날 일정 " + JSON.stringify(it && [it.date, it.endDate]));
    // 날짜 페이지를 다시 열면 첫 누름은 다시 '그날'
    await p.click('#tcard2 .row-main[data-id="it_1"]'); await p.waitForTimeout(600);
    await p.click('#f-chips [data-fpanel="date"]'); await p.waitForTimeout(400);
    await p.click('[data-bxdcd="2026-11-05"]'); await p.waitForTimeout(150);
    c.eq(await p.evaluate(() => [document.querySelector('.bx-dc.s').dataset.bxdcd, !!document.querySelector('.bx-dc.e')]), ['2026-11-05', false], '다시 열면 첫 누름은 그날(기간 아님)');
    await p.click('#bx-ep [data-bxep="back"]'); await p.waitForTimeout(300);
    c.eq((await doc(p, 'it_1')).date, '2026-11-02', '‹ : 날짜 그대로');
    c.eq(app.errors, [], '화면 오류');
  } finally { await app.close(); }
  return c.done();
};
