// 시험판 53(대표 11/4 19:48 "전체적으로 모든 페이지를 참고하고 정렬이 흐트러진 곳이 없는지 검토", 결정 기록 D-26): 전체 정렬 점검에서 고친 것
// (1) 한국어 줄 바꿈은 낱말 단위(홈 · 루틴 창 · 설정, 390 · 360 폭). 칸보다 긴 낱말만 쪼갬
// (2) 홈 줄 장소는 …로 끝남(글자가 반쯤 잘리지 않음), 지난 일 '…지남'은 모자라면 다음 줄, 루틴 카드 '도착' 줄은 잘리지 않음
// (3) 설정 첫 화면: 값이 길어도 › 가 줄마다 같은 자리(360 폭)
// (4) 입력칸 안내 글: 홈 메모 칸 '떠오른 것을 적거나 말해요', 새 일정 제목 칸은 칸에 안 들어가는 좁은 휴대폰에서만 '예) 오후 3시 치과'
// (5) 앱 안 알림 카드: 화면 끝에서 12 / (6) 오전 · 오후: '오늘 오전 11:00로', 루틴 도우미 · 처음 실행 · 잠금 화면 알람 설명
const fs = require('fs');
const path = require('path');
const { openApp, settings, checker } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
const data = () => [
  ['settings', settings({ bxDock: ['routines', 'month', 'tt', 'memo'], bxDockMig: 1, bxDockMemo: 1, bxReport: { on: true, at: '07:30' } })],
  ['c_p', { type: 'category', name: '개인', color: '#1baf7a', order: 1, createdAt: old }],
  ['it_1', { type: 'item', title: '치과 정기 검진과 스케일링 예약', date: '2026-11-02', start: '15:00', end: '16:00', remind: '10', location: '서울 강남구 연세바른치과 3층', travel: 30, categoryId: 'c_p', createdAt: old, updatedAt: old }],
  ['it_4', { type: 'item', title: '은행 서류 내기', date: '2026-11-01', start: '11:00', createdAt: old, updatedAt: old }],
  ['rt_w', { type: 'routine', name: '출근 준비', days: [0, 1, 2, 3, 4, 5, 6], mode: 'arrive', target: '09:00', travel: 45, buffer: 15, times: 6, every: 5, on: true,
    steps: [['기상하기', 2], ['스트레칭', 5], ['이불 개기', 3], ['씻기', 15], ['머리 말리기', 7], ['옷 입기', 8], ['식사', 12], ['출근 준비', 8]].map(([n, m], i) => ({ id: 's' + i, name: n, min: m })), createdAt: old, updatedAt: old }],
  ['mm_2', { type: 'memo', date: '2026-11-02', text: '점심에 우체국 들러 택배 보내기 — 주소는 문자로 받은 것', at: '12:35', createdAt: '2026-11-01T21:30:00.000Z', updatedAt: '2026-11-01T21:30:00.000Z' }]
];

// 낱말 가운데에서 꺾인 줄('오 / 전', '주소 / 는')
function midword(){
  const out = [], word = ch => /[가-힣A-Za-z0-9:]/.test(ch);
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = tw.nextNode())) {
    const t = n.textContent; if (t.trim().length < 2) continue;
    const pe = n.parentElement; if (!pe || pe.closest('input,textarea,svg,script,style,#bx-splash')) continue;
    const b = pe.getBoundingClientRect(); if (b.width < 1 || b.height < 1 || b.bottom < 0 || b.top > innerHeight) continue;
    const rg = document.createRange(); rg.selectNodeContents(n); if (rg.getClientRects().length < 2) continue;
    let prev = null;
    for (let i = 0; i < t.length; i++) {
      rg.setStart(n, i); rg.setEnd(n, i + 1); const rr = rg.getClientRects(); if (!rr.length) continue;
      const top = rr[0].top;
      if (prev != null && top > prev + 2 && word(t[i - 1]) && word(t[i]) && (/[가-힣]/.test(t[i - 1] + t[i]) || /\d/.test(t[i - 1]))) out.push(t.slice(Math.max(0, i - 6), i) + ' / ' + t.slice(i, i + 6));
      prev = top;
    }
  }
  return out;
}

