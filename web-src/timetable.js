/* ---------- 시간표 (D-06) ----------
 * 매주 반복되는 수업·알바·학원. 문서 종류 'tt':
 *   {type:'tt', name, days:[0..6], start:'HH:MM', end:'HH:MM', place, remind:'10'|'' , color, on}
 * 박스웍스 안(IIFE)에 그대로 끼워 넣어 박스웍스의 저장·창·알림 함수를 같이 쓴다.
 * scripts/build-web.mjs가 이 파일을 boot() 바로 앞에 넣는다.
 */
const TT_COLORS = ['#2a78d6', '#1baf7a', '#eda100', '#e87ba4', '#6250d6', '#e34948', '#0b8f8f'];
const TT_ORDER = [1, 2, 3, 4, 5, 6, 0];
// 고르는 칸 규칙(규칙 11, D-10): 셋 + 직접 입력, '없음'은 아래 글자 단추. 예전에 고른 5분 전은 직접 입력 값으로 보인다
const TT_REMS = [['0', '정시'], ['10', '10분 전'], ['30', '30분 전']];
let TT = null;
const TT_PX = 52, TT_SNAP = 10;
// 시간표가 보여 주는 시각 범위(대표 요청: 이른 아침·늦은 밤). 설정 문서에 저장해 백업에 들어간다. 넣은 수업이 범위 밖이면 그만큼 넓힌다
function ttRange(){ const s = (M && M.settings) || {}; const f = Number.isInteger(s.ttFrom) ? s.ttFrom : 9, t = Number.isInteger(s.ttTo) ? s.ttTo : 18; return {from: Math.max(0, Math.min(23, f)), to: Math.max(Math.min(24, t), Math.min(24, f + 1))}; }

function ttList(){
  const out = [];
  allDocs().forEach((d, id) => { if (d && d.type === 'tt' && !d.deletedAt) out.push(Object.assign({}, d, {id})); });
  return out.sort((a, b) => toMin(a.start) - toMin(b.start) || String(a.name).localeCompare(String(b.name)));
}
function ttOn(e, ds){ return e.on !== false && Array.isArray(e.days) && e.days.includes(parseYmd(ds).getDay()) && !ttSkipped(e, ds); }
// 휴강(대표 요청 2026-10-31): 그 날짜 하루만 끈다. 알람·아침 보고·위젯·오늘 할 일이 모두 ttOn을 거치므로 함께 빠진다
function ttSkipped(e, ds){ return !!(e && e.skip && e.skip[ds]); }
// 이 요일의 다음 수업 날짜(오늘 포함). 이미 지난 요일이면 다음 주
function ttNextDate(d){ const t = parseYmd(M.today); return ymd(addDays(t, (d - t.getDay() + 7) % 7)); }
function ttMD(ds){ const x = parseYmd(ds); return (x.getMonth() + 1) + '/' + x.getDate(); }
function ttDaysText(days){
  const k = days.slice().sort().join('');
  if (k === '12345') return '평일';
  if (k === '06') return '주말';
  if (k === '0123456') return '매일';
  return TT_ORDER.filter(d => days.includes(d)).map(d => WD[d]).join('·');
}

/* 한 문장 해석: "월수 10시 반부터 12시까지 경영학원론 301호", "화목 오후 2시~3시 반 통계학 공학관 205"
 * 요일 → 시각(범위·걸리는 시간) → 장소 → 남은 말은 이름. 모르는 칸은 비워 둔다(D-01). */
