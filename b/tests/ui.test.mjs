// 화면 흐름 시험(가짜 휴대폰 쪽으로): 시작했어요 · 나갔어요 · 묻기 · 약속 조정 · 넣기와 말로 고치기 · 늦는다고 알리기 · 돌아온 날 · 처음 · 시각 표시
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const require = createRequire(import.meta.url);
const pw = require('playwright'); // 전역 설치본(CJS)을 쓰려고 require
const serve = require('./serve.cjs');
const here = path.dirname(fileURLToPath(import.meta.url));

export default async function run(check) {
  const srv = await serve(path.join(here, '..', 'web'));
  const b = await pw.chromium.launch();
  const D = (h, m = 0, day = 0) => new Date(2026, 10, 6 + day, h, m).getTime();
  const ev = (id, h, m, title, location) => ({ id, begin: D(h, m), end: D(h + 1, m), title, location, allDay: false, calId: '1', calName: '내 캘린더' });
  const base = [ev('102', 15, 0, '치과', '강남역 3번 출구'), ev('103', 19, 0, '친구랑 저녁', '')];
  const open = async (sc, hash = '#/') => {
    const p = await b.newPage({ viewport: { width: 384, height: 860 } }); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.addInitScript(s => { window.__B_SCENARIO = s; }, sc);
    await p.goto(srv.url + hash); await p.waitForTimeout(300); p.errs = errs; return p;
  };
  const text = (p, sel) => p.$eval(sel, e => e.innerText.replace(/\s+/g, ' ').trim());
  try {
    // 1) 준비 시작 전 → 지금 시작하기 → 출발까지 → 나갔어요(이번 준비 기록)
    let p = await open({ now: D(13, 20), events: base });
    check.ok((await text(p, '.hero')).includes('준비 시작'), '처음: 다음 할 일은 준비 시작');
    check.ok((await text(p, '.hero .big')).startsWith('오후 1:50'), '준비 시작 오후 1:50(3시 − 이동 30 − 여유 10 − 준비 30)');
    await p.click('[data-start]'); await p.waitForTimeout(200);
    check.ok((await text(p, '.hero')).includes('출발까지'), '시작했어요 → 출발까지');
    check.ok((await text(p, '#toast')).includes('오후 2:20에 출발'), '알림 글에 출발 시각');
    await p.click('.hero [data-left]'); await p.waitForTimeout(200);
    const log = await p.evaluate(() => window.__B_SCENARIO && null);
    check.ok((await text(p, '.list')).includes('출발함'), '나갔어요 → 줄에 출발함');
    check.eq(p.errs, [], '화면 오류 없음(1)'); await p.close();
    // 2) 제목만 있는 약속: '네, 나가요' → 나가는 약속 + 같은 제목 기억
    p = await open({ now: D(9, 0), events: base });
    await p.click('[data-out][data-v="1"]'); await p.waitForTimeout(200);
    const kw = await p.evaluate(async () => (await (await import('./js/app.js')).B.state()).kw);
    check.eq(kw, { '친구랑저녁': true }, '같은 제목 기억(kw)');
    check.ok((await text(p, '.list')).includes('준비 시작 오후 5:50'), '저녁 7시 약속 → 준비 시작 오후 5:50');
    await p.close();
    // 3) 약속 화면: 이동 +5 → 이 장소 기억
    p = await open({ now: D(9, 0), events: base }, '#/e/' + encodeURIComponent('c:102:' + D(15)));
    await p.click('[data-step="travel"] [data-d="5"]'); await p.waitForTimeout(200);
    const st3 = await p.evaluate(async () => { const s = await (await import('./js/app.js')).B.state(); return [s.places, s.overrides]; });
    check.eq(st3[0], { '강남역 3번 출구': 35 }, '이동 35분 · 장소 기억');
    check.ok((await text(p, '.plan')).includes('오후 1:45'), '알람 미리 보기가 바로 바뀜(준비 1:45)');
    await p.close();
    // 4) 넣기 → 말로 고치기 → 캘린더에 넣기
    p = await open({ now: D(13, 20), events: base });
    await p.click('[data-add]'); await p.waitForTimeout(150);
    await p.fill('#addT', '금요일 7시 홍대에서 동창 저녁'); await p.press('#addT', 'Enter'); await p.waitForTimeout(100);
    check.ok((await text(p, '#addPrev')).includes('오후 7:00'), '넣기: 오후 7:00');
    await p.fill('#addT', '7시 반으로'); await p.press('#addT', 'Enter'); await p.waitForTimeout(120);
    check.ok((await text(p, '#addPrev')).includes('오후 7:30'), '말로 고치기: 7시 반으로');
    await p.fill('#addT', '장소는 합정역'); await p.press('#addT', 'Enter'); await p.waitForTimeout(120);
    check.ok((await text(p, '#addPrev')).includes('합정역'), '말로 고치기: 장소는 합정역');
    await p.click('#addGo'); await p.waitForTimeout(300);
    const evs = await p.evaluate(async () => (await import('./js/app.js')).B.__events().map(e => [e.title, e.location]));
    check.ok(evs.some(e => e[0] === '홍대에서 동창 저녁' && e[1] === '합정역'), '휴대폰 캘린더에 들어감(제목 · 장소)');
    check.ok((await text(p, '#toast')).includes('준비 시작'), '넣은 뒤: 준비 시작 시각을 알려 줌');
    check.eq(p.errs, [], '화면 오류 없음(4)'); await p.close();
    // 5) 늦을 때: 보낼 말을 채워 공유 창만
    p = await open({ now: D(14, 34), events: base, log: [{ key: 'c:102:' + D(15), act: 'rang', kind: 'prep', t: D(13, 50) }, { key: 'c:102:' + D(15), act: 'snooze', kind: 'prep', n: 5, t: D(13, 50) }, { key: 'c:102:' + D(15), act: 'snooze', kind: 'leave', n: 3, t: D(14, 25) }] });
    check.ok((await text(p, '.hero')).includes('늦어요'), '늦을 때: 몇 분 늦는지 보여 줌');
    await p.click('.hero [data-late]'); await p.waitForTimeout(150);
    const shared = await p.evaluate(async () => (await import('./js/app.js')).B.__sharedOut);
    check.ok(/미안해요, \d+분쯤 늦을 것 같아요\. 오후 3:\d\d쯤 도착해요\./.test(shared[0] || ''), '늦는다고 알리기 글: ' + (shared[0] || ''));
    await p.close();
    // 6) 돌아온 날(이틀 넘게 만에)
    p = await open({ now: D(9, 0), events: base, lastOpen: D(9, 0) - 3 * 864e5 - 3600e3 });
    check.ok((await text(p, '.back')).includes('3일 만이에요 · 오늘부터 시작'), '돌아온 날 한 장(대표 결정 C)');
    await p.click('[data-backok]'); await p.waitForTimeout(150);
    check.ok(!!(await p.$('.hero')), '시작하기 → 오늘');
    await p.close();
    p = await open({ now: D(9, 0), events: base, lastOpen: D(9, 0) - 2 * 864e5 + 3600e3 });
    check.ok(!(await p.$('.back')), '이틀 안이면 한 장 없음');
    await p.close();
    // 7) 처음 세 장 → 오늘
    p = await open({ now: D(9, 0), events: base, firstRun: true, perms: { calendar: 'no', notif: 'no', exact: 'no', fullscreen: 'no', battery: 'no' } });
    check.ok((await text(p, '.onb h1')).includes('준비를 시작할 시간'), '처음 1');
    for (let i = 0; i < 3; i++) { await p.click('[data-go]'); await p.waitForTimeout(200); }
    const perms = await p.evaluate(async () => (await (await import('./js/app.js')).B.state()).perms);
    check.eq([perms.calendar, perms.notif, perms.exact, perms.fullscreen, perms.battery], ['ok', 'ok', 'ok', 'ok', 'ok'], '처음 세 장에서 권한 다섯');
    check.ok(!!(await p.$('.hero')), '처음 → 오늘');
    await p.close();
    // 8) 24시간 표시
    p = await open({ now: D(13, 20), events: base, settings: { h24: true } });
    check.ok((await text(p, '.hero .big')).startsWith('13:50'), '24시간: 13:50');
    await p.close();
  } finally { await b.close(); srv.close(); }
}
