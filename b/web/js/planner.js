// B 스케줄러 계획 계산(기준 구현). 휴대폰 쪽 BPlanner.java가 이 파일과 똑같이 계산해야 한다.
// 같은지는 b/vectors/planner.json 으로 두 쪽 모두 시험한다(웹: tests/planner.test.mjs, 휴대폰: BPlannerTest.java).
// 시각은 모두 밀리초(ms), 길이는 분. 날짜(자정)는 화면 · 휴대폰 쪽이 계산해 input.days로 넘긴다.
//
// 시각 모형(11/6 검토 반영):
//   leaveLatest = 시작 − 이동          제시간에 닿는 가장 늦은 출발
//   leave0      = leaveLatest − 여유   처음 정한 출발
//   prepAt0     = leave0 − 준비        처음 정한 준비 시작
//   미루기는 '누른 때 + N분'에 다시 울리고(처음 시각 + N이 아님), 출발은 그만큼 늦어지되 leaveLatest를 넘지 않는다.
//   미룰 수 있는 분 = 실제로 남은 여유(시작 − 이동 − 아직 남은 준비 − 지금)의 절반(대표 결정 11/6)

export const MIN = 60000;

// 제목에 있으면 '나가는 약속인가요?'로 묻는 낱말. 이것만으로 알람을 걸지는 않는다(대표 결정 11/6 '약속 판단은 사용자가 고를 때만')
export const OUT_WORDS = ['병원', '치과', '의원', '내과', '외과', '피부과', '안과', '이비인후과', '정형외과', '한의원', '약국', '검진',
  '면접', '미팅', '약속', '모임', '회식', '저녁', '점심', '브런치', '데이트', '결혼식', '돌잔치', '장례식', '미용실', '헤어', '네일',
  '학원', '수업', '레슨', '강의', '출근', '공항', '비행기', '기차', 'ktx', 'srt', '터미널', '영화', '공연', '콘서트', '전시',
  '여행', '헬스', '필라테스', '요가', '은행', '주민센터', '구청', '시청', '상담', '동창', '친구'];
// 장소가 이런 말이면 나가지 않는 일로 본다
export const ONLINE = /(zoom|줌|google ?meet|구글 ?미트|팀즈|teams|webex|온라인|화상|비대면|https?:\/\/|www\.|통화|전화)/i;
// 집에서 하는 일은 나가는 약속이 아니다
export const HOME = /^(집|우리 ?집|내 ?방|자택)$/;

export const DEFAULTS = {
  prepDefault: 30,   // 준비 시간 기본값(분) — 실제 기록이 3번 쌓이면 기록을 쓴다
  travelDefault: 30, // 이동 시간 기본값(분)
  buffer: 10,        // 도착 여유(분)
  heads: 10,         // 출발 몇 분 전 미리 알림(0이면 끔)
  holdEvery: 3,      // 대답이 없으면 몇 분 뒤 다시 울릴지
  holdMax: 3,        // 다시 울리는 최대 횟수
  morningOn: true, morningAt: '08:00',
  h24: false, calendars: null, writeCal: null, sound: 'alarm', remindOwn: true
};

export const ceil5 = m => Math.ceil(m / 5) * 5;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// 같은 제목을 알아보는 열쇠: 소문자, 빈칸 · 숫자 · 문장 부호 · 기호를 뺀다
export function normTitle(t) { return String(t || '').toLowerCase().replace(/[\s\d\p{P}\p{S}]+/gu, ''); }
// 같은 장소를 알아보는 열쇠: 앞뒤 빈칸을 빼고, 빈칸은 하나로, 소문자
export function normPlace(p) { return String(p || '').trim().replace(/\s+/g, ' ').toLowerCase(); }
const isOnline = p => ONLINE.test(String(p || ''));
const isRealPlace = p => { const n = normPlace(p); return !!n && !isOnline(p) && !HOME.test(n); };
// '나가는 약속인가요?'에 답한 기억의 열쇠. 장소가 있는 약속과 없는 약속은 따로 기억한다
// (장소 없는 '친구랑 저녁'에 '아니에요'라고 해도, 장소가 있는 '친구랑 저녁'은 그대로 챙긴다)
export function memKey(title, place) { const t = normTitle(title); return t ? t + (isRealPlace(place) ? '|p' : '') : ''; }

