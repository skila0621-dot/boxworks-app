// 시험판 68(결정 사안 s20 '가 생활 기능('중요한 단계 확인')으로 바꾸기', 배포 준비 3절 위험 1): 약 기능 → 중요한 단계
// - 루틴 고치기 › 알림 방식 페이지 '중요한 단계' 상자: 할 일 단계마다 스위치(처음 꺼짐). 켜면 그 단계는 꼭 울림, ‹ 는 되돌림, 완료 · 저장하면 남음
// - 중요한 단계를 했다고 누르지 않으면: 홈 '했는지 확인 · …'(주황) · 확인 필요 · 루틴이 끝나고 10분 뒤 한 번 더. 단추는 '했어요'
// - 이름으로 정하지 않음: 새 루틴의 '약 먹기'는 보통 단계. 옛 루틴(시험판 67까지 저장, chkV 없음)의 약 단계만 중요한 단계로 이어받음
// - 짧게 한 번을 고르면 중요한 단계에서 빠짐. 싱잉볼 루틴은 상자 · 확인 없음
// - '먹었어요' · '약 먹기' 템플릿 · 도우미 '약 먹기' 칸 없음. 템플릿 '꼭 챙길 일' = 중요한 단계 하나. 말로 만들기는 '아침 약 먹고'를 '아침 먹기'로 바꾸지 않음
const { openApp, settings, checker } = require('./harness.cjs');
const old = '2026-10-29T00:00:00.000Z';
const NOW = '2026-11-06T07:35:00+09:00';
const st = (id, list) => list.map((s, i) => Object.assign({ id: id + i, name: s[0], min: s[1], kind: s[2] || 'do' }, s[3] || {}));
const seed = () => [['settings', settings({ bxStart: { at: old, mods: { routines: true } } })],
  // 새 판 루틴(chkV 1): '약 먹기'라도 고르지 않으면 보통 단계
  ['rt_new', { type: 'routine', name: '아침 준비', mode: 'start', target: '07:00', days: [0, 1, 2, 3, 4, 5, 6], on: true, every: 5, times: 2, chkV: 1,
    steps: st('n', [['기상', 5], ['약 먹기', 5], ['씻기', 20]]), createdAt: old, updatedAt: old }],
  // 옛 루틴(시험판 67까지): 꼭 울림이던 '저녁 약'은 중요한 단계로 이어받음, 짧게 한 번으로 바꿔 둔 '영양제'는 그대로
  ['rt_old', { type: 'routine', name: '저녁 루틴', mode: 'start', target: '06:40', days: [0, 1, 2, 3, 4, 5, 6], on: true, every: 10, times: 2,
    steps: st('o', [['씻기', 5], ['저녁 약', 0], ['영양제', 0, 'do', { ring: 'short' }], ['정리', 10]]), createdAt: old, updatedAt: old }],
  // 싱잉볼 루틴: 약 이름이 있어도 확인 없음
  ['rt_bowl', { type: 'routine', name: '명상', mode: 'start', target: '06:30', days: [0, 1, 2, 3, 4, 5, 6], on: true, sound: 'bowl', bowl: 'clear',
    steps: st('b', [['약 먹고 앉기', 2], ['호흡', 10]]), createdAt: old, updatedAt: old }]];
const doc = (p, id) => p.evaluate(id => (window.BX_T.docs().find(([k]) => k === id) || [0, null])[1], id);
const segs = p => p.evaluate(() => Array.from(document.querySelectorAll('#r-steps .rs-row')).map(r => { const b = r.querySelector('[data-rs-ring][aria-pressed="true"]'); return b ? b.dataset.rsRing : ''; }));
const sub = (p, rid) => p.evaluate(r => { const s = document.querySelector('#tcard2 .row[data-rid="' + r + '"] .rc-sub'); return s ? [s.textContent, s.classList.contains('warn')] : null; }, rid);
// 홈 줄에 확인 필요 표시가 있는지(줄이 있어야 함)
const warnOf = (p, rid) => p.evaluate(r => { const w = document.querySelector('#tcard2 .row[data-rid="' + r + '"]'); return w ? w.classList.contains('bx-ckw') : null; }, rid);

