/* 시험판 36(11/3 오후)
   1) 말로 넣기: 달 없이 'N일'만 말해도 날짜로(대표 지적 11/3: "17일 오후 3시 늘푸른 병원 예약"이 오늘 15시로 들어감).
      이번 달 그날이 아직 안 지났으면 이번 달, 지났으면 다음 달(그 달에 없는 날이면 그날이 있는 다음 달).
      다음 달로 넣었으면 제목 아래에 '이번 달 N일로'를 한 번 눌러 바꿀 수 있다(대표: 과거로 · 다음 달로 알아듣는 경우도 대응).
      'N일 뒤 · N일 후'는 오늘부터 N일 뒤. 'N일 동안 · N일간 · N일째 · N일마다 · N일 연속 · 1일 1회'는 날짜가 아니다.
      오늘 · 내일 · 모레 · 다음 주처럼 다른 날짜 말이 함께 있으면 그쪽을 따른다.
   2) 새 일정의 날짜가 오늘보다 앞이면 제목 아래에 '지난 날짜예요'(말한 날짜든 고른 날짜든)
   3) 홈 화면 위젯(대표 요청 11/3, 위젯 시안 A): 밀어 보는 목록 · '루틴 포함 | 일정만' · '일정 추가'와 '말하기' 따로.
      위젯 쪽은 BxWidgetProvider · BxWidgetService(안드로이드), 여기서는 줄을 눌렀을 때 열 화면
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
