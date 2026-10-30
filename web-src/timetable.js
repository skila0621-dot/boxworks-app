/* ---------- 시간표 (D-06) ----------
 * 매주 반복되는 수업·알바·학원. 문서 종류 'tt':
 *   {type:'tt', name, days:[0..6], start:'HH:MM', end:'HH:MM', place, remind:'10'|'' , color, on}
 * 박스웍스 안(IIFE)에 그대로 끼워 넣어 박스웍스의 저장·창·알림 함수를 같이 쓴다.
 * scripts/build-web.mjs가 이 파일을 boot() 바로 앞에 넣는다.
 */
const TT_COLORS = ['#2a78d6', '#1baf7a', '#eda100', '#e87ba4', '#6250d6', '#e34948', '#0b8f8f'];
const TT_ORDER = [1, 2, 3, 4, 5, 6, 0];
const TT_REMS = [['', '없음'], ['0', '정시'], ['5', '5분 전'], ['10', '10분 전'], ['30', '30분 전']];
let TT = null;

function ttList(){
  const out = [];
  allDocs().forEach((d, id) => { if (d && d.type === 'tt' && !d.deletedAt) out.push(Object.assign({}, d, {id})); });
  return out.sort((a, b) => toMin(a.start) - toMin(b.start) || String(a.name).localeCompare(String(b.name)));
}
function ttOn(e, ds){ return e.on !== false && Array.isArray(e.days) && e.days.includes(parseYmd(ds).getDay()); }
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

/* 주간 탭 위쪽 '주간 일정 | 시간표' 전환 */
function ttModeBar(cur){
  return '<div class="tt-mode"><div class="seg" role="group" aria-label="주간 보기" style="width:220px">' +
    '<button type="button" data-act="tt-mode" data-mode="list" aria-pressed="' + (cur === 'list') + '">주간 일정</button>' +
    '<button type="button" data-act="tt-mode" data-mode="tt" aria-pressed="' + (cur === 'tt') + '">시간표</button></div></div>';
}

function ttHtml(){
  const list = ttList();
  VBAR = {title: '시간표', nav: ''};
  const usedWeekend = list.some(e => e.days.includes(6) || e.days.includes(0));
  const cols = usedWeekend ? TT_ORDER : [1, 2, 3, 4, 5];
  let h0 = 9, h1 = 18;
  list.forEach(e => { h0 = Math.min(h0, Math.floor(toMin(e.start) / 60)); h1 = Math.max(h1, Math.ceil(toMin(e.end || e.start) / 60)); });
  h1 = Math.min(24, Math.max(h1, h0 + 6));
  const PX = 52, H = (h1 - h0) * PX;
  const todayDow = M.now.getDay(), nowM = M.now.getHours() * 60 + M.now.getMinutes();
  let head = '<div class="tt-h tt-tc"></div>' + cols.map(d => '<div class="tt-h' + (d === todayDow ? ' today' : '') + (d === 0 ? ' sun' : d === 6 ? ' sat' : '') + '">' + WD[d] + '</div>').join('');
  let lines = '';
  for (let h = h0; h <= h1; h++) lines += '<div class="tt-line" style="top:' + ((h - h0) * PX) + 'px"><span>' + (h === 24 ? 0 : h) + '</span></div>';
  const colsHtml = cols.map(d => {
    const blocks = list.filter(e => e.on !== false && e.days.includes(d)).map(e => {
      const a = toMin(e.start), b = Math.max(toMin(e.end || e.start), a + 20);
      const top = (a - h0 * 60) / 60 * PX, ht = Math.max(22, (b - a) / 60 * PX - 2);
      return '<button type="button" class="tt-b" data-act="tt-edit" data-id="' + esc(e.id) + '" style="top:' + top.toFixed(1) + 'px;height:' + ht.toFixed(1) + 'px;--c:' + (e.color || TT_COLORS[0]) + '" aria-label="' + esc(WD[d] + '요일 ' + e.start + ' ' + e.name + (e.place ? ' ' + e.place : '')) + '">' +
        '<b>' + esc(e.name) + '</b>' + (e.place && ht > 34 ? '<small>' + esc(e.place) + '</small>' : '') + '</button>';
    }).join('');
    const now = d === todayDow && nowM >= h0 * 60 && nowM <= h1 * 60 ? '<i class="tt-now" style="top:' + ((nowM - h0 * 60) / 60 * PX).toFixed(1) + 'px"></i>' : '';
    return '<div class="tt-col' + (d === todayDow ? ' today' : '') + '">' + blocks + now + '</div>';
  }).join('');
  const add = '<div class="tt-add"><label class="sr" for="tt-in">시간표에 넣기</label><div class="bx-inrow"><input id="tt-in" class="inp" type="text" autocomplete="off" enterkeyhint="done" maxlength="120" placeholder="예) 월수 10시 반부터 12시까지 경영학원론 301호">' +
    bxMic('tt-in', '예) 월수 10시 반부터 12시까지 경영학원론 301호') + '<button type="button" class="btn primary" data-act="tt-add">넣기</button></div></div>';
  const empty = list.length ? '' : '<p class="empty tt-empty">매주 반복되는 수업·알바·학원을 위 칸에 말하거나 적어 보세요. 시작 10분 전에 알람이 울려요.</p>';
  return ttModeBar('tt') +
    '<div class="page-head"><div class="ph-t"><h1>시간표</h1><p><span class="nw">' + (list.length ? '<b>' + list.length + '</b>개 · ' : '') + '매주 반복</span></p></div></div>' + add +
    '<div class="tt-sub"><span class="p small">요일·시각·장소를 알아들어요</span><button type="button" class="sec-link" data-act="tt-new">' + ICON.plus + '직접 고르기</button></div>' + empty +
    '<div class="tt-wrap"><div class="tt-grid" style="--n:' + cols.length + '">' + head + '</div>' +
    '<div class="tt-body" style="--n:' + cols.length + ';height:' + H + 'px"><div class="tt-lines">' + lines + '</div><div class="tt-tc"></div>' + colsHtml + '</div></div>';
}

