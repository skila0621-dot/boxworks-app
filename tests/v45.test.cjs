// 시험판 45: 다른 입력 창도 시험판 44 일정 창과 같은 삼성 방식(대표 11/4 1:24 · 1:34 · 1:51 · 1:53)
// 수업 추가 · 수정(줄 목록, 장소 · 시간표 · 알림 페이지), 휴대폰 캘린더 일정 창(알림 · 출발·준비 페이지), 루틴 고치기(알림 방식 · 기준 페이지)
const { openApp, settings, checker } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
function seed() {
  return [['settings', settings()],
    ['tts_main', { type: 'ttset', name: '학교', home: true, from: null, to: null, order: 0, createdAt: old }],
    ['tts_a', { type: 'ttset', name: '영어 학원(토익 · 회화 · 주말반)', home: true, from: null, to: null, order: 1, createdAt: old }],
    ['tt_s', { type: 'tt', name: '경영학원론', days: [1, 3], start: '10:30', end: '12:00', place: '301호', remind: '10', color: '#2a78d6', on: true, createdAt: old, updatedAt: old }],
    ['tt_k', { type: 'tt', name: '회계원리', days: [2, 4], start: '13:00', end: '14:30', place: '경영관 204호', remind: '', color: '#e87ba4', on: true, createdAt: old, updatedAt: old }],
    ['tt_e', { type: 'tt', name: '통계학', days: [5], start: '09:00', end: '10:00', place: '경영관 B101호', remind: '0', color: '#1baf7a', on: true, createdAt: old, updatedAt: old }],
    ['rt_1', { type: 'routine', name: '아침 준비', mode: 'start', target: '07:00', days: [1, 2, 3, 4, 5], on: true, every: 5, times: 6, steps: [{ name: '세수', min: 10 }, { name: '옷 입기', min: 10 }], createdAt: old, updatedAt: old }]];
}
const doc = (p, id) => p.evaluate(id => (window.BX_T.docs().find(([k]) => k === id) || [0, null])[1], id);
const ttRows = p => p.evaluate(() => Array.from(document.querySelectorAll('#bx-tt45-rows > *')).map(r => r.classList.contains('bx-tt45-days') ? 'DAYS' : r.classList.contains('bx-tt45-t') ? 'TIME' : r.classList.contains('bx-tt45-col') ? 'COLOR' : r.textContent.trim()));
const pgT = p => p.evaluate(() => { const e = document.getElementById('bx-pg-t'); return e ? e.textContent : null; });
const pgDone = p => p.click('#bx-pg [data-bxpg="done"]').then(() => p.waitForTimeout(250));
const pgBack = p => p.click('#bx-pg [data-bxpg="back"]').then(() => p.waitForTimeout(250));
const sheetH = p => p.evaluate(() => { const s = document.querySelector('#sheet-root .sheet'); return s ? Math.round(s.getBoundingClientRect().height) : 0; });