function ttParse(text){
  let s = ' ' + String(text || '').replace(/[,，·/]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  const days = new Set();
  const dayIdx = {'일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6};
  const addAll = arr => arr.forEach(d => days.add(d));
  s = s.replace(/\s(매주|매주마다)\s/g, ' ');
  s = s.replace(/\s(평일|주중)(마다|에|엔|은|는)?\s/g, () => { addAll([1, 2, 3, 4, 5]); return ' '; });
  s = s.replace(/\s주말(마다|에|엔|은|는)?\s/g, () => { addAll([0, 6]); return ' '; });
  s = s.replace(/\s매일(마다)?\s/g, () => { addAll([0, 1, 2, 3, 4, 5, 6]); return ' '; });
  // 요일 글자만으로 된 말: 월수, 화목, 월수금, 월요일, 화요일마다, 월·수 (수학·토익 같은 말은 건드리지 않음)
  for (let pass = 0; pass < 3; pass++) {
    s = s.replace(/\s([월화수목금토일]{1,7})(요일)?(마다|에|엔|은|는|이랑|랑|하고|과|와)?\s/g, (m, ch, yo, josa) => {
      if (ch.length === 1 && !yo && !josa && !/^[월화수목금토일]$/.test(ch)) return m;
      ch.split('').forEach(c => days.add(dayIdx[c]));
      return ' ';
    });
  }

  const hourOf = (ampm, h, half, min) => {
    let hh = +h, mm = half ? 30 : (min ? +min : 0);
    if (ampm === '오후' || ampm === '저녁' || ampm === '밤') { if (hh < 12) hh += 12; }
    else if (ampm === '오전' || ampm === '아침' || ampm === '새벽') { if (hh === 12) hh = 0; }
    else if (hh >= 1 && hh <= 6) hh += 12;   // 수업·알바에서 "2시"는 보통 오후 2시
    return hh * 60 + mm;
  };
  const T = '(오전|오후|아침|저녁|밤|새벽)?\\s*(\\d{1,2})\\s*(?:시|:)\\s*(?:(반)|(\\d{1,2})\\s*분?)?';
  let start = null, end = null, dur = null;
  const range = new RegExp('\\s' + T + '\\s*(?:부터|에서|~|-|–)\\s*' + T + '\\s*(?:까지)?\\s');
  let m = s.match(range);
  if (m) {
    start = hourOf(m[1], m[2], m[3], m[4]);
    end = hourOf(m[5] || (m[1] === '오후' || m[1] === '저녁' ? '오후' : ''), m[6], m[7], m[8]);
    if (end <= start && end + 720 < 1440) end += 720;
    s = s.replace(m[0], ' ');
  } else {
    m = s.match(new RegExp('\\s' + T + '\\s*(?:에|부터)?\\s'));
    if (m) { start = hourOf(m[1], m[2], m[3], m[4]); s = s.replace(m[0], ' '); }
  }
  let dm = s.match(/\s(\d{1,2})\s*시간(?:\s*(반|(\d{1,2})\s*분))?(?:\s*(?:동안|짜리))?\s/);
  if (dm) { dur = +dm[1] * 60 + (dm[2] === '반' ? 30 : dm[3] ? +dm[3] : 0); s = s.replace(dm[0], ' '); }
  else if ((dm = s.match(/\s(\d{2,3})\s*분(?:\s*(?:동안|짜리))?\s/))) { dur = +dm[1]; s = s.replace(dm[0], ' '); }
  if (start != null && end == null) end = Math.min(start + (dur || 60), 23 * 60 + 59);

  // 장소: 301호, 공학관 205, 인문관, 3층 강의실, 온라인, 줌
  const placeParts = [];
  s = s.replace(/\s([가-힣A-Za-z]*관)\s+(\d{2,4}(?:호)?)\s/g, (x, a, b) => { placeParts.push(a + ' ' + b); return ' '; });
  s = s.replace(/\s([가-힣A-Za-z0-9-]*\d+호(?:실)?)\s/g, (x, a) => { placeParts.push(a); return ' '; });
  s = s.replace(/\s(\d+층\s*[가-힣]*실|[가-힣]+(?:강의실|실습실|체육관|도서관)|온라인|줌|Zoom|zoom)\s/g, (x, a) => { placeParts.push(a); return ' '; });
  s = s.replace(/\s(?:에서)\s/g, ' ');

  let name = s.replace(/\s(수업|강의)?(이|가|은|는|을|를|에|이야|있어|있음|해|들어|가야\s?돼|가야\s?해)\s/g, ' ').replace(/\s+/g, ' ').trim();
  name = name.replace(/^(에|은|는|이|가)\s+/, '').replace(/\s+(에|에서)$/, '').trim();
  return {
    name: name.slice(0, 40),
    days: TT_ORDER.filter(d => days.has(d)),
    start: start == null ? null : fromMin(Math.max(0, Math.min(start, 1439))),
    end: end == null ? null : fromMin(Math.max(0, Math.min(end, 1439))),
    place: placeParts.join(' ').slice(0, 40)
  };
}

/* 캘린더 탭 위쪽 '월간 | 주간' 전환(대표 요청: 주간·월간을 '캘린더' 탭 하나로). 시간표는 아래 메뉴의 따로 된 탭 */
function bxCalBar(cur){
  // 휴대폰 캘린더를 함께 볼 때: 박스웍스 일정은 색, 휴대폰 캘린더 일정은 회색 테두리(전체 흐름 와이어프레임 14)
  const pc = typeof pcCfg === 'function' && pcCfg().on;
  return '<div class="tt-mode"><div class="seg" role="group" aria-label="캘린더 보기" style="width:200px">' +
    '<button type="button" data-act="tt-cal" data-to="month" aria-pressed="' + (cur === 'month') + '">월간</button>' +
    '<button type="button" data-act="tt-cal" data-to="week" aria-pressed="' + (cur === 'week') + '">주간</button></div>' +
    (pc ? '<span class="bx-cal-lg"><span><i class="bx"></i>박스웍스</span><span><i class="pc"></i>휴대폰 캘린더</span></span>' : '') + '</div>';
}
// 월간에서 고른 날이 든 주로, 주간에서는 그 주가 든 달로
function bxCalGo(to){
  if (to === 'week') {
    const d = S.selDate && isDate(S.selDate) ? S.selDate : M.today;
    const off = Math.round((startOfWeek(parseYmd(d)) - startOfWeek(parseYmd(M.today))) / (7 * 864e5));
    go('week', {weekOff: off});
  } else {
    const ws = addDays(startOfWeek(parseYmd(M.today)), (S.weekOff || 0) * 7);
    const d = S.weekOff ? ymd(ws) : M.today;
    go('month', {date: d});
  }
  window.scrollTo(0, 0);
}

function ttHtml(){
  const list = ttList();
  VBAR = {title: '시간표', nav: ''};
  // 보이는 요일(대표 지적 10/31: '주말 수업이 있을 때만'은 있으나 마나) → 월–금 | 월–일 두 가지.
  // 월–금이어도 토·일에 수업이 있으면 그 요일은 보인다(넣은 수업이 숨지 않게)
  const wk = (M.settings && M.settings.ttWeek) === 'all' ? 'all' : 'wd';
  const cols = wk === 'all' ? TT_ORDER : [1, 2, 3, 4, 5].concat([6, 0].filter(d => list.some(e => e.days.includes(d))));
  if (TTSEL && !list.some(e => e.id === TTSEL.id && e.days.includes(TTSEL.d))) TTSEL = null;
  const rg = ttRange();
  let h0 = rg.from, h1 = rg.to;
  list.forEach(e => { h0 = Math.min(h0, Math.floor(toMin(e.start) / 60)); h1 = Math.max(h1, Math.ceil(toMin(e.end || e.start) / 60)); });
  h1 = Math.min(24, Math.max(h1, h0 + 4));
  const PX = TT_PX, H = (h1 - h0) * PX;
  const todayDow = M.now.getDay(), nowM = M.now.getHours() * 60 + M.now.getMinutes();
  let head = '<div class="tt-h tt-tc"></div>' + cols.map(d => '<div class="tt-h' + (d === todayDow ? ' today' : '') + (d === 0 ? ' sun' : d === 6 ? ' sat' : '') + '">' + WD[d] + '</div>').join('');
  let lines = '';
  for (let h = h0; h <= h1; h++) lines += '<div class="tt-line" style="top:' + ((h - h0) * PX) + 'px"><span>' + (h === 24 ? 0 : h) + '</span></div>';
  const colsHtml = cols.map(d => {
    const blocks = list.filter(e => e.on !== false && e.days.includes(d)).map(e => {
      const a = toMin(e.start), b = Math.max(toMin(e.end || e.start), a + 20);
      const top = (a - h0 * 60) / 60 * PX, ht = Math.max(22, (b - a) / 60 * PX - 2);
      const sel = TTSEL && TTSEL.id === e.id && TTSEL.d === d, linked = ttLinked(e, list), off = ttSkipped(e, ttNextDate(d));
      return '<button type="button" class="tt-b' + (sel ? ' sel' : '') + (linked ? ' lk' : '') + (off ? ' off' : '') + '" data-act="tt-edit" data-id="' + esc(e.id) + '" data-d="' + d + '" data-h0="' + h0 + '" style="top:' + top.toFixed(1) + 'px;height:' + ht.toFixed(1) + 'px;--c:' + (e.color || TT_COLORS[0]) + '" aria-label="' + esc(WD[d] + '요일 ' + e.start + ' ' + e.name + (e.place ? ' ' + e.place : '')) + '">' +
        '<b>' + esc(e.name) + '</b>' + (off ? '<small class="tt-offtag">' + ttMD(ttNextDate(d)) + ' 휴강</small>' : e.place && ht > 34 ? '<small>' + esc(e.place) + '</small>' : '') +
        (linked ? '<span class="tt-lk" aria-hidden="true">' + TT_CLIP + '</span>' : '') +
        '<span class="tt-hd s" data-tt-rs="s" aria-hidden="true"></span><span class="tt-hd e" data-tt-rs="e" aria-hidden="true"></span></button>';
    }).join('');
    const now = d === todayDow && nowM >= h0 * 60 && nowM <= h1 * 60 ? '<i class="tt-now" style="top:' + ((nowM - h0 * 60) / 60 * PX).toFixed(1) + 'px"></i>' : '';
    return '<div class="tt-col' + (d === todayDow ? ' today' : '') + '" data-d="' + d + '">' + blocks + now + '</div>';
  }).join('');
  const add = '<div class="tt-add"><label class="sr" for="tt-in">시간표에 넣기</label><div class="bx-inrow"><input id="tt-in" class="inp" type="text" autocomplete="off" enterkeyhint="done" maxlength="120" placeholder="예) 월수 10시 반부터 12시까지 경영학원론 301호">' +
    bxMic('tt-in', '예) 월수 10시 반부터 12시까지 경영학원론 301호') + '<button type="button" class="btn primary" data-act="tt-add">넣기</button></div></div>';
  // 앱: 시간표 칸이 바로 보이게 머리는 제목만, 넣기·보기 설정·수업 추가는 아래 메뉴 위 툴바로(대표 요청 10/31)
  if (window.BX_APP) {
    const rangeTxt = String(h0).padStart(2, '0') + '–' + String(h1).padStart(2, '0') + '시 · ' + (cols.length === 7 ? '월–일' : cols.length === 5 ? '월–금' : '월–금·' + cols.slice(5).map(d => WD[d]).join('·'));
    const emptyA = list.length ? '' : '<p class="empty tt-empty">매주 반복되는 수업·알바·학원을 아래 ‘말로 넣기’로 넣어 보세요. 시작 10분 전에 알람이 울려요.</p>';
    return '<div class="page-head bx-tt-head"><div class="ph-t"><h1>시간표</h1><p><span class="nw">' + (list.length ? '<b>' + list.length + '</b>개 · ' : '') + '매주 반복 · ' + rangeTxt + '</span></p></div></div>' + emptyA +
      (TTSEL ? '<p class="p small tt-tip">' + TT_TIP1 + '</p>' : '') +
      '<div class="tt-wrap"><div class="tt-grid" style="--n:' + cols.length + '">' + head + '</div>' +
      '<div class="tt-body' + (TTSEL ? ' editing' : '') + '" style="--n:' + cols.length + ';height:' + H + 'px"><div class="tt-lines">' + lines + '</div><div class="tt-tc"></div>' + colsHtml + (TTSEL ? ttBarHtml() : '') + '</div></div>' +
      '<nav class="bx-ttbar" aria-label="시간표 도구">' +
        '<button type="button" class="bx-ttb main" data-act="bx-tt-say">' + TT_MIC_I + '<span>말로 넣기</span></button>' +
        '<button type="button" class="bx-ttb" data-act="tt-range" aria-label="보기 설정 바꾸기 · ' + rangeTxt + '">' + ICON.clock + '<span>보기 설정</span></button>' +
        '<button type="button" class="bx-ttb" data-act="tt-new">' + ICON.plus + '<span>수업 추가</span></button></nav>';
  }
  const empty = list.length ? '' : '<p class="empty tt-empty">매주 반복되는 수업·알바·학원을 위 칸에 말하거나 적어 보세요. 시작 10분 전에 알람이 울려요.</p>';
  return '<div class="page-head"><div class="ph-t"><h1>시간표</h1><p><span class="nw">' + (list.length ? '<b>' + list.length + '</b>개 · ' : '') + '매주 반복</span></p></div></div>' + add +
    '<div class="tt-sub"><button type="button" class="tt-opt" data-act="tt-range" aria-label="시간표 보기 설정 바꾸기">' + ICON.clock + '<span><b>보기 설정</b><small>' + String(h0).padStart(2, '0') + '–' + String(h1).padStart(2, '0') + '시 · ' + (cols.length === 7 ? '월–일' : cols.length === 5 ? '월–금' : '월–금·' + cols.slice(5).map(d => WD[d]).join('·')) + '</small></span>' + ICON.chevR + '</button>' +
      '<button type="button" class="tt-opt" data-act="tt-new">' + ICON.plus + '<span><b>수업 추가</b><small>요일·시간 골라 넣기</small></span></button></div>' + empty +
    (list.length ? '<p class="p small tt-tip">' + (TTSEL ? TT_TIP1 : TT_TIP0) + '</p>' : '') +
    '<div class="tt-wrap"><div class="tt-grid" style="--n:' + cols.length + '">' + head + '</div>' +
    '<div class="tt-body' + (TTSEL ? ' editing' : '') + '" style="--n:' + cols.length + ';height:' + H + 'px"><div class="tt-lines">' + lines + '</div><div class="tt-tc"></div>' + colsHtml + (TTSEL ? ttBarHtml() : '') + '</div></div>';
}

/* 오늘 화면: 그날 시간표. inner면 '오늘 할 일' 상자 안에 들어가는 묶음(홈 개편, 대표 요청 2026-10-31) */
function ttTodayHtml(ds, inner){
  if (!ds && S.homeDay) return '';
  ds = ds || M.today;
  const dow = parseYmd(ds).getDay();
  const list = ttList().filter(e => e.on !== false && Array.isArray(e.days) && e.days.includes(dow));
  if (!list.length) return '';
  const nowM = M.now.getHours() * 60 + M.now.getMinutes();
  const rows = list.map(e => {
    if (ttSkipped(e, ds)) return '<div class="row tt-row bx-off"><span class="tt-dot" style="--c:' + (e.color || TT_COLORS[0]) + '"></span>' +
      '<button type="button" class="row-main" data-act="tt-edit" data-id="' + esc(e.id) + '"><span class="row-time"><b>' + e.start + '</b>' + (e.end ? '<small>' + e.end + '</small>' : '') + '</span>' +
      '<span class="row-body"><span class="row-title">' + esc(e.name) + '</span><span class="row-meta"><span class="meta bx-off-tag">휴강 · 알람 쉼</span></span></span></button></div>';
    const past = ds < M.today || (ds === M.today && toMin(e.end || e.start) < nowM);
    const rem = e.remind === '' || e.remind == null ? '' : fromMin(Math.max(0, toMin(e.start) - (+e.remind || 0)));
    return '<div class="row tt-row' + (past ? ' done' : '') + '"><span class="tt-dot" style="--c:' + (e.color || TT_COLORS[0]) + '"></span>' +
      '<button type="button" class="row-main" data-act="tt-edit" data-id="' + esc(e.id) + '"><span class="row-time"><b>' + e.start + '</b>' + (e.end ? '<small>' + e.end + '</small>' : '') + '</span>' +
      '<span class="row-body"><span class="row-title">' + esc(e.name) + '</span><span class="row-meta">' + (e.place ? '<span class="meta">' + ICON.pin + esc(e.place) + '</span>' : '') +
      (rem && !past ? '<span class="meta bx-rem">' + ICON.bell + rem + '</span>' : '') + '</span></span></button></div>';
  }).join('');
  const offN = list.filter(e => ttSkipped(e, ds)).length;
  const hd = '<div class="sec-h"><h2 id="h-tt-today">' + (inner ? '수업' : '오늘 시간표') + '</h2><span class="sec-sub">' + (list.length - offN) + '개' + (offN ? ' · 휴강 ' + offN : '') + '</span><span class="sp"></span>' +
    '<button type="button" class="sec-link" data-act="tt-go">시간표' + ICON.chevR + '</button></div><div class="list">' + rows + '</div>';
  if (inner) return '<div class="bx-sub bx-tts">' + hd + '</div>';
  return '<section class="tcard tt-card" aria-labelledby="h-tt-today"><div class="tc-body">' + hd + '</div></section>';
}
function ttCountOn(ds){ return ttList().filter(e => ttOn(e, ds)).length; }

/* 넣기·고치기 창 */
function ttOpen(id, pre){
  const cur = id ? (ttList().find(e => e.id === id) || null) : null;
  const n = ttList().length;
  TT = cur ? Object.assign({}, cur) : Object.assign({id: null, name: '', days: [], start: '09:00', end: '10:00', place: '', remind: '10', color: TT_COLORS[n % TT_COLORS.length]}, pre || {});
  if (!TT.start) TT.start = '09:00';
  if (!TT.end || toMin(TT.end) <= toMin(TT.start)) TT.end = fromMin(Math.min(toMin(TT.start) + 60, 1439));
  openSheet({title: cur ? (window.BX_APP ? '수업 고치기' : '시간표 고치기') : (window.BX_APP ? '수업 추가' : '시간표에 넣기'), draw: ttDraw, onClose: () => { TT = null; }});
}
// 수업 알림 칸(대표 결정 11/2 밤: 켜기·끄기 스위치, 켰을 때만 아래에 셋 + 직접 입력). 정해진 칸에 맞는 게 없으면
// '직접 입력'(대표 결정 10/31)이 그 칩 자리에서 입력칸이 된다(규칙 9·12)
function ttRemsHtml(){
  const v = String(TT.remind == null ? '' : TT.remind), on = v !== '' || !!TT.remCust, std = TT_REMS.some(r => v === r[0]), cust = TT.remCust || (on && !std);
  return '<div class="tt-remw"><div class="bx-swrow"><span class="tt-l">알림</span><button type="button" class="tog" role="switch" aria-checked="' + on + '" aria-label="수업 알림" data-act="tt-remsw"><i></i></button></div>' +
    (on ? '<div class="tt-pills" role="group" aria-label="알림">' + TT_REMS.map(r => '<button type="button" class="tt-pill" data-act="tt-rem" data-v="' + r[0] + '" aria-pressed="' + (!cust && v === r[0]) + '">' + r[1] + '</button>').join('') +
      (cust ? '<span class="bx-cpick"><input id="tt-rem-c" type="number" inputmode="numeric" min="1" max="240" value="' + (+v > 0 ? +v : 15) + '" aria-label="몇 분 전에 알릴지"><span>분 전</span></span>'
        : '<button type="button" class="tt-pill" data-act="tt-rem" data-v="custom" aria-pressed="false">직접 입력</button>') + '</div>' : '') + '</div>';
}
function ttDraw(){
  if (!TT) return;
  const dayBtns = TT_ORDER.map(d => '<button type="button" class="tt-dbtn' + (d === 0 ? ' sun' : d === 6 ? ' sat' : '') + '" data-act="tt-day" data-d="' + d + '" aria-pressed="' + TT.days.includes(d) + '">' + WD[d] + '</button>').join('');
  const rems = ttRemsHtml();
  const colors = TT_COLORS.map(c => '<button type="button" class="tt-sw" data-act="tt-color" data-c="' + c + '" style="--c:' + c + '" aria-pressed="' + (TT.color === c) + '" aria-label="색"></button>').join('');
  setSheet(
    '<div class="tt-form">' +
      (TT.hint ? '<p class="p small tt-hint">' + esc(TT.hint) + '</p>' : '') +
      '<label class="tt-l" for="tt-name">이름</label><input id="tt-name" class="inp" type="text" maxlength="40" autocomplete="off" placeholder="예) 경영학원론" value="' + esc(TT.name) + '">' +
      '<span class="tt-l">요일</span><div class="tt-days" role="group" aria-label="요일">' + dayBtns + '</div>' +
      '<span class="tt-l">시간</span><div class="tt-times"><input id="tt-start" class="inp" type="time" value="' + TT.start + '" aria-label="시작"><span>–</span><input id="tt-end" class="inp" type="time" value="' + TT.end + '" aria-label="끝"></div>' +
      '<label class="tt-l" for="tt-place">장소</label><input id="tt-place" class="inp" type="text" maxlength="40" autocomplete="off" placeholder="예) 301호" value="' + esc(TT.place || '') + '">' +
      rems +
      '<span class="tt-l">색</span><div class="tt-sws">' + colors + '</div>' +
    '</div>',
    (TT.id ? '<button type="button" class="btn" data-act="tt-del">' + ICON.trash + '지우기</button>' : '') + '<button type="button" class="btn primary grow" data-act="tt-save">저장</button>'
  );
}
function ttSave(o){
  const d = {type: 'tt', name: String(o.name || '').trim().slice(0, 40), days: TT_ORDER.filter(x => o.days.includes(x)), start: o.start, end: o.end,
    place: String(o.place || '').trim().slice(0, 40), remind: o.remind == null ? '10' : String(o.remind), color: o.color || TT_COLORS[0], on: true, link: o.link || null, skip: o.skip || null, updatedAt: nowIso()};
  const id = o.id || rid('tt_');
  const prev = o.id ? getDoc(o.id) : null;
  d.createdAt = prev && prev.createdAt ? prev.createdAt : nowIso();
  writeDoc(id, d);
  return id;
}
function ttCheck(o){
  if (!String(o.name || '').trim()) return '이름을 적어 주세요.';
  if (!o.days.length) return '요일을 하나 이상 골라 주세요.';
  if (!isHM(o.start)) return '시작 시각을 적어 주세요.';
  return '';
}
const TT_MIC_I = '<svg class="i" viewBox="0 0 24 24"><rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/></svg>';
// 앱 툴바의 '말로 넣기': 넣는 칸을 창으로 연다
function ttSayOpen(){
  openSheet({title: '말로 넣기', draw: () => setSheet(
    '<p class="p small" style="margin:0 0 10px">한 문장으로 말하거나 적어요. 요일·시각·이름·장소를 알아서 나눠 넣어요.</p>' +
    '<div class="tt-add"><label class="sr" for="tt-in">시간표에 넣기</label><div class="bx-inrow"><input id="tt-in" class="inp" type="text" autocomplete="off" enterkeyhint="done" maxlength="120" placeholder="예) 월수 10시 반부터 12시까지 경영학원론 301호">' +
    bxMic('tt-in', '예) 월수 10시 반부터 12시까지 경영학원론 301호') + '<button type="button" class="btn primary" data-act="tt-add">넣기</button></div></div>' +
    '<p class="p small" style="margin:10px 0 0">예) 화목 2시 영어회화 · 금 7시부터 10시까지 편의점 알바</p>', '')});
  setTimeout(() => { const i = $('#tt-in'); if (i) i.focus(); }, 60);
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-act="bx-tt-say"]'); if (!b) return;
  ev.preventDefault(); ev.stopPropagation(); ttSayOpen();
}, true);
function ttAddFromText(text){
  text = String(text || '').trim();
  if (!text) { toast('예) 월수 10시 반부터 12시까지 경영학원론 301호'); return; }
  const p = ttParse(text);
  const o = {id: null, name: p.name, days: p.days, start: p.start, end: p.end, place: p.place, remind: '10', color: TT_COLORS[ttList().length % TT_COLORS.length]};
  if (p.name && p.days.length && p.start) {
    if (SH && $('#tt-in')) closeSheet();
    const id = ttSave(o);
    const inp = $('#tt-in'); if (inp) inp.value = '';
    toast('시간표에 넣었어요 · ' + ttDaysText(p.days) + ' ' + p.start + '–' + p.end, [['되돌리기', () => removeDoc(id)]]);
    return;
  }
  o.hint = !p.days.length ? '요일을 알아듣지 못했어요. 아래에서 골라 주세요.' : !p.start ? '시각을 알아듣지 못했어요. 아래에서 적어 주세요.' : '이름을 적어 주세요.';
  if (SH && $('#tt-in')) closeSheet();
  ttOpen(null, o);
}

