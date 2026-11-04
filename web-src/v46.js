/* ---------- 시험판 46: 삼성 기준 점검 계속(대표 11/4 1:34 "기존 메뉴의 위치가 변동되는 방식은 혼란", 결정 기록 D-20) ----------
   1) 확인 필요 카드의 '날짜 변경': 카드 아래로 날짜 · 시각 칸이 펼쳐져 아래 카드가 밀리던 것을 페이지로.
      내일 · 모레 · 다음 주 월요일 칸, 날짜 · 시각 줄(누르면 휴대폰 달력 · 시계 창). '완료'를 누르면 옮기고, ‹ 는 그대로
   2) 새 루틴의 템플릿 칸은 채운 상자(창 끝에서 12, 글자 32), 홈 요약 상자 안 20(시험판 44 규칙이 눌려 있던 것),
      '오늘의 메모' 제목 20(같은 화면의 '오늘 할 일'과 같게) */
function bxLate46Md(ds){ const d = parseYmd(ds); return (d.getMonth() + 1) + '/' + d.getDate(); }
function bxLate46Html(it){
  const t0 = parseYmd(M.today), d1 = ymd(addDays(t0, 1)), d2 = ymd(addDays(t0, 2));
  const nm = ymd(addDays(t0, ((8 - t0.getDay()) % 7) || 7));
  const picks = [[d1, '내일'], [d2, '모레']].concat(nm !== d1 && nm !== d2 ? [[nm, '다음 주 월']] : []);
  return '<div class="picks bx-late46-q" role="group" aria-label="빨리 고르기">' + picks.map(p => '<button type="button" class="pick" data-bxlate46="' + p[0] + '" aria-pressed="' + (p[0] === d1) + '">' + p[1] + '<small>' + bxLate46Md(p[0]) + '</small></button>').join('') + '</div>' +
    '<div class="bx-ep-box bx-late46-box">' +
      '<div class="bx-er bx-rt45-v"><span class="bx-er-ic" aria-hidden="true">' + ICON.cal + '</span><label class="bx-er-t" for="bx-lc-date">날짜</label><input type="date" id="bx-lc-date" class="bx-rt45-time" value="' + d1 + '" min="' + esc(M.today) + '"></div>' +
      '<div class="bx-er bx-rt45-v"><span class="bx-er-ic" aria-hidden="true">' + ICON.clock + '</span><label class="bx-er-t" for="bx-lc-time">시각</label><input type="time" id="bx-lc-time" class="bx-rt45-time" value="' + esc(it.start || '') + '"></div>' +
    '</div>' +
    '<p class="p small bx-ep-note">' + (it.start ? '완료를 누르면 옮겨요. 걸리는 시간은 그대로예요.' : '완료를 누르면 옮겨요. 시각을 적으면 그 시각 일정이 돼요.') + '</p>' +
    '<button type="button" hidden data-bx-late="move" data-id="' + esc(it.id) + '"></button>';
}
const bxLatePick46 = bxLatePickDate;
bxLatePickDate = function(id){
  if (!window.BX_APP) return bxLatePick46.apply(this, arguments);
  const it = getDoc(id), sb = document.getElementById('sheet-b'); if (!it || !sb) return;
  const node = document.createElement('div');
  node.className = 'bx-tt45-pg bx-late46'; node.hidden = true;
  node.innerHTML = bxLate46Html(Object.assign({id}, it));
  sb.appendChild(node);
  bxPgOpen('날짜 변경', node, null);
  node.hidden = false;
};
// '완료' = 옮기기(바탕의 '변경' 단추와 같은 일). ‹ · 휴대폰 뒤로는 그대로 닫기
const bxPgClose46 = bxPgClose;
bxPgClose = function(undo){
  const o = bxPg;
  const r = bxPgClose46.apply(this, arguments);
  if (o && !undo && window.BX_APP && o.node && o.node.classList.contains('bx-late46')) {
    if (!o.node.isConnected) { const sb = document.getElementById('sheet-b'); if (sb) { o.node.hidden = true; sb.appendChild(o.node); } }
    const b = o.node.querySelector('[data-bx-late="move"]');
    if (b && b.isConnected) b.click();
    if (o.node.isConnected) o.node.remove();
  } else if (o && undo && o.node && o.node.classList.contains('bx-late46') && o.node.isConnected) o.node.remove();
  return r;
};
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const q = ev.target.closest('[data-bxlate46]'); if (!q) return;
  ev.preventDefault(); ev.stopPropagation();
  const i = document.getElementById('bx-lc-date'); if (i) i.value = q.dataset.bxlate46;
  document.querySelectorAll('[data-bxlate46]').forEach(b => b.setAttribute('aria-pressed', String(b === q)));
}, true);
document.addEventListener('change', ev => {
  if (!window.BX_APP || !ev.target || ev.target.id !== 'bx-lc-date') return;
  document.querySelectorAll('[data-bxlate46]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.bxlate46 === ev.target.value)));
});

// 모양 규칙은 web-src/app.css로 옮김(시험판 54 덧칠 정리)
