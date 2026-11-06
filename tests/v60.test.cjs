// 시험판 60(선택실 5, 대표 11/5 21:45 · 22:03 · 22:05)
// (1) 누른 자리 메뉴(1번 B): 누른 줄 · 칸을 비추고 그 바로 위(자리가 없으면 아래)에 메뉴, 화면은 그대로
// (2) 줄마다 옵션(2번, 시험판 69부터 대표가 11/6 오전 2:26 고친 칩대로): 루틴 줄 수정 · 오늘은 쉬기(하기) · 삭제 / 수업 줄 수정 · 휴강 · 삭제 / 메모 줄 수정 · 일정으로 만들기 · 삭제 / 날짜 칸 이날 새 일정 · 이날 메모
// (3) 새 일정 창(3번 메모): 제목 옆 색 동그라미 없음, 말하기는 보라 바탕 마이크 아이콘만(정사각). 옆에 '추가'가 있으면 회색
// (4) 메모 줄(4번 B): [메모 아이콘 | 시각 | 글] — 목록 줄 C와 같은 칸(오전 · 오후 · 폭 384, 24시간 · 폭 360)
const { openApp, settings, checker } = require('./harness.cjs');
const old = '2026-10-29T00:00:00.000Z';
const NOW = '2026-11-05T12:20:00+09:00';
const data = clock => [['settings', settings({ bxDock: ['routines', 'month', 'tt', 'memo'], bxDockMig: 1, bxDockMemo: 1, clock })],
  ['tt_a', { type: 'tt', name: '경영학원론', days: [4], start: '16:00', end: '17:30', place: '301호', color: '#2a78d6', on: true, createdAt: old, updatedAt: old }],
  ['it_n', { type: 'item', title: '노동부', date: '2026-11-05', start: '14:00', end: '15:00', createdAt: old, updatedAt: old }],
  ['it_d', { type: 'item', title: '장보기', date: '2026-11-05', createdAt: old, updatedAt: old }],
  ['mm_1', { type: 'memo', date: '2026-11-05', text: '은행 서류 사본 두 장 챙기기', at: '06:20', createdAt: '2026-11-05T06:20:00+09:00', updatedAt: old }],
  ['mm_2', { type: 'memo', date: '2026-11-05', text: '점심에 우체국 들러 택배 보내기 — 주소는 문자로 받은 것', at: '12:35', createdAt: '2026-11-05T12:35:00+09:00', updatedAt: old }],
  ['rt_s', { type: 'routine', name: '공부 시작', days: [0, 1, 2, 3, 4, 5, 6], mode: 'start', target: '20:00', on: true,
    steps: [{ id: 's0', name: '책상 정리', min: 5 }, { id: 's1', name: '공부', min: 50 }], createdAt: old, updatedAt: old }]];

