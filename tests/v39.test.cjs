// 시험판 39: 여러 날 일정(달력 막대 · 홈 '2/3일째' 줄 · 확인 필요로 묻지 않음 · 알림은 첫날만), 분류 → 캘린더(칩 · 홈에 보이기 · 이 일정 색 · 새 일정의 기본 · 삭제),
// 말로 넣기 날짜 범위, 휴대폰 캘린더 여러 날 일정은 하나로(대표 결정 11/3 21:4x~21:51, 결정 기록 D-15)
const { openApp, settings, checker } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
const cat = (id, name, color, order, extra) => [id, Object.assign({ type: 'category', name, color, order, createdAt: old }, extra || {})];
const item = (id, o) => [id, Object.assign({ type: 'item', createdAt: old, updatedAt: old, done: false, slips: 0 }, o)];
function seed(extra) {
  return [['settings', settings(extra || {})],
    cat('c_work', '일·공부', '#2a78d6', 1), cat('c_personal', '개인', '#1baf7a', 2), cat('c_etc', '기타', '#eda100', 3),
    cat('c_hos', '병원', '#e34948', 4, { home: false }), cat('c_love', '연인', '#e87ba4', 5),
    item('it_1', { title: '치과 예약', date: '2026-11-02', start: '15:00', categoryId: 'c_personal' }),
    item('it_2', { title: '장보기', date: '2026-11-02', categoryId: 'c_etc' }),
    item('it_3', { title: '은행 서류', date: '2026-11-01', start: '11:00', categoryId: 'c_work' }),
    item('it_4', { title: '부산 여행', date: '2026-11-06', endDate: '2026-11-08', categoryId: 'c_personal', remind: 'd1@20:00' }),
    item('it_5', { title: '캠핑', date: '2026-11-08', endDate: '2026-11-10', categoryId: 'c_love' }),
    item('it_6', { title: '중간고사', date: '2026-11-17', endDate: '2026-11-20', categoryId: 'c_work', color: '#6250d6' }),
    item('it_7', { title: '출장', date: '2026-11-12', endDate: '2026-11-13', start: '10:00', end: '15:00', categoryId: 'c_work', remind: '60' }),
    item('it_8', { title: '정형외과', date: '2026-11-02', start: '10:00', categoryId: 'c_hos' }),
    item('it_9', { title: '약 타기', date: '2026-11-01', categoryId: 'c_hos' }),
    item('it_10', { title: '물리치료', date: '2026-11-07', start: '14:00', categoryId: 'c_hos' }),
    item('it_11', { title: '장보기', date: '2026-11-07', start: '18:00', categoryId: 'c_etc' })];
}
const doc = (p, id) => p.evaluate(id => (window.BX_T.docs().find(([k]) => k === id) || [0, null])[1], id);

