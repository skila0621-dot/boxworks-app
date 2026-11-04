// 알람 계산(BX_alarmPlan): 휴대폰에 거는 알람 목록이 정한 대로 나오는지.
// 기준 시각 2026-11-02(월) 06:50. 루틴 '아침 준비' 07:30 시작(일어나기 5 · 씻기 15 · 옷 입기 10 · 가방 챙기기 5분, 5분마다 6번 다시 알림)
// 시험판 52(D-25): 첫 단계만 꼭 울림(다시 알림), 나머지는 짧게 한 번. 확인 안 한 단계 알림(rcheck)은 약 단계에만 — 자세한 것은 v52.test.cjs
const { openApp, settings, checker, NOW, ymdOf, hmOf } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
const routine = (id, name, target, steps, extra = {}) => [id, Object.assign({ type: 'routine', name, days: [0, 1, 2, 3, 4, 5, 6], mode: 'start', target, times: 6, every: 5, on: true,
  steps: steps.map(([n, m], i) => ({ id: id + '_' + i, name: n, min: m })), createdAt: old, updatedAt: old }, extra)];

function baseData() {
  return [
    ['settings', settings()],
    routine('rt_m', '아침 준비', '07:30', [['일어나기', 5], ['씻기', 15], ['옷 입기', 10], ['가방 챙기기', 5]]),
    ['it_1', { type: 'item', title: '치과', date: '2026-11-02', start: '15:00', remind: '10', createdAt: old, updatedAt: old }],
    ['it_2', { type: 'item', title: '보고서', date: '2026-11-03', start: '10:00', remind: '10', createdAt: old, updatedAt: old }],
    ['tt_a', { type: 'tt', name: '경영학원론', days: [1, 3], start: '10:30', end: '12:00', place: '301호', remind: '10', on: true, createdAt: old, updatedAt: old }]
  ];
}

module.exports = async function () {
  const c = checker('알람 계산');
  const nowMs = Date.parse(NOW);
  let app = await openApp({ data: baseData() });
  try {
    const plan = await app.page.evaluate(() => window.BX_alarmPlan(14));
    const at = (day, hm) => Date.parse(day + 'T' + hm + ':00+09:00');
    const find = (day, hm, pred = () => true) => plan.filter(a => a.at === at(day, hm) && pred(a));

    c.ok(Array.isArray(plan) && plan.length > 0, '알람 목록이 비어 있음');
    c.ok(plan.every((a, i) => i === 0 || plan[i - 1].at <= a.at), '시각 순서가 아님');
    c.eq(new Set(plan.map(a => a.id)).size, plan.length, '알람 id가 겹치지 않음');
    c.ok(plan.every(a => a.at > nowMs), '지난 시각의 알람이 들어 있음');
    c.ok(plan.length <= 205, '휴대폰에 거는 알람이 너무 많음: ' + plan.length);

    // 루틴 단계: 첫 단계는 꼭 울림(다시 알림은 다음 꼭 울림 단계 전까지, 없으면 6번 다), 중간 · 마지막 단계는 짧게 한 번
    c.eq(find('2026-11-02', '07:30', a => a.kind === 'routine').map(a => a.title), ['일어나기'], '07:30 첫 단계');
    c.eq(find('2026-11-02', '07:30')[0] && find('2026-11-02', '07:30')[0].lv, 'alarm', '첫 단계는 알람 세기');
    const wake = plan.filter(a => a.series && a.series === (find('2026-11-02', '07:30')[0] || {}).series).map(a => hmOf(a.at));
    c.eq(wake, ['07:30', '07:35', '07:40', '07:45', '07:50', '07:55', '08:00'], '일어나기: 07:30 + 다시 알림 6번(짧게 한 번 단계가 끼어 있어도)');
    const wash = plan.filter(a => a.series && a.series === (find('2026-11-02', '07:35', x => x.title === '씻기')[0] || {}).series);
    c.eq(wash.map(a => [hmOf(a.at), a.lv]), [['07:35', 'short']], '씻기: 짧게 한 번, 다시 알림 없음');
    const last = plan.filter(a => a.series && a.series === (find('2026-11-02', '08:00', x => x.title === '가방 챙기기')[0] || {}).series);
    c.eq(last.length, 1, '마지막 단계도 짧게 한 번');
    c.eq(find('2026-11-02', '08:15', a => a.kind === 'rcheck').length, 0, '약 단계가 없으면 루틴 끝 확인 알림 없음');

    // 시간표와 일정
    c.eq(find('2026-11-02', '10:20', a => a.group === '시간표').map(a => a.title), ['경영학원론'], '수업 10분 전');
    const dent = find('2026-11-02', '14:50', a => a.title === '치과');
    c.eq(dent.length, 1, '치과 10분 전 알림');
    c.eq(dent[0] && dent[0].lv, 'notice', '일정은 알림 세기(D-09)');

    // 계획 기간: 첫 알람은 14일 동안, 다시 알림은 앞 7일까지만
    const firsts = plan.filter(a => a.kind === 'routine' && a.title === '일어나기' && !/_r\d+$/.test(a.id)).map(a => ymdOf(a.at));
    c.eq(firsts.length, 14, '일어나기 알람이 14일 치');
    const reps = plan.filter(a => /_r\d+$/.test(a.id));
    c.ok(reps.length > 0 && reps.every(a => a.at <= nowMs + 7 * 864e5), '다시 알림은 앞 7일까지만');

    // 앱을 오래 열지 않을 때: 마지막 알람 하루 전에 '알람이 곧 끝나요'
    const renew = plan.filter(a => a.id === 'bx_renew');
    c.eq(renew.length, 1, "'알람이 곧 끝나요' 알림 하나");
    if (renew[0]) {
      const until = nowMs + 14 * 864e5;
      c.ok(renew[0].at <= until - 12 * 3600e3 && renew[0].at >= until - 48 * 3600e3, "'알람이 곧 끝나요'는 계획이 끝나기 전날");
      c.eq(hmOf(renew[0].at), '12:00', "'알람이 곧 끝나요'는 낮 12시");
      c.eq(renew[0].lv, 'notice', "'알람이 곧 끝나요'는 알림 세기");
      c.ok(/앱을 한 번 열어/.test(renew[0].body || '') , "'알람이 곧 끝나요' 글에 할 일");
    }
    c.eq(app.errors, [], '화면 오류');
  } finally {
    await app.close();
  }

  // 알람이 많아 200개에서 잘릴 때: '곧 끝나요'는 잘린 곳보다 앞에 온다
  const heavy = baseData();
  for (let k = 0; k < 4; k++) heavy.push(routine('rt_h' + k, '루틴 ' + k, String(9 + k).padStart(2, '0') + ':00', [['하나', 5], ['둘', 5], ['셋', 5], ['넷', 5]]));
  app = await openApp({ data: heavy });
  try {
    const plan = await app.page.evaluate(() => window.BX_alarmPlan(14));
    const firsts = plan.filter(a => a.id !== 'bx_renew' && !/_r\d+$/.test(a.id));
    c.ok(firsts.length <= 200, '알람이 많을 때도 200개 안');
    const renew = plan.find(a => a.id === 'bx_renew');
    c.ok(!!renew && renew.at < Math.max(...firsts.map(a => a.at)), "잘렸을 때 '곧 끝나요'가 마지막 알람보다 앞");
    c.eq(app.errors, [], '화면 오류(알람이 많을 때)');
  } finally {
    await app.close();
  }
  return c.done();
};
