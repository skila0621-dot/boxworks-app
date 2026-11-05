// 계획 계산 시험표(b/vectors/planner.json)를 만든다. 웹 기준 구현(web/js/planner.js)의 답을 적어 두고,
// 휴대폰 쪽 BPlanner.java가 같은 답을 내는지 BPlannerTest.java가 본다. 규칙을 바꾸면 이 파일을 다시 돌린다
import { writeFileSync } from 'node:fs';
import { plan, alarms, MIN } from '../web/js/planner.js';
const KST = (y, mo, d, h = 0, mi = 0) => Date.UTC(y, mo - 1, d, h - 9, mi);
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
  ['설정: 여유 0 · 미리 알림 끔 · 아침 요약 끔', base({ events: [E1], settings: { buffer: 0, heads: 0, morningOn: false } })]
];
const pick = e => ({ key: e.key, src: e.src, title: e.title, place: e.place, allDay: e.allDay, start: e.start, end: e.end, out: e.out, outWhy: e.outWhy, suggest: e.suggest,
  prep: e.prep, prepWhy: e.prepWhy, travel: e.travel, travelWhy: e.travelWhy, off: e.off, prepAt: e.prepAt, leaveAt: e.leaveAt, headsAt: e.headsAt, snoozed: e.snoozed, state: e.state,
  tight: e.tight ? { key: e.tight.key, minutes: e.tight.minutes } : null });
const vectors = S.map(([name, input]) => { const en = plan(input); return { name, input, expect: { entries: en.map(pick), alarms: alarms(en, input) } }; });
writeFileSync(new URL('../vectors/planner.json', import.meta.url), JSON.stringify({ note: '웹 기준 구현이 낸 답. 휴대폰 쪽도 같아야 한다', MIN, vectors }, null, 1));
console.log('vectors', vectors.length);
