// 시험판 41: 오늘의 메모(대표 아이디어 11/3 15:17) · 메모 화면과 아래 메뉴 '메모'(대표 요청 11/3 23:38) · 위젯 ✎ 단추 ·
// 앱 이름 '스케줄러'(대표 결정 11/3 23:40, 이름은 strings.xml app_name 한 곳)
const { openApp, settings, checker } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
function seed(extra) {
  return [['settings', settings(Object.assign({ bxDock: ['routines', 'month', 'tt'], bxDockMig: 1 }, extra || {}))],
    ['mm_1', { type: 'memo', date: '2026-11-02', text: '우유 사기', at: '06:10', createdAt: '2026-11-01T21:10:00.000Z', updatedAt: '2026-11-01T21:10:00.000Z' }],
    ['mm_2', { type: 'memo', date: '2026-11-02', text: '치과 예약 전화하기', at: '06:30', createdAt: '2026-11-01T21:30:00.000Z', updatedAt: '2026-11-01T21:30:00.000Z' }],
    ['mm_3', { type: 'memo', date: '2026-11-01', text: '어제 떠오른 생각: 책 반납', at: '22:00', createdAt: '2026-11-01T13:00:00.000Z', updatedAt: '2026-11-01T13:00:00.000Z' }],
    ['mm_4', { type: 'memo', date: '2026-11-05', text: '목요일 준비물 챙기기', at: '20:00', createdAt: '2026-11-01T11:00:00.000Z', updatedAt: '2026-11-01T11:00:00.000Z' }],
    ['it_1', { type: 'item', title: '회의', date: '2026-11-02', start: '09:00', end: '10:00', categoryId: null, createdAt: old, updatedAt: old }]];
}
const doc = (p, id) => p.evaluate(id => (window.BX_T.docs().find(([k]) => k === id) || [0, null])[1], id);
const memos = p => p.evaluate(() => window.BX_T.docs().filter(([, d]) => d && d.type === 'memo').map(([id, d]) => Object.assign({ id }, d)));
const texts = (p, sel) => p.evaluate(s => Array.from(document.querySelectorAll(s)).map(e => e.textContent.trim()), sel);
const dockLabels = p => p.evaluate(() => Array.from(document.querySelectorAll('.dock-in .dock-btn')).map(b => Array.from(b.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim()));
const active = p => p.evaluate(() => (document.activeElement || {}).id || '');
const toasts = p => p.evaluate(() => Array.from(document.querySelectorAll('.toast')).map(t => t.textContent).join(' | '));

module.exports = async function () {
  const c = checker('시험판 41 · 오늘의 메모 · 메모 화면 · 위젯 ✎ · 앱 이름');
  let app = await openApp({ data: seed() });
  try {
    const p = app.page;
    // (1) 홈: '오늘 할 일' 아래 '오늘의 메모'(적은 시각 순)
    c.eq(await texts(p, '#bx-mm-card .bx-mm-h h2'), ['오늘의 메모'], '홈 메모 상자 제목');
    c.eq(await texts(p, '#bx-mm-card .bx-mm-x'), ['우유 사기', '치과 예약 전화하기'], '홈: 오늘 메모(적은 시각 순)');
    c.ok(await p.evaluate(() => { const a = document.getElementById('tcard2'), b = document.getElementById('bx-mm-card'); return !!(a && b && (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)); }), "메모 상자는 '오늘 할 일' 아래 따로");
    // (2) 아래 메뉴: 고쳐 둔 아래 메뉴(루틴 · 캘린더 · 시간표)에도 메모가 한 번 들어감
    c.eq(await dockLabels(p), ['루틴', '캘린더', '홈', '시간표', '메모'], '아래 메뉴에 메모(명상이 빠진 자리)');
    // (3) 홈 칸에서 적고 Enter → 메모, 칸은 그대로(연달아 적기)
    await p.evaluate(() => { document.getElementById('bx-mm-in-20261102').__same = 1; });
    await p.fill('#bx-mm-in-20261102', '빨래 돌리기');
    await p.press('#bx-mm-in-20261102', 'Enter'); await p.waitForTimeout(500);
    c.ok(await p.evaluate(() => document.getElementById('bx-mm-in-20261102').__same === 1), '넣어도 칸은 그대로(다시 그리지 않음 → 키보드가 내려가지 않음)');
    const added = (await memos(p)).find(m => m.text === '빨래 돌리기');
    c.ok(added && added.date === '2026-11-02' && added.at === '06:50', '홈 칸 → 오늘 메모(적은 시각 06:50) ' + JSON.stringify(added && { d: added.date, at: added.at }));
    c.eq(await texts(p, '#bx-mm-card .bx-mm-x'), ['우유 사기', '치과 예약 전화하기', '빨래 돌리기'], '새 메모는 칸 바로 위(맨 끝)');
    c.eq(await active(p), 'bx-mm-in-20261102', '넣은 뒤에도 칸에 커서(연달아 적기)');
    c.ok(/메모했어요/.test(await toasts(p)), "안내 '메모했어요'");
    // 적는 중에 다른 것이 바뀌어 화면을 다시 그려도(30초마다 · 알림 확인 등) 적던 글 · 커서는 그대로, 키보드도 다시 올림
    await p.fill('#bx-mm-in-20261102', '반쯤 적은');
    await p.evaluate(() => { window.__kb = 0; window.BX_T.write('it_2', { type: 'item', title: '저녁 약속', date: '2026-11-02', start: '19:00', createdAt: '2026-11-01T00:00:00.000Z', updatedAt: '2026-11-01T00:00:00.000Z' }); });
    await p.waitForTimeout(500);
    c.ok(await p.evaluate(() => { const i = document.getElementById('bx-mm-in-20261102'); return i.__same !== 1 && i.value === '반쯤 적은' && document.activeElement === i && /저녁 약속/.test(document.getElementById('tcard2').textContent) && window.__kb >= 1; }), '다시 그려도 적던 글 · 커서 그대로, 키보드 다시 올림');
    await p.fill('#bx-mm-in-20261102', '');
    // (4) 메모 누르기 → 고치기 · 되돌리기
    await p.click('#bx-mm-card [data-bxmm="mm_1"]'); await p.waitForTimeout(400);
    c.eq(await p.evaluate(() => (document.getElementById('bx-mm-edit') || {}).value), '우유 사기', '메모 창: 글이 그대로');
    await p.fill('#bx-mm-edit', '우유 2개 사기');
    await p.click('#sheet-root [data-act="bx-mm-save"]'); await p.waitForTimeout(400);
    c.eq((await doc(p, 'mm_1')).text, '우유 2개 사기', '메모 고치기');
    await p.evaluate(() => { const b = Array.from(document.querySelectorAll('.toast button')).find(x => /되돌리기/.test(x.textContent)); if (b) b.click(); }); await p.waitForTimeout(400);
    c.eq((await doc(p, 'mm_1')).text, '우유 사기', '되돌리기');
    // (5) 일정으로 만들기 → 새 일정 창에 그 글, 저장하면 메모에 '일정으로 옮김'
    await p.click('#bx-mm-card [data-bxmm="mm_2"]'); await p.waitForTimeout(400);
    await p.click('#sheet-root [data-act="bx-mm-toitem"]'); await p.waitForTimeout(500);
    c.eq(await p.evaluate(() => (document.getElementById('f-title') || {}).value), '치과 예약 전화하기', '일정으로 만들기: 새 일정 창에 메모 글');
    await p.evaluate(() => document.querySelector('#sheet-root [data-act="save"]').click()); await p.waitForTimeout(500);
    const item = await p.evaluate(() => (window.BX_T.docs().find(([, d]) => d && d.type === 'item' && /치과 예약/.test(d.title || '')) || [null])[0]);
    c.ok(item && (await doc(p, 'mm_2')).toItem === item, '저장하면 메모에 만든 일정을 적어 둠');
    c.ok(/일정으로 옮김/.test(await p.evaluate(() => document.querySelector('#bx-mm-card [data-bxmm="mm_2"]').textContent)), "메모 줄에 '일정으로 옮김'(메모는 남음)");
    // (6) 새 일정 창에 '메모 …' → 그날 메모로
    await p.click('.bx-fab'); await p.waitForTimeout(400);
    await p.fill('#f-title', '메모 택배 반품 신청'); await p.waitForTimeout(300);
    c.ok(/메모로 넣어요/.test(await p.evaluate(() => (document.getElementById('f-hint') || {}).textContent || '')), "'메모 …'이면 '메모로 넣어요' 한 줄");
    await p.evaluate(() => document.querySelector('#sheet-root [data-act="save"]').click()); await p.waitForTimeout(500);
    const ms = await memos(p);
    c.ok(ms.some(m => m.text === '택배 반품 신청' && m.date === '2026-11-02') && !(await p.evaluate(() => window.BX_T.docs().some(([, d]) => d && d.type === 'item' && /택배/.test(d.title || '')))), "'메모 택배 반품 신청' → 일정이 아니라 오늘 메모");
    // (7) 달력: 메모한 날 표시 · 날짜 창 아래 메모 · 그 창에서 바로 넣기
    await p.click('.dock [data-view="month"]'); await p.waitForTimeout(600);
    const marks = await p.evaluate(() => Array.from(document.querySelectorAll('.cal .cell')).filter(b => b.querySelector('.bx-mm-mark')).map(b => b.dataset.date));
    c.eq(marks, ['2026-11-01', '2026-11-02', '2026-11-05'], '달력: 메모한 날에만 작은 표시');
    c.ok(/메모 1개/.test(await p.evaluate(() => document.querySelector('.cal .cell[data-date="2026-11-05"]').getAttribute('aria-label'))), '읽어 주기에도 메모 개수');
    await p.click('.cal .cell[data-date="2026-11-05"]'); await p.waitForTimeout(500);
    if (!(await p.evaluate(() => !!document.querySelector('#sheet-root .bx-mm-sec')))) { await p.click('.cal .cell[data-date="2026-11-05"]'); await p.waitForTimeout(500); }
    c.eq(await texts(p, '#sheet-root .bx-mm-sec .bx-mm-x'), ['목요일 준비물 챙기기'], '날짜 창: 일정 아래 그날 메모');
    await p.fill('#bx-mm-in-20261105', '도시락');
    await p.click('#sheet-root [data-act="bx-mm-add"]'); await p.waitForTimeout(500);
    c.ok((await memos(p)).some(m => m.text === '도시락' && m.date === '2026-11-05'), '날짜 창에서 넣으면 그날 메모');
    c.eq(await texts(p, '#sheet-root .bx-mm-sec .bx-mm-x'), ['목요일 준비물 챙기기', '도시락'], '날짜 창이 열린 채로 목록이 늘어남');
    // (8) 찾기에 메모도
    await p.evaluate(() => window.BX_back()); await p.waitForTimeout(300);
    await p.click('.appbar [data-menu="search"]'); await p.waitForTimeout(400);
    await p.fill('#q', '반납'); await p.waitForTimeout(400);
    c.ok(/메모 1/.test(await p.evaluate(() => (document.querySelector('.bx-mm-sres .grp-h') || {}).textContent || '')) && (await texts(p, '.bx-mm-sres .bx-mm-x')).join() === '어제 떠오른 생각: 책 반납', '찾기: 메모도 나옴');
    await p.evaluate(() => window.BX_back()); await p.waitForTimeout(300);
    // (9) 메모 화면: 맨 위 오늘 칸, 새 것부터 · 다가오는 날 · 지난 메모
    await p.click('.dock [data-view="memo"]'); await p.waitForTimeout(600);
    c.eq(await texts(p, '.screen.memo .page-head h1'), ['메모'], '아래 메뉴 메모 → 메모 화면');
    c.eq(await texts(p, '.bx-mmp-quick .bx-mm-h h2'), ['오늘 · 11월 2일 (월)'], '맨 위: 오늘 상자');
    c.eq(await texts(p, '.bx-mmp-quick .bx-mm-x'), ['택배 반품 신청', '빨래 돌리기', '치과 예약 전화하기일정으로 옮김', '우유 사기'], '오늘 메모는 새 것부터(칸 바로 아래에 방금 적은 것)');
    c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('.bx-mmp-grp')).map(g => [g.querySelector('h2').textContent, Array.from(g.querySelectorAll('.bx-mmp-dh b')).map(b => b.textContent)])),
      [['다가오는 날', ['11월 5일 (목)']], ['지난 메모', ['어제 · 11월 1일 (일)']]], '다가오는 날 · 지난 메모(날짜마다 작은 제목)');
    // 시험판 48(대표 11/4 14:00): 메모 화면에는 적는 칸 없이 메모만, 적기는 오른쪽 아래 + → '새 메모' 페이지
    c.ok(await p.evaluate(() => !document.querySelector('.screen.memo .bx-mm-inp') && !!document.querySelector('.bx-fab[data-bxmemo]') && getComputedStyle(document.querySelector('.bx-fab')).display !== 'none'), '메모 화면: 적는 칸 없음 · + 단추');
    await p.click('.bx-fab'); await p.waitForTimeout(400);
    c.eq(await active(p), 'bx-mmn-ta', "+ → '새 메모' 페이지, 적는 칸에 커서");
    await p.fill('#bx-mmn-ta', '물 마시기');
    await p.click('#bx-mmn [data-bxmmn="done"]'); await p.waitForTimeout(500);
    c.eq((await texts(p, '.bx-mmp-quick .bx-mm-x'))[0], '물 마시기', "완료 → 오늘 메모 맨 위");
    await p.click('.appbar [data-act="bx-help"]'); await p.waitForTimeout(400);
    c.ok(/위젯의 ✎ 단추/.test(await p.evaluate(() => document.getElementById('sheet-root').textContent)), '메모 화면 도움말');
    await p.evaluate(() => window.BX_back()); await p.waitForTimeout(200);
    await p.evaluate(() => window.BX_back()); await p.waitForTimeout(400);
    c.eq(await p.evaluate(() => location.hash), '#today', '뒤로 → 홈');
    // (10) 위젯 ✎(시험판 48, 대표 11/4 14:07): 보던 화면이 아니라 홈 화면에서 '새 메모' 페이지 + 키보드 올리기
    c.eq(await p.evaluate(() => { window.__kb = 0; return window.BX_widgetData().memo; }), true, '위젯 자료: ✎ 단추 보임');
    await p.click('.dock [data-view="memo"]'); await p.waitForTimeout(400);
    await p.evaluate(() => window.__wl.memo({})); await p.waitForTimeout(900);
    c.ok(await p.evaluate(() => !!document.querySelector('.screen.today') && !!document.getElementById('bx-mmn')), "위젯 ✎ → 홈 화면에서 '새 메모' 페이지");
    c.eq(await active(p), 'bx-mmn-ta', '적는 칸에 커서');
    c.ok(await p.evaluate(() => (window.__kb || 0) >= 1), '휴대폰 쪽 키보드 올리기를 부름');
    await p.fill('#bx-mmn-ta', '우산 챙기기'); await p.click('#bx-mmn [data-bxmmn="done"]'); await p.waitForTimeout(500);
    c.eq((await texts(p, '#bx-mm-card .bx-mm-x')).slice(-1), ['우산 챙기기'], '완료 → 홈의 오늘의 메모에 바로 보임');
    // (11) 기능 · 메뉴 편집에서 메모 끄기 → 홈 상자 · 달력 표시 · 아래 메뉴 · 위젯 ✎ · '메모 …' 규칙이 빠짐(적어 둔 메모는 남음)
    await p.click('.ab-menu'); await p.waitForTimeout(400);
    await p.click('#sheet-root [data-act="bx-feat"]'); await p.waitForTimeout(500);
    c.ok(await p.evaluate(() => { const h = Array.from(document.querySelectorAll('#sheet-root .bx-ft-h')).find(x => x.textContent.trim() === '시간 · 행동 관리'); const g = h && h.parentElement.nextElementSibling; return !!(g && g.querySelector('[data-bx-feat="memo"]')); }), "메모는 '시간 · 행동 관리' 묶음");
    await p.click('#sheet-root [data-bx-feat="memo"]'); await p.waitForTimeout(400);
    c.eq((await doc(p, 'settings')).bxStart.mods.memo, false, '메모 끔');
    await p.evaluate(() => window.BX_back()); await p.waitForTimeout(300);
    c.eq(await dockLabels(p), ['루틴', '캘린더', '홈', '시간표'], '아래 메뉴에서 메모가 빠짐');
    c.eq(await p.evaluate(() => window.BX_widgetData().memo), false, '위젯 ✎ 단추 숨김');
    await p.click('.dock [data-view="today"]'); await p.waitForTimeout(500);
    c.ok(await p.evaluate(() => !document.getElementById('bx-mm-card')), '홈 메모 상자 없음');
    await p.click('.dock [data-view="month"]'); await p.waitForTimeout(500);
    c.eq(await p.evaluate(() => document.querySelectorAll('.cal .bx-mm-mark').length), 0, '달력 표시 없음');
    c.ok((await memos(p)).length >= 7, '적어 둔 메모는 그대로');
    await p.click('.ab-menu'); await p.waitForTimeout(400);
    await p.click('#sheet-root [data-act="bx-feat"]'); await p.waitForTimeout(500);
    await p.click('#sheet-root [data-bx-feat="memo"]'); await p.waitForTimeout(400);
    c.eq((await doc(p, 'settings')).bxDock, ['routines', 'month', 'tt', 'memo'], '다시 켜면 아래 메뉴 제자리(맨 끝)로');
    c.eq((await doc(p, 'settings')).bxDockMemo, 1, '아래 메뉴를 저장하면 그 뒤로는 고른 그대로');
    await p.evaluate(() => window.BX_back()); await p.waitForTimeout(300);
    c.eq(app.errors, [], '화면 오류(메모)');
  } finally { await app.close(); }

  // (12) 앱 이름: strings.xml의 app_name 한 곳(빌드가 읽어 window.BX_NAME으로) — 화면에 '박스웍스'가 남지 않음
  app = await openApp({ data: seed({ bxLock: 'none' }) });
  try {
    const p = app.page;
    c.eq(await p.evaluate(() => [window.BX_NAME, document.title]), ['스케줄러', '스케줄러'], '앱 이름 · 문서 제목');
    c.eq(await p.evaluate(() => (document.querySelector('#bx-splash .bxsp-name') || {}).textContent || ''), '스케줄러', '처음 여는 화면의 이름');
    const seen = [];
    for (const v of ['today', 'month', 'tt', 'routines', 'memo']) {
      await p.evaluate(v => { const b = document.querySelector('.dock [data-view="' + v + '"]'); if (b) b.click(); }, v); await p.waitForTimeout(500);
      seen.push([v, await p.evaluate(() => document.body.innerText.includes('박스웍스'))]);
    }
    await p.click('.ab-menu'); await p.waitForTimeout(400);
    seen.push(['menu', await p.evaluate(() => document.body.innerText.includes('박스웍스'))]);
    await p.click('#sheet-root [data-menu="prefs"]'); await p.waitForTimeout(500);
    seen.push(['prefs', await p.evaluate(() => document.body.innerText.includes('박스웍스'))]);
    c.eq(seen.filter(x => x[1]).map(x => x[0]), [], "화면에 '박스웍스' 없음");
    c.eq(app.errors, [], '화면 오류(앱 이름)');
  } finally { await app.close(); }
  return c.done();
};
