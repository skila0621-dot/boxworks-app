// 시험판 69(결정 사안 s10 '넣기(휴대폰 안에만, 테스터가 직접 보냄)', 개발 요청함 R-5): 시험 기록
// - 설정 › 시험 기록(휴대폰 쪽 기록이 있는 설치 파일에서만): 요약 일곱 줄 · '시험 기록 보내기'(휴대폰 공유 창)
// - 요약: 설치한 때 · 첫 일정 · 첫 루틴까지 · 울린 횟수(1분 넘게 늦음) · 꺼진 동안 지나간 알람 · 확인 · 5분 뒤(최근 7일) · 준비 시작 알람 → 시작까지(가운데) · 연 날 · 3일 넘게 쉬고 돌아옴
// - 보내는 글에 일정 · 루틴 이름, 장소, 메모가 들어가지 않음. 짧은 값은 휴대폰 쪽(Java String.hashCode)과 같음
// - 알람 계획: 루틴 첫 단계 · 준비 루틴을 붙인 일정의 첫 단계에 first(준비 시작)
const { openApp, settings, checker } = require('./harness.cjs');
const old = '2026-10-29T00:00:00.000Z';
const NOW = '2026-11-06T09:00:00+09:00';
const T = s => Date.parse(s + '+09:00');
const seed = () => [['settings', settings({ bxStart: { at: old, mods: { routines: true } } })],
  ['it_1', { type: 'item', title: '치과', date: '2026-11-05', start: '15:00', end: '16:00', remind: '0', location: '강남역 연세바른치과', createdAt: '2026-11-01T00:03:00.000Z', updatedAt: old }],
  ['it_2', { type: 'item', title: '회의 준비', date: '2026-11-06', start: '15:00', end: '16:00', travel: 30, prep: 'rt_1', remind: '', createdAt: '2026-11-02T01:00:00.000Z', updatedAt: old }],
  ['rt_1', { type: 'routine', name: '출근 준비', mode: 'start', target: '07:00', days: [0, 1, 2, 3, 4, 5, 6], on: true, every: 5, times: 2, chkV: 1,
    steps: [{ id: 'a', name: '기상', min: 5, kind: 'do' }, { id: 'b', name: '씻기', min: 20, kind: 'do' }], createdAt: '2026-11-01T00:12:00.000Z', updatedAt: old }],
  ['rl_rt_1_2026-11-04', { type: 'rlog', rid: 'rt_1', date: '2026-11-04', done: { a: '2026-11-03T22:04:00.000Z' }, started: {}, extra: {}, skip: false, createdAt: old }]];
// 휴대폰 쪽 기록(BxTestLog) 흉내: s는 Java "r_rt_1_2026-11-05_a".hashCode() 같은 값(16진수)
const EV = [
  { t: T('2026-11-04T07:00:20'), e: 'fire', k: 'routine', lv: 'alarm', at: T('2026-11-04T07:00:00'), s: 'e16f0d06', f: 1 },
  { t: T('2026-11-05T07:00:20'), e: 'fire', k: 'routine', lv: 'alarm', at: T('2026-11-05T07:00:00'), s: 'e16f10c7', f: 1 },
  { t: T('2026-11-05T07:03:20'), e: 'ok', k: 'routine', lv: 'alarm', at: T('2026-11-05T07:00:00'), s: 'e16f10c7', f: 1 },
  { t: T('2026-11-06T07:02:00'), e: 'fire', k: 'routine', lv: 'alarm', at: T('2026-11-06T07:00:00'), s: 'e16f1488', f: 1 },
  { t: T('2026-11-06T07:05:00'), e: 'snooze', k: 'routine', lv: 'alarm', at: T('2026-11-06T07:00:00'), s: 'e16f1488', f: 1 },
  { t: T('2026-11-05T15:00:10'), e: 'fire', k: 'item', lv: 'notice', at: T('2026-11-05T15:00:00'), s: 'd07a628' },
  { t: T('2026-11-05T15:01:00'), e: 'ok', k: 'item', lv: 'notice', at: T('2026-11-05T15:00:00'), s: 'd07a628' },
  { t: T('2026-11-05T15:03:00'), e: 'fire', k: 'nag', at: T('2026-11-05T15:03:00'), s: 'd07a628' },
  { t: T('2026-11-03T08:00:00'), e: 'missed', n: 2 }];
const WANT = [
  ['설치한 때', '11월 1일 (일) 오전 9:00'],
  ['첫 일정 · 첫 루틴까지', '3분 · 12분'],
  ['알람이 울린 횟수', '4번 · 1분 넘게 늦음 1번(가장 늦음 2분)'],
  ['휴대폰이 꺼진 동안 지나간 알람', '2개'],
  ['확인 · 5분 뒤', '2번 · 1번(최근 7일 1번)'],
  ['준비 시작 알람 → 시작까지', '가운데 3분 · 3번'],
  ['앱을 연 날', '3일 · 3일 넘게 쉬고 돌아옴 1번']];

