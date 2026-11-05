// 계획 계산 시험: 시험표가 지금 규칙과 같은지(규칙을 바꾸고 시험표를 안 만들었으면 걸림) + 손으로 확인한 값
import { readFileSync } from 'node:fs';
import { plan, alarms, snoozeLeft, lateIfStartNow, lateIfLeaveNow, MIN } from '../web/js/planner.js';
export default function run(check) {
  const V = JSON.parse(readFileSync(new URL('../vectors/planner.json', import.meta.url), 'utf8')).vectors;
  const pick = e => ({ key: e.key, src: e.src, title: e.title, place: e.place, allDay: e.allDay, start: e.start, end: e.end, out: e.out, outWhy: e.outWhy, suggest: e.suggest,
    prep: e.prep, prepWhy: e.prepWhy, travel: e.travel, travelWhy: e.travelWhy, off: e.off, prepAt: e.prepAt, leaveAt: e.leaveAt, headsAt: e.headsAt, snoozed: e.snoozed, state: e.state,
    tight: e.tight ? { key: e.tight.key, minutes: e.tight.minutes } : null });
  for (const v of V) { const en = plan(v.input); check.eq(en.map(pick), v.expect.entries, '시험표 ' + v.name + ' · 항목'); check.eq(alarms(en, v.input), v.expect.alarms, '시험표 ' + v.name + ' · 알람'); }
  const KST = (h, m) => Date.UTC(2026, 10, 6, h - 9, m);
  const f = t => new Date(t + 9 * 3600e3).toISOString().slice(11, 16);
  const e0 = plan(V[0].input)[0];
  check.eq([f(e0.prepAt), f(e0.leaveAt), f(e0.headsAt)], ['13:50', '14:20', '14:10'], '3시 약속 · 이동 30 · 여유 10 · 준비 30');
  check.eq([snoozeLeft({ buffer: 10, snoozed: 0 }), snoozeLeft({ buffer: 10, snoozed: 5 }), snoozeLeft({ buffer: 10, snoozed: 8 }), snoozeLeft({ buffer: 10, snoozed: 9 }), snoozeLeft({ buffer: 10, snoozed: 10 })], [5, 3, 1, 1, 0], '미루기 간격이 줄어듦(대표 결정)');
  check.eq(lateIfStartNow(e0, KST(14, 7)), 10, '2:07에 시작하면 10분 늦음(7분 → 5분 단위 올림)');
  check.eq(lateIfLeaveNow(e0, KST(14, 25)), 0, '2:25에 나가면 안 늦음(여유 안)');
  check.eq(lateIfLeaveNow(e0, KST(14, 33)), 5, '2:33에 나가면 5분 늦음');
  const L = plan(V[6].input)[0]; check.eq([L.prep, L.prepWhy], [50, 'learned'], '42 · 50 · 47분 → 50분');
}
