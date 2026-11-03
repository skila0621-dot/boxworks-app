// 시험판 35: (1) '시작 종' 스위치(대표 요청 11/3 오후: 배경 소리만 듣고 싶을 수도, 종소리와 섞고 싶을 수도). 끝 종은 늘(끝을 소리로),
// (2) 창을 열어도 머리 줄(로고·⋯)이 제자리(대표 지적 11/3: ⋯ 더보기를 누르면 로고 줄 위치가 바뀜). 싱잉볼이 천천히 커지는 것(4판)은 소리 파일이라 휴대폰에서 확인
const { openApp, settings, checker } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
const sw = p => p.evaluate(() => { const b = document.querySelector('[data-med-startbell]'); return b ? b.getAttribute('aria-checked') : null; });
const lastLocal = p => p.evaluate(() => (window.__local.slice(-1)[0] || []).map(a => [a.id, a.sound]));

module.exports = async function () {
  const c = checker('시험판 35 · 시작 종 · 끝 소리 · 머리 줄 · 캘린더 표시');

  let app = await openApp({ data: [['settings', settings()]] });
  try {
    const p = app.page;
    await p.evaluate(() => { const l = window.Capacitor.Plugins.BxAlarm; window.__local = []; l.local = async x => { window.__local.push(x.alarms); return {}; }; l.cancelLocal = async () => ({}); });
    await p.click('.dock [data-view="med"]'); await p.waitForTimeout(600);
    await p.click('.bx-med-more summary'); await p.waitForTimeout(300);
    c.eq(await sw(p), 'true', '시작 종 스위치는 처음엔 켜짐');
    const order = await p.evaluate(() => { const all = Array.from(document.querySelectorAll('.bx-med-more *')); return [all.indexOf(document.querySelector('.bx-bowl-picks')), all.indexOf(document.querySelector('[data-med-startbell]')), all.indexOf(document.querySelector('[data-med-bellsw]'))]; });
    c.ok(order[0] >= 0 && order[0] < order[1] && order[1] < order[2], '종소리 종류 → 시작 종 → 중간 종 순서 ' + JSON.stringify(order));
    c.ok(await p.evaluate(() => /끝날 때는 늘 세 번 울려요/.test(document.querySelector('.bx-med-more').innerText)), '끝 종은 늘 울린다는 안내');
    // 시작 종 끄기: 배경 소리만으로 시작, 끝 종은 그대로
    await p.click('[data-med-startbell]'); await p.waitForTimeout(300);
    c.eq(await sw(p), 'false', '누르면 꺼짐');
    c.ok(await p.evaluate(() => /첫 종 없이 시작해요/.test(document.querySelector('.bx-med-more').innerText) && /시작 종 없음/.test(document.querySelector('.bx-mm-t small').textContent) && !!document.querySelector('.bx-bowl-picks')), "끈 안내, 접힌 줄 '시작 종 없음', 종류는 그대로(끝 종에 씀)");
    c.eq(await p.evaluate(() => JSON.parse(localStorage.getItem('bx:med') || '{}').startBell), false, '이 휴대폰에 남음');
    await p.click('[data-bxbg="waves"]'); await p.waitForTimeout(300);
    await p.click('[data-act="bx-med-start"]'); await p.waitForTimeout(500);
    c.eq(await lastLocal(p), [['med_end', 'bowl3']], '시작 종을 끄면 첫 종만 빠지고 끝 종(세 번)은 남음');
    const run = await p.evaluate(() => JSON.parse(localStorage.getItem('bx:med') || '{}').run);
    const pl = await p.evaluate(() => window.__bg.filter(x => x[0] === 'play').slice(-1)[0]);
    c.ok(pl && pl[1].sound === 'waves' && pl[1].mode === 'med' && pl[1].startAt === run.startAt && pl[1].until === run.endAt - 2000, '배경 소리는 끝 종 2초 전부터 줄어듦 ' + JSON.stringify([pl, run.endAt]));
    c.ok(await p.evaluate(() => /끝나면 세 번 울려요\. 파도는 끝 종 앞에서 줄어들어요\./.test((document.querySelector('.bx-med-run .bx-med-note') || {}).textContent || '')), '진행 중 안내: 끝 종과 배경 소리');
    // 명상이 끝났는데 휴대폰이 아직 명상 배경 소리를 튼다고 하면 앱이 끈다
    // 시계를 명상 끝 11분 뒤로
    await p.clock.setSystemTime(new Date(run.endAt + 60000)); await p.waitForTimeout(1500);
    const n0 = await p.evaluate(() => window.__bg.length);
    await p.evaluate(() => window.__bgL({ playing: true, sound: 'waves', mode: 'med' })); await p.waitForTimeout(300);
    c.ok(await p.evaluate(n => window.__bg.slice(n).some(x => x[0] === 'stop'), n0), '끝난 명상의 배경 소리가 남아 있으면 앱이 끔');
    await p.click('[data-act="bx-med-close"]'); await p.waitForTimeout(400);
    // 다시 켜면 시작 종도
    if (!(await p.evaluate(() => document.querySelector('.bx-med-more') && document.querySelector('.bx-med-more').open))) { await p.click('.bx-med-more summary'); await p.waitForTimeout(200); }
    await p.click('[data-med-startbell]'); await p.waitForTimeout(300);
    c.eq(await sw(p), 'true', '다시 켜짐');
    await p.click('[data-act="bx-med-start"]'); await p.waitForTimeout(500);
    const l2 = await lastLocal(p);
    c.ok(l2.some(a => a[0] === 'med_start' && a[1] === 'bowl') && l2.some(a => a[0] === 'med_end' && a[1] === 'bowl3'), '켜면 시작 종 · 끝 종 ' + JSON.stringify(l2));
    c.eq(app.errors, [], '화면 오류(시작 종)');
  } finally { await app.close(); }

  // (2) 내린 뒤 ⋯ 더보기를 열어도 머리 줄이 제자리, 뒤 화면은 안 움직임
  const data = [['settings', settings()]];
  for (let i = 0; i < 14; i++) data.push(['it_' + i, { type: 'item', title: '일정 ' + i, date: '2026-11-02', start: String(8 + Math.floor(i / 2)).padStart(2, '0') + ':' + (i % 2 ? '30' : '00'), createdAt: old, updatedAt: old }]);
  app = await openApp({ data });
  try {
    const p = app.page;
    await p.evaluate(() => window.scrollTo(0, 400)); await p.waitForTimeout(300);
    const top = () => p.evaluate(() => [Math.round(document.querySelector('header.appbar').getBoundingClientRect().top), Math.round(scrollY)]);
    const t0 = await top();
    await p.click('[data-act="more"]'); await p.waitForTimeout(600);
    const t1 = await top();
    c.ok(t0[1] === 400 && t0[0] === t1[0] && t1[0] >= 0, '⋯ 더보기를 열어도 머리 줄(로고·⋯)이 제자리 ' + JSON.stringify([t0, t1]));
    await p.mouse.move(195, 150); await p.mouse.wheel(0, 300); await p.waitForTimeout(300);
    c.eq((await top())[1], 400, '창이 열린 동안 뒤 화면은 움직이지 않음');
    await p.evaluate(() => { const x = document.querySelector('#sheet-root [data-act="sheet-close"]'); if (x) x.click(); }); await p.waitForTimeout(400);
    c.eq(await top(), [0, 400], '닫으면 그대로');
    c.eq(app.errors, [], '화면 오류(머리 줄)');
  } finally { await app.close(); }
  // (3) 캘린더: 박스웍스 · 휴대폰 캘린더 표시는 달 넘기기 · 개수 줄 아래, 종류가 많으면 옆으로 밀기(대표 요청 11/3)
  app = await openApp({ data: [['settings', settings()]] });
  try {
    const p = app.page;
    await p.evaluate(() => localStorage.setItem('bx:pcal', JSON.stringify({ on: true })));
    const where = () => p.evaluate(() => {
      const ph = document.querySelector('.page-head.bx-ch'); if (!ph) return null;
      const lg = ph.querySelector(':scope > .bx-cal-lg'), pp = ph.querySelector(':scope > p'), mid = ph.querySelector('.bx-ch-mid');
      return { inTop: !!ph.querySelector('.bx-ch-top .bx-cal-lg'), below: !!(lg && pp && mid && lg.getBoundingClientRect().top >= pp.getBoundingClientRect().bottom - 1 && pp.getBoundingClientRect().top >= mid.getBoundingClientRect().bottom - 1), ox: lg ? getComputedStyle(lg).overflowX : null };
    });
    await p.click('.dock [data-view="month"]'); await p.waitForTimeout(700);
    const m = await where();
    c.ok(m && !m.inTop && m.below && m.ox === 'auto', '월간: 표시가 달 넘기기 · 개수 줄 아래 ' + JSON.stringify(m));
    const sc = await p.evaluate(() => { const lg = document.querySelector('.page-head.bx-ch > .bx-cal-lg'); for (let i = 0; i < 8; i++) lg.insertAdjacentHTML('beforeend', '<span><i class="pc"></i>공유 캘린더 ' + i + '</span>'); lg.scrollLeft = 2000; return [lg.scrollWidth > lg.clientWidth + 20, lg.scrollLeft > 0, Math.round(lg.getBoundingClientRect().height)]; });
    c.ok(sc[0] && sc[1] && sc[2] < 40, '종류가 많으면 한 줄로 옆으로 밀어 봄 ' + JSON.stringify(sc));
    await p.click('[data-act="tt-cal"][data-to="week"]'); await p.waitForTimeout(700);
    const w = await where();
    c.ok(w && !w.inTop && w.below, '주간도 같은 자리 ' + JSON.stringify(w));
    c.eq(app.errors, [], '화면 오류(캘린더 표시)');
  } finally { await app.close(); }
  return c.done();
};