// 실제 준비 시간: '시작했어요' → '나갔어요' 사이(3~240분). 되돌린 누름은 뺀다. 최근 5번의 가운데 값을 5분 단위로 올림(10~120), 3번 이상일 때만 쓴다
export function learned(log) {
  const starts = new Map(), samples = [];
  const sorted = (log || []).slice().sort((a, b) => a.t - b.t);
  for (const e of sorted) {
    if (e.act === 'start') starts.set(e.key, e.t);
    else if (e.act === 'undo' && e.kind === 'start') starts.delete(e.key);
    else if (e.act === 'left' && starts.has(e.key)) {
      const s0 = starts.get(e.key), m = Math.round((e.t - s0) / MIN);
      if (m >= 3 && m <= 240) samples.push({ key: e.key, t: e.t, minutes: m, s0 });
      starts.delete(e.key);
    } else if (e.act === 'undo' && e.kind === 'left') {
      for (let i = samples.length - 1; i >= 0; i--) if (samples[i].key === e.key) { starts.set(e.key, samples[i].s0); samples.splice(i, 1); break; }
    }
  }
  const out = samples.map(x => ({ key: x.key, t: x.t, minutes: x.minutes }));
  const last = out.slice(-5);
  if (last.length < 3) return { prep: null, samples: out };
  const s = last.map(x => x.minutes).sort((a, b) => a - b);
  const med = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  return { prep: clamp(ceil5(med), 10, 120), samples: out };
}

// 약속 하나의 기록: 시작 · 나감 · 했음 · 미룬 분(단계별, 마지막 미룸) · 마지막으로 울린 때
function stateOf(key, log) {
  const r = { startedAt: null, leftAt: null, doneAt: null, lateAt: null, snPrep: 0, snLeave: 0, snRemind: 0, lastPrep: null, lastLeave: null, lastRemind: null, rangPrepAt: null, rangLeaveAt: null, rangRemindAt: null };
  const sorted = (log || []).filter(e => e.key === key).sort((a, b) => a.t - b.t);
  for (const e of sorted) {
    if (e.act === 'start') r.startedAt = e.t;
    else if (e.act === 'left') r.leftAt = e.t;
    else if (e.act === 'done') r.doneAt = e.t;
    else if (e.act === 'late') r.lateAt = e.t;
    else if (e.act === 'snooze') {
      const n = e.n || 0, sn = { t: e.t, n };
      if (e.kind === 'leave') { r.snLeave += n; r.lastLeave = sn; } else if (e.kind === 'remind') { r.snRemind += n; r.lastRemind = sn; } else { r.snPrep += n; r.lastPrep = sn; }
    } else if (e.act === 'rang') { if (e.kind === 'prep') r.rangPrepAt = e.t; else if (e.kind === 'leave') r.rangLeaveAt = e.t; else if (e.kind === 'remind') r.rangRemindAt = e.t; }
    else if (e.act === 'undo') { if (e.kind === 'start') r.startedAt = null; else if (e.kind === 'left') r.leftAt = null; else if (e.kind === 'done') r.doneAt = null; }
  }
  return r;
}

// 캘린더 약속 + 이 앱에만 넣은 것(캘린더 권한이 없을 때). 시작 시각이 없는 것은 뺀다
function sources(input) {
  const out = [];
  for (const ev of input.events || []) {
    if (!Number.isFinite(ev.begin)) continue;
    out.push({ key: 'c:' + ev.id + ':' + ev.begin, src: 'cal', title: ev.title || '', place: ev.location || '', start: ev.begin, end: Number.isFinite(ev.end) ? ev.end : null, allDay: !!ev.allDay, calName: ev.calName || '', explicitOut: null });
  }
  for (const it of input.items || []) {
    if (!Number.isFinite(it.at)) continue;
    out.push({ key: 'o:' + it.id, src: 'own', title: it.title || '', place: it.place || '', start: it.at, end: Number.isFinite(it.endAt) ? it.endAt : null, allDay: !!it.allDay, calName: '', explicitOut: typeof it.out === 'boolean' ? it.out : null });
  }
  return out;
}

