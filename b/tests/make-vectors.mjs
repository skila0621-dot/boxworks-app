// 계획 계산 시험표(b/vectors/planner.json)를 만든다. 웹 기준 구현(web/js/planner.js)의 답을 적어 두고,
// 휴대폰 쪽 BPlanner.java가 같은 답을 내는지 BPlannerTest.java가 본다. 규칙을 바꾸면 이 파일을 다시 돌린다
import { writeFileSync } from 'node:fs';
import { plan, alarms, MIN, slack, snoozeLeft, departAt, eta, lateBy, shareText } from '../web/js/planner.js';
const KST = (y, mo, d, h = 0, mi = 0, sec = 0) => Date.UTC(y, mo - 1, d, h - 9, mi, sec);
const NOW = KST(2026, 11, 6, 10, 0);
const DAYS = [{ ymd: '2026-11-06', midnight: KST(2026, 11, 6) }, { ymd: '2026-11-07', midnight: KST(2026, 11, 7) }];
const ev = (id, h, m, title, location = '', extra = {}) => Object.assign({ id, begin: KST(2026, 11, 6, h, m), end: KST(2026, 11, 6, h + 1, m), title, location, allDay: false, calName: '내 캘린더' }, extra);
const base = (o = {}) => Object.assign({ now: NOW, days: DAYS, events: [], items: [], settings: {}, overrides: {}, places: {}, kw: {}, log: [] }, o);
const K = (e) => 'c:' + e.id + ':' + e.begin;
const E1 = ev('1', 15, 0, '치과', '강남역 3번 출구');
const S = [
  ['기본: 장소 있는 약속', base({ events: [E1] })],
  ['제목 낱말만: 묻기만 함', base({ events: [ev('2', 19, 0, '친구랑 저녁')] })],
  ['온라인 장소는 나가지 않음', base({ events: [ev('3', 11, 0, '팀 회의', 'Zoom https://zoom.us/j/1')] })],
  ['내가 정한 값', base({ events: [E1], overrides: { [K(E1)]: { out: true, prep: 45, travel: 20 } } })],
  ['장소별 이동 시간 기억', base({ events: [E1], places: { '강남역 3번 출구': 25 } })],
  ['같은 제목에 전에 정한 것', base({ events: [E1], kw: { '치과': false } })],
  ['실제 준비 시간 배우기(3번)', base({ events: [E1], log: [
    { key: 'p1', act: 'start', t: KST(2026, 11, 1, 9, 0) }, { key: 'p1', act: 'left', t: KST(2026, 11, 1, 9, 42) },
    { key: 'p2', act: 'start', t: KST(2026, 11, 2, 9, 0) }, { key: 'p2', act: 'left', t: KST(2026, 11, 2, 9, 50) },
    { key: 'p3', act: 'start', t: KST(2026, 11, 3, 9, 0) }, { key: 'p3', act: 'left', t: KST(2026, 11, 3, 9, 47) }] })],
  ['준비 중', base({ now: KST(2026, 11, 6, 14, 0), events: [E1], log: [{ key: K(E1), act: 'start', t: KST(2026, 11, 6, 13, 55) }] })],
  ['나감', base({ now: KST(2026, 11, 6, 14, 30), events: [E1], log: [{ key: K(E1), act: 'start', t: KST(2026, 11, 6, 13, 40) }, { key: K(E1), act: 'left', t: KST(2026, 11, 6, 14, 25) }] })],
  ['준비 시작을 5분 미룸', base({ now: KST(2026, 11, 6, 13, 41), events: [E1], log: [{ key: K(E1), act: 'rang', kind: 'prep', t: KST(2026, 11, 6, 13, 40) }, { key: K(E1), act: 'snooze', kind: 'prep', n: 5, t: KST(2026, 11, 6, 13, 40) }] })],
  ['빠듯함', base({ events: [ev('4', 13, 0, '점심 약속', '홍대입구역'), ev('5', 14, 30, '미팅', '강남역')] })],
  ['종일 일정은 맨 위 · 알람 없음', base({ events: [E1, { id: '6', begin: DAYS[0].midnight, end: DAYS[1].midnight, title: '엄마 생신', location: '', allDay: true, calName: '가족' }] })],
  ['이 앱에만 넣은 알림', base({ items: [{ id: 'x1', title: '약 먹기', at: KST(2026, 11, 6, 21, 0) }] })],
  ['이 앱에만 넣은 나가는 약속', base({ items: [{ id: 'x2', title: '택배 맡기기', at: KST(2026, 11, 6, 17, 0), out: true }] })],
  ['아침 요약: 내일만(오늘 8시는 지남)', base({ events: [E1, ev('7', 0, 0, '영화', '용산 CGV', { begin: KST(2026, 11, 7, 13, 0), end: KST(2026, 11, 7, 15, 0) })] })],
  ['아침 요약 건너뜀: 첫 준비 시작이 더 이름', base({ events: [ev('8', 0, 0, '출근', '회사', { begin: KST(2026, 11, 7, 8, 30), end: KST(2026, 11, 7, 18, 0) })] })],
  ['알람 끈 약속', base({ events: [E1], overrides: { [K(E1)]: { off: true } } })],
  ['이미 시작한 약속', base({ now: KST(2026, 11, 6, 15, 10), events: [E1] })],
  ['준비 시작이 지났는데 안 울림 → 곧바로', base({ now: KST(2026, 11, 6, 14, 0), events: [E1] })],
  ['준비 시작이 지났고 울렸음 → 출발만', base({ now: KST(2026, 11, 6, 14, 0), events: [E1], log: [{ key: K(E1), act: 'rang', kind: 'prep', t: KST(2026, 11, 6, 13, 50) }] })],
  ['출발을 3분 미룸(앞서 준비 5분)', base({ now: KST(2026, 11, 6, 14, 26), events: [E1], log: [
    { key: K(E1), act: 'rang', kind: 'prep', t: KST(2026, 11, 6, 13, 50) }, { key: K(E1), act: 'snooze', kind: 'prep', n: 5, t: KST(2026, 11, 6, 13, 50) },
    { key: K(E1), act: 'start', t: KST(2026, 11, 6, 13, 56) }, { key: K(E1), act: 'rang', kind: 'leave', t: KST(2026, 11, 6, 14, 25) }, { key: K(E1), act: 'snooze', kind: 'leave', n: 3, t: KST(2026, 11, 6, 14, 25) }] })],
  ['설정: 여유 0 · 미리 알림 끔 · 아침 요약 끔', base({ events: [E1], settings: { buffer: 0, heads: 0, morningOn: false } })],
  // 11/6 검토 반영: 미루기는 '누른 때 + N분'(늦게 눌러도 알람이 사라지지 않음)
  ['늦게 누른 미루기(13:56에 2분)', base({ now: KST(2026, 11, 6, 13, 56, 30), events: [E1], log: [{ key: K(E1), act: 'rang', kind: 'prep', t: KST(2026, 11, 6, 13, 50) }, { key: K(E1), act: 'rang', kind: 'prep', t: KST(2026, 11, 6, 13, 53) }, { key: K(E1), act: 'rang', kind: 'prep', t: KST(2026, 11, 6, 13, 56) }, { key: K(E1), act: 'snooze', kind: 'prep', n: 2, t: KST(2026, 11, 6, 13, 56, 20) }] })],
  ['늦게 시작 → 출발도 늦춤(최대 제시간 출발까지)', base({ now: KST(2026, 11, 6, 14, 5), events: [E1], log: [{ key: K(E1), act: 'rang', kind: 'prep', t: KST(2026, 11, 6, 13, 50) }, { key: K(E1), act: 'start', t: KST(2026, 11, 6, 14, 4) }] })],
  ['출발 단계 미루기(14:26에 2분)', base({ now: KST(2026, 11, 6, 14, 26, 30), events: [E1], log: [{ key: K(E1), act: 'start', t: KST(2026, 11, 6, 13, 50) }, { key: K(E1), act: 'rang', kind: 'leave', t: KST(2026, 11, 6, 14, 20) }, { key: K(E1), act: 'snooze', kind: 'leave', n: 2, t: KST(2026, 11, 6, 14, 26) }] })],
  ['되돌린 나갔어요는 배우지 않음', base({ events: [E1], log: [
    { key: 'q1', act: 'start', t: KST(2026, 11, 1, 9, 0) }, { key: 'q1', act: 'left', t: KST(2026, 11, 1, 9, 40) },
    { key: 'q2', act: 'start', t: KST(2026, 11, 2, 9, 0) }, { key: 'q2', act: 'left', t: KST(2026, 11, 2, 9, 50) },
    { key: 'q3', act: 'start', t: KST(2026, 11, 3, 9, 0) }, { key: 'q3', act: 'left', t: KST(2026, 11, 3, 9, 4) }, { key: 'q3', act: 'undo', kind: 'left', t: KST(2026, 11, 3, 9, 5) }, { key: 'q3', act: 'left', t: KST(2026, 11, 3, 9, 55) },
    { key: 'q4', act: 'start', t: KST(2026, 11, 4, 9, 0) }, { key: 'q4', act: 'undo', kind: 'start', t: KST(2026, 11, 4, 9, 1) }, { key: 'q4', act: 'left', t: KST(2026, 11, 4, 9, 30) }] })],
  ['장소 없는 제목에 답한 기억은 장소 있는 약속에 안 씀', base({ events: [ev('9', 19, 0, '친구랑 저녁', '홍대입구역 9번 출구')], kw: { '친구랑저녁': false } })],
  ['집은 나가는 약속 아님', base({ events: [ev('10', 18, 0, '가족 저녁', '집')] })],
  ['긴 일정(출근) 안의 약속은 빠듯함 아님', base({ events: [ev('11', 9, 0, '출근', '회사', { end: KST(2026, 11, 6, 18, 0) }), ev('12', 13, 0, '점심 약속', '홍대입구역')] })],
  ['이 앱 알림만 있는 날은 아침 요약 없음', base({ items: [{ id: 'x3', title: '약 먹기', at: KST(2026, 11, 7, 21, 0) }] })],
  ['시작 시각 없는 일정은 뺌', base({ events: [E1, { id: '13', begin: null, end: null, title: '이상한 일정', location: '어딘가', allDay: false }] })]
];
const pick = e => ({ key: e.key, src: e.src, title: e.title, place: e.place, allDay: e.allDay, start: e.start, end: e.end, out: e.out, outWhy: e.outWhy, suggest: e.suggest,
  prep: e.prep, prepWhy: e.prepWhy, travel: e.travel, travelWhy: e.travelWhy, off: e.off, prepAt: e.prepAt, leaveAt: e.leaveAt, headsAt: e.headsAt,
  latestLeave: e.latestLeave, bufferLeft: e.bufferLeft, remindAt: e.remindAt, snoozed: e.snoozed, state: e.state,
  tight: e.tight ? { key: e.tight.key, minutes: e.tight.minutes } : null });