/* 시간표 버튼과 입력 */
document.addEventListener('click', ev => {
  const el = ev.target && ev.target.closest && ev.target.closest('[data-act^="tt-"]');
  if (!el) return;
  const act = el.dataset.act;
  ev.preventDefault(); ev.stopPropagation();
  if (act === 'tt-cal') { bxCalGo(el.dataset.to); return; }
  if (act === 'tt-go') { go('tt', {}); window.scrollTo(0, 0); return; }
  if (act === 'tt-new') { ttOpen(null); return; }
  if (act === 'tt-edit') {
    if (Date.now() - ttGest.until < 700) return;
    // 편집 중에 다른 블록을 누르면 그 블록으로 바꿔 고른다
    if (TTSEL) { if (el.dataset.d != null && (TTSEL.id !== el.dataset.id || TTSEL.d !== +el.dataset.d)) { TTSEL = {id: el.dataset.id, d: +el.dataset.d}; render(); } return; }
    ttOpen(el.dataset.id); return;
  }
  if (act === 'tt-range') { ttRangeOpen(); return; }
  if (act === 'tt-wk') { $$('[data-act="tt-wk"]').forEach(b => b.setAttribute('aria-pressed', String(b === el))); return; }
  if (act === 'tt-rg-save') { const f = +($('#tt-rg-f') || {}).value, t = +($('#tt-rg-t') || {}).value, wb = $('[data-act="tt-wk"][aria-pressed="true"]'); closeSheet(); saveSettings(Object.assign({ttFrom: f, ttTo: Math.max(t, f + 1)}, wb ? {ttWeek: wb.dataset.v} : {})); toast('시간표를 ' + f + '시부터 ' + Math.max(t, f + 1) + '시까지 보여 줘요'); return; }
  if (act === 'tt-add') { ttAddFromText(($('#tt-in') || {}).value); return; }
  if (!TT) return;
  if (act === 'tt-day') { const d = +el.dataset.d; TT.days = TT.days.includes(d) ? TT.days.filter(x => x !== d) : TT.days.concat([d]); el.setAttribute('aria-pressed', TT.days.includes(d)); return; }
  if (act === 'tt-remsw') {
    // 끄면 지금 값을 기억해 두었다가, 다시 켜면 그 값으로(처음엔 10분 전)
    const v = String(TT.remind == null ? '' : TT.remind);
    if (v !== '' || TT.remCust) { TT.remLast = v; TT.remCust = false; TT.remind = ''; }
    else TT.remind = TT.remLast || '10';
    const w = $('.tt-remw'); if (w) w.outerHTML = ttRemsHtml();
    return;
  }
  if (act === 'tt-rem') {
    // 알림 칸만 다시 그린다(창 전체를 다시 그리면 적던 이름·시각이 사라짐)
    const v = el.dataset.v;
    if (v === 'custom') { TT.remCust = true; if (!(+TT.remind > 0) || TT_REMS.some(r => r[0] === String(TT.remind))) TT.remind = '15'; }
    else { TT.remCust = false; TT.remind = v; }
    const w = $('.tt-remw'); if (w) w.outerHTML = ttRemsHtml();
    if (v === 'custom') { const i = $('#tt-rem-c'); if (i) { i.focus(); i.select(); } }
    return;
  }
  if (act === 'tt-color') { TT.color = el.dataset.c; $$('[data-act="tt-color"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.c === TT.color)); return; }
  if (act === 'tt-del') { const id = TT.id, keep = getDoc(id); closeSheet(); removeDoc(id); toast('시간표에서 지웠어요', [['되돌리기', () => writeDoc(id, keep)]]); return; }
  if (act === 'tt-save') {
    TT.name = ($('#tt-name') || {}).value || TT.name; TT.place = ($('#tt-place') || {}).value || '';
    const st = ($('#tt-start') || {}).value, en = ($('#tt-end') || {}).value;
    if (isHM(st)) TT.start = st;
    TT.end = isHM(en) && toMin(en) > toMin(TT.start) ? en : fromMin(Math.min(toMin(TT.start) + 60, 1439));
    const rc = $('#tt-rem-c');
    if (rc) TT.remind = String(Math.max(1, Math.min(240, Math.round(+rc.value) || 15)));
    delete TT.remCust; delete TT.remLast;
    const err = ttCheck(TT); if (err) { toast(err); return; }
    const o = Object.assign({}, TT); closeSheet(); ttSave(o); toast(o.id ? '고쳤어요' : '시간표에 넣었어요'); return;
  }
}, true);
document.addEventListener('keydown', ev => {
  if (ev.key === 'Enter' && !ev.isComposing && ev.target && ev.target.id === 'tt-in') { ev.preventDefault(); ttAddFromText(ev.target.value); }
});
// 예전 시험판에서 주간 탭을 시간표로 두었으면 처음 열 때 시간표 탭으로
if (lsGet('bx:weekMode') === 'tt') { lsSet('bx:weekMode', ''); }

/* 표시 시간 범위 고르기 */
function ttRangeOpen(){
  const rg = ttRange(), opt = (a, b, cur) => Array.from({length: b - a + 1}, (_, i) => a + i).map(h => '<option value="' + h + '"' + (h === cur ? ' selected' : '') + '>' + h + '시</option>').join('');
  openSheet({title: '시간표 보기 설정', draw: () => setSheet(
    '<span class="tt-l" style="display:block">보이는 시간</span><p class="p small" style="margin:4px 0 0">이른 아침·늦은 밤 수업이 있으면 넓혀 주세요. 범위 밖에 넣은 수업은 저절로 넓혀서 보여요.</p>' +
    '<div class="tt-times" style="margin-top:10px"><select id="tt-rg-f" class="inp" aria-label="시작">' + opt(0, 12, rg.from) + '</select><span>–</span><select id="tt-rg-t" class="inp" aria-label="끝">' + opt(12, 24, rg.to) + '</select></div>' +
    '<span class="tt-l" style="margin-top:16px;display:block">보이는 요일</span><div class="tt-pills" role="group" aria-label="보이는 요일">' + [['wd', '월–금'], ['all', '월–일']].map(o => '<button type="button" class="tt-pill" data-act="tt-wk" data-v="' + o[0] + '" aria-pressed="' + ((((M.settings && M.settings.ttWeek) === 'all') ? 'all' : 'wd') === o[0]) + '">' + o[1] + '</button>').join('') + '</div>' +
    '<p class="p small" style="margin:6px 0 0">월–금으로 두어도 토·일 수업을 넣으면 그 요일은 저절로 보여요.</p>',
    '<button type="button" class="btn primary grow" data-act="tt-rg-save">저장</button>')});
}
/* ---------- 시간표 편집 모드(대표 요청) ----------
   블록을 꾹 누르면 그 블록이 들려 올라와 편집 모드가 된다: 몸통을 끌면 시각·요일을 옮기고, 위·아래 끝을 끌면 길이가 바뀐다.
   위쪽 도구 줄: 클립(같은 이름 수업과 연결·끊기), 복제, 고치기, 지우기, 완료.
   연결된 수업(여러 요일을 한 번에 넣은 수업, 클립으로 이은 수업)은 시각·길이를 함께 바꾼다. 요일 옮기기는 끈 블록만 */
const TT_CLIP = '<svg class="i" viewBox="0 0 24 24"><path d="M15.5 7.5l-6.7 6.7a2 2 0 0 0 2.8 2.8l7-7a4 4 0 0 0-5.7-5.7l-7.2 7.2a6 6 0 0 0 8.5 8.5l6.3-6.3"/></svg>';
let TTSEL = null;
const TT_OFF = '<svg class="i" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/><path d="M9.5 13.2l5 5M14.5 13.2l-5 5"/></svg>';
function ttNameKey(n){ return String(n || '').replace(/\s+/g, '').toLowerCase(); }
function ttGroupOf(e, list){ list = list || ttList(); return e.link ? list.filter(x => x.link === e.link) : [e]; }
function ttLinked(e, list){ return e.days.length > 1 || (!!e.link && ttGroupOf(e, list).length > 1); }
function ttFmtRange(a, b){ return fromMin(a) + '–' + fromMin(b); }
const TT_TIP0 = '블록을 꾹 누르면 옮기기·길이 바꾸기를 할 수 있어요. 클립으로 같은 수업을 연결하면 함께 움직여요.';
const TT_TIP1 = '블록을 끌어 시간·요일을 옮기고, 위·아래 끝을 끌어 길이를 바꿔요. 다 됐으면 완료를 누르세요.';
// 화면을 다시 그리지 않고 편집을 마친다(입력 칸에 적던 글·포커스를 지키려고)
function ttUnselect(){
  TTSEL = null;
  $$('.tt-b.sel').forEach(b => b.classList.remove('sel'));
  const bar = document.getElementById('tt-bar'); if (bar) bar.remove();
  const body = document.querySelector('.tt-body.editing'); if (body) body.classList.remove('editing');
  const tip = document.querySelector('.tt-tip'); if (tip) tip.textContent = TT_TIP0;
}
// 꾹 눌렀을 때 바로 들어 올린다(손을 떼지 않고 이어서 끌 수 있게)
function ttSelectDom(blk){
  $$('.tt-b.sel').forEach(b => b.classList.remove('sel'));
  blk.classList.add('sel');
  const body = blk.closest('.tt-body'); if (!body) return;
  body.classList.add('editing');
  const old = document.getElementById('tt-bar'); if (old) old.remove();
  body.insertAdjacentHTML('beforeend', ttBarHtml()); ttPlaceBar();
  const tip = document.querySelector('.tt-tip'); if (tip) tip.textContent = TT_TIP1;
}
function ttBarHtml(){
  const e = ttList().find(x => x.id === TTSEL.id); if (!e) return '';
  const lk = ttLinked(e);
  const b = (act, icon, label, on) => '<button type="button" class="tt-xb' + (on ? ' on' : '') + '" data-act="' + act + '" aria-label="' + label + '">' + icon + '<small>' + label + '</small></button>';
  const nd = ttNextDate(TTSEL.d), off = ttSkipped(e, nd);
  return '<div class="tt-bar" id="tt-bar" role="toolbar" aria-label="' + esc(e.name) + ' 편집">' +
    b('tt-x-clip', TT_CLIP, lk ? '연결 풀기' : '수업 묶기', lk) + b('tt-x-off', TT_OFF, off ? '휴강 취소' : ttMD(nd) + ' 휴강', off) + b('tt-x-dup', ICON.plus, '복제') + b('tt-x-edit', ICON.edit, '고치기') + b('tt-x-del', ICON.trash, '지우기') + b('tt-x-done', ICON.check, '닫기') + '</div>';
}
// 도구 줄을 고른 블록 바로 위에 두고, 화면 밖으로 나가지 않게
function ttPlaceBar(){
  const bar = document.getElementById('tt-bar'); if (!bar || !TTSEL) return;
  const blk = document.querySelector('.tt-b.sel'), body = bar.parentNode; if (!blk || !body) return;
  const br = body.getBoundingClientRect(), r = blk.getBoundingClientRect(), w = bar.offsetWidth;
  let left = r.left - br.left + r.width / 2 - w / 2; left = Math.max(0, Math.min(br.width - w, left));
  let top = r.top - br.top - bar.offsetHeight - 8; if (top < 0) top = r.bottom - br.top + 8;
  bar.style.left = left + 'px'; bar.style.top = top + 'px';
}
function ttSnapshot(ids){ const m = new Map(); ids.forEach(id => { const d = getDoc(id); m.set(id, d ? JSON.parse(JSON.stringify(d)) : null); }); return m; }
function ttRestore(m){ m.forEach((v, id) => { if (v) writeDoc(id, v); else removeDoc(id); }); }
// 옮기기·길이 바꾸기 저장. na·nb: 새 시작·끝(분), nd: 새 요일
function ttCommit(e, d, na, nb, nd){
  const list = ttList(), linked = ttLinked(e, list), a = toMin(e.start), b = Math.max(toMin(e.end || e.start), a + 20);
  const dS = na - a, dE = nb - b, group = linked ? ttGroupOf(e, list) : [e];
  const snap = ttSnapshot(group.map(g => g.id).concat([e.id]));
  let selId = e.id, made = null, msg;
  const clampPair = (s0, e0) => { let s1 = Math.max(0, Math.min(1430, s0)), e1 = Math.max(s1 + 10, Math.min(1439, e0)); return [s1, e1]; };
  if (linked) {
    if (dS || dE) group.forEach(g => {
      const ga = toMin(g.start), gb = Math.max(toMin(g.end || g.start), ga + 20), p = clampPair(ga + dS, gb + dE);
      writeDoc(g.id, Object.assign({}, getDoc(g.id), {start: fromMin(p[0]), end: fromMin(p[1]), updatedAt: nowIso()}));
    });
    msg = (dS || dE ? '연결된 수업 ' + group.reduce((n, g) => n + g.days.length, 0) + '칸을 함께 ' + (dS === dE ? (dS > 0 ? dS + '분 늦췄어요' : -dS + '분 당겼어요') : '바꿨어요') : '');
    if (nd !== d) {
      const doc = getDoc(e.id);
      if (doc.days.includes(nd)) toast(WD[nd] + '요일에는 이미 같은 수업이 있어요');
      else { writeDoc(e.id, Object.assign({}, doc, {days: TT_ORDER.filter(x => x === nd || (doc.days.includes(x) && x !== d)), updatedAt: nowIso()})); msg = (msg ? msg + ' · ' : '') + WD[d] + '→' + WD[nd] + '요일'; }
    }
  } else {
    const doc = getDoc(e.id);
    if (doc.days.length > 1) {
      made = rid('tt_'); selId = made;
      writeDoc(e.id, Object.assign({}, doc, {days: doc.days.filter(x => x !== d), updatedAt: nowIso()}));
      writeDoc(made, Object.assign({}, doc, {days: [nd], start: fromMin(na), end: fromMin(nb), link: null, createdAt: nowIso(), updatedAt: nowIso()}));
    } else writeDoc(e.id, Object.assign({}, doc, {days: [nd], start: fromMin(na), end: fromMin(nb), updatedAt: nowIso()}));
    msg = e.name + ' · ' + WD[nd] + ' ' + ttFmtRange(na, nb);
  }
  TTSEL = {id: selId, d: getDoc(selId) && getDoc(selId).days.includes(nd) ? nd : d};
  if (msg) toast(msg, [['되돌리기', () => { if (made) removeDoc(made); ttRestore(snap); TTSEL = null; }]]);
}
function ttClip(e, d){
  const list = ttList();
  if (ttLinked(e, list)) {
    const doc = getDoc(e.id), snap = ttSnapshot([e.id].concat(ttGroupOf(e, list).map(g => g.id)));
    let made = null;
    if (doc.days.length > 1) {
      made = rid('tt_');
      writeDoc(e.id, Object.assign({}, doc, {days: doc.days.filter(x => x !== d), updatedAt: nowIso()}));
      writeDoc(made, Object.assign({}, doc, {days: [d], link: null, createdAt: nowIso(), updatedAt: nowIso()}));
      TTSEL = {id: made, d};
    } else {
      writeDoc(e.id, Object.assign({}, doc, {link: null, updatedAt: nowIso()}));
      const rest = ttGroupOf(e, list).filter(g => g.id !== e.id);
      if (rest.length === 1 && rest[0].days.length === 1) writeDoc(rest[0].id, Object.assign({}, getDoc(rest[0].id), {link: null}));
    }
    toast(WD[d] + '요일 ' + e.name + '을 따로 움직여요', [['되돌리기', () => { if (made) removeDoc(made); ttRestore(snap); TTSEL = {id: e.id, d}; }]]);
    return;
  }
  const others = list.filter(x => x.id !== e.id && ttNameKey(x.name) === ttNameKey(e.name));
  if (!others.length) { toast('같은 이름의 수업이 없어요. 복제하면 함께 연결돼요'); return; }
  const lk = (others.find(x => x.link) || {}).link || rid('lk_'), snap = ttSnapshot([e.id].concat(others.map(x => x.id)));
  [e].concat(others).forEach(x => writeDoc(x.id, Object.assign({}, getDoc(x.id), {link: lk, updatedAt: nowIso()})));
  toast('같은 이름 수업과 연결했어요. 시각·길이를 함께 바꿔요', [['되돌리기', () => ttRestore(snap)]]);
}
function ttDelOpen(e, d){
  const multi = ttLinked(e);
  if (!multi) { const keep = getDoc(e.id); removeDoc(e.id); TTSEL = null; toast('시간표에서 지웠어요', [['되돌리기', () => writeDoc(e.id, keep)]]); return; }
  openSheet({title: e.name + ' 지우기', draw: () => setSheet('<div class="menu tt-menu">' +
    '<button type="button" class="menu-row" data-act="tt-x-del1" data-id="' + esc(e.id) + '" data-d="' + d + '"><span class="mi">' + ICON.close + '</span><span class="ml">' + WD[d] + '요일만 지우기</span></button>' +
    '<button type="button" class="menu-row danger" data-act="tt-x-delall" data-id="' + esc(e.id) + '"><span class="mi">' + ICON.trash + '</span><span class="ml">연결된 수업 모두 지우기</span></button></div>', '')});
}
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const el = ev.target.closest('[data-act^="tt-x-"]');
  if (!el) {
    // 편집 중에 블록·도구 줄 밖을 누르면 편집을 마친다
    if (TTSEL && S.view === 'tt' && !SH && !ev.target.closest('.tt-b,.tt-bar') && Date.now() - ttGest.until > 400) ttUnselect();
    return;
  }
  ev.preventDefault(); ev.stopPropagation();
  const act = el.dataset.act;
  if (act === 'tt-x-del1') { const id = el.dataset.id, d = +el.dataset.d, keep = getDoc(id); closeSheet(); if (keep) { if (keep.days.length > 1) writeDoc(id, Object.assign({}, keep, {days: keep.days.filter(x => x !== d), updatedAt: nowIso()})); else removeDoc(id); TTSEL = null; toast(WD[d] + '요일에서 지웠어요', [['되돌리기', () => writeDoc(id, keep)]]); } return; }
  if (act === 'tt-x-delall') { const e = ttList().find(x => x.id === el.dataset.id); closeSheet(); if (e) { const g = ttGroupOf(e), snap = ttSnapshot(g.map(x => x.id)); g.forEach(x => removeDoc(x.id)); TTSEL = null; toast('연결된 수업을 모두 지웠어요', [['되돌리기', () => ttRestore(snap)]]); } return; }
  if (!TTSEL) return;
  const e = ttList().find(x => x.id === TTSEL.id); if (!e) { TTSEL = null; render(); return; }
  if (act === 'tt-x-done') { ttUnselect(); return; }
  if (act === 'tt-x-clip') { ttClip(e, TTSEL.d); render(); return; }
  if (act === 'tt-x-off') {
    const nd = ttNextDate(TTSEL.d), doc = getDoc(e.id), keep = JSON.parse(JSON.stringify(doc)), sk = Object.assign({}, doc.skip || {}), lim = ymd(addDays(parseYmd(M.today), -14));
    Object.keys(sk).forEach(k => { if (k < lim) delete sk[k]; });
    const was = !!sk[nd]; if (was) delete sk[nd]; else sk[nd] = true;
    writeDoc(e.id, Object.assign({}, doc, {skip: Object.keys(sk).length ? sk : null, updatedAt: nowIso()}));
    const x = parseYmd(nd);
    toast(was ? (x.getMonth() + 1) + '월 ' + x.getDate() + '일 ' + e.name + ' 다시 켰어요' : (x.getMonth() + 1) + '월 ' + x.getDate() + '일(' + WD[x.getDay()] + ') ' + e.name + ' 휴강 · 그날 알람도 쉬어요', [['되돌리기', () => writeDoc(e.id, keep)]]);
    render(); return;
  }
  if (act === 'tt-x-edit') { const id = e.id; TTSEL = null; ttOpen(id); return; }
  if (act === 'tt-x-del') { ttDelOpen(e, TTSEL.d); render(); return; }
  if (act === 'tt-x-dup') {
    // 복제는 같은 이름이라 처음부터 연결된다
    const lk = e.link || rid('lk_'); if (!e.link) writeDoc(e.id, Object.assign({}, getDoc(e.id), {link: lk}));
    TTSEL = null; ttOpen(null, {name: e.name, days: [], start: e.start, end: e.end, place: e.place, remind: e.remind, color: e.color, link: lk, hint: '복제했어요. 넣을 요일을 골라 주세요. 원래 수업과 연결돼 시각·길이를 함께 바꿔요.'});
  }
}, true);

