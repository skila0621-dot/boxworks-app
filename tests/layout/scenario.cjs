// 자동 정렬 점검이 여는 화면 · 창 · 페이지(대표 상시 규칙 11/4 22:59: "모든 화면과 창")
// state(이름)를 부를 때마다 그 화면을 잰다(run.cjs). 새 화면 · 창을 만들면 여기에도 넣는다
const H = require('../harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
const day = n => { const d = new Date(Date.parse('2026-11-02T12:00:00+09:00') + n * 864e5); return d.toISOString().slice(0, 10); };
// 시각 표시(시험판 58): 정렬 점검은 오전 · 오후와 24시간 두 번 돈다(run.cjs --clocks). 24시간이면 모든 자료의 설정에 clock '24'
let CLOCK = '';
function data(extra = {}) {
  const S = H.settings(Object.assign({ bxDock: ['routines', 'month', 'tt', 'memo'], bxDockMig: 1, bxDockMemo: 1, bxReport: { on: true, at: '07:30' } }, CLOCK ? { clock: CLOCK } : {}, extra));
  return [
    ['settings', S],
    ['c_w', { type: 'category', name: '회사 · 프로젝트 일정 (팀 공유)', color: '#2a78d6', order: 0, createdAt: old }],
    ['c_p', { type: 'category', name: '개인', color: '#1baf7a', order: 1, createdAt: old }],
    ['it_1', { type: 'item', title: '치과 정기 검진과 스케일링 예약', date: day(0), start: '15:00', end: '16:00', remind: '10', location: '서울 강남구 연세바른치과 3층', travel: 30, categoryId: 'c_p', createdAt: old, updatedAt: old }],
    ['it_2', { type: 'item', title: '보고서 마감', date: day(0), start: '10:00', end: '12:30', remind: '60', categoryId: 'c_w', createdAt: old, updatedAt: old }],
    ['it_3', { type: 'item', title: '장보기', date: day(0), createdAt: old, updatedAt: old }],
    ['it_4', { type: 'item', title: '은행 서류 내기', date: day(-1), start: '11:00', createdAt: old, updatedAt: old }],
    ['it_5', { type: 'item', title: '부산 출장', date: day(0), endDate: day(2), categoryId: 'c_w', createdAt: old, updatedAt: old }],
    ['it_6', { type: 'item', title: '헬스', date: day(-1), start: '19:00', done: true, createdAt: old, updatedAt: old }],
    ['it_7', { type: 'item', title: '친구 생일 저녁 약속', date: day(3), start: '19:30', location: '홍대입구역 2번 출구', createdAt: old, updatedAt: old }],
    ['rt_w', { type: 'routine', name: '출근 준비', days: [0, 1, 2, 3, 4, 5, 6], mode: 'arrive', target: '09:00', travel: 45, buffer: 15, times: 6, every: 5, on: true,
      steps: [['기상하기', 2], ['스트레칭', 5], ['이불 개기', 3], ['씻기', 15], ['머리 말리기', 7], ['옷 입기', 8], ['식사', 12], ['출근 준비', 8]].map(([n, m], i) => ({ id: 's' + i, name: n, min: m })), createdAt: old, updatedAt: old }],
    ['rt_h', { type: 'routine', name: '집안일 15분', days: [0, 1, 2, 3, 4, 5, 6], mode: 'start', target: '20:00', times: 6, every: 5, on: true,
      steps: [{ id: 'h0', name: '빨래 돌리기', min: 5 }, { id: 'h1', name: '설거지', min: 15 }, { id: 'h2', name: '세탁 기다리기', min: 30, kind: 'wait' }, { id: 'h3', name: '빨래 널기', min: 10 }], createdAt: old, updatedAt: old }],
    ['rt_m', { type: 'routine', name: '약 먹기', days: [0, 1, 2, 3, 4, 5, 6], mode: 'start', target: '12:00', times: 6, every: 10, on: true, steps: [{ id: 'm0', name: '점심 약', min: 0 }], createdAt: old, updatedAt: old }],
    ['rt_b', { type: 'routine', name: '잠들기 전 명상', days: [0, 1, 2, 3, 4, 5, 6], mode: 'start', target: '22:30', times: 0, on: true, sound: 'bowl', bowl: 'clear', steps: [{ id: 'b0', name: '명상', min: 10 }], createdAt: old, updatedAt: old }],
    ['tt_a', { type: 'tt', name: '경영학원론', days: [1, 3], start: '10:30', end: '12:00', place: '301호', remind: '10', color: '#2a78d6', on: true, createdAt: old, updatedAt: old }],
    ['tt_b', { type: 'tt', name: '영어회화', days: [2, 4], start: '14:00', end: '15:30', remind: '10', color: '#d6662a', on: true, createdAt: old, updatedAt: old }],
    ['tt_c', { type: 'tt', name: '카페 알바', days: [5], start: '13:00', end: '17:00', remind: '30', color: '#3d9a5b', on: true, createdAt: old, updatedAt: old }],
    ['mm_1', { type: 'memo', date: day(0), text: '은행 서류 사본 두 장 챙기기', at: '06:20', createdAt: '2026-11-01T21:20:00.000Z', updatedAt: '2026-11-01T21:20:00.000Z' }],
    ['mm_2', { type: 'memo', date: day(0), text: '점심에 우체국 들러 택배 보내기 — 주소는 문자로 받은 것', at: '12:35', createdAt: '2026-11-01T21:30:00.000Z', updatedAt: '2026-11-01T21:30:00.000Z' }],
    ['mm_3', { type: 'memo', date: day(2), text: '출장 짐 목록', at: '21:00', createdAt: '2026-11-01T12:00:00.000Z', updatedAt: '2026-11-01T12:00:00.000Z' }]
  ];
}

// W: 폭 · theme: 'light' | 'dark' · state(이름, page): 그 화면을 잰다 · fail(이름, 오류)
module.exports = async function scenario({ W, theme, state, fail, only, clock }) {
  CLOCK = clock === '24' ? '24' : '';
  let app, p;
  // 폭마다 흔한 휴대폰 높이(360×780 · 384×832 대표 S25+ · 412×915), 위 상태 막대 32 · 아래 버튼 막대 48
  const HT = { 360: 780, 384: 832, 412: 915 }[W] || 844;
  const open = async (o = {}) => { app = await H.openApp(Object.assign({ width: W, height: HT, colorScheme: theme, insets: { top: 32, bottom: 48 } }, o)); p = app.page; await p.waitForTimeout(o.wait || 1300); };
  const snap = async label => { if (only && !label.includes(only)) return; await p.waitForTimeout(450); await state(label, p); };
  // 누르기: 미리 찾아 둔 요소가 아니라 누를 때 다시 찾는다(창이 다시 그려져 요소가 바뀌어도 '붙어 있지 않음'으로 걸리지 않게, 시험판 56)
  const tap = async sel => { const l = p.locator(sel).first(); if (!(await l.count())) return false; await l.click(); return true; };
  const tryDo = async (label, fn) => { try { await fn(); } catch (e) { fail(label, String(e && e.message || e).slice(0, 200)); } };
  const closeAll = async () => { for (let i = 0; i < 6; i++) { const has = await p.evaluate(() => !!(document.querySelector('#bx-pg:not([hidden]), #bx-ep:not([hidden]), #bx-mp:not([hidden]), #bx-mmn, #bx-att-view') || (document.querySelector('#sheet-root') && !document.querySelector('#sheet-root').hidden && document.querySelector('#sheet-root .sheet')))); if (!has) break; await p.evaluate(() => window.BX_back && window.BX_back()); await p.waitForTimeout(350); } };
  const dock = async v => { await closeAll(); await p.click('.dock [data-view="' + v + '"]'); await p.waitForTimeout(600); };
  const more = async () => { await closeAll(); await p.click('.ab-menu'); await p.waitForTimeout(500); };
  const clickAll = async (rowSel, backSel, label) => {
    const n = await p.evaluate(s => Array.from(document.querySelectorAll(s)).filter(e => e.getBoundingClientRect().height > 0).length, rowSel);
    for (let i = 0; i < n; i++) {
      await tryDo(label + i, async () => {
        const t = await p.evaluate(([s, i]) => { const e = Array.from(document.querySelectorAll(s)).filter(e => e.getBoundingClientRect().height > 0)[i]; if (!e) return null; const tt = (e.getAttribute('aria-label') || e.textContent).trim().slice(0, 14); e.scrollIntoView({ block: 'center' }); e.click(); return tt; }, [rowSel, i]);
        if (!t) return;
        await p.waitForTimeout(500);
        await snap(label + ' · ' + t.replace(/,.*$/, ''));
        await p.evaluate(b => { const x = document.querySelector(b); if (x) x.click(); else window.BX_back && window.BX_back(); }, backSel);
        await p.waitForTimeout(400);
      });
    }
  };
  const longPress = async sel => { const bb = await p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel); if (!bb) return false; await p.mouse.move(bb.x, bb.y); await p.mouse.down(); await p.waitForTimeout(700); await p.mouse.up(); await p.waitForTimeout(400); return true; };

  await open({ now: '2026-11-02T07:40:00+09:00', data: data() });
  await tryDo('홈', async () => { await snap('홈'); });
  // 단추 견본(시험판 55, 결정 기록 D-28): 공통 부품을 상태마다 한 화면에 — 기준 사진(tests/layout/base.cjs)과 같은 화면
  await tryDo('단추 견본', async () => { await p.evaluate(() => window.BX_specimen()); await snap('단추 견본'); await p.evaluate(() => { const e = document.getElementById('bx-spec'); if (e) e.remove(); }); });
  // 시험판 56(목록 줄 C): 루틴 줄을 누르면 단계 창(전: 카드 '자세히'로 그 자리에 펼침)
  await tryDo('홈 루틴 단계 창', async () => { await p.click('#tcard2 .row[data-rid="rt_w"] .row-main'); await snap('홈 루틴 단계 창'); await closeAll(); });
  await tryDo('홈 지난 일', async () => { if (await tap('[data-act="bx-past"]')) { await snap('홈 지난 일 펼침'); await tap('[data-act="bx-past"]'); } });
  await tryDo('홈 다음 날', async () => { await p.click('.bx-sum-nav[data-d="1"]'); await snap('홈 다음 날'); await p.click('[data-act="home-day"][data-d="0"]').catch(() => {}); });
  await tryDo('확인 필요', async () => { await p.click('[data-act="bx-late-open"]'); await snap('확인 필요'); if (await tap('#sheet-root [data-act="bx-late-date"], #sheet-root [data-bxlate="date"]')) { await p.waitForTimeout(500); await snap('확인 필요 날짜 변경'); } await closeAll(); });
  // 일정 창의 줄 · 날짜 · 시간 페이지(날짜 · 시간 칸은 처음 것 하나씩)
  // 시험판 56(일정 넣기 나): 맨 아래 '자세히'를 펼쳐 출발·준비 · 캘린더 · 메모 · 사진·파일 페이지까지 모두 연다
  const moreOpen = async () => { await p.evaluate(() => { const b = document.querySelector('#sheet-root [data-bxmore]'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); }); await p.waitForTimeout(250); };
  const edPages = async label => { await moreOpen(); await snap(label + ' · 자세히 펼침'); await clickAll('#sheet-root .bx-er[data-fpanel], #sheet-root [data-fpanel="date"], #sheet-root [data-fpanel="time"], #sheet-root [data-bxrem3="own"]', '#bx-ep [data-bxep="back"]', label); };
  await tryDo('새 일정', async () => { await closeAll(); await p.click('.bx-fab'); await snap('새 일정 창'); await edPages('새 일정'); await closeAll(); });
  await tryDo('일정 수정', async () => { await closeAll(); await p.click('#tcard2 .row-main[data-id="it_1"]'); await snap('일정 수정 창'); await edPages('일정 수정'); await closeAll(); });
  // 고른 칸 안의 작은 글(대표 11/4 23:07 '외출 준비 새로'가 안 보임): 출발·준비에서 새 루틴을 골라 본다
  await tryDo('출발·준비 새 루틴', async () => { await closeAll(); await p.click('#tcard2 .row-main[data-id="it_1"]'); await p.waitForTimeout(500); await moreOpen(); await p.click('#sheet-root .bx-er[data-fpanel="go"]'); await p.waitForTimeout(500);
    const ok = await p.evaluate(() => { const s = Array.from(document.querySelectorAll('#bx-ep small')).find(s => /새로/.test(s.textContent)); if (s) s.closest('button').click(); return !!s; });
    if (ok) await snap('출발·준비 · 새 루틴 고름'); else fail('출발·준비 새 루틴', "'새로' 칸이 없음"); await closeAll(); });
  await tryDo('캘린더', async () => {
    await dock('month'); await snap('캘린더 월');
    await p.click('#bx-vsw [data-bxvsw="week"]'); await snap('캘린더 주');
    await p.click('#bx-vsw [data-bxvsw="day"]'); await snap('캘린더 일');
    await p.click('#bx-vsw [data-bxvsw="month"]'); await p.waitForTimeout(400);
    await p.click('.cal .cell[data-date="2026-11-02"]'); await snap('날짜 창'); await closeAll();
    if (await tap('[data-act="bx-cals"]')) { await snap('캘린더 목록'); if (await tap('#sheet-root [data-bxcal]')) await snap('캘린더 자세히'); await closeAll(); }
    // 시험판 58: 칩을 길게 누르면 '색 바꾸기 · 이 캘린더 빼기', 뺀 캘린더는 캘린더 목록 맨 아래 '뺀 캘린더'
    if (await longPress('.page-head .bx-cchip[data-bxcsel="c_p"]')) {
      await snap('캘린더 칩 길게 누름');
      if (await tap('#sheet-root [data-act="bx-ccm-out"]')) {
        await p.waitForTimeout(500);
        if (await tap('.page-head [data-act="bx-cals"]')) { await snap('캘린더 목록 · 뺀 캘린더'); await tap('#sheet-root [data-act="bx-cal-back"][data-id="c_p"]'); await p.waitForTimeout(300); }
      }
      await closeAll();
      // 빼기 · 다시 넣기 알림 글은 그 화면에서 잠깐 뜨는 것 — 다음 화면(시간표)을 잴 때 남아 있지 않게 사라질 때까지 기다린다
      await p.waitForFunction(() => !document.querySelector('#toasts .toast'), null, { timeout: 12000 }).catch(() => {});
    }
  });
  await tryDo('시간표', async () => {
    await dock('tt'); await snap('시간표');
    if (await tap('[data-act="tt-new"]')) { await snap('수업 추가 창'); await clickAll('#sheet-root .bx-er[data-bxtt45]', '#bx-pg [data-bxpg="back"]', '수업 추가'); await closeAll(); }
    if (await p.$('.tt-b[data-id="tt_a"]')) { await p.click('.tt-b[data-id="tt_a"]'); await snap('수업 수정 창'); await closeAll(); }
    if (await p.$('[data-act="bx-ttsets"]')) { await p.click('[data-act="bx-ttsets"]'); await snap('시간표 보기 설정'); await closeAll(); }
    for (let k = 0; k < 2; k++) { await p.evaluate(() => { const c = Array.from(document.querySelectorAll('[data-bxtts]')).find(e => e.getBoundingClientRect().height > 0); if (c) c.click(); }); await p.waitForTimeout(400); }
    await snap('시간표 설정'); await closeAll();
  });
  await tryDo('루틴', async () => {
    await dock('routines'); await snap('루틴 목록');
    await p.click('[data-act="rt-edit"][data-rid="rt_w"]'); await snap('루틴 고치기');
    await clickAll('#sheet-root .bx-er[data-bxrt45]', '#bx-pg [data-bxpg="back"]', '루틴 고치기');
    if (await tap('#bx-icsum')) { await snap('루틴 아이콘 페이지'); await p.evaluate(() => { const x = document.querySelector('#bx-pg [data-bxpg="back"]'); if (x) x.click(); }); }
    await closeAll();
    if (await tap('[data-act="bx-rt-new"]')) { await snap('새 루틴'); await closeAll(); }
  });
  await tryDo('메모', async () => {
    await dock('memo'); await snap('메모 화면');
    if (await p.$('.bx-fab')) { await p.click('.bx-fab'); await snap('새 메모'); await closeAll(); }
    if (await p.$('.bx-mm-row')) { await p.click('.bx-mm-row'); await snap('메모 고치기'); await closeAll(); }
  });
  await tryDo('더보기', async () => {
    await more(); await snap('더보기');
    await p.click('#sheet-root [data-act="bx-feat"]'); await snap('기능 · 메뉴 편집'); await closeAll();
    await more(); await p.click('#sheet-root [data-act="bx-widget-open"]'); await snap('위젯 추가'); await closeAll();
  });
  await tryDo('명상', async () => {
    await more(); await p.click('#sheet-root [data-act="bx-go"][data-view="med"], #sheet-root .bx-go'); await p.waitForTimeout(600); await snap('명상');
    if (await tap('[data-act="bx-med-sound"]')) { await snap('명상 소리와 호흡'); await closeAll(); }
    await p.click('[data-act="bx-med-start"]'); await p.waitForTimeout(6500); await snap('명상 진행 중');
    if (await p.evaluate(() => { const b = document.querySelector('[data-act="bx-med-stop"]'); if (b) b.click(); return !!b; })) { await p.waitForTimeout(500); await snap('명상 끝'); }
  });
  await tryDo('설정', async () => {
    await more(); await p.locator('#sheet-root button', { hasText: '설정' }).last().click(); await p.waitForTimeout(600); await snap('설정');
    const groups = await p.evaluate(() => Array.from(document.querySelectorAll('[data-bxset]')).filter(e => e.getBoundingClientRect().height > 0).map(e => e.dataset.bxset));
    for (const g of groups) await tryDo('설정 ' + g, async () => {
      await p.click('[data-bxset="' + g + '"]'); await snap('설정 › ' + g);
      const subs = await p.evaluate(g => Array.from(document.querySelectorAll('[data-bxset]')).filter(e => e.getBoundingClientRect().height > 0 && e.dataset.bxset.startsWith(g + '/')).map(e => e.dataset.bxset), g);
      for (const s of subs) await tryDo('설정 ' + s, async () => { await p.click('[data-bxset="' + s + '"]'); await snap('설정 › ' + s); await p.click('.bx-set-back'); await p.waitForTimeout(400); });
      await p.click('.bx-set-back'); await p.waitForTimeout(400);
    });
  });
  await tryDo('찾기', async () => { await closeAll(); await dock('today'); await p.evaluate(() => { const b = Array.from(document.querySelectorAll('[data-menu="search"]')).find(e => e.getBoundingClientRect().height > 0); if (b) b.click(); }); await p.waitForTimeout(400); await p.keyboard.type('치과'); await snap('찾기'); await closeAll(); });
  await tryDo('도움말', async () => { await closeAll(); await p.click('.ab-guide'); await snap('도움말'); await closeAll(); });
  await tryDo('루틴 꾹', async () => { await dock('routines'); if (await longPress('.rt-item .rt-open[data-rid="rt_w"]')) await snap('루틴 꾹 누르기'); await closeAll(); });
  await tryDo('일정 꾹', async () => { await dock('today'); if (await longPress('#tcard2 .row-main[data-id="it_2"]')) await snap('일정 꾹 누르기'); await closeAll(); });
  const errs = app.errors.slice(); await app.close();

  await tryDo('처음 실행', async () => {
    await open({ data: [['settings', { type: 'settings', weekStart: 1 }]], wait: 1200 }); await snap('처음 실행 1');
    await tap('#bx-start .bxs-chip, #bx-start [data-bxs-mod]');
    if (await tap('#bx-start [data-act="bxs-next"], #bx-start .btn.primary')) await snap('처음 실행 2');
    errs.push(...app.errors); await app.close();
  });
  await tryDo('루틴 도우미', async () => {
    const d = data(); d[0][1] = Object.assign({}, d[0][1]); delete d[0][1].bxRtHelp; delete d[0][1].bxTtHelp;
    await open({ data: d.filter(x => !/^rt_/.test(x[0]) && !/^tt_/.test(x[0])), wait: 1000 });
    await p.click('.dock [data-view="routines"]'); await p.waitForTimeout(700); await snap('루틴 도우미');
    await p.evaluate(() => window.BX_back && window.BX_back()); await p.waitForTimeout(300);
    await p.click('.dock [data-view="tt"]'); await p.waitForTimeout(700); await snap('시간표 도우미');
    errs.push(...app.errors); await app.close();
  });
  await tryDo('알람 허락', async () => {
    await open({ data: data(), perms: { notifications: false, exact: false, fullScreen: false, battery: false }, wait: 1500 }); await snap('알람 꺼짐 줄');
    await p.evaluate(() => { const b = document.querySelector('#bx-permbar [data-act="bx-perm-fix"]'); if (b) b.click(); }); await snap('알람 허락 화면');
    errs.push(...app.errors); await app.close();
  });
  // 짧은 홈(일정 두 개 · 메모 없음): 화면이 내려가지 않아도 + 단추가 아무것도 가리지 않는지(대표 11/4 22:59 '메모 추가 단추가 + 단추에 가려짐')
  await tryDo('짧은 홈', async () => {
    const d = data().filter(x => !/^(it_|rt_|tt_|mm_)/.test(x[0])).concat([['it_9', { type: 'item', title: '치과', date: day(0), start: '15:00', createdAt: old, updatedAt: old }], ['it_8', { type: 'item', title: '장보기', date: day(0), createdAt: old, updatedAt: old }]]);
    await open({ now: '2026-11-02T07:40:00+09:00', data: d }); await snap('짧은 홈');
    await dock('month'); await snap('짧은 캘린더'); errs.push(...app.errors); await app.close();
  });
  await tryDo('앱 안 알림', async () => { await open({ now: '2026-11-02T07:01:00+09:00', data: data(), wait: 1500 }); await snap('앱 안 알림 카드'); errs.push(...app.errors); await app.close(); });
  return errs;
};
module.exports.data = data;
