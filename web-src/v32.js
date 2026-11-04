/* ---------- 시험판 32 ----------
   대표가 휴대폰에서 시험판 31을 확인하고 고칠 것으로 정한 것(11/3). 설정 묶음은 tidy.js, 명상 5초는 meditation.js,
   '내가 쓸 기능' 설명은 flow.js, 휴대폰을 쓰는 중 알람은 휴대폰 쪽(AlarmRingService) */

/* 루틴 단계: '할 일 / 기다리기' 칸 대신 단계마다 '알람' 스위치(대표 결정 11/3, D-12).
   시험판 52(대표 11/4 16:58, D-25): 스위치를 세 칸으로 — 꼭 울림(끌 때까지) · 짧게 한 번(누를 것 없음) · 소리 없이(시간만 지나감: 세탁 기다리기처럼).
   소리 없이는 지금처럼 kind 'wait'. 고르지 않은 단계는 자리 · 이름으로 정해진 기본값(v52.js bxStepRing)이 눌린 채 보인다 */
function bxRsAlarmHtml(s, i){
  const cur = bxStepRing(s, i, R ? R.steps : null);
  return '<div class="seg seg3 bx-rs-ring" role="group" aria-label="' + (i + 1) + '번째 단계 알림">' +
    BX_RINGS.map(([v, label]) => '<button type="button" data-rs-ring="' + v + '" data-i="' + i + '" aria-pressed="' + (v === cur) + '">' + label + '</button>').join('') + '</div>';
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-rs-ring]'); if (!b || !R || !window.BX_APP) return;
  ev.preventDefault(); ev.stopPropagation();
  const st = R.steps[+b.dataset.i]; if (!st) return;
  const v = b.dataset.rsRing;
  if (v === 'silent') { st.kind = 'wait'; delete st.ring; } else { st.kind = 'do'; st.ring = v; }
  // 첫 단계가 '소리 없이'가 되면 다음 단계의 기본값이 바뀌므로 단계 줄을 모두 다시 그린다
  rtRedrawParts('steps');
}, true);

/* 루틴 목록에서 루틴을 꾹 누르면 고치기 · 지우기(대표 요청 11/3). 일정 꾹 누르기와 같은 모양, 지운 뒤 되돌리기.
   보이는 대체 길: 누르면 고치기 창, 그 창 맨 아래 '이 루틴 지우기'(규칙 4) */
let bxRlp = null;
function bxRtMenu(rid){
  const rt = M.routines.find(r => r.id === rid); if (!rt) return;
  const p = rtPlan(rt);
  const row = (act, icon, label, sub, warn) => '<button type="button" class="menu-row' + (warn ? ' bx-im-del' : '') + '" data-bx-rm="' + act + '"><span class="mi">' + icon + '</span><span class="ml">' + label + '</span>' + (sub ? '<span class="mv">' + esc(sub) + '</span>' : '') + '</button>';
  openSheet({title: rt.name || '루틴', draw: () => setSheet('<p class="p small" style="margin:-6px 0 10px">' + esc(rtWhenText(rt) + (p.bad ? '' : ' · ' + bxT(mm(p.start)) + ' 시작')) + '</p><div class="menu">' +
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

// 모양 규칙은 web-src/app.css로 옮김(시험판 54 덧칠 정리)
