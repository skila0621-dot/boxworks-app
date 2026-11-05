// B 스케줄러 계획 계산(기준 구현). 휴대폰 쪽 BPlanner.java가 이 파일과 똑같이 계산해야 한다.
// 같은지는 b/vectors/planner.json 으로 두 쪽 모두 시험한다(웹: tests/planner.test.mjs, 휴대폰: BPlannerTest.java).
// 시각은 모두 밀리초(ms), 길이는 분. 날짜(자정)는 화면 · 휴대폰 쪽이 계산해 input.days로 넘긴다.

export const MIN = 60000;

// 제목에 있으면 '나가는 약속인가요?'로 묻는 낱말. 이것만으로 알람을 걸지는 않는다(대표 결정 11/6 '약속 판단은 사용자가 고를 때만')
export const OUT_WORDS = ['병원', '치과', '의원', '내과', '외과', '피부과', '안과', '이비인후과', '정형외과', '한의원', '약국', '검진',
  '면접', '미팅', '약속', '모임', '회식', '저녁', '점심', '브런치', '데이트', '결혼식', '돌잔치', '장례식', '미용실', '헤어', '네일',
  '학원', '수업', '레슨', '강의', '출근', '공항', '비행기', '기차', 'ktx', 'srt', '터미널', '영화', '공연', '콘서트', '전시',
  '여행', '헬스', '필라테스', '요가', '은행', '주민센터', '구청', '시청', '상담', '동창', '친구'];
// 장소가 이런 말이면 나가지 않는 일로 본다
export const ONLINE = /(zoom|줌|google ?meet|구글 ?미트|팀즈|teams|webex|온라인|화상|비대면|https?:\/\/|www\.|통화|전화)/i;