module.exports = async function () {
  const c = checker('시험판 60 · 누른 자리 메뉴 · 줄마다 옵션 · 말하기 아이콘 · 메모 줄 칸');
  const press = async (p, sel, ms = 700) => {
    const bb = await p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + Math.min(60, r.width / 2), y: r.top + r.height / 2 }; }, sel);
    if (!bb) return null;
    await p.mouse.move(bb.x, bb.y); await p.mouse.down(); await p.waitForTimeout(ms); await p.mouse.up(); await p.waitForTimeout(500);
    return p.evaluate(() => {
      const sc = document.querySelector('#sheet-root > .scrim'), sh = sc && sc.querySelector('.sheet'), sp = sc && sc.querySelector('.bx-spot');
      const R = e => { if (!e) return null; const r = e.getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), l: Math.round(r.left), r: Math.round(r.right) }; };
      return { screen: (document.querySelector('.screen') || {}).className || '', ctx: !!(sh && sh.classList.contains('bx-ctx')), menu: R(sh), spot: R(sp), H: innerHeight, W: innerWidth,
        opts: sh ? Array.from(sh.querySelectorAll('.menu-row .ml')).map(e => e.textContent) : [] };
    });
  };
  const pick = async (p, label) => { await p.evaluate(l => { const b = Array.from(document.querySelectorAll('#sheet-root .menu-row')).find(x => x.querySelector('.ml').textContent === l); if (b) b.click(); }, label); await p.waitForTimeout(500); };

  // (1)(2) 줄마다 누른 자리 메뉴
  const cases = [
    ['홈 일정 줄', '#tcard2 .row .row-main[data-id="it_n"]', ['수정', '완료', '내일로 미루기', '삭제'], '#tcard2 .row:has(> .row-main[data-id="it_n"])'],
    ['홈 종일 줄', '#tcard2 .row .row-main[data-id="it_d"]', ['수정', '완료', '내일로 미루기', '삭제'], '#tcard2 .row:has(> .row-main[data-id="it_d"])'],
    ['홈 루틴 줄', '#tcard2 .row[data-rid] .row-main', ['수정', '오늘은 쉬기', '삭제'], '#tcard2 .row[data-rid]'],
    ['홈 수업 줄', '#tcard2 .row.tt-row .row-main', ['수정', '휴강', '삭제'], '#tcard2 .row.tt-row'],
    ['홈 메모 줄', '#bx-mm-card .bx-mm-row', ['수정', '일정으로 만들기', '삭제'], '#bx-mm-card .bx-mm-row']
  ];
  for (const [name, sel, want, rowSel] of cases) {
    const app = await openApp({ width: 384, height: 832, now: NOW, data: data('') });
    const p = app.page;
    try {
      await p.waitForTimeout(1100);
      const before = await p.evaluate(() => (document.querySelector('.screen') || {}).className || '');
      const r = await press(p, sel);
      const row = await p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return { t: Math.round(q.top), b: Math.round(q.bottom), l: Math.round(q.left), r: Math.round(q.right) }; }, rowSel);
      c.eq(r && r.opts, want, name + ': 옵션');
      const near = r && row && r.spot && Math.abs(r.spot.t - (row.t - 4)) <= 2 && Math.abs(r.spot.b - (row.b + 4)) <= 2 && Math.abs(r.spot.l - (row.l - 4)) <= 2;
      const where = r && r.menu && row ? (r.menu.b <= row.t - 4 ? '위' : r.menu.t >= row.b + 4 ? '아래' : '겹침') : null;
      const inView = r && r.menu && r.menu.t >= 12 && r.menu.b <= r.H - 12 && r.menu.l >= 12 && r.menu.r <= r.W - 12;
      c.ok(r && r.ctx && r.screen === before && near && where !== '겹침' && inView, name + ': 누른 줄을 비추고(줄 ±4) 줄 ' + where + '에 메뉴 · 화면 안 · 화면은 그대로 ' + JSON.stringify({ r, row }));
      // 자리가 있으면 위(선택실 5 그림: 손가락에 가리지 않게)
      if (r && r.menu && row && row.t - 4 - 10 - (r.menu.b - r.menu.t) >= 12) c.eq(where, '위', name + ': 위에 자리가 있으면 위');
      // 짧게 누르면 지금처럼(메뉴가 아니라 그 창)
      await p.evaluate(() => { if (window.BX_back) window.BX_back(); }); await p.waitForTimeout(400);
      const s = await press(p, sel, 80);
      c.ok(s && !s.ctx, name + ': 짧게 누르면 누른 자리 메뉴가 아님 ' + JSON.stringify(s && { ctx: s.ctx, opts: s.opts }));
      c.eq(app.errors, [], name + ': 화면 오류');
    } finally { await app.close(); }
  }

  // 위쪽 줄은 아래에: 화면 맨 위 근처 줄을 길게 누르면 메뉴는 줄 아래
  // (시험판 69: 홈 날짜 상자가 줄어 높이 832에서는 그 줄을 맨 위 근처까지 올릴 만큼 내려가지 않아 화면을 낮춤)
  {
    const app = await openApp({ width: 384, height: 640, now: NOW, data: data('') });
    const p = app.page;
    try {
      await p.waitForTimeout(1100);
      await p.evaluate(() => { const e = document.querySelector('#tcard2 .row-main[data-id="it_n"]'); const y = e.getBoundingClientRect().top + scrollY - 70; scrollTo(0, y); });
      await p.waitForTimeout(300);
      const bb = await p.evaluate(() => { const r = document.querySelector('#tcard2 .row-main[data-id="it_n"]').getBoundingClientRect(); return { x: r.left + 60, y: r.top + r.height / 2, t: r.top, b: r.bottom }; });
      await p.mouse.move(bb.x, bb.y); await p.mouse.down(); await p.waitForTimeout(700); await p.mouse.up(); await p.waitForTimeout(500);
      const m = await p.evaluate(() => { const r = document.querySelector('#sheet-root .sheet.bx-ctx').getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom) }; });
      const rowB = await p.evaluate(() => Math.round(document.querySelector('#tcard2 .row:has(> .row-main[data-id="it_n"])').getBoundingClientRect().bottom));
      c.ok(bb.t < 160 && m.t >= rowB + 4, '위쪽 줄(맨 위에서 ' + Math.round(bb.t) + ')은 메뉴가 줄 아래 ' + JSON.stringify({ m, rowB }));
    } finally { await app.close(); }
  }

  // (2) 옵션이 하는 일: 루틴 쉬기 → 하기, 수업 휴강 → 취소, 메모 일정으로 만들기 · 삭제(되돌리기)
  {
    const app = await openApp({ width: 384, height: 832, now: NOW, data: data('') });
    const p = app.page;
    try {
      await p.waitForTimeout(1100);
      const sub = sel => p.evaluate(s => { const e = document.querySelector(s); return e ? e.textContent.trim() : null; }, sel);
      await press(p, '#tcard2 .row[data-rid] .row-main'); await pick(p, '오늘은 쉬기');
      c.ok(/건너뛰어요/.test(await sub('#tcard2 .row[data-rid] .row-meta') || ''), "루틴 '오늘은 쉬기' → 줄에 '오늘은 건너뛰어요'");
      const r2 = await press(p, '#tcard2 .row[data-rid] .row-main');
      c.eq(r2 && r2.opts, ['수정', '오늘은 하기', '삭제'], "쉬는 루틴은 '오늘은 하기'");
      await pick(p, '오늘은 하기');
      c.ok(!/건너뛰어요/.test(await sub('#tcard2 .row[data-rid] .row-meta') || ''), "'오늘은 하기' → 다시 켜짐");
      await press(p, '#tcard2 .row.tt-row .row-main'); await pick(p, '휴강');
      c.ok(/휴강/.test(await sub('#tcard2 .row.tt-row .row-meta') || ''), "수업 '휴강' → 줄에 '휴강 · 알람 쉼'");
      c.eq(await p.evaluate(() => { const d = (window.BX_T.docs().find(([k]) => k === 'tt_a') || [])[1]; return d && d.skip ? Object.keys(d.skip) : null; }), ['2026-11-05'], '휴강은 그날(11월 5일)만');
      const r3 = await press(p, '#tcard2 .row.tt-row .row-main');
      c.eq(r3 && r3.opts, ['수정', '휴강 취소', '삭제'], "휴강인 수업은 '휴강 취소'");
      await pick(p, '휴강 취소');
      c.ok(!/휴강/.test(await sub('#tcard2 .row.tt-row .row-meta') || ''), "'휴강 취소' → 다시 수업");
      // 메모: 일정으로 만들기 → 그 글로 새 일정 창
      await p.evaluate(() => { if (window.BX_back) window.BX_back(); }); await p.waitForTimeout(300);
      await press(p, '#bx-mm-card .bx-mm-row[data-bxmm="mm_1"]'); await pick(p, '일정으로 만들기');
      c.eq(await p.evaluate(() => (document.getElementById('f-title') || {}).value), '은행 서류 사본 두 장 챙기기', "메모 '일정으로 만들기' → 그 글로 새 일정 창");
      await p.evaluate(() => { if (window.BX_back) window.BX_back(); }); await p.waitForTimeout(400);
      // 메모: 삭제 → 줄이 빠지고 되돌리기
      await press(p, '#bx-mm-card .bx-mm-row[data-bxmm="mm_2"]'); await pick(p, '삭제');
      c.ok(await p.evaluate(() => !document.querySelector('#bx-mm-card .bx-mm-row[data-bxmm="mm_2"]') && /되돌리기/.test((document.querySelector('.toast, #toast, .bx-toast') || document.body).textContent)), "메모 '삭제' → 줄이 빠지고 '되돌리기'");
      // 메모: 수정 → 메모 창(글 칸). 앞의 알림 글이 아래쪽 줄을 덮지 않게 치운다(시험판 69: 홈이 짧아져 메모 줄이 알림 글 자리까지 내려옴)
      await p.evaluate(() => document.querySelectorAll('#toasts .toast').forEach(t => t.remove()));
      await press(p, '#bx-mm-card .bx-mm-row[data-bxmm="mm_1"]'); await pick(p, '수정');
      c.ok(await p.evaluate(() => !!document.getElementById('bx-mm-edit')), "메모 '수정' → 메모 창");
      await p.evaluate(() => { if (window.BX_back) window.BX_back(); }); await p.waitForTimeout(400);
      // 시험판 69: 수업 줄 · 루틴 줄 '삭제' → 줄이 빠지고 되돌리기로 돌아옴(맨 끝 빨간 글)
      const r4 = await press(p, '#tcard2 .row.tt-row .row-main');
      c.ok(r4 && r4.opts[r4.opts.length - 1] === '삭제' && await p.evaluate(() => { const b = Array.from(document.querySelectorAll('#sheet-root .menu-row')).pop(); return !!b && b.classList.contains('bx-im-del'); }), '수업 줄: 삭제는 맨 끝 빨간 글');
      await pick(p, '삭제');
      const gone = await p.evaluate(() => !document.querySelector('#tcard2 .row.tt-row') && !window.BX_T.docs().some(([k]) => k === 'tt_a'));
      c.ok(gone, "수업 '삭제' → 홈 줄 · 시간표에서 빠짐");
      await p.evaluate(() => { const b = Array.from(document.querySelectorAll('#toasts .toast button')).reverse().find(x => /되돌리기/.test(x.textContent)); if (b) b.click(); }); await p.waitForTimeout(500);
      c.ok(await p.evaluate(() => !!document.querySelector('#tcard2 .row.tt-row')), "수업 삭제 '되돌리기' → 다시");
      await press(p, '#tcard2 .row[data-rid] .row-main'); await pick(p, '삭제');
      c.ok(await p.evaluate(() => !document.querySelector('#tcard2 .row[data-rid]') && !window.BX_T.docs().some(([k]) => k === 'rt_s')), "루틴 '삭제' → 홈 줄에서 빠짐");
      await p.evaluate(() => { const b = Array.from(document.querySelectorAll('#toasts .toast button')).reverse().find(x => /되돌리기/.test(x.textContent)); if (b) b.click(); }); await p.waitForTimeout(500);
      c.ok(await p.evaluate(() => !!document.querySelector('#tcard2 .row[data-rid]')), "루틴 삭제 '되돌리기' → 다시");
      c.eq(app.errors, [], '화면 오류');
    } finally { await app.close(); }
  }

  // (2) 캘린더 날짜 칸: 이날 새 일정 · 이날 메모(시험판 69, 말로 넣기는 새 일정 창 마이크)
  {
    const app = await openApp({ width: 384, height: 832, now: NOW, data: data('') });
    const p = app.page;
    try {
      await p.waitForTimeout(1100);
      await p.click('.dock [data-view="month"]'); await p.waitForTimeout(700);
      const before = await p.evaluate(() => (document.querySelector('.screen') || {}).className || '');
      const r = await press(p, '.cal .cell[data-date="2026-11-12"]');
      c.ok(r && r.ctx && r.screen === before && JSON.stringify(r.opts) === JSON.stringify(['이날 새 일정', '이날 메모']), "날짜 칸: '이날 새 일정 · 이날 메모'(화면은 그대로) " + JSON.stringify(r && r.opts));
      await pick(p, '이날 새 일정');
      c.eq(await p.evaluate(() => { const t = document.getElementById('f-title'); const ds = document.querySelector('#f-chips [data-fpanel="date"]'); return [!!t, ds ? ds.textContent.trim() : ''].join('|'); }), 'true|11월 12일 (목)', "'이날 새 일정' → 그날로 새 일정 창");
      await p.evaluate(() => { if (window.BX_back) window.BX_back(); }); await p.waitForTimeout(400);
      await press(p, '.cal .cell[data-date="2026-11-12"]'); await pick(p, '이날 메모');
      c.ok(await p.evaluate(() => { const pg = document.getElementById('bx-mmn'); return !!pg && pg.dataset.ds === '2026-11-12' && /11월 12일/.test(pg.textContent); }), "'이날 메모' → 그날 새 메모 페이지");
      c.eq(app.errors, [], '화면 오류');
    } finally { await app.close(); }
  }

  // (3) 새 일정 창: 색 동그라미 없음 · 말하기는 보라 바탕 아이콘만(정사각). 시간표 빠른 추가는 옆에 '추가'가 있어 회색
  {
    const app = await openApp({ width: 384, height: 832, now: NOW, data: data('') });
    const p = app.page;
    try {
      await p.waitForTimeout(1100);
      await p.click('.bx-fab'); await p.waitForTimeout(600);
      const m = await p.evaluate(() => {
        const b = document.querySelector('#sheet-root [data-act="bx-mic"][data-for="f-title"]'), r = b.getBoundingClientRect(), q = getComputedStyle(b);
        const acc = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
        const probe = document.createElement('i'); probe.style.color = acc; document.body.append(probe); const accRgb = getComputedStyle(probe).color; probe.remove();
        return { dot: !!document.querySelector('#sheet-root .bx-tdot'), txt: (b.innerText || '').trim(), label: b.getAttribute('aria-label'), w: Math.round(r.width), h: Math.round(r.height), bg: q.backgroundColor, acc: accRgb, ph: document.getElementById('f-title').getAttribute('placeholder') };
      });
      c.ok(!m.dot, '새 일정 창: 제목 옆 색 동그라미 없음(캘린더 · 색은 자세히)');
      c.ok(!m.txt && m.label === '말하기' && m.w === m.h && m.w <= 40 && m.bg === m.acc, "말하기: 보라 바탕 마이크 아이콘만 · 정사각 " + JSON.stringify(m));
      c.eq(m.ph, '예) 내일 오후 3시 치과', '칸이 넓어져 폭 384에서 긴 예시가 들어감');
      await p.evaluate(() => { if (window.BX_back) window.BX_back(); }); await p.waitForTimeout(400);
      await p.click('.dock [data-view="tt"]'); await p.waitForTimeout(600);
      await p.evaluate(() => { const b = document.querySelector('[data-act="bx-tt-say"]'); if (b) b.click(); }); await p.waitForTimeout(500);
      const t = await p.evaluate(() => { const b = document.querySelector('#sheet-root [data-act="bx-mic"][data-for="tt-in"]'), a = document.querySelector('#sheet-root [data-act="tt-add"]'); if (!b || !a) return null; return { mic: getComputedStyle(b).backgroundColor, add: getComputedStyle(a).backgroundColor, w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height) }; });
      c.ok(t && t.mic !== t.add && t.w === t.h, "시간표 빠른 추가: 말하기는 회색 아이콘(옆 '추가'가 보라) " + JSON.stringify(t));
      c.eq(app.errors, [], '화면 오류');
    } finally { await app.close(); }
  }

  // (4) 메모 줄 칸: 아이콘 · 시각 · 글이 위 상자 줄(목록 줄 C)의 아이콘 · 시각 · 이름과 같은 자리
  for (const clock of ['', '24']) {
    const app = await openApp({ width: clock ? 360 : 384, height: 900, now: NOW, data: data(clock) });
    const p = app.page;
    try {
      await p.waitForTimeout(1100);
      const col = await p.evaluate(() => {
        const L = e => e ? Math.round(e.getBoundingClientRect().left) : null;
        const a = document.querySelector('#tcard2 .row.rowc'), m = document.querySelector('#bx-mm-card .bx-mm-row');
        return { row: [L(a.querySelector('.rc-ic')), L(a.querySelector('.row-time')), L(a.querySelector('.row-body'))], memo: [L(m.querySelector('.rc-ic')), L(m.querySelector('.bx-mm-t')), L(m.querySelector('.bx-mm-x'))],
          icon: !!m.querySelector('.rc-ic svg'), one: Math.round(m.querySelector('.bx-mm-t').getBoundingClientRect().height) };
      });
      c.ok(col.icon && JSON.stringify(col.row) === JSON.stringify(col.memo) && col.one <= 24, (clock ? '24시간 · 폭 360' : '오전 · 오후 · 폭 384') + ': 메모 줄 [메모 아이콘 | 시각 | 글]이 위 상자 줄과 같은 칸, 시각은 한 줄 ' + JSON.stringify(col));
    } finally { await app.close(); }
  }
  return c.done();
};