/* 끌기: 꾹 눌러 편집 모드로, 편집 중인 블록은 몸통을 끌면 옮기기, 위·아래 끝을 끌면 길이 */
const ttGest = {until: 0, lp: null, g: null};
function ttStartDrag(blk, e, d, kind, x, y, pid){
  const a = toMin(e.start), b = Math.max(toMin(e.end || e.start), a + 20);
  const cols = $$('.tt-col[data-d]').map(c => ({d: +c.dataset.d, r: c.getBoundingClientRect()}));
  ttGest.g = {blk, e, d, kind, x, y, a, b, na: a, nb: b, nd: d, h0: +blk.dataset.h0 || 0, cols, moved: false};
  try { if (pid != null) blk.setPointerCapture(pid); } catch (err) { /* 일부 기기 */ }
  blk.classList.add('drag');
}
document.addEventListener('pointerdown', ev => {
  const blk = ev.target.closest && ev.target.closest('.tt-b'); if (!blk || !window.BX_APP || blk.dataset.d == null) return;
  const e = ttList().find(x => x.id === blk.dataset.id); if (!e) return;
  const d = +blk.dataset.d;
  if (TTSEL && TTSEL.id === e.id && TTSEL.d === d) {
    ev.preventDefault();
    const hd = ev.target.closest('[data-tt-rs]');
    ttStartDrag(blk, e, d, hd ? hd.dataset.ttRs : 'move', ev.clientX, ev.clientY, ev.pointerId);
    return;
  }
  const pid = ev.pointerId;
  ttGest.lp = {x: ev.clientX, y: ev.clientY, t: setTimeout(() => {
    const lp = ttGest.lp; ttGest.lp = null; ttGest.until = Date.now();
    try { if (navigator.vibrate) navigator.vibrate(15); } catch (err) { /* 진동 없음 */ }
    TTSEL = {id: e.id, d}; ttSelectDom(blk);
    // 손을 떼지 않았으니 그대로 끌어 옮길 수 있다
    if (lp) ttStartDrag(blk, e, d, 'move', lp.x, lp.y, pid);
  }, 450)};
}, true);
// 들어 올린 뒤 손가락을 움직일 때 화면이 같이 밀리지 않게
document.addEventListener('touchmove', ev => { if (ttGest.g) ev.preventDefault(); }, {capture: true, passive: false});
document.addEventListener('pointermove', ev => {
  if (ttGest.lp && (Math.abs(ev.clientX - ttGest.lp.x) > 8 || Math.abs(ev.clientY - ttGest.lp.y) > 8)) { clearTimeout(ttGest.lp.t); ttGest.lp = null; }
  const g = ttGest.g; if (!g) return;
  ev.preventDefault();
  const dm = Math.round((ev.clientY - g.y) / TT_PX * 60 / TT_SNAP) * TT_SNAP, len = g.b - g.a;
  if (Math.abs(ev.clientY - g.y) > 4 || Math.abs(ev.clientX - g.x) > 4) g.moved = true;
  if (!g.moved) return;
  if (g.kind === 'e') { g.na = g.a; g.nb = Math.max(g.a + 20, Math.min(1439, g.b + dm)); }
  else if (g.kind === 's') { g.na = Math.min(g.b - 20, Math.max(0, g.a + dm)); g.nb = g.b; }
  else {
    g.na = Math.max(0, Math.min(1439 - len, g.a + dm)); g.nb = g.na + len;
    const col = g.cols.find(c => ev.clientX >= c.r.left && ev.clientX < c.r.right); if (col) g.nd = col.d;
    const tc = g.cols.find(c => c.d === g.nd), oc = g.cols.find(c => c.d === g.d);
    g.blk.style.transform = tc && oc ? 'translateX(' + (tc.r.left - oc.r.left).toFixed(1) + 'px)' : '';
  }
  g.blk.style.top = ((g.na - g.h0 * 60) / 60 * TT_PX).toFixed(1) + 'px';
  g.blk.style.height = Math.max(22, (g.nb - g.na) / 60 * TT_PX - 2).toFixed(1) + 'px';
  g.blk.setAttribute('data-rs-t', (g.nd !== g.d ? WD[g.nd] + ' ' : '') + ttFmtRange(g.na, g.nb));
  g.blk.classList.add('rs');
  const bar = document.getElementById('tt-bar'); if (bar) bar.style.visibility = 'hidden';
}, {capture: true, passive: false});
function ttGestEnd(){
  if (ttGest.lp) { clearTimeout(ttGest.lp.t); ttGest.lp = null; }
  const g = ttGest.g; if (!g) return;
  ttGest.g = null; ttGest.until = Date.now();
  g.blk.classList.remove('drag');
  if (!g.moved || (g.na === g.a && g.nb === g.b && g.nd === g.d)) {
    g.blk.classList.remove('rs'); g.blk.style.transform = '';
    if (g.moved) render(); else { const bar = document.getElementById('tt-bar'); if (bar) { bar.style.visibility = ''; ttPlaceBar(); } }
    return;
  }
  ttCommit(g.e, g.d, g.na, g.nb, g.nd);
  render();
}
document.addEventListener('pointerup', ttGestEnd, true);
document.addEventListener('pointercancel', ttGestEnd, true);
// 꾹 누르기·끌기를 끝내며 손을 뗄 때 생기는 클릭은 버린다
window.addEventListener('click', ev => {
  if (Date.now() - ttGest.until > 600 || !ev.target.closest || ev.target.closest('.tt-bar')) return;
  if (ev.target.matches('.scrim') || ev.target.closest('.tt-b') || ev.target.closest('.tt-body')) { ev.preventDefault(); ev.stopPropagation(); }
}, true);
document.addEventListener('contextmenu', ev => { if (ev.target.closest && ev.target.closest('.tt-b')) ev.preventDefault(); }, true);
