/* ---------- 시험판 31 ----------
   알람 공휴일 제외(대표 요청 11/2: "알람을 공휴일 제외 기능도 있으면 좋겠군요". 결정: 루틴마다 '공휴일에는 쉬기', 처음엔 꺼 둠).
   공휴일 표(HOLIDAYS: 2026~2027년, 대체공휴일·선거일 포함)에 있는 날은 그 루틴이 쉰다. 알람 · 홈 · 위젯 · 아침 일정 알림이
   모두 rtActiveOn 하나를 보므로 거기서 한 번만 거른다(scripts/patches-v31.mjs). 그날만 하려면 홈의 쉬는 줄에서 '오늘은 하기' */
function bxHolRun(rt, ds){ const lg = M && M.rlogs && M.rlogs.get(rt.id + '|' + ds); return !!(lg && lg.holRun); }
// 원래 그 요일에 하는 루틴인데 공휴일이라 쉬는 날(그날 '오늘은 하기'를 눌렀으면 쉬지 않음)
function bxHolOff(rt, ds){
  return !!(rt && rt.skipHol && rt.on && !rt.once && HOLIDAYS[ds] && rt.days.includes(parseYmd(ds).getDay()) && !bxHolRun(rt, ds));
}
// 받침이 있으면 '이라'·'을', 없으면 '라'·'를'(개천절이라 · 추석 연휴라 / 아침 준비를 · 출근을)
function bxBatchim(w){ const c = String(w || '').trim().slice(-1).charCodeAt(0); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 > 0; }
const bxJosaIra = w => bxBatchim(w) ? '이라' : '라';
const bxJosaUl = w => bxBatchim(w) ? '을' : '를';
function bxHolNote(ds){ const h = HOLIDAYS[ds] || '공휴일'; return '오늘은 ' + h + bxJosaIra(h) + ' 쉬어요.'; }

// 루틴 고치기 창: 요일 바로 아래에 '공휴일에는 쉬기' 스위치(켜고 끄는 칸은 스위치 하나). 켜면 바로 아래에 한 줄 안내
function bxHolRowHtml(){
  return '<div class="bx-swrow bx-holrow"><span>공휴일 제외</span>' + bxSwitch('data-rhol', !!R.skipHol, '공휴일 제외') + '</div>' +
    '<p class="p small bx-hol-note"' + (R.skipHol ? '' : ' hidden') + '>설날·추석 같은 공휴일과 대체공휴일에는 이 루틴 알람이 울리지 않아요. 그날만 하려면 홈에서 ‘오늘은 하기’를 눌러요.</p>';
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-rhol]'); if (!b || !R || !window.BX_APP) return;
  ev.preventDefault(); ev.stopPropagation();
  R.skipHol = !R.skipHol;
  b.setAttribute('aria-checked', String(R.skipHol)); b.setAttribute('data-rhol', R.skipHol ? '0' : '1');
  const n = document.querySelector('#sheet-root .bx-hol-note'); if (n) n.hidden = !R.skipHol;
}, true);
// 홈: 공휴일이라 쉬는 루틴 줄의 '오늘은 하기' → 그날 기록에 holRun(알람이 다시 잡힌다)
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-act="bx-holrun"]'); if (!b || !window.BX_APP) return;
  ev.preventDefault(); ev.stopPropagation();
  const rt = M.routines.find(r => r.id === b.dataset.rid); if (!rt) return;
  bxHolRunOn(rt);
}, true);
function bxHolRunOn(rt){
  rtPatchLog(rt.id, l => { l.holRun = true; });
  toast('오늘은 ' + rt.name + bxJosaUl(rt.name) + ' 해요. 알람도 울려요.');
}
// 모양 규칙은 web-src/app.css로 옮김(시험판 54 덧칠 정리)
