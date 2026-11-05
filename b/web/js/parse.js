// 한 문장으로 약속 넣기 · 말로 고치기. 휴대폰 안에서만 푼다(서버 · AI 없음).
// 시험: tests/parse.test.mjs(A에서 쓰던 문장 56개 + 고치기)
// parse(text, now) → {date:'YYYY-MM-DD'|null, start:'HH:MM'|null, end:'HH:MM'|null, title, place|null, alt|null}
// revise(draft, text, now) → 고치는 말이면 고친 draft, 아니면 null

const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const sod = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const WD = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };
const NUMW = { 한: 1, 두: 2, 세: 3, 네: 4, 다섯: 5, 여섯: 6, 일곱: 7, 여덟: 8, 아홉: 9, 열: 10, 열한: 11, 열두: 12 };

// 'N시' 앞의 때 말: 오전 · 오후 · 아침 · 점심 · 저녁 · 밤 · 새벽 · 낮
function toHM(ap, h, m) {
  h = +h; m = +(m || 0);
  if (ap === '오후' || ap === '저녁' || ap === '밤') { if (h < 12) h += 12; }
  else if (ap === '오전' || ap === '아침' || ap === '새벽') { if (h === 12) h = 0; }
  else if (ap === '낮' || ap === '점심') { if (h < 6) h += 12; }
  else if (h >= 1 && h <= 7) h += 12; // 때 말 없이 1~7시는 오후로(대부분 약속)
  if (h > 23 || m > 59) return null;
  return pad(h) + ':' + pad(m);
}
const hourNum = s => /^\d+$/.test(s) ? +s : NUMW[s] || null;
const T_RE = '(오전|오후|아침|점심|저녁|밤|새벽|낮)?\\s*(\\d{1,2}|열한|열두|한|두|세|네|다섯|여섯|일곱|여덟|아홉|열)\\s*시(?:\\s*(반)|\\s*(\\d{1,2})\\s*분)?';

function weekStart(d) { const x = sod(d); const k = (x.getDay() + 6) % 7; return addDays(x, -k); } // 월요일 시작

