// 시험판 67(결정 사안 s05 '나 루틴마다 스위치(처음 꺼짐)'): 단계 이름 읽어 주기
// - 루틴 고치기 › 알림 방식 페이지: '단계 이름 읽어 주기' 스위치(처음 꺼짐) · '들어 보기'(휴대폰 목소리, BxAlarm.speak가 있을 때만)
// - 켜면 그 루틴 단계 알람(다시 알림도)에 읽어 줄 글 '씻기, 출발까지 25분' · 출발은 '출발할 시간'. 그 루틴을 준비 루틴으로 붙인 일정의 단계도
// - 싱잉볼 루틴은 읽지 않음. ‹ 는 되돌림
const { openApp, settings, checker } = require('./harness.cjs');
const old = '2026-10-29T00:00:00.000Z';
const NOW = '2026-11-06T06:00:00+09:00';
const seed = (say) => [['settings', settings({ bxStart: { at: old, mods: { routines: true } } })],
  ['rt_1', Object.assign({ type: 'routine', name: '출근 준비', mode: 'arrive', target: '09:00', travel: 40, buffer: 10, days: [1, 2, 3, 4, 5], on: true, every: 5, times: 2,
    steps: [{ id: 'a', name: '기상', min: 5, kind: 'do' }, { id: 'b', name: '씻기', min: 20, kind: 'do' }, { id: 'c', name: '옷 입기', min: 10, kind: 'do' }], createdAt: old, updatedAt: old }, say ? { say: true } : {})],
  ['rt_b', { type: 'routine', name: '명상', mode: 'start', target: '07:30', days: [1, 2, 3, 4, 5], on: true, sound: 'bowl', bowl: 'clear', say: true, steps: [{ id: 'm', name: '호흡', min: 10, kind: 'do' }], createdAt: old, updatedAt: old }],
  ['it_1', { type: 'item', title: '치과', date: '2026-11-06', start: '15:00', end: '16:00', travel: 30, prep: 'rt_1', remind: '', createdAt: old, updatedAt: old }]];
const doc = (p, id) => p.evaluate(id => (window.BX_T.docs().find(([k]) => k === id) || [0, null])[1], id);
const says = (p, re) => p.evaluate(src => (window.BX_alarmPlan(14) || []).filter(a => new RegExp(src).test(a.id)).map(a => [a.id.replace(/^.*_(\d{4}-\d\d-\d\d)_/, '$1_'), a.title, a.say || '', a.lv]), re);

