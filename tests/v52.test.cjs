// 시험판 52(대표 11/4 16:34 · 16:58, 결정 기록 D-25): 루틴은 폰을 쥐고 있지 않아도 되게
// (1) 단계 세기 기본값: 첫 단계 · 중요한 단계 · 출발은 꼭 울림, 중간은 짧게 한 번, 기다리기는 소리 없이
//     시험판 68(s20): 이름으로 정하지 않음. 옛 루틴(chkV 없음)만 약 이름 단계를 중요한 단계로 이어받음('약속' · '예약'은 아님)
// (2) 알람 계획: 짧게 한 번은 다시 알림 없음, 꼭 울림만 다시 알림(다음 꼭 울림 단계 전까지), 출발은 '다 했어요', 확인 안 한 단계 알림은 중요한 단계만
// (3) 기다리기 시작: 소리 없는 자리(알림창 · 위젯만 고침), 0분 단계와 같은 시각의 짧게 한 번은 하나로, '조용히'면 소리 없이
// (4) 일정 출발: 출발 10분 전은 짧게 한 번, 루틴을 하는 동안이면 빠짐, 준비 루틴을 붙이면 루틴과 같은 세기
// (5) 홈: 확인 안 해도 주의 줄 · 빨간 숫자 없음, '지금'은 시각으로, 중요한 단계만 확인 필요 / 펼친 단계 시각은 한 줄
// (6) 루틴 창: 단계마다 세 칸(꼭 울림 · 짧게 한 번 · 소리 없이), 고른 세기 저장, 좁은 휴대폰에서도 한 줄
// (7) 위젯 자료: 단계표에 세기 · 기다리기, 출발 '다 했어요', 아침 요약은 꼭 울림 알람에
const { openApp, settings, checker, hmOf } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
const DOC_STEPS = [['기상하기', 2], ['스트레칭', 5], ['이불 개기', 3], ['씻기', 15], ['머리 말리기', 7], ['옷 입기', 8], ['식사', 12], ['출근 준비', 8]];
// 대표 예시(방향_검토 4절): 9시 도착 · 이동 45분 · 여유 15분 → 7:00 기상 ~ 8:00 출발
const work = (id, steps, extra = {}) => [id, Object.assign({ type: 'routine', name: '출근 준비', days: [0, 1, 2, 3, 4, 5, 6], mode: 'arrive', target: '09:00', travel: 45, buffer: 15,
  times: 6, every: 5, on: true, steps: steps.map((s, i) => Array.isArray(s) ? { id: 's' + i, name: s[0], min: s[1], kind: s[2] } : s), createdAt: old, updatedAt: old }, extra)];
const startRt = (id, name, target, steps, extra = {}) => [id, Object.assign({ type: 'routine', name, days: [0, 1, 2, 3, 4, 5, 6], mode: 'start', target, times: 6, every: 5, on: true,
  steps: steps.map((s, i) => ({ id: id + i, name: s[0], min: s[1], kind: s[2] })), createdAt: old, updatedAt: old }, extra)];
const at = hm => Date.parse('2026-11-02T' + hm + ':00+09:00');
const doc = (p, id) => p.evaluate(i => (window.BX_T.docs().find(([k]) => k === i) || [0, null])[1], id);

