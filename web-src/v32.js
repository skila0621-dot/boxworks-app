/* ---------- 시험판 32 ----------
   대표가 휴대폰에서 시험판 31을 확인하고 고칠 것으로 정한 것(11/3). 설정 묶음은 tidy.js, 명상 5초는 meditation.js,
   '내가 쓸 기능' 설명은 flow.js, 휴대폰을 쓰는 중 알람은 휴대폰 쪽(AlarmRingService) */

/* 루틴 단계: '할 일 / 기다리기' 칸 대신 단계마다 '알람' 스위치(대표 결정 11/3).
   켜면 그 단계 시각에 알람이 울리고 '확인'을 누를 때까지 다시 울린다(할 일). 끄면 울리지 않고 시간만 지나간다(기다리기: 세탁기 돌리기처럼) */
function bxRsAlarmHtml(s, i){
  const on = s.kind !== 'wait';
  return '<span class="bx-rs-al"><span class="bx-rs-al-l" aria-hidden="true">알람</span><button type="button" class="tog" role="switch" aria-checked="' + on + '" aria-label="' + (i + 1) + '번째 단계 알람" data-rs-alarm="' + i + '"><i></i></button></span>';
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-rs-alarm]'); if (!b || !R || !window.BX_APP) return;
  ev.preventDefault(); ev.stopPropagation();
  const st = R.steps[+b.dataset.rsAlarm]; if (!st) return;
  st.kind = st.kind === 'wait' ? 'do' : 'wait';
  b.setAttribute('aria-checked', String(st.kind !== 'wait'));
  rtRedrawParts('prev');
}, true);

/* 루틴 목록에서 루틴을 꾹 누르면 고치기 · 지우기(대표 요청 11/3). 일정 꾹 누르기와 같은 모양, 지운 뒤 되돌리기.
   보이는 대체 길: 누르면 고치기 창, 그 창 맨 아래 '이 루틴 지우기'(규칙 4) */
let bxRlp = null;
function bxRtMenu(rid){
  const rt = M.routines.find(r => r.id === rid); if (!rt) return;
  const p = rtPlan(rt);
  const row = (act, icon, label, sub, warn) => '<button type="button" class="menu-row' + (warn ? ' bx-im-del' : '') + '" data-bx-rm="' + act + '"><span class="mi">' + icon + '</span><span class="ml">' + label + '</span>' + (sub ? '<span class="mv">' + esc(sub) + '</span>' : '') + '</button>';
  openSheet({title: rt.name || '루틴', draw: () => setSheet('<p class="p small" style="margin:-6px 0 10px">' + esc(rtWhenText(rt) + (p.bad ? '' : ' · ' + mm(p.start) + ' 시작')) + '</p><div class="menu">' +
    row('edit', ICON.edit, '수정', '') + row('del', ICON.trash, '삭제', '삭제해도 되돌릴 수 있어요', true) + '</div>', '')});
  SH.bxRm = rid;
}
document.addEventListener('pointerdown', ev => {
  if (!window.BX_APP || (ev.button != null && ev.button > 0) || !ev.target.closest) return;
  const el = ev.target.closest('.rt-item .rt-open[data-rid]'); if (!el) return;
  const rid = el.dataset.rid;
  if (bxRlp) clearTimeout(bxRlp.t);
  bxRlp = {x: ev.clientX, y: ev.clientY, t: setTimeout(() => {
    bxRlp = null; bxIlpAt = Date.now();
    try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) { /* 진동 없음 */ }
    bxRtMenu(rid);
  }, 480)};
}, true);
document.addEventListener('pointermove', ev => { if (bxRlp && (Math.abs(ev.clientX - bxRlp.x) > 10 || Math.abs(ev.clientY - bxRlp.y) > 10)) { clearTimeout(bxRlp.t); bxRlp = null; } }, true);
['pointerup', 'pointercancel'].forEach(t => document.addEventListener(t, () => { if (bxRlp) { clearTimeout(bxRlp.t); bxRlp = null; } }, true));
document.addEventListener('contextmenu', ev => { if (window.BX_APP && ev.target.closest && ev.target.closest('.rt-item')) ev.preventDefault(); }, true);
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-bx-rm]'); if (!b || !SH || !SH.bxRm) return;
  ev.preventDefault(); ev.stopPropagation();
  const rid = SH.bxRm, rt = M.routines.find(r => r.id === rid), op = b.dataset.bxRm;
  closeSheet();
  if (!rt) return;
  if (op === 'edit') { openRoutine(rid); return; }
  if (op === 'del') {
    record([rid]); removeDoc(rid); M = buildModel();
    toast(rt.name + bxJosaUl(rt.name) + ' 삭제했어요.', [['되돌리기', doUndo]]);
  }
}, true);