module.exports = async function () {
  const c = checker('시험판 39 · 여러 날 일정 · 캘린더 · 홈에 보이기 · 말로 넣기 날짜 범위');

  // (1) 말로 넣기: 날짜 범위(지금 11월 2일 월요일)
  let app = await openApp({ data: seed() });
  try {
    const p = app.page;
    const P = t => p.evaluate(t => { const r = window.BX_parseAt(t, new Date('2026-11-02T06:50:00+09:00')); return [r.date || null, r.endDate || null, r.title]; }, t);
    c.eq(await P('6일부터 8일까지 부산 여행'), ['2026-11-06', '2026-11-08', '부산 여행'], "'6일부터 8일까지'");
    c.eq(await P('11월 6~8일 제주도'), ['2026-11-06', '2026-11-08', '제주도'], "'11월 6~8일'");
    c.eq(await P('11/30~12/2 출장'), ['2026-11-30', '2026-12-02', '출장'], "'11/30~12/2'");
    c.eq(await P('30일부터 2일까지 워크숍'), ['2026-11-30', '2026-12-02', '워크숍'], "달 없는 끝 날이 작으면 다음 달");
    c.eq(await P('내일부터 3일간 가족 여행'), ['2026-11-03', '2026-11-05', '가족 여행'], "'내일부터 3일간'");
    c.eq(await P('금요일부터 일요일까지 캠핑'), ['2026-11-06', '2026-11-08', '캠핑'], "'금요일부터 일요일까지'");
    c.eq(await P('6일부터 2박 3일 제주'), ['2026-11-06', '2026-11-08', '제주'], "'6일부터 2박 3일'");
    c.eq((await P('3시부터 5시까지 회의')).slice(1, 2), [null], '시각 범위는 여러 날이 아님');
    c.eq((await P('3일간 금식')).slice(0, 2), [null, null], "'3일간'만으로는 날짜가 아님");
    c.eq((await P('내일 오후 3시 치과')).slice(1, 2), [null], '하루 일정은 그대로');

    // (2) 월간: 날짜를 잇는 막대, 주가 바뀌면 다음 줄에서 ↳
    await p.click('.dock [data-view="month"]'); await p.waitForTimeout(700);
    const bars = await p.evaluate(() => Array.from(document.querySelectorAll('.cal .c-bar')).map(b => [b.closest('.cell').dataset.date, b.textContent.trim(), b.style.getPropertyValue('--n'), b.classList.contains('h'), b.classList.contains('t')]));
    c.ok(bars.some(b => b.join() === ['2026-11-06', '부산 여행', '3', true, true].join()), '부산 여행: 6일에서 3칸 막대 ' + JSON.stringify(bars));
    c.ok(bars.some(b => b.join() === ['2026-11-08', '캠핑', '1', true, false].join()) && bars.some(b => b.join() === ['2026-11-09', '↳ 캠핑', '2', false, true].join()), '캠핑: 일요일 한 칸 + 다음 줄에서 ↳ 두 칸');
    const geo = await p.evaluate(() => { const b = document.querySelector('.cell[data-date="2026-11-06"] .c-bar'), a = document.querySelector('.cell[data-date="2026-11-06"]').getBoundingClientRect(), z = document.querySelector('.cell[data-date="2026-11-08"]').getBoundingClientRect(), r = b.getBoundingClientRect(); return [Math.round(r.left - a.left), Math.round(z.right - r.right), getComputedStyle(b).pointerEvents]; });
    c.ok(geo[0] <= 2 && geo[1] <= 2 && geo[2] === 'none', '막대 너비 = 사흘 칸(누르기는 칸으로) ' + JSON.stringify(geo));
    const lanes = await p.evaluate(() => { const c7 = document.querySelector('.cell[data-date="2026-11-07"] .c-chips'); return Array.from(c7.children).map(e => e.className.split(' ')[0]); });
    c.eq(lanes, ['c-gap', 'c-chip', 'c-more'], '7일 칸: 막대 자리 · 하루 일정 하나 · +1');
    c.eq(await p.evaluate(() => document.querySelector('.cell[data-date="2026-11-17"] .c-bar').style.getPropertyValue('--c')), 'var(--cat-violet)', '이 일정 색(보라)이 캘린더 색(파랑)보다 먼저');
    // 칩: 일·공부만
    const chips = await p.evaluate(() => Array.from(document.querySelectorAll('.page-head .bx-cchips .bx-cchip')).map(b => b.textContent.trim()));
    c.eq(chips, ['전체', '일·공부', '개인', '기타', '병원', '연인', '캘린더'], '캘린더 칩 줄');
    await p.click('[data-bxcsel="c_work"]'); await p.waitForTimeout(500);
    const only = await p.evaluate(() => ({ bars: Array.from(document.querySelectorAll('.cal .c-bar')).map(b => b.textContent.trim()), chips: Array.from(document.querySelectorAll('.cal .c-chip')).map(b => b.textContent.trim()), head: document.querySelector('.page-head.bx-ch > p').textContent }));
    c.eq(only.bars.sort(), ['중간고사', '출장'], '일·공부만: 막대');
    c.ok(only.chips.length === 1 && /은행 서류/.test(only.chips[0]) && /일정 3개/.test(only.head), '일·공부만: 하루 일정 · 개수 ' + JSON.stringify(only));
    await p.click('.cell[data-date="2026-11-12"]'); await p.waitForTimeout(600);
    c.ok(/일·공부만 보는 중/.test(await p.evaluate(() => document.querySelector('#sheet-b').textContent)), '날짜 창 맨 위에 고른 캘린더 한 줄');
    await p.click('#sheet-b [data-bxcsel=""]'); await p.waitForTimeout(500);
    c.ok(!/보는 중/.test(await p.evaluate(() => document.querySelector('#sheet-b').textContent)) && await p.evaluate(() => document.querySelectorAll('.cal .c-bar').length >= 5), '전체 보기 → 다시 모두');
    await p.evaluate(() => document.querySelector('#sheet-root [data-act="sheet-close"]').click()); await p.waitForTimeout(300);
    // 날짜 창의 여러 날 줄
    await p.click('.cell[data-date="2026-11-08"]'); await p.waitForTimeout(600);
    const day8 = await p.evaluate(() => Array.from(document.querySelectorAll('#sheet-root .row')).map(r => [r.classList.contains('bx-span'), (r.querySelector('.row-title') || {}).textContent, (r.querySelector('.rc-sub') || {}).textContent || '']));
    c.eq(day8, [[true, '부산 여행', '3/3일째 · 마지막 날'], [true, '캠핑', '1/3일째 · ~11/10 (화)']], '날짜 창: 여러 날 줄(몇째 날)');
    await p.evaluate(() => document.querySelector('#sheet-root [data-act="sheet-close"]').click()); await p.waitForTimeout(300);
    // 새 일정: 캘린더 칩을 골라 두면 그 캘린더로
    await p.click('[data-bxcsel="c_love"]'); await p.waitForTimeout(400);
    await p.click('.bx-fab'); await p.waitForTimeout(500);
    c.eq(await p.evaluate(() => document.querySelector('#f-chips [data-fpanel="cat"]').textContent.trim()), '연인', "칩 '연인'을 골라 두고 새 일정 → 캘린더 '연인'");
    await p.evaluate(() => document.querySelector('#sheet-root [data-act="sheet-close"]').click()); await p.waitForTimeout(300);
    await p.click('[data-bxcsel=""]'); await p.waitForTimeout(300);

    // (3) 알림은 첫날만, 알림 글은 '10:00 시작 · ~11/13 (금) 15:00'
    const plan = await p.evaluate(() => window.BX_alarmPlan(21));
    const a7 = plan.filter(a => a.kind === 'item' && /^i_it_7_/.test(a.id)), a4 = plan.filter(a => a.kind === 'item' && /^i_it_4_/.test(a.id));
    c.ok(a7.length === 1 && new Date(a7[0].at).toISOString() === '2026-11-12T00:00:00.000Z' && /오전 10:00 시작 · ~11\/13 \(금\) 오후 3:00/.test(a7[0].sub), '출장: 첫날 한 시간 전 한 번 ' + JSON.stringify(a7.map(a => [a.at, a.sub])));
    c.ok(a4.length === 1 && new Date(a4[0].at).toISOString() === '2026-11-05T11:00:00.000Z' && /종일 · ~11\/8 \(일\)/.test(a4[0].sub), '부산 여행: 전날 저녁 한 번 ' + JSON.stringify(a4.map(a => [a.at, a.sub])));
    // 위젯: 날마다 한 줄, 병원(홈에서 뺌)은 빼고 놓친 것(약 타기)은 그대로
    const wd = await p.evaluate(() => window.BX_widgetData());
    const w4 = wd.items.filter(i => i.id === 'it_4').map(i => i.title);
    c.eq(w4, ['부산 여행 · 1/3일째', '부산 여행 · 2/3일째', '부산 여행 · 3/3일째'], '위젯: 여러 날 일정은 날마다 한 줄');
    c.ok(!wd.items.some(i => i.id === 'it_8' || i.id === 'it_10') && wd.items.some(i => i.id === 'it_9'), '위젯: 홈에서 뺀 캘린더는 빼고 놓친 일정은 그대로');

    // (4) 홈: 홈에서 뺀 캘린더(병원)는 오늘 목록에 없음, 놓친 것은 지난 일에
    await p.click('.dock [data-view="today"]'); await p.waitForTimeout(600);
    const home = await p.evaluate(() => ({ ids: Array.from(document.querySelectorAll('#tcard2 .row-main[data-id]')).map(b => b.dataset.id) }));
    c.ok(!home.ids.includes('it_8') && home.ids.includes('it_9') && home.ids.includes('it_1'), '홈: 정형외과(병원) 없음 · 약 타기(놓친 병원 일정)는 지난 일에 ' + JSON.stringify(home.ids));
    for (let i = 0; i < 5; i++) { await p.click('.bx-sum-nav[data-d="1"]'); await p.waitForTimeout(250); }
    const h7 = await p.evaluate(() => ({ first: (() => { const r = document.querySelector('#tcard2 .bx-tl .row'); return r ? [r.classList.contains('bx-span'), r.querySelector('.row-title').textContent, (r.querySelector('.rc-sub') || {}).textContent] : null; })(),
      tiles: Array.from(document.querySelectorAll('.bx-sum-tiles .bx-st')).map(b => b.textContent.replace(/\s+/g, '')), ids: Array.from(document.querySelectorAll('#tcard2 .row-main[data-id]')).map(b => b.dataset.id) }));
    c.eq(h7.first, [true, '부산 여행', '2/3일째 · ~11/8 (일)'], "11월 7일: 맨 위 '부산 여행 · 2/3일째 · ~11/8 (일)'");
    c.ok(h7.tiles[0] === '남은1' && h7.tiles[1] === '완료0/1' && !h7.ids.includes('it_10'), '위 숫자는 여러 날 일정을 세지 않음 · 병원 빠짐 ' + JSON.stringify(h7));
    await p.click('.bx-sum-back'); await p.waitForTimeout(300);
    c.eq(app.errors, [], '화면 오류(1)');
  } finally { await app.close(); }

  // (5) 끝난 여러 날 일정은 확인 필요로 묻지 않음(11월 9일)
  app = await openApp({ now: '2026-11-09T09:00:00+09:00', data: seed() });
  try {
    const p = app.page;
    const late = await p.evaluate(() => { const ids = []; document.querySelectorAll('#tcard2 .bx-past .row-main[data-id]').forEach(b => ids.push(b.dataset.id)); return ids; });
    c.ok(!late.includes('it_4') && late.includes('it_3'), '끝난 부산 여행은 지난 일(확인 필요)에 없음 ' + JSON.stringify(late));
    c.ok(await p.evaluate(() => { const r = document.querySelector('#tcard2 .row-main[data-id="it_5"]'); return !!r && !r.closest('.bx-past'); }), '이어지는 캠핑(8~10일)은 오늘 목록에');
    c.eq(app.errors, [], '화면 오류(2)');
  } finally { await app.close(); }

  // (6) 새 일정 창: 말로 '6일부터 8일까지' · 여러 날 스위치 · 이 일정 색 · 저장
  app = await openApp({ data: seed() });
  try {
    const p = app.page;
    await p.click('.bx-fab'); await p.waitForTimeout(500);
    await p.fill('#f-title', '6일부터 8일까지 부산 여행'); await p.waitForTimeout(300);
    // 시험판 56(일정 넣기 나): 날짜 줄 하나에 '11월 6일 (금) → 11월 8일 (일)'
    const dts = () => p.evaluate(() => document.querySelector('#f-chips [data-fpanel="date"] .bx-er-t').textContent.trim().split(' → '));
    const more = () => p.evaluate(() => { const b = document.querySelector('#f-chips [data-bxmore]'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); });
    c.eq(await dts(), ['11월 6일 (금)', '11월 8일 (일)'], '일정 창 날짜: 11월 6일 (금) → 11월 8일 (일)');
    c.ok(/11월 6일 ~ 8일/.test(await p.evaluate(() => document.getElementById('f-hint').textContent)), '해석 줄도 범위');
    await more(); await p.waitForTimeout(150);
    await p.click('#f-chips [data-fpanel="cat"]'); await p.waitForTimeout(300);
    await p.click('#f-cat [data-fcat="c_personal"]'); await p.waitForTimeout(200);
    await p.click('#f-cat [data-fcolor="#e87ba4"]'); await p.waitForTimeout(200);
    await p.click('#bx-ep [data-bxep="done"]'); await p.waitForTimeout(200);
    await p.click('#sheet-root [data-act="save"]'); await p.waitForTimeout(600);
    const saved = await p.evaluate(() => window.BX_T.docs().filter(([k, d]) => d && d.type === 'item' && d.title === '부산 여행' && k !== 'it_4').map(([, d]) => [d.date, d.endDate, d.categoryId, d.color]));
    c.eq(saved, [['2026-11-06', '2026-11-08', 'c_personal', '#e87ba4']], '저장: 시작 · 끝나는 날 · 캘린더 · 이 일정 색');
    // 손으로: 여러 날 켜기 → 3일간 → 시작을 내일로 옮기면 끝도 따라감
    await p.click('.bx-fab'); await p.waitForTimeout(500);
    await p.fill('#f-title', '워크숍'); await p.waitForTimeout(200);
    await p.click('#f-chips [data-fpanel="date"]'); await p.waitForTimeout(300);
    await p.click('#f-date [data-fmulti]'); await p.waitForTimeout(200);
    c.eq(await p.evaluate(() => document.getElementById('f-end-in').value), '2026-11-03', '여러 날을 켜면 끝나는 날은 다음 날');
    await p.click('#f-date [data-fspan="3"]'); await p.waitForTimeout(200);
    await p.click('#f-date [data-fdate="2026-11-03"]'); await p.waitForTimeout(200);
    c.eq([await p.evaluate(() => document.getElementById('f-end-in').value), await dts()], ['2026-11-05', ['11월 3일 (화)', '11월 5일 (목)']], '시작을 옮기면 끝나는 날도 같은 길이로');
    await p.click('#bx-ep [data-bxep="done"]'); await p.waitForTimeout(200);
    // 시간은 시간 줄 → 시간 페이지 맨 위 '시간 지정'(시험판 56, 전: 일정 창의 '하루 종일' 스위치)
    await p.click('#f-chips [data-fpanel="time"]'); await p.waitForTimeout(250);
    await p.click('#bx-ep [data-ftimed="1"]'); await p.waitForTimeout(200);
    c.ok(await p.evaluate(() => !document.getElementById('f-dur') && /첫날 시작/.test(document.getElementById('f-time').textContent)), "여러 날 + 시간: '첫날 시작 ~ 마지막 날 끝', 소요 시간 칸 없음");
    await p.evaluate(() => { const e = document.getElementById('f-end'); e.value = '09:00'; e.dispatchEvent(new Event('change', { bubbles: true })); });
    await p.click('#bx-ep [data-bxep="done"]'); await p.waitForTimeout(200);
    await p.click('#sheet-root [data-act="save"]'); await p.waitForTimeout(600);
    const ws = await p.evaluate(() => window.BX_T.docs().filter(([, d]) => d && d.title === '워크숍').map(([, d]) => [d.date, d.endDate, d.start, d.end]));
    c.eq(ws.length, 1, '워크숍 저장');
    c.ok(ws[0] && ws[0][0] === '2026-11-03' && ws[0][1] === '2026-11-05' && ws[0][3] === '09:00', '마지막 날 끝 시각이 시작보다 일러도 그대로 ' + JSON.stringify(ws));
    c.eq(app.errors, [], '화면 오류(3)');
  } finally { await app.close(); }

  // (7) 캘린더 목록 · 자세히 · 만들기 · 새 일정의 기본 · 삭제(옮기기) · 되돌리기
  app = await openApp({ data: seed() });
  try {
    const p = app.page;
    await p.click('.dock [data-view="month"]'); await p.waitForTimeout(600);
    await p.click('[data-act="bx-cals"]'); await p.waitForTimeout(500);
    c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('#sheet-root .bx-calrow[data-cal] .bx-at b')).map(b => b.textContent.trim())), ['일·공부', '개인', '기타', '병원', '연인'], '캘린더 목록(시험판 40부터 아래에 시간표 줄)');
    await p.click('#sheet-root .bx-calrow[data-cal="c_hos"] [data-bxcalhome]'); await p.waitForTimeout(300);
    c.ok((await doc(p, 'c_hos')).home === true, '목록에서 병원 홈에 보이기 켜기');
    await p.click('#sheet-root [data-act="bx-cal-add"]'); await p.waitForTimeout(500);
    const nw = await p.evaluate(() => window.BX_T.docs().filter(([, d]) => d && d.type === 'category' && d.name === '새 캘린더').map(([k, d]) => [k, d.color]));
    c.ok(nw.length === 1 && nw[0][1] === '#6250d6' && await p.evaluate(() => document.activeElement && document.activeElement.id === 'bx-cal-name'), '캘린더 만들기: 쓰지 않은 색(보라)이 저절로, 이름 칸에 커서 ' + JSON.stringify(nw));
    await p.fill('#bx-cal-name', '학원'); await p.waitForTimeout(700);
    await p.click('#sheet-root [data-bxcalcol="#008300"]'); await p.waitForTimeout(300);
    await p.click('#sheet-root [data-bxcaldef]'); await p.waitForTimeout(300);
    const d1 = await doc(p, nw[0][0]), st = await doc(p, 'settings');
    c.ok(d1.name === '학원' && d1.color === '#008300' && st.defCal === nw[0][0], '이름 · 색 · 새 일정의 기본');
    await p.evaluate(() => document.querySelector('#sheet-root [data-act="sheet-close"]').click()); await p.waitForTimeout(300);
    await p.click('.dock [data-view="today"]'); await p.waitForTimeout(500);
    await p.click('.bx-fab'); await p.waitForTimeout(500);
    c.eq(await p.evaluate(() => document.querySelector('#f-chips [data-fpanel="cat"]').textContent.trim()), '학원', '홈에서 새 일정 → 새 일정의 기본(학원)');
    await p.evaluate(() => document.querySelector('#sheet-root [data-act="sheet-close"]').click()); await p.waitForTimeout(300);
    // 삭제: 연인(캠핑) → 개인으로 옮기고 삭제, 되돌리기
    await p.click('.dock [data-view="month"]'); await p.waitForTimeout(500);
    await p.click('[data-act="bx-cals"]'); await p.waitForTimeout(400);
    await p.click('#sheet-root [data-bxcal="c_love"]'); await p.waitForTimeout(400);
    await p.click('#sheet-root [data-act="bx-cal-del"]'); await p.waitForTimeout(400);
    await p.click('#sheet-root [data-bxcalto="c_personal"]'); await p.waitForTimeout(200);
    await p.click('#sheet-root [data-act="bx-cal-del-move"]'); await p.waitForTimeout(500);
    c.ok(!(await doc(p, 'c_love')) && (await doc(p, 'it_5')).categoryId === 'c_personal', '삭제: 일정은 개인으로 옮김');
    await p.evaluate(() => { const b = Array.from(document.querySelectorAll('.toast button, #toast button')).find(x => /되돌리기/.test(x.textContent)); if (b) b.click(); }); await p.waitForTimeout(500);
    c.ok(!!(await doc(p, 'c_love')) && (await doc(p, 'it_5')).categoryId === 'c_love', '되돌리기: 캘린더와 일정이 그대로');
    c.eq(app.errors, [], '화면 오류(4)');
  } finally { await app.close(); }

  // (8) 휴대폰 캘린더: 여러 날 종일 일정은 하나(막대), 칩 줄에 그 캘린더, 홈에 보이기 끄기
  const t0 = Date.UTC(2026, 10, 4);
  const pcache = { at: Date.parse('2026-11-02T06:00:00+09:00'), events: [
    { eventId: 77, begin: t0, end: t0 + 3 * 864e5, allDay: true, title: '가족 여행', calendarId: 5, calendar: '가족', color: -16744448, location: '', description: '' },
    { eventId: 78, begin: Date.parse('2026-11-02T13:00:00+09:00'), end: Date.parse('2026-11-02T14:00:00+09:00'), allDay: false, title: '팀 점심', calendarId: 5, calendar: '가족', color: -16744448, location: '', description: '' }] };
  app = await openApp({ data: seed() });
  try {
    const p = app.page;
    await p.evaluate(pc => { localStorage.setItem('bx:pcal', JSON.stringify({ on: true })); localStorage.setItem('bx:pcache', JSON.stringify(pc)); }, pcache);
    await p.reload(); await p.waitForFunction(() => window.BX_T && document.querySelector('.dock')); await p.waitForTimeout(600);
    await p.click('.dock [data-view="month"]'); await p.waitForTimeout(600);
    const pb = await p.evaluate(() => Array.from(document.querySelectorAll('.cal .c-bar.pc')).map(b => [b.closest('.cell').dataset.date, b.textContent.trim(), b.style.getPropertyValue('--n')]));
    c.eq(pb, [['2026-11-04', '가족 여행', '3']], '휴대폰 캘린더 여러 날 종일 일정: 하나의 막대(조각나지 않음)');
    c.ok(await p.evaluate(() => Array.from(document.querySelectorAll('.bx-cchip.pc')).some(b => /가족/.test(b.textContent))), '칩 줄에 휴대폰 캘린더(테두리 칩)');
    await p.click('[data-act="bx-cals"]'); await p.waitForTimeout(400);
    await p.click('#sheet-root .bx-calrow[data-cal="pcc_5"] [data-bxpchome]'); await p.waitForTimeout(300);
    c.eq(await p.evaluate(() => JSON.parse(localStorage.getItem('bx:pcal')).homeOff), ['5'], '휴대폰 캘린더 홈에 보이기 끄기(이 휴대폰에)');
    await p.evaluate(() => document.querySelector('#sheet-root [data-act="sheet-close"]').click()); await p.waitForTimeout(300);
    await p.click('.dock [data-view="today"]'); await p.waitForTimeout(500);
    c.ok(await p.evaluate(() => !document.querySelector('#tcard2 [data-id^="pc_78"]')), '홈에서 뺀 휴대폰 캘린더 일정(팀 점심)은 홈에 없음');
    c.eq(app.errors, [], '화면 오류(5)');
  } finally { await app.close(); }
  return c.done();
};