module.exports = async function () {
  const c = checker('시험판 52 · 루틴 단계 세기(꼭 울림 · 짧게 한 번 · 소리 없이) · 확인은 기상 · 중요한 단계 · 출발만');

  // (1)~(4) 계산
  let app = await openApp({ data: [['settings', settings()], work('rt_w', DOC_STEPS),
    startRt('rt_h', '집안일 15분', '20:00', [['빨래 돌리기', 5], ['설거지', 15], ['세탁 기다리기', 30, 'wait'], ['빨래 널기', 10]]),
    startRt('rt_m', '약 먹기', '12:00', [['점심 약', 0]], { every: 10 }),
    startRt('rt_b', '책 읽기', '21:30', [['휴대폰 멀리 두기', 0], ['책 읽기', 30]])] });
  try {
    const p = app.page;
    const R = await p.evaluate(() => {
      const ring = (name, i, steps) => window.BX_RING.ring({ name, kind: 'do' }, i, steps || [{ kind: 'do' }, { kind: 'do' }]);
      // 시험판 68: 옛 루틴(chkV 없음)만 약 이름 단계를 중요한 단계로 이어받는다. 새 루틴(chkV 1)은 이름으로 정하지 않는다
      const leg = (n, v) => !!window.BX_RING.legacy(Object.assign({ type: 'routine', steps: [{ name: n, kind: 'do' }] }, v ? { chkV: 1 } : {})).steps[0].chk;
      return {
        med: ['약 먹기', '아침 약', '저녁약', 'ADHD 약', '영양제', '약속 준비', '병원 예약', '약국 가기', '요약 정리', '약간 쉬기'].map(n => leg(n)),
        fresh: ['약 먹기', '아침 약'].map(n => leg(n, true)),
        ring: [ring('씻기', 0), ring('씻기', 1), ring('아침 약', 1), ring('세탁', 1, [{ kind: 'wait' }, { kind: 'do' }]), window.BX_RING.ring({ name: '세탁 기다리기', kind: 'wait' }, 2, []),
          window.BX_RING.ring({ name: '씻기', kind: 'do', ring: 'must' }, 3, []), window.BX_RING.ring({ name: '기상', kind: 'do', ring: 'short' }, 0, []),
          window.BX_RING.ring({ name: '챙기기', kind: 'do', chk: true }, 2, [])]
      };
    });
    c.eq(R.med, [true, true, true, true, true, false, false, false, false, false], "옛 루틴의 약 단계 이어받기: '약속' · '예약' · '약국' · '요약' · '약간'은 아님");
    c.eq(R.fresh, [false, false], '새 루틴은 이름으로 중요한 단계를 정하지 않음');
    c.eq(R.ring, ['must', 'short', 'short', 'must', 'silent', 'must', 'short', 'must'], '기본값: 첫 단계 · 중요한 단계는 꼭 울림, 중간은 짧게 한 번(이름과 상관없이), 기다리기는 소리 없이, 고른 세기가 먼저');

    const plan = await p.evaluate(() => window.BX_alarmPlan(1));
    const mine = (rid, day = '2026-11-02') => plan.filter(a => a.id.startsWith('r_' + rid + '_' + day + '_'));
    const W = mine('rt_w');
    const firsts = W.filter(a => !/_r\d+$/.test(a.id)).map(a => [hmOf(a.at), a.title, a.lv]);
    c.eq(firsts, [['07:00', '기상하기', 'alarm'], ['07:02', '스트레칭', 'short'], ['07:07', '이불 개기', 'short'], ['07:10', '씻기', 'short'], ['07:25', '머리 말리기', 'short'],
      ['07:32', '옷 입기', 'short'], ['07:40', '식사', 'short'], ['07:52', '출근 준비', 'short'], ['08:00', '출발할 시간', 'alarm']], '대표 예시 출근 루틴: 끄는 것은 기상 · 출발 둘, 일곱 번은 짧게 한 번');
    c.eq(W.filter(a => /_r\d+$/.test(a.id)).map(a => a.title).filter((t, i, x) => x.indexOf(t) === i), ['기상하기', '출발할 시간'], '다시 알림은 꼭 울림 단계(기상 · 출발)만');
    c.eq(W.filter(a => a.series === 'r_rt_w_2026-11-02_s0').length, 7, '기상: 확인할 때까지(5분마다 6번), 중간 단계가 짧게 울려도 이어짐');
    const leave = W.find(a => a.id === 'r_rt_w_2026-11-02_leave');
    c.ok(leave && leave.ok === '다 했어요' && leave.ring === 'must', "출발의 확인 단추는 '다 했어요'");
    const s1 = W.find(a => a.id === 'r_rt_w_2026-11-02_s1');
    c.ok(s1 && s1.ring === 'short' && Array.isArray(s1.steps) && s1.rid === 'rt_w', '짧게 한 번도 단계표를 실어 알림창 진행 알림을 고친다');
    c.eq(s1 && s1.steps.map(x => x.r).join(''), 'msssssssm', '단계표의 세기(m 꼭 울림 · s 짧게 한 번)');
    c.eq(s1 && s1.steps[8].ok, '다 했어요', "단계표 출발에 '다 했어요'");
    c.eq(plan.filter(a => a.kind === 'rcheck' && a.id.includes('rt_w')).length, 0, '약 단계가 없는 루틴은 끝난 뒤 확인 알림 없음');
    // 기다리기: 시작할 때 소리 없는 자리 하나(진행 알림 · 위젯만), 끝나면 다음 단계가 짧게 한 번
    const H = mine('rt_h').filter(a => !/_r\d+$/.test(a.id)).map(a => [hmOf(a.at), a.title, a.lv]);
    c.eq(H, [['20:00', '빨래 돌리기', 'alarm'], ['20:05', '설거지', 'short'], ['20:20', '세탁 기다리기', 'silent'], ['20:50', '빨래 널기', 'short']], '세탁 기다리기: 소리 없는 자리, 끝나면 빨래 널기 짧게 한 번');
    const wt = mine('rt_h').find(a => a.lv === 'silent');
    c.ok(wt && wt.steps && wt.steps.map(x => x.r).join('') === 'msws' && wt.rid === 'rt_h', '기다리기도 단계표에(알림창 · 위젯이 지금 세탁 기다리기를 보임)');
    // 약 루틴: 지금처럼 확인(10분마다 6번 + 끝난 10분 뒤 확인 알림)
    const Mm = mine('rt_m');
    c.eq([Mm.length, Mm[0] && Mm[0].lv], [7, 'alarm'], '약 루틴: 꼭 울림 + 10분마다 6번');
    c.eq(plan.filter(a => a.kind === 'rcheck' && a.id === 'rc_rt_m_2026-11-02').map(a => hmOf(a.at)), ['12:10'], '약 루틴: 끝난 10분 뒤 확인 알림(지금처럼)');
    // 0분 단계: 같은 시각의 짧게 한 번은 따로 울리지 않음
    c.eq(mine('rt_b').filter(a => !/_r\d+$/.test(a.id)).map(a => [hmOf(a.at), a.title, a.lv]), [['21:30', '휴대폰 멀리 두기', 'alarm']], '같은 시각(0분 단계)이면 꼭 울림 하나만');
    // 아침 요약은 꼭 울림 알람(기상)에 붙는다
    c.ok(W.find(a => a.id === 'r_rt_w_2026-11-02_s0').report && !W.some(a => a.ring === 'short' && a.report), '아침 요약은 기상(꼭 울림) 알람을 확인한 뒤에');
    // 위젯 자료
    const wd = await p.evaluate(() => window.BX_widgetData(window.BX_alarmPlan(1)));
    const wr = wd.routines.find(r => r.rid === 'rt_h' && r.ds === '2026-11-02');
    c.ok(wr && wr.steps.map(x => x.r).join('') === 'msws' && wr.steps[2].n === '세탁 기다리기', '위젯 단계표: 세기 · 기다리기 단계까지');
    const ww = wd.routines.find(r => r.rid === 'rt_w' && r.ds === '2026-11-02');
    c.ok(ww && ww.steps[ww.steps.length - 1].ok === '다 했어요', "위젯 단계표: 출발 '다 했어요'");
    c.eq(wd.late, 0, '위젯 확인 필요 숫자에 루틴 단계를 세지 않음');
    c.eq(app.errors, [], '화면 오류(계산)');
  } finally { await app.close(); }

  // 울리는 방식 '조용히'면 짧게 한 번도 소리 없이 · 일정 출발 10분 전
  app = await openApp({ data: [['settings', settings({ bxLevels: { routine: 'quiet' } })], work('rt_w', DOC_STEPS)] });
  try {
    const plan = await app.page.evaluate(() => window.BX_alarmPlan(1));
    const W = plan.filter(a => a.id.startsWith('r_rt_w_2026-11-02_') && !/_r\d+$/.test(a.id));
    c.eq([W[0].lv, W[1].lv, W[W.length - 1].lv], ['quiet', 'silent', 'quiet'], "'조용히': 꼭 울림은 조용한 알림, 짧게 한 번은 소리 없이");
  } finally { await app.close(); }
  app = await openApp({ data: [['settings', settings()], work('rt_w', DOC_STEPS),
    ['it_a', { type: 'item', title: '회의', date: '2026-11-02', start: '08:30', travel: 30, createdAt: old, updatedAt: old }],
    ['it_b', { type: 'item', title: '치과', date: '2026-11-02', start: '15:00', travel: 20, createdAt: old, updatedAt: old }],
    startRt('rt_o', '외출 준비', '10:00', [['씻기', 20], ['옷 입기', 10], ['짐 챙기기', 5]], { on: false }),
    ['it_c', { type: 'item', title: '병원', date: '2026-11-02', start: '18:00', travel: 30, prep: 'rt_o', createdAt: old, updatedAt: old }]] });
  try {
    const plan = await app.page.evaluate(() => window.BX_alarmPlan(1));
    const of = id => plan.filter(a => a.id.startsWith('iv_' + id + '_')).map(a => [hmOf(a.at), a.title, a.lv]);
    c.eq(of('it_b'), [['14:30', '치과', 'short'], ['14:40', '출발할 시간', 'alarm']], '일정 출발: 10분 전은 짧게 한 번, 출발은 알람');
    c.eq(of('it_a'), [], '출근 루틴과 겹치는 일정 출발(7:50 출발 10분 전 · 8:00 출발): 루틴 알림 하나로');
    c.eq(of('it_c'), [['16:55', '씻기', 'alarm'], ['17:15', '옷 입기', 'short'], ['17:25', '짐 챙기기', 'short'], ['17:30', '출발할 시간', 'alarm']], '준비 루틴을 붙인 일정: 첫 단계 꼭 울림 · 중간 짧게 한 번 · 출발');
    c.eq((plan.find(a => a.id.startsWith('iv_it_c_leave')) || {}).ok, '다 했어요', "준비 루틴을 붙인 출발은 '다 했어요'");
    c.eq(app.errors, [], '화면 오류(일정 출발)');
  } finally { await app.close(); }

  // (5) 홈: 7:40까지 하나도 확인하지 않음
  app = await openApp({ now: '2026-11-02T07:40:00+09:00', data: [['settings', settings()], work('rt_w', DOC_STEPS)] });
  try {
    const p = app.page;
    await p.waitForTimeout(600);
    // 시험판 56(목록 줄 C): 홈 루틴 줄을 누르면 단계 창(전: 카드 '자세히'로 펼침)
    await p.click('#tcard2 .row[data-rid="rt_w"] .row-main'); await p.waitForTimeout(400);
    const h = await p.evaluate(() => {
      const card = document.querySelector('#sheet-root .rt-card[data-rid="rt_w"]');
      const tile = Array.from(document.querySelectorAll('.bx-sum-tile, [data-act="bx-late-open"]')).map(e => e.textContent.replace(/\s+/g, '')).join('|');
      const badge = document.getElementById('dock-badge');
      const lis = Array.from(card.querySelectorAll('.rt-steps li'));
      const t0 = card.querySelector('.rt-steps li .rt-t');
      return { miss: !!card.querySelector('.bx-miss-line'), tile, badge: badge ? !badge.hidden && badge.textContent.trim() : false,
        now: (card.querySelector('.rt-now b') || {}).textContent, left: (card.querySelector('.rt-now .rt-left') || {}).textContent,
        primary: !!card.querySelector('.rt-now .btn.primary'), late: !!card.querySelector('.rt-now.late'), btn: card.querySelector('.rt-now .chk.rt-chk[data-act="rt-done"]') ? '체크 칸' : (card.querySelector('.rt-now .btn') || {}).textContent,
        past: lis.filter(li => li.classList.contains('past')).map(li => li.querySelector('.rt-n').textContent.replace(/\d+분$/, '')),
        done: lis.filter(li => li.classList.contains('done')).length,
        oneLine: t0 ? t0.getBoundingClientRect().height < 26 : null, t0: t0 && t0.textContent };
    });
    c.eq([h.miss, h.badge], [false, false], '확인하지 않아도 홈 주의 줄 · 아래 메뉴 빨간 숫자 없음');
    c.ok(/확인필요0/.test(h.tile), "'확인 필요'에 루틴 단계를 세지 않음 " + h.tile);
    // 시험판 54(대표 11/4 22:46 '했어요 기다리기보다 그냥 체크 박스로'): '했어요' 단추 대신 체크 칸
    c.eq([h.now, h.left, h.primary, h.late, h.btn], ['식사', '오전 7:52까지 · 다음 출근 준비', false, false, '체크 칸'], "'지금'은 시각으로(식사), 끝 시각 · 다음 단계, 누르지 않아도 되는 체크 칸");
    c.eq(h.past, ['스트레칭', '이불 개기', '씻기', '머리 말리기', '옷 입기'], '지나간 짧게 한 번 단계는 흐리게(지운 줄 없이)');
    c.eq(h.done, 0, '확인한 단계가 없으면 지운 줄도 없음');
    c.ok(h.oneLine && h.t0 === '오전 7:00', "펼친 단계 목록의 시각 '오전 7:00'이 한 줄 " + JSON.stringify([h.t0, h.oneLine]));
    c.eq(app.errors, [], '화면 오류(홈)');
  } finally { await app.close(); }

  // (5) 중요한 단계(옛 루틴의 약 단계)는 확인(주의 줄 · 확인 필요 · 빨간 숫자)
  app = await openApp({ now: '2026-11-02T07:40:00+09:00', data: [['settings', settings()], work('rt_w', [['기상', 5], ['약 먹기', 5], ['씻고 옷 입기', 30], ['아침 먹기', 15], ['짐 챙기기', 5]])] });
  try {
    const p = app.page;
    await p.waitForTimeout(600);
    // 시험판 56(목록 줄 C): 홈 루틴 줄 둘째 줄이 주황 '했는지 확인 · 약 먹기', 주의 줄 · '했어요'는 줄을 누르면 나오는 단계 창(시험판 68 글)
    const row = await p.evaluate(() => { const s = document.querySelector('#tcard2 .row[data-rid="rt_w"] .rc-sub'); return s ? [s.textContent, s.classList.contains('warn')] : null; });
    c.eq(row, ['했는지 확인 · 약 먹기', true], "홈 루틴 줄 둘째 줄: 주황 '했는지 확인 · 약 먹기'(옛 루틴의 약 단계 = 중요한 단계)");
    await p.click('#tcard2 .row[data-rid="rt_w"] .row-main'); await p.waitForTimeout(500);
    const h = await p.evaluate(() => ({ line: (document.querySelector('#sheet-root .bx-miss-line span') || {}).textContent, btn: (document.querySelector('#sheet-root .bx-miss-line .btn') || {}).textContent,
      badge: (document.getElementById('dock-badge') || {}).textContent }));
    c.eq([h.line, h.btn, String(h.badge).trim()], ['했는지 확인하지 않은 단계 · 약 먹기', '했어요', '1'], '중요한 단계만 확인 필요(단계 창 주의 줄 · 빨간 숫자 1)');
    await p.click('#sheet-root .bx-miss-line .btn'); await p.waitForTimeout(500);
    const lg = await p.evaluate(() => (window.BX_T.docs().find(([k]) => k.startsWith('rl_rt_w_')) || [0, {}])[1]);
    c.ok(lg && lg.done && lg.done.s1 && !lg.done.s0, "'했어요'는 중요한 단계만 완료로");
    c.eq(app.errors, [], '화면 오류(약)');
  } finally { await app.close(); }

  // (6) 루틴 창: 단계마다 세 칸
  app = await openApp({ data: [['settings', settings()], work('rt_w', [['기상', 5], ['씻기', 15], ['세탁 기다리기', 30, 'wait'], ['옷 입기', 10]])] });
  try {
    const p = app.page;
    await p.click('.dock [data-view="routines"]'); await p.waitForTimeout(500);
    await p.click('[data-act="rt-edit"][data-rid="rt_w"]'); await p.waitForTimeout(600);
    const segs = () => p.evaluate(() => Array.from(document.querySelectorAll('#r-steps .bx-rs-ring')).map(g => (g.querySelector('[aria-pressed="true"]') || {}).dataset.rsRing));
    c.eq(await segs(), ['must', 'short', 'silent', 'short'], '세 칸 기본값: 첫 단계 꼭 울림 · 중간 짧게 한 번 · 기다리기 소리 없이');
    c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('#r-steps .bx-rs-ring')[0].querySelectorAll('button')).map(b => b.textContent)), ['꼭 울림', '짧게 한 번', '소리 없이'], '칸 이름');
    const lay = await p.evaluate(() => { const r = document.querySelector('#r-steps .rs-row'), y = s => Math.round(r.querySelector(s).getBoundingClientRect().top);
      return { nameMin: y('.rs-name') === y('.stepper') || Math.abs(y('.rs-name') - y('.stepper')) < 6, ringAct: Math.abs(y('.bx-rs-ring') - y('.rs-act')) < 8, two: y('.bx-rs-ring') > y('.stepper') }; });
    c.eq(lay, { nameMin: true, ringAct: true, two: true }, '단계 줄: 이름 · 분 / 세 칸 · 위로 · 지우기');
    await p.click('#r-steps [data-rs-ring="must"][data-i="3"]'); await p.waitForTimeout(150);
    await p.click('#r-steps [data-rs-ring="short"][data-i="2"]'); await p.waitForTimeout(150);
    await p.click('#r-steps [data-rs-ring="silent"][data-i="1"]'); await p.waitForTimeout(150);
    c.eq(await segs(), ['must', 'silent', 'short', 'must'], '누르면 그 칸으로');
    await p.click('[data-act="rs-add"]'); await p.waitForTimeout(200);
    await p.fill('#r-steps .rs-row:last-child .rs-name', '영양제'); await p.waitForTimeout(150);
    c.eq((await segs())[4], 'short', "새 단계 이름이 '영양제'여도 기본값은 짧게 한 번(시험판 68: 이름으로 정하지 않음)");
    // 좁은 휴대폰(360)에서도 세 칸 글자가 칸 안에
    await p.setViewportSize({ width: 360, height: 780 }); await p.waitForTimeout(300);
    c.ok(await p.evaluate(() => Array.from(document.querySelectorAll('#r-steps .bx-rs-ring button')).every(b => b.scrollWidth <= b.clientWidth + 1 && b.getBoundingClientRect().height < 44)), '360 너비에서도 세 칸 글자가 한 줄로 칸 안에');
    await p.click('[data-act="rt-save"]'); await p.waitForTimeout(500);
    const rt = await doc(p, 'rt_w');
    c.eq(rt.steps.map(s => [s.kind, s.ring || null]), [['do', null], ['wait', null], ['do', 'short'], ['do', 'must'], ['do', null]], '저장: 고른 세기만 남김(고르지 않은 단계는 기본값을 따름)');
    const plan = await p.evaluate(() => window.BX_alarmPlan(2).filter(a => a.id.startsWith('r_rt_w_2026-11-03_') && !/_r\d+$/.test(a.id)).map(a => [a.title, a.lv]));
    c.eq(plan, [['기상', 'alarm'], ['씻기', 'silent'], ['세탁 기다리기', 'short'], ['옷 입기', 'alarm'], ['영양제', 'short'], ['출발할 시간', 'alarm']], '고른 세기대로 울림');
    c.eq(app.errors, [], '화면 오류(루틴 창)');
  } finally { await app.close(); }

  // 앱을 열어 둔 동안의 화면 안 알림 카드: 꼭 울림 단계만(기상을 확인한 뒤 7:03 스트레칭에는 카드 없음)
  app = await openApp({ now: '2026-11-02T07:01:00+09:00', data: [['settings', settings()], work('rt_w', DOC_STEPS)] });
  try {
    const p = app.page;
    await p.waitForTimeout(800);
    c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('#alarms .alarm.rt .alarm-t')).map(e => e.textContent)), ['기상하기'], '7:01 기상(꼭 울림): 앱 안 알림 카드');
  } finally { await app.close(); }
  app = await openApp({ now: '2026-11-02T07:04:00+09:00', data: [['settings', settings()], work('rt_w', DOC_STEPS),
    ['rl_rt_w_20261102', { type: 'rlog', rid: 'rt_w', date: '2026-11-02', done: { s0: '2026-11-01T22:00:30.000Z' }, started: {}, extra: {}, skip: false, createdAt: old }]] });
  try {
    const p = app.page;
    await p.waitForTimeout(800);
    c.eq(await p.evaluate(() => document.querySelectorAll('#alarms .alarm.rt').length), 0, '7:04 스트레칭(짧게 한 번): 앱 안 알림 카드 없음');
    c.eq(await p.evaluate(() => (document.querySelector('#tcard2 .row[data-rid="rt_w"] .rc-sub') || {}).textContent), '지금 · 스트레칭', "기상을 확인하면 홈 루틴 줄 둘째 줄 '지금 · 스트레칭'");
    await p.click('#tcard2 .row[data-rid="rt_w"] .row-main'); await p.waitForTimeout(400);
    // 시험판 54(대표 11/4 22:46 ② 체크 칸): 확인한 단계는 체크 칸이 채워짐(상태 글자 칸은 없음 — 시각 '07:00'도 없음)
    c.eq(await p.evaluate(() => { const li = document.querySelector('#sheet-root .rt-card[data-rid="rt_w"] .rt-steps li.done'); return li ? [!!li.querySelector('.chk.rt-chk.on svg'), !li.querySelector('.rt-s'), /\d{2}:\d{2}/.test(li.textContent.replace(/오[전후] \d{1,2}:\d{2}/g, ''))] : null; }), [true, true, false], "확인한 단계는 체크만(24시간 시각 '07:00' 없이)");
    c.eq(app.errors, [], '화면 오류(앱 안 알림 카드)');
  } finally { await app.close(); }

  // 단추 글: '했어요'(시험판 68부터 '먹었어요'는 없음), 루틴 목록 글이 '오 / 전'으로 꺾이지 않음
  app = await openApp({ now: '2026-11-02T07:31:00+09:00', data: [['settings', settings()], startRt('rt_k', '외출', '07:30', [['약속 준비', 20], ['짐', 5]])] });
  try {
    const p = app.page;
    await p.waitForTimeout(500);
    // 홈 카드는 체크 칸(시험판 54), 확인 글은 앱 안 알림 카드 단추
    c.eq(await p.evaluate(() => (document.querySelector('#alarms .alarm.rt [data-alarm="rt-ok"]') || {}).textContent), '했어요', "'약속 준비'는 '했어요'");
    await p.click('#tcard2 .row[data-rid="rt_k"] .row-main'); await p.waitForTimeout(400);
    c.ok(await p.evaluate(() => !!document.querySelector('#sheet-root .rt-card[data-rid="rt_k"] .rt-steps li.cur .chk.rt-chk[data-act="rt-done"], #sheet-root .rt-card[data-rid="rt_k"] .rt-now .chk.rt-chk[data-act="rt-done"]')), "루틴 단계 창: 지금 단계는 '했어요' 단추 대신 체크 칸");
    await p.evaluate(() => window.BX_back && window.BX_back()); await p.waitForTimeout(300);
    await p.click('.dock [data-view="routines"]'); await p.waitForTimeout(500);
    c.eq(await p.evaluate(() => getComputedStyle(document.querySelector('.rt-item .rt-open > span')).wordBreak), 'keep-all', "루틴 목록 줄은 낱말 단위로 꺾임('오 / 전 9:00' 막기)");
    c.eq(app.errors, [], '화면 오류(단추 글)');
  } finally { await app.close(); }
  return c.done();
};