/* '내가 쓸 기능'의 아침에 오늘 일정 받기: 지금 한 번 받아 보기(대표 지적 11/3: 켰는데 어디서 무엇이 오는지 모름).
   3초 뒤 휴대폰 알림창에 오늘 일정 요약이 온다(아침에 오는 것과 같은 알림) */
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-act="bx-rep-try"]'); if (!b || !window.BX_APP) return;
  ev.preventDefault(); ev.stopPropagation();
  const al = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.BxAlarm;
  if (!al || !al.local) { toast('휴대폰 앱에서 받아 볼 수 있어요'); return; }
  const rep = bxReportFor(M.today), at = Date.now() + 3000;
  al.local({alarms: [{id: 'rep_try_' + at, at, kind: 'report', group: '오늘 일정', title: rep.title, sub: rep.text, body: rep.text, report: rep}]})
    .then(() => toast('3초 뒤 알림창에 와요. 휴대폰 위쪽을 내려 보세요.'))
    .catch(() => toast('알림을 보내지 못했어요. 알림이 켜져 있는지 봐 주세요.'));
}, true);

(function bxV32Style(){
  if (!window.BX_APP) return;
  const st = document.createElement('style');
  st.textContent = [
    // 설정 묶음 화면: 왼쪽 위 ‹ 단추와 제목
    '.bx-app .bx-set-subh{display:flex;align-items:center;gap:4px}',
    '.bx-app .bx-set-back{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;margin-left:-10px;border:0;border-radius:12px;background:none;color:var(--ink)}',
    '.bx-app .bx-set-back .i{width:24px;height:24px}',
    '.bx-app .bx-set-home .menu-row .mv{max-width:58%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.bx-app .bx-set-foot{margin:14px 4px 0;text-align:center;color:var(--ink-3)}',
    // 루틴 단계의 알람 스위치: 분 칸 오른쪽, 위·지우기 단추 앞
    '.bx-app .bx-rs-al{display:inline-flex;align-items:center;justify-content:flex-end;gap:8px;min-height:44px}',
    '.bx-app .bx-rs-al-l{font-size:14px;font-weight:600;color:var(--ink-2)}',
    '.bx-app .bx-rs-note{margin:2px 0 8px}',
    // 내가 쓸 기능: 줄마다 한 줄 설명, 아침 일정은 켜면 아래에 언제 오는지와 단추 둘
    '.bx-app .bx-ft-t{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}',
    '.bx-app .bx-ft-t small{font-size:12.5px;font-weight:400;color:var(--ink-3)}',
    '.bx-app .bx-ft-more{margin:-2px 0 4px;padding:10px 12px;border-radius:12px;background:var(--sunk)}',
    '.bx-app .bx-ft-more .p{margin:0 0 8px}',
    '.bx-app .bx-ft-acts{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}',
    // 명상 시작 전 5초: 원 가운데에 큰 숫자, 아래 안내 두 줄까지
    '.bx-app .bx-med-run.lead .bx-med-left{font-size:44px}',
    '.bx-app .bx-med-run.lead .bx-med-cue{max-width:150px;text-align:center;word-break:keep-all;line-height:1.35}'
  ].join('');
  (document.head || document.documentElement).appendChild(st);
})();