// 알람 화면 계산(남은 여유 · 미루기 · 도착 예정 · 늦음 · 보낼 글). 글의 시각은 24시간(HH:MM)으로 적는다
const hm24 = ms => { const d = new Date(ms + 9 * 3600e3); return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); };
const H = [
  ['기본', 0, KST(2026, 11, 6, 13, 50), 'prep'], ['기본', 0, KST(2026, 11, 6, 13, 56), 'prep'], ['기본', 0, KST(2026, 11, 6, 14, 5), 'prep'], ['기본', 0, KST(2026, 11, 6, 14, 22), 'leave'],
  ['기본', 0, KST(2026, 11, 6, 14, 33), 'leave'], ['기본', 0, KST(2026, 11, 6, 14, 0), 'leave'], ['준비 중', 0, KST(2026, 11, 6, 14, 0), 'leave'], ['늦게 시작 → 출발도 늦춤(최대 제시간 출발까지)', 0, KST(2026, 11, 6, 14, 5), 'leave']
];
const vectors = S.map(([name, input]) => { const en = plan(input); return { name, input, expect: { entries: en.map(pick), alarms: alarms(en, input) } }; });
const helpers = H.map(([vname, idx, now, stage]) => {
  const v = vectors.find(x => x.name.startsWith(vname)); const e = plan(Object.assign({}, v.input, { now }))[idx];
  return { vector: v.name, index: idx, now, stage, expect: { slack: slack(e, now, stage), snoozeLeft: snoozeLeft(e, now, stage), departAt: departAt(e, now, stage), eta: eta(e, now, stage), lateBy: lateBy(e, now, stage), text: shareText(e, now, stage, hm24) } };
});
writeFileSync(new URL('../vectors/planner.json', import.meta.url), JSON.stringify({ note: '웹 기준 구현이 낸 답. 휴대폰 쪽도 같아야 한다. helpers의 input은 vectors[이름]의 input에 now만 바꾼 것', MIN, vectors, helpers }, null, 1));
console.log('vectors', vectors.length, 'helpers', helpers.length);