export function parse(text, now = new Date()) {
  const today = sod(now);
  let s = ' ' + String(text || '').replace(/\s+/g, ' ').trim() + ' ';
  let date = null, start = null, end = null, alt = null, at = null;
  const take = (re, fn) => { const m = s.match(re); if (!m) return false; if (fn(m) === false) return false; s = s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length); return true; };

  // 상대 시각: 'N분 뒤', 'N시간 뒤', '한 시간 반 뒤'
  take(/(\d{1,3}|한|두|세)\s*시간(?:\s*(반))?\s*(?:뒤|후)(?:에)?/, m => { const h = hourNum(m[1]); at = new Date(now.getTime() + (h * 60 + (m[2] ? 30 : 0)) * 60000); });
  if (!at) take(/(\d{1,3})\s*분\s*(?:뒤|후)(?:에)?/, m => { at = new Date(now.getTime() + (+m[1]) * 60000); });
  if (at) { date = sod(at); start = pad(at.getHours()) + ':' + pad(at.getMinutes()); }

  // 날짜
  take(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/, m => { date = new Date(+m[1], m[2] - 1, +m[3]); });
  if (!date) take(/(\d{1,2})\s*월\s*(\d{1,2})\s*일(?:날)?(?:에)?(?:까지)?/, m => {
    let x = new Date(today.getFullYear(), m[1] - 1, +m[2]); if (x < addDays(today, -60)) x = new Date(today.getFullYear() + 1, m[1] - 1, +m[2]); date = x;
  });
  if (!date) take(/(?:^|\s)(\d{1,2})\/(\d{1,2})(?=\s)/, m => { let x = new Date(today.getFullYear(), m[1] - 1, +m[2]); if (x < addDays(today, -60)) x = new Date(today.getFullYear() + 1, m[1] - 1, +m[2]); date = x; });
  if (!date) take(/(\d{1,3})\s*일\s*(?:뒤|후)(?:에)?/, m => { date = addDays(today, +m[1]); });
  if (!date) take(/(오늘|내일모레|내일|모레|글피)(?:은|는|에)?/, m => { date = addDays(today, { 오늘: 0, 내일: 1, 모레: 2, 내일모레: 2, 글피: 3 }[m[1]]); });
  if (!date) take(/(다다음\s*주|다음\s*주|이번\s*주|담주|저번\s*주)?\s*([일월화수목금토])요일(?:날)?(?:에)?/, m => {
    const w = WD[m[2]], pre = (m[1] || '').replace(/\s/g, '');
    if (pre === '다음주' || pre === '담주' || pre === '다다음주') { const ws = addDays(weekStart(today), pre === '다다음주' ? 14 : 7); date = addDays(ws, (w + 6) % 7); }
    else if (pre === '이번주') { date = addDays(weekStart(today), (w + 6) % 7); }
    else { const diff = (w - today.getDay() + 7) % 7; date = addDays(today, diff); }
  });
  if (!date) take(/(다음|이번)\s*달\s*(\d{1,2})\s*일(?:날)?(?:에)?(?:까지)?/, m => { const mo = today.getMonth() + (m[1] === '다음' ? 1 : 0); date = new Date(today.getFullYear(), mo, +m[2]); });
  // 달 없이 'N일': 이번 달 그날이 지났으면 다음 달(alt = 이번 달 그날). 'N일 동안 · N일차 · N일 N회'는 날짜가 아니다
  if (!date) take(/(?:^|\s)(\d{1,2})\s*일(?:날)?(?!\s*(?:동안|간|차|\d|째|씩))(?:에)?(?:까지)?(?=\s)/, m => {
    const d = +m[1]; if (d < 1 || d > 31) return false;
    const fit = (y, mo) => { const x = new Date(y, mo, d); return x.getDate() === d ? x : null; };
    let x = fit(today.getFullYear(), today.getMonth());
    if (x && x >= today) { date = x; return; }
    alt = x ? ymd(x) : null;
    for (let k = 1; k <= 3 && !date; k++) date = fit(today.getFullYear(), today.getMonth() + k);
  });
  take(/\s([일월화수목금토])요일(?=\s)/, () => {}); // '11월 7일 토요일'처럼 날짜 옆 요일은 지운다

  // 시각(범위 먼저)
  if (!start) {
    const rng = new RegExp(T_RE + '\\s*(?:부터|~|-)\\s*' + T_RE + '\\s*(?:까지)?');
    take(rng, m => { start = toHM(m[1], hourNum(m[2]), m[3] ? 30 : m[4]); end = toHM(m[5] || m[1], hourNum(m[6]), m[7] ? 30 : m[8]); if (!start) return false; if (end && end <= start && !m[5]) { const e2 = toHM('오후', hourNum(m[6]), m[7] ? 30 : m[8]); if (e2 > start) end = e2; } });
  }
  if (!start) take(/(?:(오전|오후)\s*)?(\d{1,2}):(\d{2})(?:에)?/, m => { start = toHM(m[1] || (+m[2] >= 13 || +m[2] === 0 ? '오전' : null), +m[2], m[3]); if (+m[2] >= 13) start = pad(+m[2]) + ':' + m[3]; });
  if (!start) take(new RegExp(T_RE + '(?:\\s*(?:에|쯤|경))?'), m => { const h = hourNum(m[2]); start = h >= 13 ? (h <= 23 ? pad(h) + ':' + pad(m[3] ? 30 : +(m[4] || 0)) : null) : toHM(m[1], h, m[3] ? 30 : m[4]); });
  if (!start) take(/(정오|자정)/, m => { start = m[1] === '정오' ? '12:00' : '00:00'; });
  // 때 말만 남은 것(시각 없이 '저녁'은 제목에 남긴다: '친구랑 저녁')

  // 말끝 정리
  let t = s.replace(/\s+/g, ' ').trim();
  t = t.replace(/^(에|은|는|까지)\s+/, '');
  t = t.replace(/\s*(가야\s*(?:돼|해|함|한다|됨)|해야\s*(?:돼|해|함|한다|됨)|있어|있음|있다|예정|할\s*거야|하기로\s*함|잡혀\s*있어)\s*$/, '');
  t = t.replace(/^(에|은|는)\s+/, '').trim();
  const place = findPlace(t);
  const out = { date: date ? ymd(date) : null, start, end, title: t, place, alt };
  if (at) out.at = at.getTime();
  return out;
}