module.exports = async function () {
  const c = checker('시험판 67 · 단계 이름 읽어 주기');
  for (const theme of ['light', 'dark']) {
    const app = await openApp({ width: 384, height: 832, colorScheme: theme, now: NOW, data: seed(false) });
    const p = app.page;
    try {
      await p.waitForTimeout(900);
      // 휴대폰 목소리 흉내: 부른 글을 모아 두고, '한국어 목소리 없음'으로도 답해 본다
      await p.evaluate(() => { window.__say = []; window.__sayAns = { ok: true, why: '' }; window.Capacitor.Plugins.BxAlarm.speak = async x => { window.__say.push(x.text); return window.__sayAns; }; });
      const off = await says(p, '^r_rt_1_2026-11-06_');
      c.ok(off.length >= 3 && off.every(x => !x[2]), theme + ': 처음엔 꺼짐 — 읽어 줄 글 없음 ' + JSON.stringify(off.slice(0, 2)));
      await p.click('.dock [data-view="routines"]'); await p.waitForTimeout(600);
      await p.click('[data-act="rt-edit"][data-rid="rt_1"]'); await p.waitForTimeout(500);
      await p.click('[data-bxrt45="ntf"]'); await p.waitForTimeout(400);
      const pg = await p.evaluate(() => { const r = document.querySelector('#bx-pg .bx-say'); return r ? { b: r.querySelector('b').textContent, s: r.querySelector('small').textContent, on: r.querySelector('[data-rsay]').getAttribute('aria-checked'), inRep: !!r.closest('#bx-rrep'), tryBtn: !!document.querySelector('#bx-pg [data-act="rt-say-try"]') } : null; });
      c.ok(pg && pg.b === '단계 이름 읽어 주기' && /씻기, 출발까지 25분/.test(pg.s) && pg.on === 'false' && pg.inRep && pg.tryBtn, theme + ": 알림 방식 페이지 '단계 이름 읽어 주기'(꺼짐) · 들어 보기 " + JSON.stringify(pg));
      // 들어 보기: 이 루틴의 첫 단계 이름으로
      await p.click('#bx-pg [data-act="rt-say-try"]'); await p.waitForTimeout(250);
      c.eq(await p.evaluate(() => window.__say), ['기상, 출발까지 25분'], theme + ': 들어 보기 → 휴대폰 목소리로 첫 단계 이름');
      await p.evaluate(() => { window.__sayAns = { ok: false, why: 'lang' }; });
      await p.click('#bx-pg [data-act="rt-say-try"]'); await p.waitForTimeout(350);
      c.ok(/한국어 목소리가 없어요/.test(await p.evaluate(() => (document.querySelector('#toasts .toast') || {}).textContent || '')), theme + ': 한국어 목소리가 없으면 안내 글');
      // 켜기 → ‹ 는 되돌림
      await p.click('#bx-pg [data-rsay]'); await p.waitForTimeout(250);
      c.eq(await p.evaluate(() => document.querySelector('#bx-pg [data-rsay]').getAttribute('aria-checked')), 'true', theme + ': 스위치 켜짐');
      await p.click('#bx-pg [data-bxpg="back"]'); await p.waitForTimeout(300);
      c.ok(!/이름 읽어 주기/.test(await p.evaluate(() => document.querySelector('[data-bxrt45="ntf"]').textContent)), theme + ': ‹ 로 돌아가면 되돌림');
      // 다시 켜고 완료 → 줄 글 · 저장
      await p.click('[data-bxrt45="ntf"]'); await p.waitForTimeout(400);
      await p.click('#bx-pg [data-rsay]'); await p.waitForTimeout(250);
      await p.click('#bx-pg [data-bxpg="done"]'); await p.waitForTimeout(300);
      c.ok(/이름 읽어 주기/.test(await p.evaluate(() => document.querySelector('[data-bxrt45="ntf"]').textContent)), theme + ": 완료 → 루틴 창 '알림 방식' 줄에 '이름 읽어 주기'");
      await p.click('#sheet-root [data-act="rt-save"]'); await p.waitForTimeout(600);
      c.eq((await doc(p, 'rt_1')).say, true, theme + ': 저장하면 루틴에 읽어 주기');
      // 알람 계획: 단계마다 '이름, 출발까지 N분', 다시 알림도, 출발은 '출발할 시간'
      const on = await says(p, '^r_rt_1_2026-11-06_');
      const byT = t => on.filter(x => x[1] === t);
      c.ok(byT('기상').length >= 1 && byT('기상').every(x => /^기상, 출발까지 \d+분$/.test(x[2])) && byT('씻기').every(x => /^씻기, 출발까지 \d+분$/.test(x[2])) && byT('출발할 시간').every(x => x[2] === '출발할 시간'), theme + ': 알람마다 읽어 줄 글(다시 알림 · 출발 포함) ' + JSON.stringify(on.slice(0, 4)));
      // 이 루틴을 붙인 일정의 단계도(출발 10분 전 알림은 읽지 않음, 일정 제목은 읽지 않음)
      const it = await p.evaluate(() => (window.BX_alarmPlan(14) || []).filter(a => /^iv_it_1_/.test(a.id)).map(a => [a.title, a.say || '']));
      c.ok(it.length >= 3 && it.filter(x => x[0] !== '출발할 시간' && x[0] !== '치과').every(x => /, (출발|시작)까지 \d+분$/.test(x[1])) && it.filter(x => x[0] === '치과').every(x => !x[1]) && it.every(x => !/치과/.test(x[1])), theme + ': 준비 루틴으로 붙인 일정의 단계도 읽음(제목은 읽지 않음) ' + JSON.stringify(it));
      // 싱잉볼 루틴은 읽지 않음(페이지에도 스위치 없음)
      const bw = await says(p, '^r_rt_b_2026-11-06_');
      c.ok(bw.length >= 1 && bw.every(x => !x[2]), theme + ': 싱잉볼 루틴은 읽지 않음 ' + JSON.stringify(bw));
      await p.click('[data-act="rt-edit"][data-rid="rt_b"]'); await p.waitForTimeout(500);
      await p.click('[data-bxrt45="ntf"]'); await p.waitForTimeout(400);
      c.ok(await p.evaluate(() => { const r = document.querySelector('#bx-pg .bx-say'); return !r || r.getBoundingClientRect().height === 0; }), theme + ': 싱잉볼이면 스위치가 보이지 않음');
      c.eq(app.errors, [], theme + ': 화면 오류 없음');
    } catch (e) { c.ok(false, theme + ': ' + (e && e.stack || e)); }
    finally { await app.close(); }
  }
  // 휴대폰 목소리가 없는 곳(BxAlarm.speak 없음): '들어 보기'를 두지 않음
  const app = await openApp({ now: NOW, data: seed(true) });
  try {
    const p = app.page; await p.waitForTimeout(900);
    await p.click('.dock [data-view="routines"]'); await p.waitForTimeout(600);
    await p.click('[data-act="rt-edit"][data-rid="rt_1"]'); await p.waitForTimeout(500);
    await p.click('[data-bxrt45="ntf"]'); await p.waitForTimeout(400);
    c.ok(await p.evaluate(() => !!document.querySelector('#bx-pg .bx-say [data-rsay][aria-checked="true"]') && !document.querySelector('#bx-pg [data-act="rt-say-try"]')), "켜 둔 루틴은 켜짐으로 · 목소리가 없는 휴대폰에는 '들어 보기' 없음");
    c.eq(app.errors, [], '화면 오류(목소리 없음)');
  } catch (e) { c.ok(false, '목소리 없음: ' + (e && e.stack || e)); }
  finally { await app.close(); }
  return c.done();
};