/* 오늘 화면: 그날 시간표 */
function ttTodayHtml(){
  if (S.homeDay) return '';
  const ds = M.today, list = ttList().filter(e => ttOn(e, ds));
  if (!list.length) return '';
  const nowM = M.now.getHours() * 60 + M.now.getMinutes();
  const rows = list.map(e => {
    const past = toMin(e.end || e.start) < nowM;
    const rem = e.remind === '' || e.remind == null ? '' : fromMin(Math.max(0, toMin(e.start) - (+e.remind || 0)));
    return '<div class="row tt-row' + (past ? ' done' : '') + '"><span class="tt-dot" style="--c:' + (e.color || TT_COLORS[0]) + '"></span>' +
      '<button type="button" class="row-main" data-act="tt-edit" data-id="' + esc(e.id) + '"><span class="row-time"><b>' + e.start + '</b>' + (e.end ? '<small>' + e.end + '</small>' : '') + '</span>' +
      '<span class="row-body"><span class="row-title">' + esc(e.name) + '</span><span class="row-meta">' + (e.place ? '<span class="meta">' + ICON.pin + esc(e.place) + '</span>' : '') +
      (rem && !past ? '<span class="meta bx-rem">' + ICON.bell + rem + '</span>' : '') + '</span></span></button></div>';
  }).join('');
  return '<section class="tcard tt-card" aria-labelledby="h-tt-today"><div class="tc-body"><div class="sec-h"><h2 id="h-tt-today">오늘 시간표</h2><span class="sec-sub">' + list.length + '개</span><span class="sp"></span>' +
    '<button type="button" class="sec-link" data-act="tt-go">시간표' + ICON.chevR + '</button></div><div class="list">' + rows + '</div></div></section>';
}

