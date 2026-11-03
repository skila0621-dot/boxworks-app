/* 시험판 36(11/3 오후)
   1) 말로 넣기: 달 없이 'N일'만 말해도 날짜로(대표 지적 11/3: "17일 오후 3시 늘푸른 병원 예약"이 오늘 15시로 들어감).
      이번 달 그날이 아직 안 지났으면 이번 달, 지났으면 다음 달(그 달에 없는 날이면 그날이 있는 다음 달).
      다음 달로 넣었으면 제목 아래에 '이번 달 N일로'를 한 번 눌러 바꿀 수 있다(대표: 과거로 · 다음 달로 알아듣는 경우도 대응).
      'N일 뒤 · N일 후'는 오늘부터 N일 뒤. 'N일 동안 · N일간 · N일째 · N일마다 · N일 연속 · 1일 1회'는 날짜가 아니다.
      오늘 · 내일 · 모레 · 다음 주처럼 다른 날짜 말이 함께 있으면 그쪽을 따른다.
   2) 새 일정의 날짜가 오늘보다 앞이면 제목 아래에 '지난 날짜예요'(말한 날짜든 고른 날짜든)
   3) 홈 화면 위젯(대표 요청 11/3, 위젯 시안 A): 밀어 보는 목록 · '루틴 포함 | 일정만' · '일정 추가'와 '말하기' 따로.
      위젯 쪽은 BxWidgetProvider · BxWidgetService(안드로이드), 여기서는 줄을 눌렀을 때 열 화면
   4) 목록 줄 정렬(아래 bxRowAlignStyle)
   5) 말로 넣기: 장소도 알아듣기(대표 확인 11/3 "날짜 및 장소 분류가 안 된다"). 제목은 말한 그대로 두고 장소 칸에 넣는다
   화면 구조를 바꾸는 부분은 scripts/patches-v36.mjs */

var BXQ_ALT = null;
function bxYmdText(x){ return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); }
// 달 없이 말한 날(d)을 날짜로. 오늘 이전이면 다음 달부터, 그 달에 없는 날(31일 등)이면 그날이 있는 달까지
function bxDayOnlyDate(d, today){
  if (!(d >= 1 && d <= 31)) return null;
  const m0 = today.getMonth() + (d < today.getDate() ? 1 : 0);
  for (let k = 0; k < 13; k++) { const x = new Date(today.getFullYear(), m0 + k, d); if (x.getDate() === d) return x; }
  return null;
}
function bxDayOnlyPre(s, now){
  BXQ_ALT = null;
  const today = sod(now);
  // 'N일 뒤 · N일 후' → 오늘부터 N일 뒤
  s = s.replace(/(?<![\d.\/-])(\d{1,3})\s*일\s*(?:뒤|후)(?=\s|에|$)/g, (m, n) => ' ' + bxYmdText(addDays(today, +n)) + ' ');
  // 날짜가 이미 있거나(연-월-일 · 월 일 · 월/일), 다른 날짜 말이 있으면 'N일'은 건드리지 않는다
  if (/\d{4}[-.\/]\d{1,2}[-.\/]\d{1,2}|\d{1,2}\s*월\s*\d{1,2}\s*일|(^|\s)\d{1,2}\/\d{1,2}(?=\s|$)|오늘|금일|내일|모레|글피|(이번|다음|다다음|담|차|금)\s*주/.test(s)) return s;
  let once = false;
  return s.replace(/(?<![\d.\/-])(?<!\d\s*월\s*)(\d{1,2})\s*일(\s*날)?(?!(?:차|째|간|치|씩|정|주|요일)|\s*(?:동안|마다|이내|연속|뒤|후|전|만에|안에|안으로|내로|내에|\d))/g, (m, n) => {
    if (once) return m;
    const d = +n, x = bxDayOnlyDate(d, today); if (!x) return m;
    once = true;
    // 다음 달로 넘겼으면 이번 달 그날(지난 날)을 바꿀 거리로 남긴다
    if (d < today.getDate()) BXQ_ALT = {chosen: bxYmdText(x), alt: bxYmdText(new Date(today.getFullYear(), today.getMonth(), d)), day: d};
    return ' ' + bxYmdText(x) + ' ';
  });
}
function bxDayOnlyTag(r){
  if (r && BXQ_ALT && r.date === BXQ_ALT.chosen) { r.alt = BXQ_ALT.alt; r.altDay = BXQ_ALT.day; }
  return r;
}
// 새 일정 창: 제목 아래 해석 결과 밑에 한 줄(다음 달로 넣었음 · 지난 날짜). 단추로 이번 달 ↔ 다음 달을 오간다
function bxDateNote(p){
  if (!F || F.mode !== 'new' || !isDate(F.date)) return '';
  const today = ymd(new Date()), md = d => (parseYmd(d).getMonth() + 1) + '월 ' + parseYmd(d).getDate() + '일';
  const btn = d => '<button type="button" class="btn sm" data-act="bx-date-alt" data-d="' + esc(d) + '">' + md(d) + '로</button>';
  const a = p && p.alt ? {next: p.date, past: p.alt, day: p.altDay} : null;
  if (a && F.date === a.next) return '<div class="hint bx-dn">' + ICON.cal + '<span>' + a.day + '일은 지나서 ' + (parseYmd(a.next).getMonth() + 1) + '월로 넣었어요</span>' + btn(a.past) + '</div>';
  if (F.date < today) return '<div class="hint bx-dn warn">' + ICON.alert + '<span>지난 날짜예요</span>' + (a && F.date === a.past ? btn(a.next) : '') + '</div>';
  return '';
}
document.addEventListener('click', ev => {
  const b = window.BX_APP && ev.target.closest && ev.target.closest('[data-act="bx-date-alt"]'); if (!b || !F) return;
  ev.preventDefault(); ev.stopPropagation();
  const d = b.dataset.d; if (!isDate(d)) return;
  F.date = d; F.touchedDate = true;
  drawFHint(); drawFDate(); if (typeof updRemWhen === 'function') updRemWhen();
}, true);
// 위젯의 줄을 누르면(BxWidget 'open' {k, id, ds}): 일정은 고치기 창, 루틴 · 시간표는 그 화면, 없어진 일정이면 그날 홈
window.BX_openFromWidget = function(o){
  if (!o || !M) return;
  if (SH) closeSheet();
  if (o.k === 'item' && o.id && getDoc(o.id) && !getDoc(o.id).deletedAt) { openEdit(o.id); return; }
  if (o.k === 'routine' && bxModOn('routines')) { go('routines'); return; }
  if (o.k === 'tt' && bxModOn('tt')) { go('tt'); return; }
  go('today');
};

