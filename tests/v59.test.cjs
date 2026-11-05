// 시험판 59(대표 11/5 19:57 · 20:28 · 20:35)
// (1) 말로 넣기: '30분 뒤에 마트 갈거야'처럼 지금부터 N분 · N시간 뒤 → 날짜 · 시각(자정을 넘으면 다음 날)
// (2) 제목 끝 말끝: '갈거야 · 갈 거야 · 들를 예정'은 장소만, '먹어야 해 · 할 거야 · 보낼게'는 '먹기 · 하기 · 보내기'
// (3) 시간 미지정 상자 줄: [종류 아이콘 | '시간 미지정' | 이름] — 이름이 '오늘 할 일' 줄과 같은 자리(24시간에서도)
// (4) 길게 누르기: 일정 · 루틴 · 메모 줄, 날짜 칸 같은 '것'은 다른 페이지로 넘어가지 않는다. 단추는 오래 눌러도 누르기
const { openApp, settings, checker } = require('./harness.cjs');
const old = '2026-10-29T00:00:00.000Z';

const REL = [
  // 기준: 2026-11-05(목) 오후 7:57
  ['30분 뒤에 마트 갈거야', '2026-11-05', '20:27', '마트'],
  ['30분 후 마트', '2026-11-05', '20:27', '마트'],
  ['1시간 뒤 병원', '2026-11-05', '20:57', '병원'],
  ['한 시간 반 뒤에 친구 만나기', '2026-11-05', '21:27', '친구 만나기'],
  ['2시간 후에 회의', '2026-11-05', '21:57', '회의'],
  ['10분 있다가 빨래 널기', '2026-11-05', '20:07', '빨래 널기'],
  ['20분 뒤에 약 먹어야 해', '2026-11-05', '20:17', '약 먹기'],
  ['30분 안에 출발', '2026-11-05', '20:27', '출발'],
  ['지금부터 삼십 분 뒤 설거지', '2026-11-05', '20:27', '설거지'],
  ['1시간 30분 뒤 장보기', '2026-11-05', '21:27', '장보기'],
  ['반 시간 뒤 엄마한테 전화', '2026-11-05', '20:27', '엄마한테 전화'],
  ['오늘 40분 뒤에 택배 보낼게', '2026-11-05', '20:37', '택배 보내기'],
  ['다섯 시간 뒤 공항 갈 거예요', '2026-11-06', '00:57', '공항']
];
const TAIL = [
  // 기준: 2026-10-31(토) 오후 1:40 — 말로 넣기 30문장(parse.test.cjs)과 같은 날. 날짜를 말하지 않으면 날짜는 비움(창이 오늘 · 고른 날을 씀)
  ['3시에 치과 갈 거야', null, '15:00', '치과'],
  ['목요일 3시에 치과 가야 돼', '2026-11-05', '15:00', '치과'],
  ['내일 7시 공부할 거야', '2026-11-01', '19:00', '공부하기'],
  ['내일 3시 청소해야 해', '2026-11-01', '15:00', '청소하기'],
  ['모레 2시 은행 들를 예정', '2026-11-02', '14:00', '은행'],
  ['저녁 7시 운동하려고', null, '19:00', '운동하기'],
  ['내일 아침 8시 약 먹기로 했어', '2026-11-01', '08:00', '약 먹기'],
  ['내일 할머니 댁 갈래', '2026-11-01', null, '할머니 댁'],
  ['4시 우체국에서 택배 보낼게', null, '16:00', '우체국에서 택배 보내기'],
  ['내일 6시 친구 만날 거야', '2026-11-01', '18:00', '친구 만나기']
];