/* 넣기·고치기 창 */
function ttOpen(id, pre){
  const cur = id ? (ttList().find(e => e.id === id) || null) : null;
  const n = ttList().length;
  TT = cur ? Object.assign({}, cur) : Object.assign({id: null, name: '', days: [], start: '09:00', end: '10:00', place: '', remind: '10', color: TT_COLORS[n % TT_COLORS.length]}, pre || {});
  if (!TT.start) TT.start = '09:00';
  if (!TT.end || toMin(TT.end) <= toMin(TT.start)) TT.end = fromMin(Math.min(toMin(TT.start) + 60, 1439));
  openSheet({title: cur ? '시간표 고치기' : '시간표에 넣기', draw: ttDraw, onClose: () => { TT = null; }});
}
function ttDraw(){
  if (!TT) return;
  const dayBtns = TT_ORDER.map(d => '<button type="button" class="tt-dbtn' + (d === 0 ? ' sun' : d === 6 ? ' sat' : '') + '" data-act="tt-day" data-d="' + d + '" aria-pressed="' + TT.days.includes(d) + '">' + WD[d] + '</button>').join('');
  const rems = '<div class="tt-pills" role="group" aria-label="알림">' + TT_REMS.map(r => '<button type="button" class="tt-pill" data-act="tt-rem" data-v="' + r[0] + '" aria-pressed="' + (String(TT.remind) === r[0]) + '">' + r[1] + '</button>').join('') + '</div>';
  const colors = TT_COLORS.map(c => '<button type="button" class="tt-sw" data-act="tt-color" data-c="' + c + '" style="--c:' + c + '" aria-pressed="' + (TT.color === c) + '" aria-label="색"></button>').join('');
  setSheet(
    '<div class="tt-form">' +
      (TT.hint ? '<p class="p small tt-hint">' + esc(TT.hint) + '</p>' : '') +
      '<label class="tt-l" for="tt-name">이름</label><input id="tt-name" class="inp" type="text" maxlength="40" autocomplete="off" placeholder="예) 경영학원론" value="' + esc(TT.name) + '">' +
      '<span class="tt-l">요일</span><div class="tt-days" role="group" aria-label="요일">' + dayBtns + '</div>' +
      '<span class="tt-l">시간</span><div class="tt-times"><input id="tt-start" class="inp" type="time" value="' + TT.start + '" aria-label="시작"><span>–</span><input id="tt-end" class="inp" type="time" value="' + TT.end + '" aria-label="끝"></div>' +
      '<label class="tt-l" for="tt-place">장소</label><input id="tt-place" class="inp" type="text" maxlength="40" autocomplete="off" placeholder="예) 301호" value="' + esc(TT.place || '') + '">' +
      '<span class="tt-l">알림</span>' + rems +
      '<span class="tt-l">색</span><div class="tt-sws">' + colors + '</div>' +
    '</div>',
    (TT.id ? '<button type="button" class="btn" data-act="tt-del">' + ICON.trash + '지우기</button>' : '') + '<button type="button" class="btn primary grow" data-act="tt-save">저장</button>'
  );
}
function ttSave(o){
  const d = {type: 'tt', name: String(o.name || '').trim().slice(0, 40), days: TT_ORDER.filter(x => o.days.includes(x)), start: o.start, end: o.end,
    place: String(o.place || '').trim().slice(0, 40), remind: o.remind == null ? '10' : String(o.remind), color: o.color || TT_COLORS[0], on: true, updatedAt: nowIso()};
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
function ttAddFromText(text){
  text = String(text || '').trim();
  if (!text) { toast('예) 월수 10시 반부터 12시까지 경영학원론 301호'); return; }
  const p = ttParse(text);
  const o = {id: null, name: p.name, days: p.days, start: p.start, end: p.end, place: p.place, remind: '10', color: TT_COLORS[ttList().length % TT_COLORS.length]};
  if (p.name && p.days.length && p.start) {
    const id = ttSave(o);
    const inp = $('#tt-in'); if (inp) inp.value = '';
    toast('시간표에 넣었어요 · ' + ttDaysText(p.days) + ' ' + p.start + '–' + p.end, [['되돌리기', () => removeDoc(id)]]);
    return;
  }
  o.hint = !p.days.length ? '요일을 알아듣지 못했어요. 아래에서 골라 주세요.' : !p.start ? '시각을 알아듣지 못했어요. 아래에서 적어 주세요.' : '이름을 적어 주세요.';
  ttOpen(null, o);
}

/* 시간표 버튼과 입력 */
document.addEventListener('click', ev => {
  const el = ev.target && ev.target.closest && ev.target.closest('[data-act^="tt-"]');
  if (!el) return;
  const act = el.dataset.act;
  ev.preventDefault(); ev.stopPropagation();
  if (act === 'tt-mode') { S.weekMode = el.dataset.mode === 'tt' ? 'tt' : 'list'; lsSet('bx:weekMode', S.weekMode); window.scrollTo(0, 0); render(); return; }
  if (act === 'tt-go') { S.weekMode = 'tt'; lsSet('bx:weekMode', 'tt'); go('week', {}); return; }
  if (act === 'tt-new') { ttOpen(null); return; }
  if (act === 'tt-edit') { ttOpen(el.dataset.id); return; }
  if (act === 'tt-add') { ttAddFromText(($('#tt-in') || {}).value); return; }
  if (!TT) return;
  if (act === 'tt-day') { const d = +el.dataset.d; TT.days = TT.days.includes(d) ? TT.days.filter(x => x !== d) : TT.days.concat([d]); el.setAttribute('aria-pressed', TT.days.includes(d)); return; }
  if (act === 'tt-rem') { TT.remind = el.dataset.v; $$('[data-act="tt-rem"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === TT.remind)); return; }
  if (act === 'tt-color') { TT.color = el.dataset.c; $$('[data-act="tt-color"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.c === TT.color)); return; }
  if (act === 'tt-del') { const id = TT.id, keep = getDoc(id); closeSheet(); removeDoc(id); toast('시간표에서 지웠어요', [['되돌리기', () => writeDoc(id, keep)]]); return; }
  if (act === 'tt-save') {
    TT.name = ($('#tt-name') || {}).value || TT.name; TT.place = ($('#tt-place') || {}).value || '';
    const st = ($('#tt-start') || {}).value, en = ($('#tt-end') || {}).value;
    if (isHM(st)) TT.start = st;
    TT.end = isHM(en) && toMin(en) > toMin(TT.start) ? en : fromMin(Math.min(toMin(TT.start) + 60, 1439));
    const err = ttCheck(TT); if (err) { toast(err); return; }
    const o = Object.assign({}, TT); closeSheet(); ttSave(o); toast(o.id ? '고쳤어요' : '시간표에 넣었어요'); return;
  }
}, true);
document.addEventListener('keydown', ev => {
  if (ev.key === 'Enter' && !ev.isComposing && ev.target && ev.target.id === 'tt-in') { ev.preventDefault(); ttAddFromText(ev.target.value); }
});
S.weekMode = lsGet('bx:weekMode') === 'tt' ? 'tt' : 'list';