/* 4) 목록 줄 정렬(대표 지적 11/3 "정렬이 흐트러졌다"): 시작 시각 · 제목 · 왼쪽 표시(체크 · 점 · 아이콘) · 오른쪽 단추를 첫 줄 한가운데에 맞춘다.
      전에는 줄 안을 가운데 맞춤이라 제목이 두 줄 시각(시작 · 끝)의 가운데로 내려가거나, 시각이 제목 · 장소 두 줄의 가운데로 내려갔다.
      첫 줄 높이 22px, 위아래 13px. 끝 시각 · 장소 같은 둘째 줄은 그 밑으로 */
(function bxRowAlignStyle(){
  if (!window.BX_APP) return;
  const st = document.createElement('style');
  st.textContent = [
    '.bx-app .row{align-items:flex-start;padding-top:0!important;padding-bottom:0!important;min-height:48px}',
    '.bx-app .row-main{align-items:flex-start;min-height:48px;padding:13px 0;box-sizing:border-box}',
    '.bx-app .row-time{gap:1px}',
    '.bx-app .row-time b,.bx-app .row-title{line-height:22px}',
    '.bx-app .row-body{gap:2px}',
    '.bx-app .row > .chk{margin-top:12px}',
    '.bx-app .row.tt-row > .tt-dot,.bx-app .bx-tl .row.tt-row > .tt-dot{margin-top:18px}',
    '.bx-app .row > .lamp{align-self:flex-start;margin-top:calc(24px - var(--bx-lamp-h, 32px) / 2)}',
    '.bx-app .bx-tl-rt .rt-h{align-items:flex-start}',
    '.bx-app .bx-tl-rt .rt-h .bx-ic{margin-top:-1px}',
    '.bx-app .bx-tl-rt .bx-tl-t .bx-tl-s,.bx-app .bx-tl-rt .rt-h b{line-height:22px}',
    '.bx-app .bx-tl-rt .bx-tl-t{gap:1px}',
    '.bx-app .bx-tl-rt .rt-h .bx-rt-tog{margin-top:-4px}',
    '.bx-app .bx-tl-rt .rt-h [data-act="rt-skip"]{margin-top:-7px}',
    // 위젯 창의 '루틴도 보기' 스위치 줄, 확인 필요 카드 단추의 아이콘(시험판 36)
    '.bx-app .bx-wg-rt{margin-top:14px;gap:12px}.bx-app .bx-wg-rt > span{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}.bx-app .bx-wg-rt small{font-size:13px;color:var(--ink-3)}',
    '.bx-app .bx-lc-a .btn .i{width:16px;height:16px;flex:none}.bx-app .bx-lc-a .btn{gap:5px}'
  ].join('');
  (document.head || document.documentElement).appendChild(st);
})();