module.exports = async function () {
  const c = checker('시험판 69 · 시험 기록');
  for (const theme of ['light', 'dark']) {
    const app = await openApp({ width: 384, height: 832, colorScheme: theme, now: NOW, data: seed() });
    const p = app.page;
    try {
      await p.waitForTimeout(700);
      // 연 날(앱 쪽 기록): 11/1 · 11/2 · 11/6. 다시 열면 오늘도 연 날로
      await p.waitForTimeout(1200);
      await p.evaluate(() => { localStorage.setItem('bx:days', JSON.stringify(['2026-11-01', '2026-11-02'])); document.dispatchEvent(new Event('visibilitychange')); });
      await p.evaluate(([ev, inst]) => { window.__tl = ev; window.__tlInst = inst; }, [EV, T('2026-11-01T09:00:00')]);
      await p.waitForTimeout(300);
      c.eq(await p.evaluate(() => window.BX_T.fn.tlDays()), ['2026-11-01', '2026-11-02', '2026-11-06'], theme + ': 화면이 보이면 오늘을 연 날로(하루 한 번)');
      // 짧은 값: 휴대폰 쪽 Java String.hashCode와 같아야 맞춰 볼 수 있다
      c.eq(await p.evaluate(() => ['hello', 'polygenelubricants', 'r_rt_1_2026-11-05_a', 'iv_it_1_x'].map(window.BX_T.fn.tlHash)), ['5e918d2', '80000000', 'e16f10c7', 'd07a628'], theme + ': 짧은 값이 Java와 같음');
      // 설정 › 시험 기록
      await p.click('.ab-menu'); await p.waitForTimeout(450);
      await p.locator('#sheet-root button', { hasText: '설정' }).last().click(); await p.waitForTimeout(600);
      const row = await p.evaluate(() => { const b = document.querySelector('.bx-set-home [data-bxset="test"]'); return b ? [b.querySelector('.ml').textContent, b.querySelector('.mv').textContent.trim()] : null; });
      c.eq(row, ['시험 기록', '이 휴대폰에만 · 보내기는 직접'], theme + ': 설정 목록에 시험 기록');
      await p.click('[data-bxset="test"]'); await p.waitForTimeout(700);
      const lines = await p.evaluate(() => Array.from(document.querySelectorAll('.bx-tl-row .bx-at')).map(r => [r.querySelector('b').textContent, (r.querySelector('small') || {}).textContent || '']));
      c.eq(lines, WANT, theme + ': 요약 일곱 줄');
      c.ok(await p.evaluate(() => /일정 · 루틴 이름, 장소, 메모는 들어가지 않아요/.test(document.querySelector('.bx-setd-note').textContent) && !!document.querySelector('[data-act="bx-tl-send"]')), theme + ": 무엇이 들어 있는지 안내 · '시험 기록 보내기'");
      // 보내기: 휴대폰 공유 창(글 + 파일), 파일에는 요약 + 자세한 기록(JSON). 이름 · 장소 없음
      await p.evaluate(() => {
        window.__share = null; window.__fsw = null;
        window.Capacitor.Plugins.Share = { share: async x => { window.__share = x; return {}; } };
        window.Capacitor.Plugins.Filesystem = { writeFile: async x => { window.__fsw = x; return { uri: 'file:///cache/' + x.path }; } };
      });
      // 처음 한 번: 무엇이 들어 있는지 보여 주는 창(개발 요청함 R-5) → '보내기'
      await p.click('[data-act="bx-tl-send"]'); await p.waitForTimeout(500);
      const ask = await p.evaluate(() => { const sh = document.querySelector('#sheet-root .sheet'); return sh ? { t: (sh.querySelector('#sheet-title') || {}).textContent, rows: Array.from(sh.querySelectorAll('.bx-at b')).map(b => b.textContent), yes: !!sh.querySelector('[data-act="bx-tl-yes"]'), shared: !!window.__share } : null; });
      c.eq(ask, { t: '시험 기록 보내기', rows: ['들어 있는 것', '들어가지 않는 것'], yes: true, shared: false }, theme + ': 처음 보낼 때 들어 있는 것 · 들어가지 않는 것을 보여 주고 묻는다');
      await p.click('[data-act="bx-tl-yes"]'); await p.waitForTimeout(500);
      const sent = await p.evaluate(() => ({ share: window.__share, fsw: window.__fsw }));
      c.ok(sent.share && sent.share.title === '스케줄러 시험 기록' && /^스케줄러 시험 기록 · 시험판 \d+ · 보낸 때 2026-11-06 /.test(sent.share.text) && Array.isArray(sent.share.files) && /testlog\/스케줄러-시험기록-20261106\.txt$/.test(sent.share.files[0]),
        theme + ': 공유 창에 요약 글 + 파일 ' + JSON.stringify(sent.share && { title: sent.share.title, files: sent.share.files }));
      const body = sent.fsw ? String(sent.fsw.data) : '';
      const js = body.indexOf('--- 자세한 기록(JSON) ---\n') >= 0 ? JSON.parse(body.split('--- 자세한 기록(JSON) ---\n')[1]) : null;
      c.ok(js && js.v === 1 && js.events.length === EV.length && js.done.length === 1 && js.done[0].s === 'e16f0d06' && js.days.length === 3 && js.items.length === 2 && js.routines.length === 1 && js.installedAt === T('2026-11-01T09:00:00'),
        theme + ': 자세한 기록(울림 · 누름 · 했어요 · 연 날 · 만든 시각) ' + JSON.stringify(js && { e: js.events.length, d: js.done, days: js.days }));
      c.ok(body && !/치과|강남역|출근 준비|회의 준비|기상|씻기/.test(body), theme + ': 보내는 글에 일정 · 루틴 이름, 장소가 없음');
      c.ok(WANT.every(([a, b]) => body.includes(a + ': ' + b)), theme + ': 파일 맨 위에 요약 일곱 줄');
      // 두 번째부터는 묻지 않고 바로 공유 창
      await p.evaluate(() => { window.__share = null; });
      await p.click('[data-act="bx-tl-send"]'); await p.waitForTimeout(500);
      c.ok(await p.evaluate(() => !!window.__share && !document.querySelector('#sheet-root .sheet [data-act="bx-tl-yes"]')), theme + ': 두 번째부터는 바로 공유 창');
      c.eq(app.errors, [], theme + ': 화면 오류 없음');
    } catch (e) { c.ok(false, theme + ': ' + (e && e.stack || e)); }
    finally { await app.close(); }
  }
  // 알람 계획: 준비 시작(루틴 첫 단계 · 붙인 준비 루틴의 첫 단계)에 first
  const app = await openApp({ now: '2026-11-06T06:00:00+09:00', data: seed() });
  try {
    const p = app.page; await p.waitForTimeout(900);
    const plan = await p.evaluate(() => (window.BX_alarmPlan(2) || []).filter(a => /^r_rt_1_2026-11-06_|^iv_it_2_/.test(a.id)).map(a => [a.id.replace(/_\d{13}$/, ''), a.title, !!a.first]));
    const rt = plan.filter(x => /^r_rt_1/.test(x[0]));
    c.ok(rt.length >= 2 && rt.filter(x => x[1] === '기상').every(x => x[2]) && rt.filter(x => x[1] === '씻기').every(x => !x[2]), '루틴 첫 단계(다시 알림도)에만 first ' + JSON.stringify(rt.slice(0, 4)));
    const iv = plan.filter(x => /^iv_it_2_/.test(x[0]));
    c.ok(iv.length >= 2 && iv.filter(x => x[2]).length >= 1 && iv.filter(x => x[2]).every(x => x[1] === '기상') && iv.filter(x => x[1] === '출발할 시간').every(x => !x[2]), '준비 루틴을 붙인 일정은 첫 단계에 first(출발 · 출발 10분 전은 아님) ' + JSON.stringify(iv));
    // 휴대폰 쪽 기록이 없는 설치 파일에서는 설정에 시험 기록이 없음
    await p.evaluate(() => { delete window.Capacitor.Plugins.BxAlarm.testLog; });
    await p.click('.ab-menu'); await p.waitForTimeout(450);
    await p.locator('#sheet-root button', { hasText: '설정' }).last().click(); await p.waitForTimeout(600);
    c.ok(await p.evaluate(() => !!document.querySelector('.bx-set-home') && !document.querySelector('.bx-set-home [data-bxset="test"]')), '휴대폰 쪽 기록이 없으면 설정에 시험 기록 없음');
    c.eq(app.errors, [], '화면 오류(알람 계획)');
  } catch (e) { c.ok(false, '알람 계획: ' + (e && e.stack || e)); }
  finally { await app.close(); }
  // 같은 시험판: 홈 날짜 상자 세로(대표 11/6 13:06) · 홈 목록 상자 위아래 12(선택실 5 · 5번 B) · 입력 칸 글자 16(대표 11/6 13:03)
  const app3 = await openApp({ width: 384, height: 832, now: NOW, data: seed() });
  try {
    const p = app3.page; await p.waitForTimeout(900);
    const h = await p.evaluate(() => {
      const r = e => e ? e.getBoundingClientRect() : null, card = r(document.querySelector('#tcard')), st = r(document.querySelector('#tcard .bx-st'));
      const t2 = document.querySelector('#tcard2'), b = t2 && getComputedStyle(t2, '::before'), tr = r(t2);
      // 상자(::before) 안에 그려진 것 가운데 가장 위 · 가장 아래(정렬 점검 boxpad와 같은 재기)
      const bt = tr.top + parseFloat(b.top), inside = t2 ? Array.from(t2.querySelectorAll('.tc-body *')).map(r).filter(q => q.height > 0.5 && q.top >= bt - 0.5) : [];
      return { card: card && Math.round(card.height), tile: st && Math.round(st.height), top: inside.length ? Math.round(Math.min(...inside.map(q => q.top)) - bt) : null, bottom: inside.length ? Math.round(tr.bottom - Math.max(...inside.map(q => q.bottom))) : null };
    });
    c.ok(h.card <= 116 && h.tile === 36, '홈 날짜 상자 세로 113 안팎(전 142) · 숫자 칸 36 ' + JSON.stringify(h));
    c.ok(h.top === 12 && h.bottom === 12, "홈 '오늘 할 일' 상자 첫 줄 위 12 = 마지막 줄 아래 12 " + JSON.stringify(h));
    await p.click('.bx-fab'); await p.waitForTimeout(600);
    c.eq(await p.evaluate(() => { const t = document.getElementById('f-title'); const s = getComputedStyle(t); return [s.fontSize, getComputedStyle(t, '::placeholder').fontSize, s.fontWeight]; }), ['16px', '16px', '600'], '새 일정 제목 칸 글자 16 · 안내 글 16 · 굵기 600(전 20 · 700)');
    c.eq(app3.errors, [], '화면 오류(홈 · 새 일정)');
  } catch (e) { c.ok(false, '홈 · 입력 칸: ' + (e && e.stack || e)); }
  finally { await app3.close(); }
  // 날짜 칸 꾹 누르기: 누르는 사이 화면이 다시 그려져도(누른 칸이 새 칸으로 바뀜) 그 칸 위에 메뉴. 전에는 아래 창으로 뜨던 때가 있었다(와이어프레임 10판)
  const app2 = await openApp({ width: 384, height: 832, now: NOW, data: seed() });
  try {
    const p = app2.page; await p.waitForTimeout(900);
    if (await p.$('.dock [data-view="month"]')) await p.click('.dock [data-view="month"]'); else { await p.click('.ab-menu'); await p.waitForTimeout(450); await p.click('#sheet-root [data-act="bx-go"][data-view="month"]'); }
    await p.waitForTimeout(700);
    const sel = '.cal .cell[data-date="2026-11-12"]';
    const bb = await p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
    c.ok(!!bb, '달력에 11월 12일 칸');
    if (bb) {
      await p.mouse.move(bb.x, bb.y); await p.mouse.down(); await p.waitForTimeout(150);
      // 누르는 사이 다시 그림: 일정 하나를 고쳐 쓴다
      const old1 = await p.evaluate(() => { const c0 = document.querySelector('.cal .cell[data-date="2026-11-12"]'); window.__c0 = c0; window.BX_T.write('it_1', Object.assign({}, window.BX_T.docs().find(d => d[0] === 'it_1')[1], { updatedAt: new Date().toISOString() })); return !!c0; });
      await p.waitForTimeout(650); await p.mouse.up(); await p.waitForTimeout(400);
      const r = await p.evaluate(s => {
        const sh = document.querySelector('#sheet-root .sheet'), cell = document.querySelector(s);
        if (!sh || !cell) return null;
        const a = sh.getBoundingClientRect(), b = cell.getBoundingClientRect();
        return { ctx: sh.classList.contains('bx-ctx'), redrawn: window.__c0 !== cell && !window.__c0.isConnected, near: Math.min(Math.abs(a.bottom - b.top), Math.abs(a.top - b.bottom)) < 30, title: (sh.textContent || '').includes('이날 새 일정') };
      }, sel);
      c.ok(old1 && r && r.redrawn && r.ctx && r.near && r.title, '누르는 사이 다시 그려져도 누른 칸 바로 위 · 아래에 메뉴 ' + JSON.stringify(r));
    }
    c.eq(app2.errors, [], '화면 오류(날짜 칸 꾹 누르기)');
  } catch (e) { c.ok(false, '날짜 칸 꾹 누르기: ' + (e && e.stack || e)); }
  finally { await app2.close(); }
  return c.done();
};