module.exports = async function () {
  const c = checker('시험판 59 · N분 뒤 · 말끝 · 시간 미지정 줄 칸 · 길게 누르기는 페이지로 안 넘어감');
  // ── (1) (2) 말 알아듣기 ──
  {
    const app = await openApp({ now: '2026-11-05T19:57:00+09:00' });
    const p = app.page;
    try {
      await p.waitForTimeout(600);
      for (const [t, d, s, title] of REL) {
        const r = await p.evaluate(t => { const r = window.BX_parseAt(t, new Date()); return [r.date || null, r.start || null, r.title]; }, t);
        c.eq(r, [d, s, title], "'" + t + "'");
      }
      // 시각의 일부인 '30분'은 '뒤'가 있어도 지금부터 30분이 아니다
      c.eq(await p.evaluate(() => window.BX_parseAt('3시 30분 뒤에 마트', new Date()).start), '15:30', "'3시 30분 뒤'의 30분은 시각");
      // 알림 말('30분 전에 알려 줘')은 그대로
      c.eq(await p.evaluate(() => { const r = window.BX_parseAt('내일 3시 치과 30분 전에 알려 줘', new Date()); return [r.start, r.remind, r.title]; }), ['15:00', '30', '치과'], '알림 말은 그대로');
      // 밤 11:40에 30분 뒤면 다음 날 0:10
      c.eq(await p.evaluate(() => { const r = window.BX_parseAt('30분 뒤 잠자리 들기', new Date('2026-11-05T23:40:00+09:00')); return [r.date, r.start]; }), ['2026-11-06', '00:10'], '자정을 넘으면 다음 날');
    } finally { await app.close(); }
  }
  {
    const app = await openApp({ now: '2026-10-31T13:40:00+09:00' });
    const p = app.page;
    try {
      await p.waitForTimeout(600);
      for (const [t, d, s, title] of TAIL) {
        const r = await p.evaluate(t => { const r = window.BX_parseAt(t, new Date()); return [r.date || null, r.start || null, r.title]; }, t);
        c.eq(r, [d, s, title], "'" + t + "'");
      }
      // 날짜 · 시각이 없거나 깨졌을 때(대표 11/5 21:25 'NaN월 NaN일 (u…' → '미지정 혹은 --:--')
      c.eq(await p.evaluate(() => { const f = window.BX_T.fn; return [f.md(undefined), f.md('bad'), f.edDay(undefined), f.bxMD(''), f.range('2026-11-05', undefined), f.rel(undefined), f.bxT(new Date('x')), f.bxT('NaN:NaN'), f.hmText(undefined), f.md('2026-11-06')]; }),
        ['미지정', '미지정', '날짜 미지정', '미지정', '11월 5일 ~ 미지정', '미지정', '--:--', '--:--', '--:--', '11월 6일 (금)'], "없는 날짜는 '미지정', 없는 시각은 '--:--'");
      // '할머니 · 할인'처럼 '할'로 시작하는 낱말은 그대로
      c.eq(await p.evaluate(() => window.BX_titleTail('할인 쿠폰 챙기기')), '할인 쿠폰 챙기기', "'할인'은 그대로");
    } finally { await app.close(); }
  }

  // ── (3) 시간 미지정 줄 칸 · (4) 길게 누르기 ──
  const data = clock => [['settings', settings({ bxDock: ['routines', 'month', 'tt', 'memo'], bxDockMig: 1, bxDockMemo: 1, clock })],
    ['tt_a', { type: 'tt', name: '경영학원론', days: [4], start: '16:00', end: '17:30', place: '301호', color: '#2a78d6', on: true, createdAt: old, updatedAt: old }],
    ['it_n', { type: 'item', title: '노동부', date: '2026-11-05', start: '14:00', end: '15:00', createdAt: old, updatedAt: old }],
    ['it_d', { type: 'item', title: '장보기', date: '2026-11-05', createdAt: old, updatedAt: old }],
    ['mm_1', { type: 'memo', date: '2026-11-05', text: '은행 서류 사본 두 장 챙기기', at: '06:20', createdAt: old, updatedAt: old }],
    ['rt_s', { type: 'routine', name: '공부 시작', days: [0, 1, 2, 3, 4, 5, 6], mode: 'start', target: '20:00', on: true,
      steps: [{ id: 's0', name: '책상 정리', min: 5 }, { id: 's1', name: '공부', min: 50 }], createdAt: old, updatedAt: old }]];
  for (const clock of ['', '24']) {
    const app = await openApp({ width: clock ? 360 : 384, height: 900, now: '2026-11-05T12:20:00+09:00', data: data(clock) });
    const p = app.page;
    try {
      await p.waitForTimeout(1100);
      const col = await p.evaluate(() => {
        const L = e => e ? Math.round(e.getBoundingClientRect().left) : null;
        // 시험판 61: 시간 없는 일정은 '오늘 할 일' 맨 위 '종일' 줄(같은 목록) — 다른 줄과 같은 칸
        const b = Array.from(document.querySelectorAll('#tcard2 .row.rowc')).find(r => r.querySelector('[data-id="it_d"]')), a = Array.from(document.querySelectorAll('#tcard2 .row.rowc')).find(r => r !== b && r.getBoundingClientRect().width > 0);
        return { t: b && b.querySelector('.row-time').textContent.trim(), a: [L(a && a.querySelector('.row-time')), L(a && a.querySelector('.row-body'))], b: [L(b && b.querySelector('.row-time')), L(b && b.querySelector('.row-body'))],
          wrap: b ? Math.round(b.querySelector('.row-time b').getBoundingClientRect().height) : 0 };
      });
      c.ok(col.t === '종일' && JSON.stringify(col.a) === JSON.stringify(col.b), (clock ? '24시간 · 폭 360' : '오전 · 오후 · 폭 384') + ": 종일 줄도 시각 칸 · 이름 칸이 다른 줄과 같은 자리 " + JSON.stringify(col));
      if (clock) c.ok(col.wrap > 0 && col.wrap < 30, "24시간 칸(56)에서도 '종일'은 한 줄 " + col.wrap);
    } finally { await app.close(); }
  }
  const press = async (p, sel, ms) => {
    const bb = await p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + Math.min(50, r.width / 2), y: r.top + r.height / 2 }; }, sel);
    if (!bb) return null;
    await p.mouse.move(bb.x, bb.y); await p.mouse.down(); await p.waitForTimeout(ms); await p.mouse.up(); await p.waitForTimeout(650);
    return p.evaluate(() => { const s = document.querySelector('#sheet-root .sheet'); return { screen: (document.querySelector('.screen') || {}).className || '', sheet: s ? (s.querySelector('h2') || {}).textContent : null, opts: s ? s.querySelectorAll('.menu-row').length : 0 }; });
  };
  // 시험판 60(선택실 5 · 2번): 루틴 · 메모 · 수업 줄에도 옵션이 생겼다(누른 자리 메뉴). 다른 페이지로 넘어가지 않는 것은 그대로
  const cases = [
    ['홈 일정 줄', '#tcard2 .row .row-main[data-id="it_n"]', 'opts'],
    ['홈 루틴 줄', '#tcard2 .row[data-rid] .row-main', 'opts', 1],
    ['홈 메모 줄', '#bx-mm-card .bx-mm-row', 'opts', 1],
    ['홈 종일 줄', '#tcard2 .row .row-main[data-id="it_d"]', 'opts'],
    // 수업 줄도 data-id를 달고 있어 일정 옵션('(제목 없음)' 완료 · 삭제)이 떴다 — 수업에는 수업 옵션(휴강 · 수정)
    ['홈 수업 줄', '#tcard2 .row.tt-row .row-main', 'opts', 1]
  ];
  for (const [name, sel, want, tapToo] of cases) {
    const app = await openApp({ width: 384, height: 900, now: '2026-11-05T12:20:00+09:00', data: data('') });
    const p = app.page;
    try {
      await p.waitForTimeout(1100);
      const before = await p.evaluate(() => (document.querySelector('.screen') || {}).className || '');
      const r = await press(p, sel, 800);
      if (want === 'opts') c.ok(r && r.sheet && r.opts >= 2 && r.screen === before, name + ': 길게 누르면 옵션 창(화면은 그대로) ' + JSON.stringify(r));
      else c.ok(r && !r.sheet && r.screen === before, name + ': 길게 눌렀다 떼도 다른 페이지 · 창이 열리지 않음 ' + JSON.stringify(r));
      // 짧게 누르면 지금처럼 열린다
      if (want === 'none' || tapToo) {
        await p.evaluate(() => { if (window.BX_back) window.BX_back(); }); await p.waitForTimeout(300);
        const s = await press(p, sel, 80);
        c.ok(s && (s.sheet || s.screen !== before), name + ': 짧게 누르면 지금처럼 열림 ' + JSON.stringify(s));
      }
    } finally { await app.close(); }
  }
  // 단추는 오래 눌러도 누르기(휴대폰 기본): 홈 요약 '남은'
  {
    const app = await openApp({ width: 384, height: 900, now: '2026-11-05T12:20:00+09:00', data: data('') });
    const p = app.page;
    try {
      await p.waitForTimeout(1100);
      const r = await press(p, '.bx-st', 800);
      c.ok(r && r.sheet, "단추(요약 '남은')는 오래 눌러도 열림 " + JSON.stringify(r));
      c.eq(app.errors, [], '화면 오류');
    } finally { await app.close(); }
  }
  return c.done();
};