module.exports = async function () {
  const c = checker('시험판 53 · 전체 정렬 점검(낱말 줄 바꿈 · … 잘림 · › 자리 · 안내 글 · 알림 카드 여백 · 오전 · 오후)');
  const html = fs.readFileSync(path.join(__dirname, '..', 'www', 'index.html'), 'utf8');
  c.ok(html.includes('처음엔 오전 7:30') && !html.includes('처음엔 7:30'), "처음 실행 아침 요약: '처음엔 오전 7:30'");
  c.ok(html.includes('치과 · 오후 2:30 출발') && !html.includes('치과 · 14:30 출발'), "잠금 화면 알람 설명 예: '치과 · 오후 2:30 출발'");

  let app = await openApp({ now: '2026-11-02T07:40:00+09:00', data: data() });
  try {
    const p = app.page;
    const back = async () => { for (let i = 0; i < 6; i++) { const has = await p.evaluate(() => !!(document.querySelector('#bx-pg:not([hidden]), #bx-ep:not([hidden]), #bx-mp:not([hidden])') || (document.querySelector('#sheet-root') && !document.querySelector('#sheet-root').hidden && document.querySelector('#sheet-root .sheet')))); if (!has) break; await p.evaluate(() => window.BX_back && window.BX_back()); await p.waitForTimeout(350); } };
    await p.waitForTimeout(1200);
    c.eq(await p.evaluate(() => getComputedStyle(document.body).wordBreak), 'keep-all', '앱 전체 줄 바꿈은 낱말 단위');
    c.eq(await p.evaluate(midword), [], '홈(390): 낱말 가운데에서 꺾인 줄 없음');
    const pl = await p.evaluate(() => { const e = document.querySelector('.row.bx-r49 .bx-r49-pl'); const cs = e && getComputedStyle(e); return e && [e.textContent, cs.display, cs.textOverflow, cs.whiteSpace]; });
    c.eq(pl, ['서울 강남구 연세바른치과 3층', 'block', 'ellipsis', 'nowrap'], '홈 줄 장소: … 이 보이는 칸(flex 칸이면 글자가 반쯤 잘림)');
    c.eq(await p.evaluate(() => (document.querySelector('.bx-mm-inp') || {}).placeholder), '떠오른 것을 적거나 말해요', '홈 메모 칸 안내 글(384 폭에서도 칸 안)');

    await p.click('[data-act="bx-past"]'); await p.waitForTimeout(400);
    const late = await p.evaluate(() => { const m = document.querySelector('.row.bx-r49.late .row-meta'); return m && [getComputedStyle(m).flexWrap, Array.from(m.children).every(x => x.scrollWidth <= x.clientWidth + 1), m.textContent.includes('지남')]; });
    c.eq(late, ['wrap', true, true], "지난 일 '…지남': 잘리지 않고 모자라면 다음 줄");
    await p.click('[data-act="bx-past"]'); await p.waitForTimeout(300);

    await p.click('.rt-card[data-rid="rt_w"] .bx-rt-tog'); await p.waitForTimeout(400);
    const arr = await p.evaluate(() => { const e = document.querySelector('.rt-card[data-rid="rt_w"] .rt-steps li.arr .rt-n'); return e && [e.textContent.replace(/\s+/g, ' ').trim(), e.scrollWidth <= e.clientWidth + 1]; });
    c.ok(arr && /도착/.test(arr[0]) && /이동 45분/.test(arr[0]) && /여유 15분/.test(arr[0]) && arr[1], "루틴 카드 펼침 '도착 이동 45분 · 여유 15분'이 …로 잘리지 않음: " + JSON.stringify(arr));
    c.eq(await p.evaluate(midword), [], '루틴 카드를 펼친 홈: 낱말 가운데에서 꺾인 줄 없음');
    await p.click('.rt-card[data-rid="rt_w"] .bx-rt-tog'); await p.waitForTimeout(300);

    await p.click('[data-act="bx-late-open"]'); await p.waitForTimeout(500);
    c.ok(await p.evaluate(() => Array.from(document.querySelectorAll('#sheet-root button')).some(b => b.textContent.trim() === '오늘 오전 11:00로')), "확인 필요: '오늘 오전 11:00로'(24시간 '11:00로'가 아님)");
    await back();

    await p.click('.bx-fab'); await p.waitForTimeout(600);
    c.eq(await p.evaluate(() => document.querySelector('#f-title').placeholder), '예) 내일 오후 3시 치과', '새 일정 제목 칸(390): 원래 예시 그대로');
    await p.setViewportSize({ width: 360, height: 844 }); await p.waitForTimeout(400);
    c.eq(await p.evaluate(() => document.querySelector('#f-title').placeholder), '예) 오후 3시 치과', '새 일정 제목 칸(360): 칸에 안 들어가면 짧은 예시');
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(400);
    c.eq(await p.evaluate(() => document.querySelector('#f-title').placeholder), '예) 내일 오후 3시 치과', '다시 넓어지면 원래 예시로');
    await back();

    await p.setViewportSize({ width: 360, height: 844 }); await p.waitForTimeout(500);
    c.eq(await p.evaluate(midword), [], '홈(360): 낱말 가운데에서 꺾인 줄 없음');
    c.ok(await p.evaluate(() => { const e = document.querySelector('.bx-mm-inp'); const s = document.createElement('span'), ps = getComputedStyle(e, '::placeholder'), cs = getComputedStyle(e); s.style.cssText = 'position:absolute;white-space:pre;font:' + ps.font + ';letter-spacing:' + ps.letterSpacing; s.textContent = e.placeholder; document.body.appendChild(s); const w = s.getBoundingClientRect().width; s.remove(); return w <= e.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); }), '홈 메모 칸 안내 글이 360 폭에서도 칸 안');

    await p.click('.ab-menu'); await p.waitForTimeout(500);
    await p.locator('#sheet-root button', { hasText: '설정' }).last().click(); await p.waitForTimeout(600);
    const set = await p.evaluate(() => Array.from(document.querySelectorAll('.bx-set-home .menu-row')).map(r => { const v = r.querySelector('.bx-mvt'), s = r.querySelector('.mv svg'); return [Math.round(s.getBoundingClientRect().right), v.scrollWidth <= v.clientWidth + 1, v.textContent]; }));
    c.ok(set.length >= 3 && set.every(x => Math.abs(x[0] - set[0][0]) <= 1), '설정 첫 화면(360): › 가 줄마다 같은 자리 ' + JSON.stringify(set.map(x => x[0])));
    c.ok(set.every(x => x[1]) && set.some(x => /아침 요약 오전 7:30/.test(x[2])), "설정 첫 화면(360): 값이 잘리지 않음('아침 요약 오전 7:30 · 10분 전')");
    c.eq(await p.evaluate(midword), [], '설정(360): 낱말 가운데에서 꺾인 줄 없음');
    c.eq(app.errors, [], '화면 오류');
  } finally { await app.close(); }

  // 앱을 열어 둔 동안 뜨는 알림 카드: 화면 끝에서 12(다른 상자와 같은 줄, D-13)
  app = await openApp({ now: '2026-11-02T07:01:00+09:00', data: data() });
  try {
    const p = app.page;
    await p.waitForTimeout(1500);
    const card = await p.evaluate(() => { const a = document.querySelector('#alarms'), e = a && a.querySelector('.alarm'); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(innerWidth - r.right), getComputedStyle(e).paddingTop]; });
    c.eq(card, [12, 12, '12px'], '앱 안 알림 카드: 양옆 12, 위 여백 12');
    c.eq(app.errors, [], '화면 오류(알림 카드)');
  } finally { await app.close(); }

  // 루틴 도우미: 시각 단추도 오전 · 오후
  const fresh = settings({ bxDock: ['routines', 'month', 'tt', 'memo'], bxDockMig: 1, bxDockMemo: 1 });
  delete fresh.bxRtHelp;
  app = await openApp({ data: [['settings', fresh]] });
  try {
    const p = app.page;
    await p.waitForTimeout(800);
    await p.click('.dock [data-view="routines"]'); await p.waitForTimeout(700);
    c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('#bx-start .bxs-big')).map(b => b.textContent.trim())), ['오전 7:30', '오전 8:00', '오전 8:30', '오전 9:00'], "루틴 도우미 시각 단추: '오전 7:30'(24시간 '7:30'이 아님)");
    c.eq(app.errors, [], '화면 오류(루틴 도우미)');
  } finally { await app.close(); }
  return c.done();
};