module.exports = async function () {
  const c = checker("시험판 68 · 약 기능 → '중요한 단계 확인'");
  for (const theme of ['light', 'dark']) {
    const app = await openApp({ width: 384, height: 832, colorScheme: theme, now: NOW, data: seed() });
    const p = app.page;
    try {
      await p.waitForTimeout(900);
      // 처음: 새 루틴의 '약 먹기'는 확인 없음, 옛 루틴의 '저녁 약'은 확인(06:40 → 06:45 약 · 지금 07:35), 싱잉볼은 없음
      c.eq(await warnOf(p, 'rt_new'), false, theme + ": 새 루틴의 '약 먹기'는 이름만으로 확인을 받지 않음");
      c.eq(await sub(p, 'rt_old'), ['했는지 확인 · 저녁 약', true], theme + ": 옛 루틴의 약 단계는 중요한 단계로 이어받음(주황 '했는지 확인')");
      c.eq(await warnOf(p, 'rt_bowl'), false, theme + ': 싱잉볼 루틴은 확인 없음');
      const plan0 = await p.evaluate(() => (window.BX_alarmPlan(1) || []).filter(a => a.kind === 'rcheck').map(a => a.id));
      c.eq(plan0.filter(id => /rt_new|rt_bowl/.test(id)), [], theme + ': 새 루틴 · 싱잉볼에는 끝난 뒤 확인 알림 없음');
      // 확인 필요 창: '루틴 단계 · 1', 단추 '했어요', '먹었' 글자 없음
      await p.click('[data-act="bx-late-open"]'); await p.waitForTimeout(500);
      const late = await p.evaluate(() => ({ h: Array.from(document.querySelectorAll('#sheet-root .bx-late-h')).map(x => x.textContent), b: Array.from(document.querySelectorAll('#sheet-root .bx-late-rt .btn')).map(x => x.textContent),
        p: (document.querySelector('#sheet-root .bx-late-p') || {}).textContent, t: document.getElementById('sheet-root').innerText }));
      c.ok(late.h.includes('루틴 단계 · 1') && late.b.join() === '했어요' && /했는지 확인하지 않은 루틴 단계/.test(late.p) && !/먹었|약 ·/.test(late.t), theme + ": 확인 필요 창: '루틴 단계 · 1' · '했어요' " + JSON.stringify(late.h.concat(late.b)));
      await p.evaluate(() => window.BX_back && window.BX_back()); await p.waitForTimeout(400);

      // 알림 방식 페이지: '중요한 단계' 상자, 할 일 단계마다 스위치(꺼짐)
      await p.click('.dock [data-view="routines"]'); await p.waitForTimeout(600);
      await p.click('[data-act="rt-edit"][data-rid="rt_new"]'); await p.waitForTimeout(500);
      c.eq(await segs(p), ['must', 'short', 'short'], theme + ': 단계 세기 처음(첫 단계만 꼭 울림)');
      await p.click('[data-bxrt45="ntf"]'); await p.waitForTimeout(400);
      const box = await p.evaluate(() => { const b = document.querySelector('#bx-pg .bx-chkbox'); return b ? { h: b.querySelector('.bx-chk-h b').textContent, s: b.querySelector('.bx-chk-h small').textContent,
        rows: Array.from(b.querySelectorAll('.bx-swrow')).map(r => [r.querySelector('span').textContent, r.querySelector('[data-rchk]').getAttribute('aria-checked')]) } : null; });
      c.ok(box && box.h === '중요한 단계' && /10분 뒤/.test(box.s) && /확인 필요/.test(box.s) && JSON.stringify(box.rows) === JSON.stringify([['기상', 'false'], ['약 먹기', 'false'], ['씻기', 'false']]),
        theme + ": 알림 방식 페이지 '중요한 단계' 상자(단계마다 꺼짐) " + JSON.stringify(box));
      // 켜기 → 뒤의 단계 줄도 꼭 울림, ‹ 는 되돌림
      await p.click('#bx-pg [data-rck="1"]'); await p.waitForTimeout(250);
      c.eq(await p.evaluate(() => document.querySelector('#bx-pg [data-rck="1"]').getAttribute('aria-checked')), 'true', theme + ': 스위치 켜짐');
      c.eq(await segs(p), ['must', 'must', 'short'], theme + ': 켜면 그 단계는 꼭 울림');
      await p.click('#bx-pg [data-bxpg="back"]'); await p.waitForTimeout(300);
      c.eq(await segs(p), ['must', 'short', 'short'], theme + ': ‹ 로 돌아가면 되돌림(세기도)');
      c.ok(!/중요한 단계/.test(await p.evaluate(() => document.querySelector('[data-bxrt45="ntf"]').textContent)), theme + ': ‹ 뒤 줄 글에 중요한 단계 없음');
      // 다시 켜고 완료 → 줄 글 '중요한 단계 1' · 저장
      await p.click('[data-bxrt45="ntf"]'); await p.waitForTimeout(400);
      await p.click('#bx-pg [data-rck="1"]'); await p.waitForTimeout(250);
      await p.click('#bx-pg [data-bxpg="done"]'); await p.waitForTimeout(300);
      c.ok(/중요한 단계 1/.test(await p.evaluate(() => document.querySelector('[data-bxrt45="ntf"]').textContent)), theme + ": 완료 → '알림 방식' 줄에 '중요한 단계 1'");
      await p.click('#sheet-root [data-act="rt-save"]'); await p.waitForTimeout(700);
      const d1 = await doc(p, 'rt_new');
      c.ok(d1 && d1.chkV === 1 && d1.steps[1].chk === true && d1.steps[1].ring === 'must' && !d1.steps[0].chk && !d1.steps[2].chk, theme + ': 저장하면 그 단계에 중요한 단계 ' + JSON.stringify(d1 && d1.steps.map(s => [s.name, s.chk, s.ring])));
      // 이제 확인을 받음: 홈 '했는지 확인 · 약 먹기' · 끝난 10분 뒤 알림(07:30 끝 → 07:40)
      const plan1 = await p.evaluate(() => (window.BX_alarmPlan(1) || []).filter(a => a.kind === 'rcheck' && /rt_new/.test(a.id)).map(a => [new Date(a.at).toTimeString().slice(0, 5), (a.check || []).map(x => x.n)]));
      c.eq(plan1, [['07:40', ['약 먹기']]], theme + ': 중요한 단계를 켠 루틴은 끝난 10분 뒤 한 번 더');
      await p.click('.dock [data-view="today"]'); await p.waitForTimeout(600);
      c.eq(await sub(p, 'rt_new'), ['했는지 확인 · 약 먹기', true], theme + ": 홈 줄 '했는지 확인 · 약 먹기'");
      // 짧게 한 번을 고르면 중요한 단계에서 빠짐
      await p.click('.dock [data-view="routines"]'); await p.waitForTimeout(600);
      await p.click('[data-act="rt-edit"][data-rid="rt_new"]'); await p.waitForTimeout(500);
      await p.click('#r-steps .rs-row:nth-child(2) [data-rs-ring="short"]'); await p.waitForTimeout(250);
      c.ok(!/중요한 단계/.test(await p.evaluate(() => document.querySelector('[data-bxrt45="ntf"]').textContent)), theme + ': 짧게 한 번을 고르면 줄 글에서도 빠짐');
      await p.click('#sheet-root [data-act="rt-save"]'); await p.waitForTimeout(700);
      const d2 = await doc(p, 'rt_new');
      c.ok(d2 && !d2.steps[1].chk && d2.steps[1].ring === 'short', theme + ': 짧게 한 번 → 중요한 단계 아님 ' + JSON.stringify(d2 && d2.steps[1]));
      // 싱잉볼 루틴: 상자가 보이지 않음
      await p.click('[data-act="rt-edit"][data-rid="rt_bowl"]'); await p.waitForTimeout(500);
      await p.click('[data-bxrt45="ntf"]'); await p.waitForTimeout(400);
      c.ok(await p.evaluate(() => { const b = document.querySelector('#bx-pg .bx-chkbox'); return !b || b.getBoundingClientRect().height === 0; }), theme + ': 싱잉볼이면 중요한 단계 상자 없음');
      await p.click('#bx-pg [data-bxpg="back"]'); await p.waitForTimeout(300);
      await p.evaluate(() => window.BX_back && window.BX_back()); await p.waitForTimeout(400);
      c.eq(app.errors, [], theme + ': 화면 오류 없음');
    } catch (e) { c.ok(false, theme + ': ' + (e && e.stack || e)); }
    finally { await app.close(); }
  }

  // 템플릿 · 도우미 · 말로 만들기
  const s0 = settings({ bxStart: { at: old, mods: { routines: true } } }); delete s0.bxRtHelp;
  const app = await openApp({ now: NOW, data: [['settings', s0]] });
  try {
    const p = app.page; await p.waitForTimeout(900);
    const tpls = await p.evaluate(() => window.BX_T.fn.rtTpls());
    c.ok(!tpls.some(n => /약/.test(n)) && tpls.includes('꼭 챙길 일'), "템플릿: '약 먹기' 없음 · '꼭 챙길 일' 있음 " + JSON.stringify(tpls));
    // 루틴 도우미(루틴이 없을 때 루틴 화면): 넣을 단계에 '약 먹기' 칸 없음
    await p.click('.dock [data-view="routines"]'); await p.waitForTimeout(700);
    if (await p.evaluate(() => !!document.querySelector('#bx-start [data-bxr="08:00"]'))) {
      await p.click('#bx-start [data-bxr="08:00"]'); await p.waitForTimeout(200);
      await p.click('#bx-start [data-bxr-nav="next"]'); await p.waitForTimeout(300);
    }
    const chips = await p.evaluate(() => Array.from(document.querySelectorAll('#bx-start .bxr-st b')).map(b => b.textContent));
    c.ok(chips.length >= 4 && !chips.some(n => /약/.test(n)), "루틴 도우미 넣을 단계에 '약 먹기' 없음 " + JSON.stringify(chips));
    await p.evaluate(() => { const s = document.querySelector('#bx-start [data-bxr-nav="skip"]'); if (s) s.click(); }); await p.waitForTimeout(400);
    // 템플릿 '꼭 챙길 일' → 고치기 창: 단계 하나가 중요한 단계(꼭 울림), 알림 방식 줄 '중요한 단계 1'
    await p.evaluate(() => { const b = document.querySelector('[data-act="bx-rt-new"]'); if (b) b.click(); }); await p.waitForTimeout(500);
    await p.click('#sheet-root [data-act="rt-tpl"][data-key="key"]'); await p.waitForTimeout(600);
    c.ok(/중요한 단계 1/.test(await p.evaluate(() => (document.querySelector('[data-bxrt45="ntf"]') || {}).textContent || '')) && (await segs(p)).join() === 'must',
      "템플릿 '꼭 챙길 일': 중요한 단계 하나(꼭 울림)");
    // 말로 만들기: '아침 약 먹고'는 적은 말 그대로(아침 먹기로 바꾸지 않음), '아침 먹고'는 아침 먹기
    const pr = await p.evaluate(() => [window.BX_T.fn.rtParse('평일 7시에 일어나서 아침 약 먹고 8시에 나가기'), window.BX_T.fn.rtParse('7시에 일어나서 씻고 아침 먹고 8시에 나가기')].map(r => r ? r.steps.map(s => s[0]) : null));
    c.ok(pr[0] && pr[0].includes('아침 약 먹기') && !pr[0].includes('아침 먹기') && pr[1] && pr[1].includes('아침 먹기'), "말로 만들기: '아침 약 먹고' → '아침 약 먹기' · '아침 먹고' → '아침 먹기' " + JSON.stringify(pr));
    c.eq(app.errors, [], '화면 오류(템플릿 · 도우미)');
  } catch (e) { c.ok(false, '템플릿 · 도우미: ' + (e && e.stack || e)); }
  finally { await app.close(); }
  return c.done();
};
