// 계획 계산 시험: 시험표가 지금 규칙과 같은지(규칙을 바꾸고 시험표를 안 만들었으면 걸림) + 손으로 확인한 값
import { readFileSync } from 'node:fs';
import { plan, alarms, snoozeLeft, slack, departAt, eta, lateBy, shareText, MIN } from '../web/js/planner.js';
export default function run(check) {
  const V = JSON.parse(readFileSync(new URL('../vectors/planner.json', import.meta.url), 'utf8')).vectors;
  const pick = e => ({ key: e.key, src: e.src, title: e.title, place: e.place, allDay: e.allDay, start: e.start, end: e.end, out: e.out, outWhy: e.outWhy, suggest: e.suggest,
    prep: e.prep, prepWhy: e.prepWhy, travel: e.travel, travelWhy: e.travelWhy, off: e.off, prepAt: e.prepAt, leaveAt: e.leaveAt, headsAt: e.headsAt,
    latestLeave: e.latestLeave, bufferLeft: e.bufferLeft, remindAt: e.remindAt, snoozed: e.snoozed, state: e.state,
    tight: e.tight ? { key: e.tight.key, minutes: e.tight.minutes } : null });
  for (const v of V) { const en = plan(v.input); check.eq(en.map(pick), v.expect.entries, '시험표 ' + v.name + ' · 항목'); check.eq(alarms(en, v.input), v.expect.alarms, '시험표 ' + v.name + ' · 알람'); }
  const KST = (h, m) => Date.UTC(2026, 10, 6, h - 9, m);
  const f = t => new Date(t + 9 * 3600e3).toISOString().slice(11, 16);
  const e0 = plan(V[0].input)[0];
  check.eq([f(e0.prepAt), f(e0.leaveAt), f(e0.headsAt)], ['13:50', '14:20', '14:10'], '3시 약속 · 이동 30 · 여유 10 · 준비 30');
  check.eq([snoozeLeft(e0, KST(13, 50), 'prep'), snoozeLeft(e0, KST(13, 56), 'prep'), snoozeLeft(e0, KST(13, 58), 'prep'), snoozeLeft(e0, KST(13, 59), 'prep'), snoozeLeft(e0, KST(14, 0), 'prep')], [5, 2, 1, 1, 0], '미루기 간격이 실제 남은 여유에 따라 줄어듦(대표 결정)');
  check.eq(lateBy(e0, KST(14, 7), 'prep'), 10, '2:07에 시작하면 10분 늦음(7분 → 5분 단위 올림)');
  check.eq(lateBy(e0, KST(14, 25), 'leave'), 0, '2:25에 나가면 안 늦음(여유 안)');
  check.eq(lateBy(e0, KST(14, 33), 'leave'), 5, '2:33에 나가면 5분 늦음');
  const hm24 = ms => { const d = new Date(ms + 9 * 3600e3); return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); };
  const H = JSON.parse(readFileSync(new URL('../vectors/planner.json', import.meta.url), 'utf8')).helpers;
  for (const h of H) { const v = V.find(x => x.name === h.vector); const e = plan(Object.assign({}, v.input, { now: h.now }))[h.index];
    check.eq({ slack: slack(e, h.now, h.stage), snoozeLeft: snoozeLeft(e, h.now, h.stage), departAt: departAt(e, h.now, h.stage), eta: eta(e, h.now, h.stage), lateBy: lateBy(e, h.now, h.stage), text: shareText(e, h.now, h.stage, hm24) }, h.expect, '알람 화면 계산 ' + h.vector + ' ' + hm24(h.now) + ' ' + h.stage); }
  check.eq(shareText(e0, KST(14, 5), 'prep', hm24), '미안해요, 5분쯤 늦을 것 같아요. 15:05쯤 도착해요.', '늦을 때 글');
  const L = plan(V[6].input)[0]; check.eq([L.prep, L.prepWhy], [50, 'learned'], '42 · 50 · 47분 → 50분');
}