// 장소: 'X에서', 장소 끝말(역 · 병원 · 치과 · 점 …)이 붙은 이름. 흔한 말(치과 · 병원 · 지역 · 출발점)만 있으면 장소가 아니다
const PERSON = /^(엄마|아빠|어머니|아버지|할머니|할아버지|아이|애기|아기|동생|형|누나|언니|오빠|친구|남편|아내|와이프|부모님|가족|딸|아들)$/;
const SUFFIX = /(역|병원|의원|치과|한의원|약국|내과|외과|피부과|안과|이비인후과|정형외과|센터|카페|학원|공항|터미널|대학교|학교|도서관|마트|백화점|점|호텔|극장|공원|시청|구청|교회|성당|빌딩|타워|CGV|메가박스|롯데시네마)$/i;
const NOT_PLACE = /^(지역|구역|영역|역할|무역|번역|통역|출발점|시작점|종점|반환점|장점|단점|문제점|관점|시점|정점|요점|만점|점|역|병원|치과|의원|약국|센터|카페|학원|학교|마트|공원|교회|성당|내과|외과|피부과|안과)$/;
export function findPlace(t) {
  const words = String(t || '').split(' ').filter(Boolean);
  const m = t.match(/(?:^|\s)((?:[^\s]+\s)?[^\s]+?)에서(?=\s|$)/);
  if (m) {
    const ws = m[1].split(' ');
    if (ws.length === 2 && (SUFFIX.test(ws[1]) && !NOT_PLACE.test(ws[1]) || /점$/.test(ws[1]))) return m[1];
    return ws[ws.length - 1];
  }
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (SUFFIX.test(w) && !NOT_PLACE.test(w) && w.length >= 2) {
      const prev = words[i - 1];
      if (prev && /^(병원|치과|의원|한의원|약국|점)$/.test(w) === false && /점$/.test(w) && prev && !/\d/.test(prev) && !PERSON.test(prev)) return prev + ' ' + w;
      return w;
    }
    // '늘푸른 병원' 같은 두 낱말 이름(앞 낱말이 사람이 아니고 숫자도 아닐 때)
    if (/^(병원|치과|의원|한의원|약국)$/.test(w) && i > 0) {
      const prev = words[i - 1];
      if (!PERSON.test(prev) && !/\d/.test(prev) && !/^(에|의|가|은|는)$/.test(prev)) return prev + ' ' + w;
    }
  }
  return null;
}

// 말로 고치기: '4시로', '모레로', '장소는 홍대', '제목은 …', '30분 늦게', '1시간 일찍'
export function revise(draft, text, now = new Date()) {
  if (!draft) return null;
  const s = String(text || '').replace(/\s+/g, ' ').trim().replace(/\s*(바꿔\s*줘|바꿔|바꿔요|변경|해\s*줘|해줘|해요|할게|요)$/, '').trim();
  let m;
  if ((m = s.match(/^(?:장소는?|장소를|곳은?)\s*(.+?)(?:로|으로|에서)?$/))) return Object.assign({}, draft, { place: m[1].trim() });
  if ((m = s.match(/^(?:제목은?|이름은?|제목을)\s*(.+?)(?:로|으로)?$/))) return Object.assign({}, draft, { title: m[1].trim() });
  if ((m = s.match(/^(\d{1,3}|한|두|세)\s*(분|시간)(?:\s*(반))?\s*(늦게|뒤로|일찍|앞으로)$/))) {
    if (!draft.start) return null;
    const n = (m[2] === '시간' ? hourNum(m[1]) * 60 + (m[3] ? 30 : 0) : +m[1]) * (/늦게|뒤로/.test(m[4]) ? 1 : -1);
    const [h, mi] = draft.start.split(':').map(Number); let v = h * 60 + mi + n; v = Math.max(0, Math.min(1439, v));
    return Object.assign({}, draft, { start: pad(Math.floor(v / 60)) + ':' + pad(v % 60) });
  }
  if ((m = s.match(/^(.+?)(?:으로|로)$/)) || (m = s.match(/^(.+?)에서$/))) {
    const body = m[1].trim();
    if (/에서$/.test(s)) return Object.assign({}, draft, { place: body });
    const p = parse(body, now);
    const next = Object.assign({}, draft);
    let hit = false;
    if (p.start) { next.start = p.start; hit = true; if (p.end) next.end = p.end; }
    if (p.date) { next.date = p.date; next.alt = p.alt; hit = true; }
    if (!hit) return null;
    return next;
  }
  return null;
}
