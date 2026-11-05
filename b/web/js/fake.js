// 휴대폰 쪽(Capacitor.Plugins.B)을 흉내 낸다 — 브라우저 미리 보기와 자동 시험용. 모양은 SPEC.md 7절과 같다.
// 시험은 window.__B_SCENARIO = {now, events, log, settings, overrides, perms, lastOpen, firstRun, calendars, shared, speech}로 상황을 넣는다
import { plan as planCore, DEFAULTS, learned, MIN } from './planner.js';

export function makeFake(sc = {}) {
  const fixedNow = typeof sc.now === 'number' ? sc.now : null;
  const now = () => fixedNow != null ? fixedNow : Date.now();
  const day0 = (() => { const d = new Date(now()); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); })();
  const at = (dayOff, h, m = 0) => day0 + dayOff * 1440 * MIN + (h * 60 + m) * MIN;
  const S = {
    settings: Object.assign({}, DEFAULTS, sc.settings || {}),
    overrides: sc.overrides || {}, places: sc.places || {}, kw: sc.kw || {}, items: sc.items || [], log: sc.log || [],
    perms: Object.assign({ notif: 'ok', exact: 'ok', fullscreen: 'ok', battery: 'ok', calendar: 'ok', mic: 'ok' }, sc.perms || {}),
    calendars: sc.calendars || [{ id: '1', name: '내 캘린더', account: 'Samsung', color: '#3b6df0', writable: true, visible: true }, { id: '2', name: '가족', account: 'Google', color: '#1f9d6b', writable: true, visible: true }],
    lastOpen: sc.lastOpen === undefined ? now() - 3600e3 : sc.lastOpen, firstRun: !!sc.firstRun, shared: sc.shared || null
  };
  let events = sc.events || [
    { id: '101', begin: at(0, 11), end: at(0, 12), title: '팀 회의', location: 'Zoom', allDay: false, calId: '1', calName: '내 캘린더' },
    { id: '102', begin: at(0, 15), end: at(0, 16), title: '치과', location: '강남역 3번 출구', allDay: false, calId: '1', calName: '내 캘린더' },
    { id: '103', begin: at(0, 19), end: at(0, 21), title: '친구랑 저녁', location: '', allDay: false, calId: '1', calName: '내 캘린더' },
    { id: '104', begin: at(1, 0), end: at(2, 0), title: '엄마 생신', location: '', allDay: true, calId: '2', calName: '가족' },
    { id: '105', begin: at(1, 13), end: at(1, 15), title: '영화', location: '용산 CGV', allDay: false, calId: '1', calName: '내 캘린더' }
  ];
  const ls = { changed: [], speech: [] };
  const emit = (n, d) => (ls[n] || []).forEach(f => f(d));
  const visibleEvents = () => events.filter(e => !S.settings.calendars || S.settings.calendars.includes(e.calId));
  const days = () => [0, 1, 2].map(k => { const m = at(k, 0); const d = new Date(m); return { ymd: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'), midnight: m }; });
  const input = (from, to) => ({ now: now(), days: days(), events: visibleEvents().filter(e => e.end > from - 12 * 3600e3 && e.begin < to), items: S.items, settings: S.settings, overrides: S.overrides, places: S.places, kw: S.kw, log: S.log });
  const api = {
    __S: S, __events: () => events, __sharedOut: [],
    async state() { return { settings: S.settings, overrides: S.overrides, places: S.places, kw: S.kw, items: S.items, learned: learned(S.log), perms: S.perms, calendars: S.calendars, lastOpen: S.lastOpen, now: now(), trial: 1, firstRun: S.firstRun }; },
    async plan({ from, to }) {
      const ents = planCore(input(from, to)).filter(e => e.end ? e.end > from && e.start < to : e.start >= from && e.start < to);
      const byId = new Map(events.map(e => [String(e.id), e]));
      ents.forEach(e => { if (e.src === 'cal') { const id = e.key.split(':')[1]; const ev = byId.get(id); e.calId = ev ? ev.calId : null; e.eventId = id; } });
      return { now: now(), entries: ents };
    },
    async save(p) { for (const k of ['settings', 'overrides', 'places', 'kw', 'items']) if (p[k] !== undefined) S[k] = p[k]; if (p.firstRunDone) S.firstRun = false; return { ok: true, scheduled: 0 }; },
    async act({ key, act, kind, n }) {
      S.log.push({ key, act, kind, n, t: now() });
      if (act === 'off') S.overrides[key] = Object.assign({}, S.overrides[key], { off: true });
      emit('changed', { reason: act }); return { ok: true };
    },
    async addEvent({ title, begin, end, location, calendarId }) {
      if (S.perms.calendar !== 'ok') throw Object.assign(new Error('no_calendar'), { code: 'no_calendar' });
      const id = String(200 + events.length); const cal = S.calendars.find(c => c.id === (calendarId || S.settings.writeCal)) || S.calendars[0];
      events.push({ id, begin, end, title, location: location || '', allDay: false, calId: cal.id, calName: cal.name });
      return { ok: true, id, calendarId: cal.id };
    },
    async openEvent() { return { ok: true }; },
    async perms() { return S.perms; },
    async fix({ kind }) { S.perms[kind] = 'ok'; return { kind, state: 'ok' }; },
    async test() { return { ok: true }; },
    async share({ text }) { api.__sharedOut.push(text); return { ok: true }; },
    async shared() { const t = S.shared; S.shared = null; return { text: t }; },
    async listen() { const t = sc.speech || ''; setTimeout(() => emit('speech', { text: t.slice(0, Math.ceil(t.length / 2)), final: false }), 150); setTimeout(() => emit('speech', { text: t, final: true }), 350); return { ok: true }; },
    async stopListen() { return { ok: true }; },
    async opened() { const prev = S.lastOpen; S.lastOpen = now(); return { prev }; },
    async stats({ days: n = 7 } = {}) {
      const since = now() - n * 864e5, L = S.log.filter(e => e.t >= since);
      const rang = L.filter(e => e.act === 'rang' && e.kind === 'prep');
      const gaps = rang.map(r => { const s = L.find(e => e.key === r.key && e.act === 'start' && e.t >= r.t); return s ? Math.round((s.t - r.t) / MIN) : null; }).filter(v => v != null).sort((a, b) => a - b);
      const med = gaps.length ? gaps[Math.floor(gaps.length / 2)] : null;
      return { rang: rang.length, started: L.filter(e => e.act === 'start').length, prepToStart: { median: med, n: gaps.length }, snoozes: L.filter(e => e.act === 'snooze').length, late: { count: L.filter(e => e.act === 'late').length, leadMedian: null }, left: { onTime: 0, late: 0 } };
    },
    addListener(name, fn) { (ls[name] = ls[name] || []).push(fn); return Promise.resolve({ remove() { ls[name] = ls[name].filter(f => f !== fn); } }); }
  };
  return api;
}