export const DEFAULTS = {
  prepDefault: 30,   // 준비 시간 기본값(분) — 실제 기록이 3번 쌓이면 기록을 쓴다
  travelDefault: 30, // 이동 시간 기본값(분)
  buffer: 10,        // 도착 여유(분). 미루기는 이 여유 안에서만 되고, 남은 여유가 줄수록 미루는 간격도 준다(대표 결정 11/6)
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

// 실제 준비 시간: '시작했어요' → '나갔어요' 사이(3~240분). 최근 5번의 가운데 값을 5분 단위로 올림(10~120), 3번 이상일 때만 쓴다
export function learned(log) {
  const starts = new Map(), samples = [];
  const sorted = (log || []).slice().sort((a, b) => a.t - b.t);
  for (const e of sorted) {
    if (e.act === 'start') starts.set(e.key, e.t);
    else if (e.act === 'left' && starts.has(e.key)) {
      const m = Math.round((e.t - starts.get(e.key)) / MIN);
      if (m >= 3 && m <= 240) samples.push({ key: e.key, t: e.t, minutes: m });
      starts.delete(e.key);
    }
  }
  const last = samples.slice(-5);
  if (last.length < 3) return { prep: null, samples };
  const s = last.map(x => x.minutes).sort((a, b) => a - b);
  const med = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  return { prep: clamp(ceil5(med), 10, 120), samples };
}

// 약속 하나의 기록: 시작 · 나감 · 했음 · 미룬 분(단계별) · 울렸는지
function stateOf(key, log) {
  const r = { startedAt: null, leftAt: null, doneAt: null, lateAt: null, snPrep: 0, snLeave: 0, snRemind: 0, rangPrep: false, rangLeave: false, rangRemind: false };
  for (const e of log || []) {
    if (e.key !== key) continue;
    if (e.act === 'start') r.startedAt = Math.max(r.startedAt || 0, e.t);
    else if (e.act === 'left') r.leftAt = Math.max(r.leftAt || 0, e.t);
    else if (e.act === 'done') r.doneAt = Math.max(r.doneAt || 0, e.t);
    else if (e.act === 'late') r.lateAt = Math.max(r.lateAt || 0, e.t);
    else if (e.act === 'snooze') { const n = e.n || 0; if (e.kind === 'leave') r.snLeave += n; else if (e.kind === 'remind') r.snRemind += n; else r.snPrep += n; }
    else if (e.act === 'rang') { if (e.kind === 'prep') r.rangPrep = true; else if (e.kind === 'leave') r.rangLeave = true; else if (e.kind === 'remind') r.rangRemind = true; }
    else if (e.act === 'undo') { if (e.kind === 'start') r.startedAt = null; else if (e.kind === 'left') r.leftAt = null; else if (e.kind === 'done') r.doneAt = null; }
  }
  return r;
}

// 캘린더 약속 + 이 앱에만 넣은 것(캘린더 권한이 없을 때)
function sources(input) {
  const out = [];
  for (const ev of input.events || []) {
    out.push({ key: 'c:' + ev.id + ':' + ev.begin, src: 'cal', title: ev.title || '', place: ev.location || '', start: ev.begin, end: ev.end || null, allDay: !!ev.allDay, calName: ev.calName || '', explicitOut: null });
  }
  for (const it of input.items || []) {
    if (typeof it.at !== 'number') continue;
    out.push({ key: 'o:' + it.id, src: 'own', title: it.title || '', place: it.place || '', start: it.at, end: it.endAt || null, allDay: !!it.allDay, calName: '', explicitOut: typeof it.out === 'boolean' ? it.out : null });
  }
  return out;
}

export function plan(input) {
  const S = Object.assign({}, DEFAULTS, input.settings || {});
  const ov = input.overrides || {}, places = input.places || {}, kw = input.kw || {}, log = input.log || [], now = input.now;
  const L = learned(log);
  const list = sources(input).map(x => {
    const o = ov[x.key] || {};
    const pk = normPlace(x.place), tk = normTitle(x.title);
    // 나가는 약속인지: 내가 정한 것 > 넣을 때 정한 것 > 같은 제목에 전에 정한 것 > 장소(온라인 아님) > (제목 낱말은 묻기만)
    let out = false, outWhy = 'none';
    if (x.allDay) outWhy = 'allday';
    else if (typeof o.out === 'boolean') { out = o.out; outWhy = 'user'; }
    else if (typeof x.explicitOut === 'boolean') { out = x.explicitOut; outWhy = 'user'; }
    else if (tk && typeof kw[tk] === 'boolean') { out = kw[tk]; outWhy = 'memory'; }
    else if (pk && !isOnline(x.place)) { out = true; outWhy = 'place'; }
    else if (!isOnline(x.place) && OUT_WORDS.some(w => x.title.toLowerCase().includes(w))) outWhy = 'word';
    let prep = S.prepDefault, prepWhy = 'default';
    if (Number.isFinite(o.prep)) { prep = o.prep; prepWhy = 'user'; } else if (L.prep) { prep = L.prep; prepWhy = 'learned'; }
    let travel = S.travelDefault, travelWhy = 'default';
    if (Number.isFinite(o.travel)) { travel = o.travel; travelWhy = 'user'; } else if (pk && Number.isFinite(places[pk])) { travel = places[pk]; travelWhy = 'place'; }
    const st = stateOf(x.key, log);
    const snoozed = st.snPrep + st.snLeave;
    const e = {
      key: x.key, src: x.src, calName: x.calName, title: x.title, place: x.place, allDay: x.allDay, start: x.start, end: x.end,
      out, outWhy, suggest: outWhy === 'word', prep, prepWhy, travel, travelWhy, off: o.off === true, buffer: S.buffer,
      prepAt: null, leaveAt: null, headsAt: null, snoozed, snRemind: st.snRemind,
      startedAt: st.startedAt, leftAt: st.leftAt, doneAt: st.doneAt, lateAt: st.lateAt,
      rangPrep: st.rangPrep, rangLeave: st.rangLeave, rangRemind: st.rangRemind, state: 'idle', tight: null
    };
    if (out) {
      // 미룬 만큼 뒤로(미루기는 도착 여유를 쓴다): 준비 시작은 준비 단계에서 미룬 만큼, 출발은 모두 미룬 만큼
      const leave0 = x.start - (travel + S.buffer) * MIN;
      e.prepAt = leave0 - prep * MIN + st.snPrep * MIN;
      e.leaveAt = leave0 + snoozed * MIN;
      if (S.heads > 0 && S.heads < prep) e.headsAt = e.leaveAt - S.heads * MIN;
    }
    if (out && e.leftAt) e.state = 'left';
    else if (out && e.startedAt) e.state = 'prep';
    else if (!out && e.doneAt) e.state = 'done';
    else if (!x.allDay && now >= x.start) e.state = 'past';
    return e;
  }).sort((a, b) => (a.allDay === b.allDay ? 0 : a.allDay ? -1 : 1) || a.start - b.start || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  // 빠듯함: 앞 약속이 끝나기 전에 다음 약속 준비를 시작해야 하는 경우(둘 다 나가는 약속). 끝 시각이 없으면 한 시간으로 본다
  const outs = list.filter(e => e.out && !e.off);
  for (let i = 1; i < outs.length; i++) {
    const a = outs[i - 1], b = outs[i];
    const aEnd = a.end && a.end > a.start ? a.end : a.start + 60 * MIN;
    if (b.start > a.start && b.prepAt < aEnd) b.tight = { key: a.key, title: a.title, minutes: Math.round((aEnd - b.prepAt) / MIN) };
  }
  return list;
}

// 지금(now) 뒤에 울릴 알람. 시각이 이미 지났는데 한 번도 안 울렸으면 곧바로(5초 뒤) 울린다.
// 대답이 없을 때 다시 울리는 것(붙잡기)은 울린 뒤 휴대폰 쪽이 붙인다
export const SOON = 5000;
export function alarms(entries, input) {
  const S = Object.assign({}, DEFAULTS, input.settings || {});
  const now = input.now, out = [];
  const push = (kind, e, at, strong) => out.push({ id: kind + ':' + e.key, key: e.key, kind, at, strong });
  for (const e of entries) {
    if (e.off || e.allDay) continue;
    if (e.out) {
      if (e.state === 'left' || now >= e.start) continue;
      if (e.state === 'idle') {
        if (e.prepAt > now) push('prep', e, e.prepAt, true);
        else if (!e.rangPrep && now < e.leaveAt) push('prep', e, now + SOON, true);
      }
      if (e.headsAt && e.headsAt > now) push('heads', e, e.headsAt, false);
      if (e.leaveAt > now) push('leave', e, e.leaveAt, true);
      else if (!e.rangLeave) push('leave', e, now + SOON, true);
    } else if (e.src === 'own' && S.remindOwn && e.state !== 'done') {
      const at = e.start + e.snRemind * MIN;
      if (at > now) push('remind', e, at, true);
      else if (!e.rangRemind && now < e.start + 30 * MIN) push('remind', e, now + SOON, true);
    }
  }
  // 아침 요약: 그날 나가는 약속(또는 이 앱에 넣은 알림)이 있고, 그날 첫 준비 시작보다 이를 때만
  if (S.morningOn && /^\d{2}:\d{2}$/.test(S.morningAt || '')) {
    const hm = S.morningAt.split(':').map(Number);
    for (const day of input.days || []) {
      const at = day.midnight + (hm[0] * 60 + hm[1]) * MIN, end = day.midnight + 1440 * MIN;
      const mine = entries.filter(e => !e.off && !e.allDay && e.start >= day.midnight && e.start < end && (e.out || e.src === 'own'));
      if (!mine.length || at <= now + 1000) continue;
      const firstPrep = Math.min(...mine.filter(e => e.out).map(e => e.prepAt), Infinity);
      if (at < firstPrep) out.push({ id: 'morning:' + day.ymd, key: 'day:' + day.ymd, kind: 'morning', at, strong: false });
    }
  }
  return out.sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

// 미루기: 남은 도착 여유의 절반(올림)씩이라 미룰수록 간격이 준다(10 → 5, 5 → 3, 2 → 1분). 0이면 미루기를 내지 않고
// '지금 시작 · 늦는다고 알리기'만 낸다(대표 결정 11/6)
export function snoozeLeft(e) { const r = Math.max(0, e.buffer - e.snoozed); return r >= 2 ? Math.ceil(r / 2) : r; }
// 지금 시작(또는 지금 출발)하면 몇 분 늦는지(5분 단위 올림, 늦지 않으면 0)
export function lateIfStartNow(e, now) { const m = (now + (e.prep + e.travel) * MIN - e.start) / MIN; return m > 0 ? ceil5(m) : 0; }
export function lateIfLeaveNow(e, now) { const m = (now + e.travel * MIN - e.start) / MIN; return m > 0 ? ceil5(m) : 0; }