/* 5) 장소 알아듣기. "강남역에서 만나" → 강남역, "늘푸른 병원 예약" → 늘푸른 병원, "연세치과 예약" → 연세치과.
   '…에서' 앞의 말은 장소. '에서'가 없으면 병원 · 치과 · 역 · 카페처럼 장소를 뜻하는 말로 끝나고 이름이 붙은 것만(그냥 "치과 예약"은 아님) */
const BX_PLACE_HEAD = ['한의원', '대학병원', '병원', '의원', '치과', '약국', '은행', '카페', '식당', '학교', '학원', '센터', '마트', '백화점', '공원', '도서관', '시청', '구청', '군청', '우체국', '헬스장', '미용실', '호텔', '교회', '성당', '극장', '영화관', '체육관', '대학교', '터미널', '공항', '빌딩', '타워', '회관', '경기장', '수영장', '사무소', '법원', '경찰서', '보건소', '클리닉', '편의점', '서점', '어린이집', '유치원', '초등학교', '중학교', '고등학교', '본사', '매장', '스튜디오'];
const BX_PLACE_STOP = new Set(['출발점', '시작점', '기준점', '교차점', '문제점', '장단점', '공통점', '차이점', '연결점', '중간점', '종착점', '개선점', '특이점']);
const BX_PLACE_NOTNAME = /^(예약|진료|검진|약속|회의|수업|방문|가기|가서|다녀오기|오늘|내일|모레|글피|오전|오후|아침|점심|저녁|밤|새벽|낮|주말|평일|다음|이번|지난|매주|매일|그|이|저|큰|작은|동네|근처|새|우리|내|친구|엄마|아빠|가족)$/;
function bxPlaceHead(w){
  if (!w || BX_PLACE_STOP.has(w)) return 0;
  if (w.length >= 3 && /역$/.test(w)) return 1;
  if (w.length >= 3 && /점$/.test(w)) return 2;
  return BX_PLACE_HEAD.some(h => w.endsWith(h)) ? (BX_PLACE_HEAD.includes(w) ? 3 : 1) : 0;   // 3 = 이름 없이 그 말만("병원")
}
const bxNameOk = w => !!w && !/\d|[시분일]$/.test(w) && !BX_PLACE_NOTNAME.test(w) && !bxPlaceHead(w);
function bxPlaceOf(title){
  const t = String(title || '').replace(/[,.!?~]/g, ' ').split(/\s+/).filter(Boolean);
  // '…에서'
  for (let i = 0; i < t.length; i++) {
    const m = /^(.+?)에서$/.exec(t[i]); if (!m) continue;
    const w = m[1], k = bxPlaceHead(w);
    if ((k === 3 || k === 2) && bxNameOk(t[i - 1])) return t[i - 1] + ' ' + w;
    if (!/\d/.test(w)) return w;
  }
  for (let i = 0; i < t.length; i++) {
    // 조사는 장소 말이 아닐 때만 뗀다('연세치과'의 '과'를 떼면 안 됨)
    let w = t[i], k = bxPlaceHead(w);
    if (!k) { w = w.replace(/(으로|로|에|까지|부터|은|는|이|가|을|를|과|와|랑|이랑|의)$/, ''); k = bxPlaceHead(w); }
    if (!k) continue;
    if (k === 3 || k === 2) { if (bxNameOk(t[i - 1])) return t[i - 1] + ' ' + w; if (k === 3) continue; }
    return w;
  }
  return null;
}
function bxPlaceTag(r){
  if (r && r.title) { const pl = bxPlaceOf(r.title); if (pl) r.place = pl; }
  return r;
}
// 새 일정 창: 알아들은 장소를 장소 칸에(손으로 적은 장소는 건드리지 않음). 제목에서 장소가 빠지면 넣었던 것도 뺀다
function bxPlaceOnParse(p){
  if (!F || F.mode !== 'new') return;
  const loc = (F.location || '').trim(), pl = p && p.place;
  if (pl) { if (!loc || loc === F.bxPlaceAuto) { F.location = pl; F.bxPlaceAuto = pl; } }
  else if (F.bxPlaceAuto && loc === F.bxPlaceAuto) { F.location = ''; F.bxPlaceAuto = null; }
}
function bxPlaceHint(){ return F && F.bxPlaceAuto && (F.location || '').trim() === F.bxPlaceAuto ? ' · 장소 ' + esc(F.bxPlaceAuto) : ''; }
// 위젯의 새 일정(＋) · 말하기(🎤): 위젯이 보고 있던 날짜로 새 일정 창(시험판 36, 대표 결정 11/3 17:01). 오늘이면 + 단추와 같음
window.BX_newOn = function(ds, mic){
  if (!M) return;
  if (SH) closeSheet();
  openEdit(null, isDate(ds) ? {date: ds} : {});
  if (mic) setTimeout(() => { const m = document.querySelector('[data-act="bx-mic"][data-for="f-title"]'); if (m) m.click(); }, 350);
};