module.exports = async function () {
  const c = checker('시험판 45 · 수업 창 · 휴대폰 캘린더 일정 창 · 루틴 고치기를 삼성 방식으로(줄 목록 · 페이지 · 완료)');

  // (1) 수업 수정: 이름 → 요일 → 시작 → 끝 → 장소 → 시간표 → 알림 → 색, 펼치는 칸 없음
  let app = await openApp({ data: seed() });
  try {
    const p = app.page;
    await p.click('.dock [data-view="tt"]'); await p.waitForTimeout(600);
    await p.waitForSelector('[data-act="tt-edit"][data-id="tt_s"]', { state: 'attached' }); await p.evaluate(() => document.querySelector('[data-act="tt-edit"][data-id="tt_s"]').click()); await p.waitForTimeout(500);
    c.eq(await ttRows(p), ['DAYS', 'TIME', '301호', '학교', '10분 전', 'COLOR'], '수업 창 줄 순서: 요일 → 시작 → 끝 → 장소 → 시간표 → 알림 → 색');
    const look = await p.evaluate(() => {
      const n = document.getElementById('tt-name'), rows = Array.from(document.querySelectorAll('#bx-tt45-rows > .bx-er'));
      const vis = s => Array.from(document.querySelectorAll('#sheet-b ' + s)).filter(e => e.getBoundingClientRect().height > 0).length;
      return { title: n.classList.contains('title-in'), h: rows.map(r => Math.round(r.getBoundingClientRect().height)), pills: vis('.tt-pill'), place: vis('#tt-place'),
        days: Array.from(document.querySelectorAll('#bx-tt45-rows [data-act="tt-day"][aria-pressed="true"]')).map(b => b.textContent), del: !!document.querySelector('#sheet-f .bx-del-btn[data-act="tt-del"]') };
    });
    c.ok(look.title && look.h.every(h => h >= 56) && look.pills === 0 && look.place === 0, '수업 이름은 제목 칸, 줄 높이 56 이상, 알림 칩 · 장소 칸은 창에 펼쳐 두지 않음 ' + JSON.stringify(look));
    c.ok(look.days.join('') === '월수' && look.del, '요일 동그라미(월 · 수) · 아래 삭제는 빨간 글자 단추 ' + JSON.stringify(look));
    // 알림 페이지: 사용 중 스위치 + 동그라미 목록. ‹ 는 되돌림, 완료는 바꿈
    const h0 = await sheetH(p);
    await p.click('[data-bxtt45="rem"]'); await p.waitForTimeout(300);
    const rp = await p.evaluate(() => ({ t: document.getElementById('bx-pg-t').textContent, sw: document.querySelector('#bx-pg .bx-swrow span').textContent,
      opts: Array.from(document.querySelectorAll('#bx-pg .tt-pills > *')).map(e => [e.textContent.trim(), e.getAttribute('aria-pressed')]) }));
    c.eq(rp, { t: '알림', sw: '사용 중', opts: [['정시', 'false'], ['10분 전', 'true'], ['30분 전', 'false'], ['직접 입력', 'false']] }, '알림 페이지: 사용 중 · 정시 · 10분 전 · 30분 전 · 직접 입력');
    await p.click('#bx-pg [data-act="tt-rem"][data-v="30"]'); await p.waitForTimeout(150);
    await pgBack(p);
    c.ok(await pgT(p) === null && (await ttRows(p))[4] === '10분 전' && await sheetH(p) === h0, '‹ : 바꾼 알림을 되돌리고 창 높이도 그대로');
    await p.click('[data-bxtt45="rem"]'); await p.waitForTimeout(300);
    c.eq(await p.evaluate(() => document.querySelector('#bx-pg [data-act="tt-rem"][data-v="10"]').getAttribute('aria-pressed')), 'true', '다시 열면 10분 전 그대로');
    const cb = await p.evaluate(() => { const r = document.querySelector('#bx-pg [data-act="tt-rem"][data-v="custom"]').getBoundingClientRect(); return { x: r.x, y: r.y, h: r.height }; });
    await p.click('#bx-pg [data-act="tt-rem"][data-v="custom"]'); await p.waitForTimeout(250);
    const ci = await p.evaluate(() => { const r = document.querySelector('#bx-pg #tt-rem-c').getBoundingClientRect(); return { x: r.x, y: r.y, h: r.height }; });
    c.ok(Math.abs((ci.y + ci.h / 2) - (cb.y + cb.h / 2)) < 10, "'직접 입력' 줄이 그 자리에서 적는 칸이 됨 " + JSON.stringify({ cb, ci }));
    await p.fill('#bx-pg #tt-rem-c', '25');
    await pgDone(p);
    c.eq((await ttRows(p))[4], '25분 전', "완료: 줄에 '25분 전'");
    // 장소 페이지: 다른 수업 장소, 적으면 그 글자가 든 것만, 고르면 칸에. ‹ 는 되돌림
    await p.click('[data-bxtt45="place"]'); await p.waitForTimeout(300);
    const pl = await p.evaluate(() => ({ t: document.getElementById('bx-pg-t').textContent, v: document.getElementById('tt-place').value, rec: Array.from(document.querySelectorAll('#bx-pg [data-bxtt45place]')).map(b => b.textContent.trim()).sort(), focus: document.activeElement && document.activeElement.id }));
    c.eq(pl, { t: '장소', v: '301호', rec: ['경영관 204호', '경영관 B101호'], focus: 'tt-place' }, '장소 페이지: 적는 칸(바로 키보드) + 다른 수업 장소');
    await p.fill('#tt-place', 'B1'); await p.waitForTimeout(150);
    c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('#bx-pg [data-bxtt45place]')).map(b => b.textContent.trim())), ['경영관 B101호'], "'B1'을 적으면 그 글자가 든 장소만");
    await pgBack(p);
    c.eq(await p.evaluate(() => [document.getElementById('tt-place').value, document.querySelector('[data-bxtt45="place"]').textContent.trim()]), ['301호', '301호'], '‹ : 적던 장소를 되돌림');
    await p.click('[data-bxtt45="place"]'); await p.waitForTimeout(300);
    await p.click('#bx-pg [data-bxtt45place="경영관 204호"]'); await p.waitForTimeout(150);
    await pgDone(p);
    c.eq((await ttRows(p))[2], '경영관 204호', '고르고 완료: 줄에 경영관 204호');
    // 시간표 페이지(긴 이름도 다 보임) → 완료
    await p.click('[data-bxtt45="set"]'); await p.waitForTimeout(300);
    const sp = await p.evaluate(() => Array.from(document.querySelectorAll('#bx-pg [data-bxttpick]')).map(b => [b.textContent.trim(), b.getAttribute('aria-pressed'), b.scrollWidth <= b.clientWidth + 1]));
    c.eq(sp, [['학교', 'true', true], ['영어 학원(토익 · 회화 · 주말반)', 'false', true]], '시간표 페이지: 고른 것 ✓, 긴 이름도 잘리지 않음');
    await p.click('#bx-pg [data-bxttpick="tts_a"]'); await p.waitForTimeout(150);
    await pgDone(p);
    c.eq((await ttRows(p))[3], '영어 학원(토익 · 회화 · 주말반)', '완료: 줄에 고른 시간표');
    // 시작을 바꾸면 끝도 같은 길이(1시간 30분)만큼
    await p.fill('#tt-start', '11:00'); await p.dispatchEvent('#tt-start', 'change'); await p.waitForTimeout(150);
    c.eq(await p.evaluate(() => document.getElementById('tt-end').value), '12:30', '시작 10:30 → 11:00이면 끝 12:00 → 12:30');
    await p.click('#sheet-root [data-act="tt-save"]'); await p.waitForTimeout(500);
    const s1 = await doc(p, 'tt_s');
    c.eq([s1.remind, s1.place, s1.set, s1.start, s1.end], ['25', '경영관 204호', 'tts_a', '11:00', '12:30'], '저장: 알림 25분 전 · 장소 · 시간표 · 시각');
    // 휴대폰 뒤로: 페이지만 닫고(되돌림) 창은 그대로
    await p.click('[data-bxtts="tts_a"]').catch(() => {}); await p.waitForTimeout(300);
    await p.waitForSelector('[data-act="tt-edit"][data-id="tt_s"]', { state: 'attached' }); await p.evaluate(() => document.querySelector('[data-act="tt-edit"][data-id="tt_s"]').click()); await p.waitForTimeout(500);
    await p.click('[data-bxtt45="rem"]'); await p.waitForTimeout(300);
    await p.click('#bx-pg [data-act="tt-remsw"]'); await p.waitForTimeout(150);
    c.ok(await p.evaluate(() => document.querySelector('#bx-pg .bx-swrow span').textContent === '사용 안 함' && !document.querySelector('#bx-pg .tt-pills')), "알림 끄기: '사용 안 함', 목록 없음");
    await p.evaluate(() => window.BX_back()); await p.waitForTimeout(250);
    c.ok(await pgT(p) === null && (await ttRows(p))[4] === '25분 전' && await p.evaluate(() => !!document.getElementById('tt-name')), '휴대폰 뒤로: 페이지를 닫고 되돌림, 수업 창은 그대로');
    await p.click('[data-bxtt45="rem"]'); await p.waitForTimeout(300);
    await p.click('#bx-pg [data-act="tt-remsw"]'); await p.waitForTimeout(150);
    await pgDone(p);
    c.eq((await ttRows(p))[4], '알림', "알림을 끄고 완료: 줄은 회색 '알림'");
    c.ok(await p.evaluate(() => document.querySelector('[data-bxtt45="rem"] .bx-er-t').classList.contains('ph')), '비어 있으면 회색 이름');
    await p.click('#sheet-root [data-act="tt-save"]'); await p.waitForTimeout(500);
    c.eq((await doc(p, 'tt_s')).remind, '', '알림 없이 저장');
    // 새 수업: 시간표가 하나뿐이면 시간표 줄 없음은 (2)에서. 여기서는 새 수업 창 줄
    await p.click('[data-act="tt-new"]'); await p.waitForTimeout(400);
    c.eq(await ttRows(p), ['DAYS', 'TIME', '장소', '영어 학원(토익 · 회화 · 주말반)', '10분 전', 'COLOR'], '새 수업 창: 장소는 회색 이름, 시간표는 보고 있는 것');
    // 시간표 보기 설정: 상자 안 줄(처음 · 끝), 표시 요일은 동그라미 목록
    await p.evaluate(() => document.querySelector('#sheet-root [data-act="sheet-close"]').click()); await p.waitForTimeout(300);
    await p.click('[data-act="tt-range"]'); await p.waitForTimeout(400);
    const rg = await p.evaluate(() => ({ boxes: document.querySelectorAll('#sheet-b .bx-grp').length, wk: Array.from(document.querySelectorAll('#sheet-b [data-act="tt-wk"]')).map(b => [b.textContent.trim(), b.getAttribute('aria-pressed')]) }));
    c.eq(rg, { boxes: 2, wk: [['월–금', 'true'], ['월–일', 'false']] }, '시간표 보기 설정: 상자 둘(표시 시간 · 표시 요일 동그라미 목록)');
    await p.selectOption('#tt-rg-f', '8'); await p.selectOption('#tt-rg-t', '20');
    await p.click('#sheet-b [data-act="tt-wk"][data-v="all"]'); await p.waitForTimeout(150);
    await p.click('#sheet-root [data-act="tt-rg-save"]'); await p.waitForTimeout(500);
    const st = await doc(p, 'settings');
    c.eq([st.ttFrom, st.ttTo, st.ttWeek], [8, 20, 'all'], '저장: 8시–20시 · 월–일');
    c.eq(app.errors, [], '화면 오류(수업 창)');
  } finally { await app.close(); }

  // (2) 휴대폰 캘린더 일정 창: 알림 · 출발·준비 줄 → 페이지(바로 바뀌고, ‹ 는 되돌림)
  const pcache = { at: Date.parse('2026-11-02T06:00:00+09:00'), events: [
    { eventId: 78, begin: Date.parse('2026-11-02T13:00:00+09:00'), end: Date.parse('2026-11-02T14:00:00+09:00'), allDay: false, title: '팀 점심', calendarId: 5, calendar: '회사', color: -16744448, location: '강남역 11번 출구', description: '' }] };
  app = await openApp({ data: seed() });
  try {
    const p = app.page;
    await p.evaluate(pc => { localStorage.setItem('bx:pcal', JSON.stringify({ on: true })); localStorage.setItem('bx:pcache', JSON.stringify(pc)); }, pcache);
    await p.reload(); await p.waitForFunction(() => window.BX_T && document.querySelector('.dock')); await p.waitForTimeout(700);
    await p.waitForSelector('[data-act="edit"][data-id^="pc_78"]', { state: 'attached' }); await p.evaluate(() => document.querySelector('[data-act="edit"][data-id^="pc_78"]').click()); await p.waitForTimeout(500);
    const pr = await p.evaluate(() => ({ rows: Array.from(document.querySelectorAll('.bx-pc45 > .bx-er')).map(r => r.textContent.trim()), picks: Array.from(document.querySelectorAll('#sheet-b .pick')).filter(e => e.getBoundingClientRect().height > 0).length }));
    c.eq(pr, { rows: ['10분 전', '출발·준비'], picks: 0 }, '휴대폰 캘린더 일정 창: 알림 · 출발·준비 두 줄(고르는 칩을 펼쳐 두지 않음)');
    await p.click('[data-bxpc45="rem"]'); await p.waitForTimeout(300);
    c.eq(await p.evaluate(() => [document.getElementById('bx-pg-t').textContent, Array.from(document.querySelectorAll('#bx-pg [data-pcrem]')).map(b => b.textContent.trim()).join('|')]), ['알림', '없음|정시|10분 전|30분 전|1시간 전|2시간 전'], '알림 페이지: 동그라미 목록');
    await p.click('#bx-pg [data-pcrem="30"]'); await p.waitForTimeout(250);
    c.ok(await p.evaluate(() => document.querySelector('#bx-pg [data-pcrem="30"]').getAttribute('aria-pressed') === 'true' && document.querySelector('[data-bxpc45="rem"]').textContent.trim() === '30분 전'), '고르면 바로: 페이지 동그라미 · 창 줄 30분 전');
    await pgBack(p);
    const k = await p.evaluate(() => (window.BX_T.docs().find(([id]) => id.startsWith('px_78')) || [0, null])[1]);
    c.ok((!k || k.remind == null) && await p.evaluate(() => document.querySelector('[data-bxpc45="rem"]').textContent.trim()) === '10분 전', '‹ : 알림을 되돌림 ' + JSON.stringify(k));
    await p.click('[data-bxpc45="rem"]'); await p.waitForTimeout(300);
    await p.click('#bx-pg [data-pcrem="60"]'); await p.waitForTimeout(250);
    await pgDone(p);
    c.eq((await p.evaluate(() => (window.BX_T.docs().find(([id]) => id.startsWith('px_78')) || [0, {}])[1])).remind, '60', '완료: 1시간 전 저장');
    await p.click('[data-bxpc45="go"]'); await p.waitForTimeout(300);
    await p.click('#bx-pg [data-pctv="20"]'); await p.waitForTimeout(250);
    await p.click('#bx-pg [data-pcprep="rt_1"]'); await p.waitForTimeout(250);
    const go = await p.evaluate(() => ({ t: document.getElementById('bx-pg-t').textContent, line: !!document.querySelector('#bx-pg .tv-line'), row: document.querySelector('[data-bxpc45="go"]').textContent.trim(),
      cols: getComputedStyle(document.querySelector('#bx-pg .bx-pc45-tv')).gridTemplateColumns.split(' ').length }));
    c.eq(go, { t: '출발·준비', line: true, row: '오후 12:40 출발', cols: 4 }, '출발·준비 페이지: 이동 시간 4칸 · 준비 루틴 · 시각 줄, 창 줄은 오후 12:40 출발');
    await pgBack(p);
    const k2 = await p.evaluate(() => (window.BX_T.docs().find(([id]) => id.startsWith('px_78')) || [0, {}])[1]);
    const mem = await p.evaluate(() => (window.BX_T.docs().find(([id]) => id === 'travelmem') || [0, null])[1]);
    c.ok(k2.travel == null && k2.prep == null && k2.remind === '60' && !mem && await p.evaluate(() => document.querySelector('[data-bxpc45="go"]').textContent.trim()) === '출발·준비', '‹ : 이동 시간 · 준비 루틴 · 이동 시간 기억까지 되돌림 ' + JSON.stringify({ k2, mem }));
    c.eq(app.errors, [], '화면 오류(휴대폰 캘린더)');
  } finally { await app.close(); }

  // (3) 루틴 고치기: 이름 → 알림 방식 → 요일 · 공휴일 제외 → 기준 → 시각, 알림 방식 · 기준은 페이지
  app = await openApp({ data: seed() });
  try {
    const p = app.page;
    await p.click('.dock [data-view="routines"]'); await p.waitForTimeout(600);
    await p.click('[data-act="rt-edit"][data-rid="rt_1"]'); await p.waitForTimeout(500);
    const rr = await p.evaluate(() => ({ title: document.getElementById('r-name').classList.contains('title-in'),
      rows: Array.from(document.querySelectorAll('#bx-rt45 > *, #bx-rt45 #r-timebox > *')).filter(e => e.id !== 'r-timebox').map(e => e.classList.contains('bx-rt45-days') ? 'DAYS:' + document.getElementById('bx-rt45-dsum').textContent : e.textContent.replace(/\s+/g, ' ').trim().slice(0, 24)),
      det: document.querySelectorAll('#sheet-b details').length, rep: Array.from(document.querySelectorAll('#sheet-b #bx-rrep, #sheet-b #bx-rbowl, #sheet-b .bx-lockset')).filter(e => e.getBoundingClientRect().height > 0).length }));
    c.eq(rr.rows, ['알림 방식알람 · 꼭 울림은 5분마다 6번 ', 'DAYS:평일', '공휴일 제외공휴일에도 울려요', '기준시작 시각부터', '시작 시각오전 7:00'], '루틴 창 줄: 알림 방식 → 요일 → 공휴일 제외 → 기준 → 시작 시각(칸 위에 오전 · 오후 글)');
    c.ok(rr.title && rr.det === 0 && rr.rep === 0, '이름은 제목 칸, 펼치는 칸(details · 간격 · 횟수 · 종소리)을 창에 두지 않음 ' + JSON.stringify(rr));
    // 알림 방식 페이지: 싱잉볼로 바꿨다가 ‹ → 그대로
    await p.click('[data-bxrt45="ntf"]'); await p.waitForTimeout(300);
    c.eq(await p.evaluate(() => [document.getElementById('bx-pg-t').textContent, Array.from(document.querySelectorAll('#bx-pg [data-rsound]')).map(b => b.getAttribute('aria-checked')).join(','), !document.querySelector('#bx-pg #bx-rrep').hidden]), ['알림 방식', 'true,false', true], '알림 방식 페이지: 알람(간격 · 횟수 보임)');
    await p.click('#bx-pg [data-rsound="bowl"]'); await p.waitForTimeout(200);
    c.ok(await p.evaluate(() => document.querySelector('#bx-pg #bx-rrep').hidden && !document.querySelector('#bx-pg #bx-rbowl').hidden), '싱잉볼: 페이지 안에서 종소리 목록으로');
    await pgBack(p);
    c.eq(await p.evaluate(() => document.querySelector('[data-bxrt45="ntf"] small').textContent), '알람 · 꼭 울림은 5분마다 6번 더', '‹ : 알람 그대로');
    await p.click('[data-bxrt45="ntf"]'); await p.waitForTimeout(300);
    c.eq(await p.evaluate(() => document.querySelector('#bx-pg [data-rsound=""]').getAttribute('aria-checked')), 'true', '다시 열면 알람에 동그라미');
    await p.click('#bx-pg [data-step="1"][data-for="r-times"]'); await p.waitForTimeout(150);
    await pgDone(p);
    c.eq(await p.evaluate(() => document.querySelector('[data-bxrt45="ntf"] small').textContent), '알람 · 꼭 울림은 5분마다 7번 더', '완료: 횟수 7번');
    // 기준 페이지: 도착 시각에 맞추기 → 완료 → 시각 줄이 도착 · 이동 · 여유
    await p.click('[data-bxrt45="mode"]'); await p.waitForTimeout(300);
    await p.click('#bx-pg [data-rmode="arrive"]'); await p.waitForTimeout(200);
    await pgBack(p);
    c.eq(await p.evaluate(() => [document.querySelector('[data-bxrt45="mode"] small').textContent, document.querySelectorAll('#r-timebox > .bx-er').length]), ['시작 시각부터', 1], '‹ : 기준 · 시각 줄 그대로');
    await p.click('[data-bxrt45="mode"]'); await p.waitForTimeout(300);
    await p.click('#bx-pg [data-rmode="arrive"]'); await p.waitForTimeout(200);
    await pgDone(p);
    c.eq(await p.evaluate(() => [document.querySelector('[data-bxrt45="mode"] small').textContent, Array.from(document.querySelectorAll('#r-timebox > .bx-er .bx-er-t')).map(e => e.textContent)]), ['도착 시각에 맞추기', ['도착 시각', '이동 시간', '여유']], '완료: 도착 시각 · 이동 시간 · 여유 줄');
    // 공휴일 제외: 안내는 줄 아래 한 줄로 늘 보임(켜면 파랗게)
    const hy0 = await p.evaluate(() => Math.round(document.querySelector('[data-bxrt45="mode"]').getBoundingClientRect().top));
    await p.click('#sheet-root [data-rhol]'); await p.waitForTimeout(200);
    c.ok(await p.evaluate(hy0 => { const s = document.getElementById('bx-rt45-hsum'); return s.textContent === '공휴일 · 대체공휴일에는 울리지 않아요' && s.classList.contains('on') && Math.round(document.querySelector('[data-bxrt45="mode"]').getBoundingClientRect().top) === hy0; }, hy0), '공휴일 제외를 켜면 한 줄 안내가 바뀌고 아래 줄은 움직이지 않음');
    await p.click('#sheet-root [data-rday="6"]'); await p.waitForTimeout(150);
    c.eq(await p.evaluate(() => document.getElementById('bx-rt45-dsum').textContent), '월·화·수·목·금·토', '요일을 누르면 줄 글도 바로');
    await p.click('#sheet-root [data-rdays="all"]'); await p.waitForTimeout(150);
    c.eq(await p.evaluate(() => document.getElementById('bx-rt45-dsum').textContent), '매일', "'매일'을 누르면 매일");
    await p.click('#sheet-root [data-act="rt-save"]'); await p.waitForTimeout(500);
    const r1 = await doc(p, 'rt_1');
    c.eq([r1.mode, r1.times, r1.skipHol, r1.days.length, r1.sound || null], ['arrive', 7, true, 7, null], '저장: 기준 · 횟수 · 공휴일 제외 · 요일');
    c.eq(app.errors, [], '화면 오류(루틴 창)');
  } finally { await app.close(); }
  return c.done();
};
