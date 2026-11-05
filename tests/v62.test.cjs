// 시험판 62(대표 11/6)
// (1) 그 밖의 기능으로 접기(결정 사안 '1차 고를 이유' · 04:32 "캘린더 · 시간관리 · 행동조절에만 집중"): 시간표 · 메모 · 명상(이름 '릴렉스', n09)
//     아래 메뉴 기본 루틴 · 홈 · 캘린더, 저장해 둔 아래 메뉴에서도 한 번 뺌, ☰ · 기능 · 메뉴 편집 · 첫 실행은 '그 밖의 기능' 묶음. 켠 기능은 그대로
// (2) 시간 페이지 세 칸 바퀴(선택실 4 · 1번 B, s02): 시작 · 끝 칸 + 오전 · 오후 | 시 | 분(24시간이면 시 | 분), 휴대폰 시계 창 없음
// (3) 출발·준비 단계마다 ±(2번 가) · 시각 왼쪽 종(3번 ㄱ): 이 일정만 / '루틴에도 저장', 알람 계획에 반영
const { openApp, settings, checker } = require('./harness.cjs');
const old = '2026-10-29T00:00:00.000Z';
const at = s => Date.parse(s + '+09:00');
const doc = (p, id) => p.evaluate(id => (window.BX_T.docs().find(([k]) => k === id) || [0, null])[1], id);
// 홈 단추의 확인 필요 숫자(.dock-badge)는 빼고 이름만
const dockLabels = p => p.evaluate(() => Array.from(document.querySelectorAll('.dock .dock-btn')).map(b => Array.from(b.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim()));
const ALL = { report: true, routines: true, tt: true, memo: true, med: true };

module.exports = async function () {
  const c = checker('시험판 62 · 그 밖의 기능 · 시간 바퀴 · 출발·준비 단계 ± · 종');
  const base = (st = {}) => [['settings', settings(Object.assign({ bxStart: { at: old, mods: ALL } }, st))],
    ['rt_o', { type: 'routine', name: '외출 준비', days: [], mode: 'start', target: '08:00', on: false, steps: [{ id: 'o0', name: '씻기', min: 20 }, { id: 'o1', name: '옷 입기', min: 10 }, { id: 'o2', name: '짐 챙기기', min: 5 }], createdAt: old, updatedAt: old }],
    ['it_n', { type: 'item', title: '노동부', date: '2026-11-06', start: '14:00', end: '15:00', travel: 30, prep: 'rt_o', createdAt: old, updatedAt: old }],
    ['it_v', { type: 'item', title: '은행', date: '2026-11-06', start: '16:00', end: '16:30', travel: 20, createdAt: old, updatedAt: old }],
    ['it_d', { type: 'item', title: '장보기', date: '2026-11-06', createdAt: old, updatedAt: old }],
    ['mm_1', { type: 'memo', date: '2026-11-06', text: '은행 서류 사본 두 장 챙기기', at: '06:20', createdAt: '2026-11-05T21:20:00.000Z', updatedAt: old }]];
  const NOW = '2026-11-06T09:20:00+09:00';

  // (1) 접기
  {
    // 아래 메뉴를 고친 적 없는 휴대폰: 루틴 · 홈 · 캘린더
    let app = await openApp({ width: 384, height: 832, now: NOW, data: base({ bxDock: undefined, bxDockMig: undefined, bxDockFold: undefined }) });
    try {
      const p = app.page; await p.waitForTimeout(1100);
      c.eq(await dockLabels(p), ['루틴', '홈', '캘린더'], '아래 메뉴 기본: 루틴 · 홈 · 캘린더');
      await p.click('.ab-menu'); await p.waitForTimeout(500);
      const mn = await p.evaluate(() => Array.from(document.querySelectorAll('#sheet-b .bx-menu-h')).map(h => [h.textContent.trim(), Array.from(h.nextElementSibling.querySelectorAll('.ml')).map(x => x.textContent.trim())]));
      c.eq(mn[0], ['그 밖의 기능', ['시간표', '메모', '릴렉스']], "왼쪽 위 메뉴: '그 밖의 기능'에 시간표 · 메모 · 릴렉스 " + JSON.stringify(mn));
      await p.click('#sheet-root [data-act="bx-go"][data-view="med"]'); await p.waitForTimeout(600);
      c.eq(await p.evaluate(() => document.querySelector('.page-head h1').textContent.trim()), '릴렉스', "명상 화면 제목 '릴렉스'(안의 명상 · 배경 소리는 그대로)");
      // 켠 기능은 그대로: 홈 '오늘의 메모'
      await p.click('.dock [data-view="today"]'); await p.waitForTimeout(500);
      c.ok(await p.evaluate(() => !!document.getElementById('bx-mm-card') && /은행 서류 사본/.test(document.getElementById('bx-mm-card').textContent)), "켠 메모는 홈 '오늘의 메모' 그대로");
      // 기능 · 메뉴 편집
      await p.click('.ab-menu'); await p.waitForTimeout(400); await p.click('#sheet-root [data-act="bx-feat"]'); await p.waitForTimeout(500);
      const ft = await p.evaluate(() => Array.from(document.querySelectorAll('#sheet-b .bx-ft-hd')).map(h => [h.querySelector('.bx-ft-h').textContent.trim(), Array.from((h.nextElementSibling || document.createElement('i')).querySelectorAll('.bx-ft-t b')).map(x => x.textContent.trim())]));
      c.eq(ft.slice(0, 2), [['시간 · 행동 관리', ['루틴', '아침 요약']], ['그 밖의 기능', ['시간표', '메모', '릴렉스']]], '기능 · 메뉴 편집: 시간 · 행동 관리(루틴 · 아침 요약) / 그 밖의 기능(시간표 · 메모 · 릴렉스) ' + JSON.stringify(ft));
      // 시간표를 껐다 켜도 아래 메뉴에 들어가지 않음(그 밖의 기능), 루틴은 들어감
      await p.click('#sheet-b [data-bx-feat="tt"]'); await p.waitForTimeout(200); await p.click('#sheet-b [data-bx-feat="tt"]'); await p.waitForTimeout(200);
      await p.click('#sheet-b [data-bx-feat="routines"]'); await p.waitForTimeout(200); await p.click('#sheet-b [data-bx-feat="routines"]'); await p.waitForTimeout(300);
      const st = await doc(p, 'settings');
      c.eq([st.bxDock, st.bxDockFold], [['routines', 'month'], 1], '시간표를 켜도 아래 메뉴에 안 들어감 · 루틴은 제자리(캘린더 앞)로 들어감, 저장하면 bxDockFold ' + JSON.stringify([st.bxDock, st.bxDockFold]));
      c.eq(app.errors, [], '화면 오류(접기)');
    } finally { await app.close(); }

    // 시험판 41~61 기본값(루틴 · 캘린더 · 시간표 · 메모)을 저장해 둔 휴대폰: 접은 기능만 한 번 뺀다
    app = await openApp({ width: 384, height: 832, now: NOW, data: base({ bxDock: ['routines', 'month', 'tt', 'memo'], bxDockMig: 1, bxDockMemo: 1, bxDockFold: undefined }) });
    try { await app.page.waitForTimeout(1000); c.eq(await dockLabels(app.page), ['루틴', '홈', '캘린더'], '저장해 둔 아래 메뉴(루틴 · 캘린더 · 시간표 · 메모)에서 시간표 · 메모를 뺌'); }
    finally { await app.close(); }
    app = await openApp({ width: 384, height: 832, now: NOW, data: base({ bxDock: ['med', 'month', 'tt'], bxDockMig: 1, bxDockFold: undefined }) });
    try { await app.page.waitForTimeout(1000); c.eq(await dockLabels(app.page), ['캘린더', '홈'], '명상 · 시간표를 넣어 둔 아래 메뉴도 그 둘만 뺌'); }
    finally { await app.close(); }
    // 시험판 62 뒤에 고른 아래 메뉴는 그대로(원하면 그 밖의 기능도 넣음)
    app = await openApp({ width: 384, height: 832, now: NOW, data: base({ bxDock: ['routines', 'month', 'tt', 'memo'], bxDockMig: 1, bxDockFold: 1 }) });
    try { await app.page.waitForTimeout(1000); c.eq(await dockLabels(app.page), ['루틴', '캘린더', '홈', '시간표', '메모'], '시험판 62 뒤에 저장한 아래 메뉴는 고른 그대로'); }
    finally { await app.close(); }

    // 첫 실행: 그 밖의 기능은 따로 묶음, 끝내면 아래 메뉴는 루틴 · 캘린더만
    app = await openApp({ width: 384, height: 1000, now: NOW, data: [['settings', Object.assign(settings({}), { bxStart: undefined, onboarded: undefined, welcomed: undefined, bxDock: undefined, bxDockMig: undefined, bxDockFold: undefined })]] });
    try {
      const p = app.page; await p.waitForTimeout(1300);
      const s1 = await p.evaluate(() => { const l = document.querySelector('#bx-start .bxs-list'); return l ? Array.from(l.children).map(e => e.classList.contains('bxs-gh') ? '|' + e.textContent.trim() : (e.querySelector('b') || e).textContent.trim()) : null; });
      c.eq(s1, ['일정 · 캘린더', '아침 요약', '루틴', '|그 밖의 기능', '시간표', '메모', '릴렉스'], "첫 실행: 그 밖의 기능 묶음(시간표 · 메모 · 릴렉스) " + JSON.stringify(s1));
      for (const k of ['routines', 'tt', 'med']) { await p.click('#bx-start [data-bxs-mod="' + k + '"]'); await p.waitForTimeout(120); }
      await p.click('#bx-start [data-bxs="next"]'); await p.waitForTimeout(300);
      const cards = await p.evaluate(() => Array.from(document.querySelectorAll('#bx-start .bxs-card')).map(e => e.querySelector('.bxs-cn b').textContent + ':' + ((e.querySelector('.bxs-cn em') || {}).textContent || '')));
      c.ok(cards.includes('시간표:왼쪽 위 메뉴') && cards.includes('릴렉스:왼쪽 위 메뉴') && cards.some(x => /^루틴:아래 메뉴/.test(x)), "첫 실행 둘째 화면: 시간표 · 릴렉스는 '왼쪽 위 메뉴' " + JSON.stringify(cards));
      await p.click('#bx-start [data-bxs="done"]'); await p.waitForTimeout(500);
      const st = await doc(p, 'settings');
      c.eq([st.bxDock, st.bxDockFold, await dockLabels(p)], [['routines', 'month'], 1, ['루틴', '홈', '캘린더']], '첫 실행 끝: 아래 메뉴 루틴 · 홈 · 캘린더(시간표를 골라도)');
      c.eq(app.errors, [], '화면 오류(첫 실행)');
    } finally { await app.close(); }
  }

  // (2) 시간 페이지 바퀴
  const openTime = async p => {
    await p.click('#tcard2 .row-main[data-id="it_n"]'); await p.waitForTimeout(600);
    await p.click('#sheet-root .bx-er[data-fpanel="time"]'); await p.waitForTimeout(700);
  };
  const tw = p => p.evaluate(() => {
    const w = document.querySelector('#bx-ep .bx-tw'); if (!w) return null;
    return { box: Array.from(w.querySelectorAll('.bx-tw-box')).map(b => [b.textContent.trim(), b.getAttribute('aria-pressed')]),
      cols: Array.from(w.querySelectorAll('.bx-wc')).map(c => [c.dataset.wpart, c.querySelectorAll('.bx-wi').length, (c.querySelector('.bx-wi.on') || {}).textContent, Math.round(c.scrollTop / 40)]),
      clock: !!document.querySelector('#bx-ep input[type="time"]#f-start') };
  });
  const pick = (p, part, label) => p.evaluate(([part, label]) => { const it = Array.from(document.querySelectorAll('#bx-ep .bx-wc[data-wpart="' + part + '"] .bx-wi')).find(e => e.textContent.trim() === label); if (it) it.click(); return !!it; }, [part, label]);
  {
    const app = await openApp({ width: 384, height: 832, now: NOW, data: base() });
    try {
      const p = app.page; await p.waitForTimeout(1100);
      await openTime(p);
      const a = await tw(p);
      c.eq(a, { box: [['오후 2:00', 'true'], ['오후 3:00', 'false']], cols: [['ap', 2, '오후', 1], ['h', 12, '2', 2], ['m', 12, '00', 0]], clock: false },
        '시간 페이지: 시작 · 끝 칸(시작을 고치는 중) + 오전 · 오후 | 시 | 분 바퀴, 고른 칸이 가운데, 휴대폰 시계 창 칸 없음 ' + JSON.stringify(a));
      // 오전으로 → 오전 2:00 ~ 오전 3:00(끝은 소요 시간만큼 따라감)
      await pick(p, 'ap', '오전'); await p.waitForTimeout(250);
      c.eq((await tw(p)).box, [['오전 2:00', 'true'], ['오전 3:00', 'false']], '오전을 누르면 시작이 오전 2:00, 끝도 1시간 뒤로 따라감');
      await pick(p, 'ap', '오후'); await pick(p, 'h', '4'); await p.waitForTimeout(250);
      await pick(p, 'm', '30'); await p.waitForTimeout(250);
      c.eq((await tw(p)).box, [['오후 4:30', 'true'], ['오후 5:30', 'false']], '시 · 분 바퀴를 누르면 오후 4:30 ~ 오후 5:30');
      // 밀어서 고르기: 시 바퀴를 3칸 위로(1시) 밀고 멈추면
      await p.evaluate(() => { const c = document.querySelector('#bx-ep .bx-wc[data-wpart="h"]'); c.dispatchEvent(new Event('pointerdown')); c.scrollTop = 40; c.dispatchEvent(new Event('scroll')); });
      await p.waitForTimeout(500);
      c.eq((await tw(p)).box[0][0], '오후 1:30', '시 바퀴를 밀어 1에서 멈추면 오후 1:30');
      // 끝 칸: 누르면 끝을 고침, 시작보다 앞서면 시작 + 5분
      await p.click('#bx-ep [data-bxtw="end"]'); await p.waitForTimeout(300);
      const e1 = await tw(p);
      c.eq([e1.box[1][1], e1.cols.map(x => x[2])], ['true', ['오후', '2', '30']], '끝 칸을 누르면 끝(오후 2:30)을 바퀴로 고침 ' + JSON.stringify(e1));
      await pick(p, 'h', '12'); await p.waitForTimeout(250);
      c.eq((await tw(p)).box[1][0], '오후 1:35', '끝을 시작보다 앞으로 돌리면 시작 + 5분(오후 1:35)');
      // 완료 → 일정 창 줄, 저장
      await p.click('#bx-ep [data-bxep="done"]'); await p.waitForTimeout(300);
      c.eq(await p.evaluate(() => document.querySelector('#f-chips [data-fpanel="time"] .bx-er-t').textContent), '오후 1:30 ~ 오후 1:35', '완료: 일정 창 시간 줄 오후 1:30 ~ 오후 1:35');
      // ‹ 는 되돌림
      await p.click('#sheet-root .bx-er[data-fpanel="time"]'); await p.waitForTimeout(500);
      await pick(p, 'h', '9'); await p.waitForTimeout(200);
      await p.click('#bx-ep [data-bxep="back"]'); await p.waitForTimeout(300);
      c.eq(await p.evaluate(() => document.querySelector('#f-chips [data-fpanel="time"] .bx-er-t').textContent), '오후 1:30 ~ 오후 1:35', '‹ : 바퀴로 바꾼 것을 되돌림');
      c.eq(app.errors, [], '화면 오류(시간 바퀴)');
    } finally { await app.close(); }
    // 24시간 · 말로 넣은 3분은 분 바퀴를 건드릴 때까지 그대로
    const data = base({ clock: '24' }); data.push(['it_m', { type: 'item', title: '약국', date: '2026-11-06', start: '09:03', end: '09:33', createdAt: old, updatedAt: old }]);
    const app2 = await openApp({ width: 360, height: 780, now: NOW, data });
    try {
      const p = app2.page; await p.waitForTimeout(1100);
      await p.click('#tcard2 .row-main[data-id="it_m"]'); await p.waitForTimeout(600);
      await p.click('#sheet-root .bx-er[data-fpanel="time"]'); await p.waitForTimeout(700);
      const a = await tw(p);
      c.eq(a, { box: [['09:03', 'true'], ['09:33', 'false']], cols: [['h', 24, '09', 9], ['m', 12, '05', 1]], clock: false }, '24시간: 시 | 분 바퀴(시 00~23), 3분은 가까운 05에 표시 ' + JSON.stringify(a));
      await pick(p, 'h', '10'); await p.waitForTimeout(250);
      c.eq((await tw(p)).box, [['10:03', 'true'], ['10:33', 'false']], '시만 바꾸면 3분은 그대로(10:03 ~ 10:33)');
      c.eq(app2.errors, [], '화면 오류(24시간 바퀴)');
    } finally { await app2.close(); }
  }

  // (3) 출발·준비: 단계마다 ± · 종
  const openGo = async p => {
    await p.click('#tcard2 .row-main[data-id="it_n"]'); await p.waitForTimeout(600);
    await p.evaluate(() => { const b = document.querySelector('#sheet-root [data-bxmore]'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); });
    await p.click('#sheet-root .bx-er[data-fpanel="go"]'); await p.waitForTimeout(600);
  };
  const line = p => p.evaluate(() => {
    const l = document.querySelector('#bx-ep .tv-line.ed'); if (!l) return null;
    return { rows: Array.from(l.children).map(li => [(li.querySelector('.bx-tvl-bell') || {}).getAttribute ? li.querySelector('.bx-tvl-bell').getAttribute('aria-pressed') : '-', li.querySelector('b.tnum').textContent, li.querySelector('.nm').textContent, (li.querySelector('.bx-stp b') || {}).textContent || '']),
      note: (document.querySelector('#bx-ep .bx-tvl-note') || {}).textContent, save: (document.querySelector('#bx-ep .bx-tvl-save') || { getAttribute: () => null }).getAttribute('aria-checked') };
  });
  const tap = (p, sel) => p.evaluate(sel => { const b = document.querySelector(sel); if (b) b.click(); return !!b; }, sel);
  {
    const app = await openApp({ width: 384, height: 832, now: NOW, data: base() });
    try {
      const p = app.page; await p.waitForTimeout(1100);
      await openGo(p);
      const a = await line(p);
      c.eq(a.rows, [['true', '오후 12:55', '씻기', '20분'], ['true', '오후 1:15', '옷 입기', '10분'], ['true', '오후 1:25', '짐 챙기기', '5분'], ['true', '오후 1:30', '출발이동', '30분'], ['-', '오후 2:00', '도착 · 노동부', '']],
        '출발·준비: 줄마다 시각 왼쪽 종 · 단계 − N분 + · 출발 줄 이동 시간 ' + JSON.stringify(a));
      c.ok(a.note === '알람 4개 중 4개 울려요 · 준비 시작 오후 12:55' && a.save === 'false', "아래 '알람 4개 중 4개 울려요 · 준비 시작', '‘외출 준비’ 루틴에도 저장'(꺼짐) " + JSON.stringify([a.note, a.save]));
      // 씻기 + → 25분, 준비 시작 5분 일찍(출발 시각은 그대로)
      await tap(p, '#bx-ep [data-tvl="st:o0"][data-d="5"]'); await p.waitForTimeout(200);
      let b = await line(p);
      c.ok(b.rows[0][1] === '오후 12:50' && b.rows[0][3] === '25분' && b.rows[3][1] === '오후 1:30' && /준비 시작 오후 12:50\(루틴보다 5분 일찍\)/.test(b.note), '씻기 + : 25분, 준비 시작 오후 12:50(루틴보다 5분 일찍), 출발은 그대로 ' + JSON.stringify(b));
      // 옷 입기 종 끄기
      await tap(p, '#bx-ep [data-tvl="bell"][data-r="o1"]'); await p.waitForTimeout(200);
      b = await line(p);
      c.ok(b.rows[1][0] === 'false' && /알람 4개 중 3개 울려요 · 끈 것: 옷 입기/.test(b.note), "옷 입기 종을 누르면 안 울림 · '끈 것: 옷 입기' " + JSON.stringify(b));
      // 이동 시간 + → 35분, 출발 1:25 · 준비 단계도 함께 앞당겨짐
      await tap(p, '#bx-ep [data-tvl="tv"][data-d="5"]'); await p.waitForTimeout(200);
      b = await line(p);
      c.ok(b.rows[3][1] === '오후 1:25' && b.rows[3][3] === '35분' && b.rows[0][1] === '오후 12:45' && await p.evaluate(() => document.querySelector('#bx-ep [data-ftv="0"]') && !Array.from(document.querySelectorAll('#bx-ep [data-ftv]')).some(x => x.getAttribute('aria-pressed') === 'true' && x.dataset.ftv === '30')),
        '출발 줄 이동 시간 + : 35분 → 출발 오후 1:25, 씻기 오후 12:45(위 이동 시간 칸도 30분이 아님) ' + JSON.stringify(b.rows.map(r => r[1])));
      await p.click('#bx-ep [data-bxep="done"]'); await p.waitForTimeout(300);
      await p.evaluate(() => document.querySelector('#sheet-root [data-act="save"]').click());
      await p.waitForTimeout(600);
      const it = await doc(p, 'it_n'), rt = await doc(p, 'rt_o');
      c.eq([it.travel, it.prepMin, it.prepRing, rt.steps.map(s => s.min)], [35, { o0: 25 }, { o1: 0 }, [20, 10, 5]], '저장: 이 일정만(이동 35분 · 씻기 25분 · 옷 입기 끔), 루틴 탭 외출 준비는 그대로 ' + JSON.stringify([it.travel, it.prepMin, it.prepRing]));
      // 알람: 옷 입기 없음, 씻기 오후 12:45 꼭 울림
      const al = (await p.evaluate(() => window.BX_alarmPlan(2))).filter(x => /^iv_it_n_/.test(x.id)).map(x => [new Date(x.at + 9 * 3600e3).toISOString().slice(11, 16), x.title, x.ring]);
      c.eq(al, [['12:45', '씻기', 'must'], ['13:20', '짐 챙기기', 'short'], ['13:25', '출발할 시간', 'must']], '알람 계획: 씻기 12:45(꼭 울림) · 짐 챙기기 1:20 · 출발 1:25, 끈 옷 입기는 없음 ' + JSON.stringify(al));
      c.eq(app.errors, [], '화면 오류(출발·준비)');
    } finally { await app.close(); }
  }
  {
    // 앞 단계를 끄면 남은 첫 단계가 준비 시작이라 꼭 울림 · '루틴에도 저장'
    const data = base(); data[2] = ['it_n', Object.assign({}, data[2][1], { prepRing: { o0: 0 } })];
    const app = await openApp({ width: 384, height: 832, now: NOW, data });
    try {
      const p = app.page; await p.waitForTimeout(1100);
      const al = (await p.evaluate(() => window.BX_alarmPlan(2))).filter(x => /^iv_it_n_/.test(x.id)).map(x => [x.title, x.ring]);
      c.eq(al, [['옷 입기', 'must'], ['짐 챙기기', 'short'], ['출발할 시간', 'must']], '씻기를 끄면 옷 입기가 준비 시작(꼭 울림) ' + JSON.stringify(al));
      await openGo(p);
      await tap(p, '#bx-ep [data-tvl="st:o1"][data-d="-5"]'); await p.waitForTimeout(150);
      await tap(p, '#bx-ep [data-tvl="save"]'); await p.waitForTimeout(150);
      const s = await line(p);
      c.ok(s.save === 'true' && s.rows[1][3] === '5분', "'루틴에도 저장'을 켬 · 옷 입기 5분 " + JSON.stringify(s));
      await p.click('#bx-ep [data-bxep="done"]'); await p.waitForTimeout(300);
      await p.evaluate(() => document.querySelector('#sheet-root [data-act="save"]').click());
      await p.waitForTimeout(600);
      const it = await doc(p, 'it_n'), rt = await doc(p, 'rt_o');
      c.eq([it.prepMin, it.prepRing, rt.steps.map(s => [s.min, s.kind || 'do'])], [null, null, [[20, 'wait'], [5, 'do'], [5, 'do']]], "저장: 루틴 외출 준비가 바뀜(씻기 소리 없이 · 옷 입기 5분), 이 일정에는 남기지 않음 " + JSON.stringify([it.prepMin, it.prepRing]));
      c.eq(app.errors, [], '화면 오류(루틴에도 저장)');
    } finally { await app.close(); }
  }
  {
    // 휴대폰 캘린더 일정: 바로 적고 ‹ 는 되돌림, '완료' + 루틴에도 저장이면 루틴으로
    const pcache = { at: Date.parse('2026-11-06T06:00:00+09:00'), events: [
      { eventId: 91, begin: Date.parse('2026-11-06T13:00:00+09:00'), end: Date.parse('2026-11-06T14:00:00+09:00'), allDay: false, title: '팀 점심', calendarId: 5, calendar: '회사', color: -16744448, location: '강남역 11번 출구', description: '' }] };
    const app = await openApp({ width: 384, height: 832, now: NOW, data: base() });
    try {
      const p = app.page;
      await p.evaluate(pc => { localStorage.setItem('bx:pcal', JSON.stringify({ on: true })); localStorage.setItem('bx:pcache', JSON.stringify(pc)); }, pcache);
      await p.reload(); await p.waitForFunction(() => window.BX_T && document.querySelector('.dock')); await p.waitForTimeout(800);
      await p.waitForSelector('[data-act="edit"][data-id^="pc_91"]', { state: 'attached' }); await p.evaluate(() => document.querySelector('[data-act="edit"][data-id^="pc_91"]').click()); await p.waitForTimeout(500);
      const pxOf = () => p.evaluate(() => (window.BX_T.docs().find(([id]) => id.startsWith('px_91')) || [0, {}])[1]);
      await p.click('[data-bxpc45="go"]'); await p.waitForTimeout(300);
      await p.click('#bx-pg [data-pctv="20"]'); await p.waitForTimeout(250);
      await p.click('#bx-pg [data-pcprep="rt_o"]'); await p.waitForTimeout(300);
      await tap(p, '#bx-pg [data-tvl="st:o2"][data-d="5"]'); await p.waitForTimeout(250);
      await tap(p, '#bx-pg [data-tvl="bell"][data-r="leave"]'); await p.waitForTimeout(250);
      const k1 = await pxOf();
      c.eq([k1.travel, k1.prepMin, k1.prepRing], [20, { o2: 10 }, { leave: 0 }], '휴대폰 캘린더 일정: 짐 챙기기 + · 출발 종 끄기는 바로 그 일정에 ' + JSON.stringify(k1));
      await p.click('#bx-pg [data-bxpg="back"]'); await p.waitForTimeout(300);
      const k2 = await pxOf();
      c.ok(k2.prepMin == null && k2.prepRing == null && k2.travel == null, '‹ : 되돌림 ' + JSON.stringify(k2));
      await p.click('[data-bxpc45="go"]'); await p.waitForTimeout(300);
      await p.click('#bx-pg [data-pctv="20"]'); await p.waitForTimeout(250);
      await p.click('#bx-pg [data-pcprep="rt_o"]'); await p.waitForTimeout(300);
      await tap(p, '#bx-pg [data-tvl="st:o2"][data-d="5"]'); await p.waitForTimeout(200);
      await tap(p, '#bx-pg [data-tvl="bell"][data-r="leave"]'); await p.waitForTimeout(200);
      await tap(p, '#bx-pg [data-tvl="save"]'); await p.waitForTimeout(200);
      await p.click('#bx-pg [data-bxpg="done"]'); await p.waitForTimeout(400);
      const k3 = await pxOf(), rt = await doc(p, 'rt_o');
      c.eq([k3.prepMin || null, k3.prepRing, rt.steps.map(s => s.min)], [null, { leave: 0 }, [20, 10, 10]], "완료 + '루틴에도 저장': 짐 챙기기 10분은 루틴으로, 출발 종 끔은 이 일정에 " + JSON.stringify([k3, rt.steps.map(s => s.min)]));
      c.eq(app.errors, [], '화면 오류(휴대폰 캘린더 출발·준비)');
    } finally { await app.close(); }
  }
  return c.done();
};