export function plan(input) {
  const S = Object.assign({}, DEFAULTS, input.settings || {});
  const ov = input.overrides || {}, places = input.places || {}, kw = input.kw || {}, log = input.log || [], now = input.now;
  const L = learned(log);
  const list = sources(input).map(x => {
    const o = ov[x.key] || {};
    const pk = normPlace(x.place), mk = memKey(x.title, x.place);
    // 나가는 약속인지: 내가 정한 것 > 넣을 때 정한 것 > 같은 제목(같은 장소 유무)에 전에 정한 것 > 장소(온라인 · 집 아님) > (제목 낱말은 묻기만)
    let out = false, outWhy = 'none';
    if (x.allDay) outWhy = 'allday';
    else if (typeof o.out === 'boolean') { out = o.out; outWhy = 'user'; }
    else if (typeof x.explicitOut === 'boolean') { out = x.explicitOut; outWhy = 'user'; }
    else if (mk && typeof kw[mk] === 'boolean') { out = kw[mk]; outWhy = 'memory'; }
    else if (isRealPlace(x.place)) { out = true; outWhy = 'place'; }
    else if (!isOnline(x.place) && !HOME.test(pk) && OUT_WORDS.some(w => x.title.toLowerCase().includes(w))) outWhy = 'word';
    let prep = S.prepDefault, prepWhy = 'default';
    if (Number.isFinite(o.prep)) { prep = o.prep; prepWhy = 'user'; } else if (L.prep) { prep = L.prep; prepWhy = 'learned'; }
    let travel = S.travelDefault, travelWhy = 'default';
    if (Number.isFinite(o.travel)) { travel = o.travel; travelWhy = 'user'; } else if (pk && Number.isFinite(places[pk])) { travel = places[pk]; travelWhy = 'place'; }
    const st = stateOf(x.key, log);
    const e = {
      key: x.key, src: x.src, calName: x.calName, title: x.title, place: x.place, allDay: x.allDay, start: x.start, end: x.end,
      out, outWhy, suggest: outWhy === 'word', prep, prepWhy, travel, travelWhy, off: o.off === true, buffer: S.buffer,
      prepAt: null, leaveAt: null, headsAt: null, latestLeave: null, bufferLeft: null, remindAt: null,
      snoozed: st.snPrep + st.snLeave, snRemind: st.snRemind,
      startedAt: st.startedAt, leftAt: st.leftAt, doneAt: st.doneAt, lateAt: st.lateAt,
      rangPrepAt: st.rangPrepAt, rangLeaveAt: st.rangLeaveAt, rangRemindAt: st.rangRemindAt, state: 'idle', tight: null
    };
    if (out) {
      const latest = x.start - travel * MIN, leave0 = latest - S.buffer * MIN, prep0 = leave0 - prep * MIN;
      const nextPrep = st.lastPrep ? Math.max(prep0, st.lastPrep.t + st.lastPrep.n * MIN) : prep0;
      const expStart = st.startedAt != null ? st.startedAt : nextPrep;
      const planned = Math.max(leave0, Math.min(expStart + prep * MIN, latest));
      e.prepAt = st.startedAt != null ? st.startedAt : nextPrep;
      e.leaveAt = st.lastLeave ? Math.max(planned, st.lastLeave.t + st.lastLeave.n * MIN) : planned;
      e.latestLeave = latest;
      e.bufferLeft = Math.max(0, Math.round((latest - e.leaveAt) / MIN));
      if (S.heads > 0 && S.heads < prep) e.headsAt = e.leaveAt - S.heads * MIN;
    } else if (x.src === 'own') e.remindAt = st.lastRemind ? st.lastRemind.t + st.lastRemind.n * MIN : x.start;
    if (out && e.leftAt != null) e.state = 'left';
    else if (out && e.startedAt != null) e.state = 'prep';
    else if (!out && e.doneAt != null) e.state = 'done';
    else if (!x.allDay && now >= x.start) e.state = 'past';
    return e;
  }).sort((a, b) => (a.allDay === b.allDay ? 0 : a.allDay ? -1 : 1) || a.start - b.start || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  // 빠듯함: 앞 약속(나가는 약속, 4시간 이하, 다음 약속 전에 끝남)이 끝나기 전에 다음 약속 준비를 시작해야 하면. 끝 시각이 없으면 한 시간으로 본다.
  // 출근처럼 긴 일정 안의 약속은 '앞 약속'으로 보지 않는다
  const outs = list.filter(e => e.out && !e.off && !e.allDay);
  for (const b of outs) {
    let best = null;
    for (const a of outs) {
      if (a === b || !(a.start < b.start)) continue;
      const aEnd = a.end && a.end > a.start ? a.end : a.start + 60 * MIN;
      if (aEnd - a.start > 240 * MIN || aEnd > b.start || !(b.prepAt < aEnd)) continue;
      if (!best || aEnd > best.aEnd) best = { a, aEnd };
    }
    if (best) b.tight = { key: best.a.key, title: best.a.title, minutes: Math.round((best.aEnd - b.prepAt) / MIN) };
  }
  return list;
}

// 지금(now) 뒤에 울릴 알람. 그 단계 시각이 지났는데 그 시각 뒤로 한 번도 안 울렸으면 곧바로(5초 뒤) 울린다.
// 대답이 없을 때 다시 울리는 것(붙잡기)은 울린 뒤 휴대폰 쪽이 붙인다
export const SOON = 5000;
export function alarms(entries, input) {
  const S = Object.assign({}, DEFAULTS, input.settings || {});
  const now = input.now, out = [];
  const push = (kind, e, at, strong) => out.push({ id: kind + ':' + e.key, key: e.key, kind, at, strong });
  const due = (at, rangAt, until) => at > now ? at : (rangAt == null || rangAt < at) && now < until ? now + SOON : null;
  for (const e of entries) {
    if (e.off || e.allDay) continue;
    if (e.out) {
      if (e.state === 'left' || now >= e.start) continue;
      if (e.state === 'idle') { const a = due(e.prepAt, e.rangPrepAt, e.latestLeave); if (a != null) push('prep', e, a, true); }
      if (e.headsAt != null && e.headsAt > now) push('heads', e, e.headsAt, false);
      const l = due(e.leaveAt, e.rangLeaveAt, e.start); if (l != null) push('leave', e, l, true);
    } else if (e.src === 'own' && S.remindOwn && e.state !== 'done') {
      const a = due(e.remindAt, e.rangRemindAt, e.start + 30 * MIN); if (a != null) push('remind', e, a, true);
    }
  }
  // 아침 요약: 그날 나가는 약속이 있고, 그날 첫 준비 시작보다 이를 때만
  if (S.morningOn && /^\d{2}:\d{2}$/.test(S.morningAt || '')) {
    const hm = S.morningAt.split(':').map(Number);
    for (const day of input.days || []) {
      const at = day.midnight + (hm[0] * 60 + hm[1]) * MIN, end = day.midnight + 1440 * MIN;
      const outsDay = entries.filter(e => e.out && !e.off && !e.allDay && e.start >= day.midnight && e.start < end);
      if (!outsDay.length || at <= now + 1000) continue;
      const firstPrep = Math.min(...outsDay.map(e => e.prepAt));
      if (at < firstPrep) out.push({ id: 'morning:' + day.ymd, key: 'day:' + day.ymd, kind: 'morning', at, strong: false });
    }
  }
  return out.sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

// ---------- 알람 화면 · 오늘 화면이 같이 쓰는 계산(휴대폰 쪽도 같게). stage: 'prep'(아직 준비 시작 전) | 'leave'(준비했거나 나갈 때)
// 실제로 남은 여유(분): 이만큼 더 미뤄도 제시간에 닿는다
export function slack(e, now, stage) { return Math.floor((e.start - e.travel * MIN - (stage === 'prep' ? e.prep * MIN : 0) - now) / MIN); }
// 미루기: 남은 여유의 절반(올림)씩이라 미룰수록 간격이 준다(10 → 5, 5 → 3, 2 → 1분). 여유가 없으면 0 = 미루기를 내지 않고
// '지금 시작 · 늦는다고 알리기'만 낸다(대표 결정 11/6)
export function snoozeLeft(e, now, stage) { const r = slack(e, now, stage); return r >= 2 ? Math.ceil(r / 2) : r >= 1 ? 1 : 0; }
// 도착 예정: 준비 전이면 지금부터 준비를 다 하고(출발 시각보다 이르진 않게), 준비했으면 출발 시각(지났으면 지금)에 나간다고 본다
export function departAt(e, now, stage) { return stage === 'prep' ? Math.max(e.leaveAt, now + e.prep * MIN) : Math.max(e.leaveAt, now); }
export function eta(e, now, stage) { return departAt(e, now, stage) + e.travel * MIN; }
export function lateBy(e, now, stage) { const m = (eta(e, now, stage) - e.start) / MIN; return m > 0 ? ceil5(m) : 0; }
// '늦는다고 알리기' · '도착 시각 알리기' 글(hm = 시각 글 함수). 늦으면 늦는 분과 도착 시각, 아니면 출발 · 도착 시각
export function shareText(e, now, stage, hm) {
  const late = lateBy(e, now, stage), a = eta(e, now, stage), dep = a - e.travel * MIN;
  if (late > 0) return '미안해요, ' + late + '분쯤 늦을 것 같아요. ' + hm(e.start + late * MIN) + '쯤 도착해요.';
  if (dep <= now + MIN) return '지금 출발해요. ' + hm(a) + '쯤 도착해요.';
  return hm(dep) + '에 출발해서 ' + hm(a) + '쯤 도착해요.';
}
