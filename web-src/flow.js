/* ---------- 전체 흐름 와이어프레임 반영 (시험판 25, 대표 승인 2026-10-31 "이대로") ----------
   3 빈 홈의 예시 문장 · + 단추 팁 / 7 자주 넣은 말 / 13 확인 필요 창 처리 / 15 시간표 도우미
   17 위젯 두기 제안 / 18 울리는 방식(종류별 기본값) / 19 내가 쓸 기능 · 아래 메뉴 */

/* 3. 빈 홈: 예시 문장을 누르면 새 일정 창에 그 문장이 채워져 열린다(플래닛의 예시 할 일처럼 쓰는 법을 보여 줌) */
const BX_EXAMPLES = ['내일 3시 치과', '금요일 저녁 7시 약속', '다음 주 월요일 보고서 마감'];
function bxOpenNewWith(text){
  openEdit(null);
  setTimeout(() => { const t = $('#f-title'); if (!t) return; t.value = text; t.dispatchEvent(new Event('input', {bubbles: true})); t.focus(); }, 30);
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-bx-ex],[data-bx-freq]'); if (!b || !window.BX_APP) return;
  ev.preventDefault(); ev.stopPropagation();
  if (b.dataset.bxEx) { bxOpenNewWith(b.dataset.bxEx); return; }
  const t = $('#f-title'); if (!t) return;
  t.value = b.dataset.bxFreq + ' '; t.dispatchEvent(new Event('input', {bubbles: true})); t.focus();
  try { t.setSelectionRange(t.value.length, t.value.length); } catch (e) { /* 지원 안 함 */ }
}, true);

/* 화면을 그릴 때마다. (+ 단추 말풍선 '꾹 누르면 말로 넣어요'는 목록 글자를 가려서 뺐다. 정리판 2번, 사용법은 ⓘ에) */
function bxFlowDecorate(){
  bxCalHead();
  document.documentElement.classList.toggle('bx-ttbar-on', !!(window.BX_APP && S.view === 'tt'));
}
/* 캘린더 머리(대표 요청 10/31): '‹ 10월 ›'처럼 달 이름을 가운데에, 넘기기 단추는 양옆에 작게. 월간|주간은 작은 칩 */
function bxCalHead(){
  if (S.view !== 'month' && S.view !== 'week') return;
  const ph = document.querySelector('.screen .page-head'); if (!ph || ph.classList.contains('bx-ch')) return;
  const h1 = ph.querySelector('.ph-t h1'), p = ph.querySelector('.ph-t p'), nav = ph.querySelector('.ph-nav'); if (!h1 || !nav) return;
  const bs = nav.querySelectorAll('button'); if (bs.length < 3) return;
  const prev = bs[0], pill = bs[1], next = bs[bs.length - 1];
  const top = document.createElement('div'); top.className = 'bx-ch-top';
  const mode = document.querySelector('.screen .tt-mode'); if (mode) top.appendChild(mode);
  if (pill.getAttribute('aria-pressed') !== 'true') { pill.classList.add('bx-ch-today'); pill.textContent = S.view === 'week' ? '이번 주로' : '이번 달로'; top.appendChild(pill); }
  prev.setAttribute('aria-label', S.view === 'week' ? '지난주' : '지난달'); next.setAttribute('aria-label', S.view === 'week' ? '다음 주' : '다음 달');
  const mid = document.createElement('div'); mid.className = 'bx-ch-mid'; mid.append(prev, h1, next);
  ph.textContent = ''; ph.classList.add('bx-ch'); ph.append(top, mid); if (p) ph.append(p);
  // 박스웍스 · 휴대폰 캘린더 표시는 달 넘기기 · 개수 줄 아래(대표 요청 11/3, 시험판 35). 종류가 많아지면 옆으로 밀어 본다
  const lg = top.querySelector('.bx-cal-lg'); if (lg) ph.append(lg);
}

/* 받은 글로 새 일정(시험판 35, 공유의 첫걸음 · 결정 기록 D-12). 카톡에서 약속 메시지를 '공유' → '박스웍스 일정으로'.
   날짜·시각이 있는 줄을 제목 칸에 넣어 말로 넣기와 같은 해석을 쓰고, 여러 줄이면 받은 글 전체를 메모에 남긴다. 서버 없음 */
function bxSharedLines(text){
  return String(text || '').replace(/\r/g, '').split('\n')
    .map(l => l.replace(/^\s*\[[^\]]{1,20}\]\s*\[(오전|오후)\s*\d{1,2}:\d{2}\]\s*/, '').trim())
    .filter(l => l && !/^https?:\/\/\S+$/.test(l));
}
window.BX_openShared = function(text){
  if (!window.BX_APP || !M) return;
  const lines = bxSharedLines(text); if (!lines.length) return;
  if (document.getElementById('bx-start')) { toast('처음 안내를 마친 뒤 다시 공유해 주세요'); return; }
  const now = new Date(), when = l => { try { const r = parseQuick(l, now); return !!(r && (r.date || r.start)); } catch (e) { return false; } };
  const first = (lines.find(when) || lines[0]).slice(0, 120), whole = lines.join('\n');
  closeSheet();
  if (S.view !== 'today') go('today');
  setTimeout(() => {
    openEdit(null, {});
    const t = document.getElementById('f-title'); if (!t) return;
    t.value = first; t.dispatchEvent(new Event('input', {bubbles: true}));
    if (whole !== first) { F.note = whole.slice(0, 2000); F.extra = true; drawEdit(); }
    toast('받은 글로 새 일정을 열었어요. 날짜·시각을 보고 저장하세요');
  }, 250);
};

/* 7. 새 일정 창: 자주 넣은 말(최근 넉 달 두 번 이상 넣은 제목, 자주 쓴 시각 함께). 쓸수록 덜 입력한다 */
function bxSayTime(hmS){
  if (!isHM(hmS)) return '';
  const [h, m] = hmS.split(':').map(Number);
  return (h < 12 ? '오전 ' : '오후 ') + (h % 12 || 12) + '시' + (m ? (m === 30 ? ' 반' : ' ' + m + '분') : '');
}
function bxFreq(){
  const since = ymd(addDays(sod(new Date()), -120)), map = new Map();
  M.items.forEach(i => {
    if (!i.title || i.pc || !isDate(i.date) || i.date < since) return;
    const k = String(i.title).trim(); if (!k || k.length > 18) return;
    const g = map.get(k) || {t: k, n: 0, st: {}};
    g.n++; if (i.start) g.st[i.start] = (g.st[i.start] || 0) + 1;
    map.set(k, g);
  });
  return Array.from(map.values()).filter(g => g.n >= 2).sort((a, b) => b.n - a.n).slice(0, 4).map(g => {
    const top = Object.entries(g.st).sort((a, b) => b[1] - a[1])[0];
    return {t: g.t, when: top && top[1] >= 2 ? bxSayTime(top[0]) : ''};
  });
}
const bxDrawEdit0 = drawEdit;
drawEdit = function(){
  bxDrawEdit0();
  if (!window.BX_APP || !F || F.mode !== 'new') return;
  const fr = bxFreq(), hint = $('#f-hint'); if (!fr.length || !hint || $('.bx-freq')) return;
  const box = document.createElement('div');
  box.className = 'bx-freq';
  box.innerHTML = '<span class="bx-freq-h">자주 넣은 말</span><div class="bx-freq-c">' + fr.map(g => { const v = g.t + (g.when ? ' ' + g.when : ''); return '<button type="button" class="bx-freq-b" data-bx-freq="' + esc(v) + '">' + esc(g.t) + (g.when ? ' · ' + esc(g.when) : '') + '</button>'; }).join('') + '</div>';
  hint.after(box);
};

/* 13. 확인 필요 창의 단추 */
function bxLatePatch(id, patch, msg){
  const it = getDoc(id); if (!it) return;
  record([id]);
  patchDoc(id, patch);
  toast(msg, [['되돌리기', doUndo]]);
  if (SH && SH.refresh) { SH.refresh(); }
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-bx-late]'); if (!b || !window.BX_APP) return;
  ev.preventDefault(); ev.stopPropagation();
  const op = b.dataset.bxLate, id = b.dataset.id, it = id ? getDoc(id) : null;
  if (op === 'keepall') {
    const its = M.items.filter(isLate); if (!its.length) return;
    record(its.map(i => i.id));
    its.forEach(i => patchDoc(i.id, {lateKeep: +dueAt(getDoc(i.id))}));
    toast('지난 일 ' + its.length + '개를 그대로 뒀어요', [['되돌리기', doUndo]]);
    if (SH && SH.refresh) { SH.refresh(); }
    return;
  }
  if (!it) return;
  if (op === 'done') { toggleDone(id); setTimeout(() => { if (SH && SH.refresh) SH.refresh(); }, 50); return; }
  if (op === 'pick') { bxLatePickDate(id); return; }
  if (op === 'keep') { bxLatePatch(id, {lateKeep: +dueAt(it)}, '그대로 뒀어요. 확인 필요에서 빠져요'); return; }
  const base = {slips: (it.slips || 0) + 1, ackAt: null, snoozeUntil: null, lateKeep: null};
  if (!it.origDate) { base.origDate = it.date; base.origStart = it.start || null; }
  if (op === 'move') { const d = ($('#bx-lc-date') || {}).value; if (isDate(d)) { BXL_PICK = null; bxLateMove(id, d, base); } return; }
  if (op === 'today') {
    // 오늘 그 시각이 이미 지났으면 지금부터 한 시간 뒤로(옮기자마자 다시 '지난 일'이 되지 않게)
    const n = new Date(), nowM = n.getHours() * 60 + n.getMinutes();
    if (it.start && toMin(it.start) <= nowM) {
      const s = Math.min(23 * 60, Math.ceil((nowM + 60) / 10) * 10), dur = it.end ? toMin(it.end) - toMin(it.start) : null;
      bxLatePatch(id, Object.assign(base, {date: M.today, start: fromMin(s), end: dur != null ? fromMin(Math.min(1439, s + dur)) : null}), '오늘 ' + fromMin(s) + '로 옮겼어요');
    } else bxLatePatch(id, Object.assign(base, {date: M.today}), '오늘로 옮겼어요');
    return;
  }
  if (op === 'later') {
    const n = new Date(), s = Math.min(23 * 60, Math.ceil((n.getHours() * 60 + n.getMinutes() + 60) / 10) * 10);
    const dur = it.start && it.end ? toMin(it.end) - toMin(it.start) : null;
    bxLatePatch(id, Object.assign(base, {date: M.today, start: fromMin(s), end: dur != null ? fromMin(Math.min(1439, s + dur)) : null}), fromMin(s) + '로 미뤘어요');
  }
}, true);
// 날짜 고르기: 휴대폰 달력 창을 바로 연다(내일이 골라져 있음). 창을 못 여는 휴대폰이면 카드 안에 날짜 칸
function bxLateMove(id, d, base){
  const it = getDoc(id); if (!it) return;
  if (!base) { base = {slips: (it.slips || 0) + 1, ackAt: null, snoozeUntil: null, lateKeep: null}; if (!it.origDate) { base.origDate = it.date; base.origStart = it.start || null; } }
  bxLatePatch(id, Object.assign(base, {date: d}), fmtMD(d) + '로 옮겼어요');
}
// 시험판 36(대표 지적 11/3 "확인 필요에서 다 했어요 · 그대로 두기 말고는 안 된다"): 숨긴 날짜 칸에 showPicker()를 부르던 방식은
// 휴대폰(웹뷰)에서 달력 창이 열리지 않는 것으로 보였다(시험 브라우저에서는 오류 없이 지나가 알 수 없었음). 늘 카드 안에 날짜 칸(내일이 골라져 있음)과
// '이 날로 옮기기'를 연다. 날짜 칸을 누르면 휴대폰 달력이 열린다. '날짜 고르기'를 다시 누르면 닫힘
function bxLatePickDate(id){
  BXL_PICK = BXL_PICK === id ? null : id;
  // (한 줄로 'if (SH && SH.refresh) SH.refresh();'라고 쓰면 build-web의 다른 바꾸기와 겹친다)
  if (SH && SH.refresh) { SH.refresh(); }
  if (BXL_PICK) setTimeout(() => { const f = $('#bx-lc-date'); if (f) { f.focus(); f.scrollIntoView({block: 'nearest'}); } }, 60);
}
// 목록의 주황 '확인' 단추와 고치기 창의 '확인'은 같은 카드 한 장(옛 지연·연기 창 대신)
document.addEventListener('click', ev => {
  const b = window.BX_APP && ev.target.closest && ev.target.closest('[data-act="late"]'); if (!b) return;
  ev.preventDefault(); ev.stopPropagation();
  const id = b.dataset.id; if (!id || !getDoc(id)) return;
  bxLateOpen(id);
}, true);

/* 15. 시간표 도우미: 처음 들어갈 때, 한 화면에 입력칸 하나(여러 줄 한 번에) → 알림 몇 분 전 */
let BXT = null;
const BXT_REMS = [['0', '정시'], ['5', '5분 전'], ['10', '10분 전'], ['30', '30분 전']];
function bxTtHelpOpen(){ BXT = {q: 0, text: '', rem: '10', cust: '15'}; bxTtHelpDraw(); }
function bxTtHelpClose(){ BXT = null; const el = document.getElementById('bx-start'); if (el) el.remove(); document.documentElement.classList.remove('locked'); render(); }
function bxTtParsed(){ return String(BXT.text || '').split(/\n+/).map(l => l.trim()).filter(Boolean).map(l => ({line: l, p: ttParse(l)})); }
function bxTtPrevHtml(){
  const rows = bxTtParsed(); if (!rows.length) return '';
  const ok = rows.filter(r => r.p.name && r.p.days.length && r.p.start);
  return '<span class="bxt-ph">알아들은 것 ' + ok.length + '개' + (ok.length ? ' · 넣은 뒤 시간표에서 고칠 수 있어요' : '') + '</span>' + rows.map((r, i) => {
    const good = r.p.name && r.p.days.length && r.p.start;
    return '<div class="bxt-row' + (good ? '' : ' bad') + '"><span class="bxt-bar" style="--c:' + TT_COLORS[i % TT_COLORS.length] + '"></span><span class="bxs-t"><b>' + esc(good ? r.p.name : r.line) + '</b><small>' +
      esc(good ? ttDaysText(r.p.days) + ' ' + r.p.start + '–' + r.p.end + (r.p.place ? ' · ' + r.p.place : '') : !r.p.days.length ? '요일을 알아듣지 못했어요' : !r.p.start ? '시각을 알아듣지 못했어요' : '이름을 적어 주세요') + '</small></span></div>';
  }).join('');
}
function bxTtHelpDraw(){
  const n = bxTtParsed().filter(r => r.p.name && r.p.days.length && r.p.start).length;
  const top = '<div class="bxs-top"><button type="button" class="bxs-back-i" data-bxt-nav="back" aria-label="뒤로">' + ICON.chevL + '</button><span class="bxs-tt">시간표 도우미</span><button type="button" class="bxs-skip" data-bxt-nav="skip">건너뛰기</button></div>' +
    '<div class="bxs-prog"><span style="width:' + (BXT.q ? 100 : 50) + '%"></span></div><span class="bxs-pn">' + (BXT.q + 1) + ' / 2</span>';
  if (!BXT.q) {
    bxStartOverlay(top +
      '<h1 class="bxs-h big">매주 있는 수업이나 일을<br>말해 주세요</h1><p class="bxs-p">한 줄에 하나씩, 여러 개를 한 번에 넣어도 돼요.</p>' +
      '<div class="bxt-in"><label class="sr" for="bxt-in">수업 적기</label><textarea id="bxt-in" rows="3" maxlength="600" placeholder="월수 10시 반부터 12시 경영학원론 301호&#10;화목 2시 영어회화">' + esc(BXT.text) + '</textarea>' +
      (window.BX_HAS_MIC ? '<button type="button" class="icon-btn bx-mic" data-act="bx-mic" data-for="bxt-in" data-prompt="예) 월수 10시 반 경영학원론" aria-label="말로 넣기">' + BXT_MIC + '</button>' : '') + '</div>' +
      '<div id="bxt-prev" class="bxt-prev">' + bxTtPrevHtml() + '</div>' +
      '<div class="bxs-links"><button type="button" data-bxt-nav="manual">요일·시간 직접 고르기</button><button type="button" data-bxt-nav="skip">나중에 할게요</button></div>' +
      '<div class="bxs-sp"></div><button type="button" class="btn primary bxs-go" data-bxt-nav="next"' + (n ? '' : ' disabled') + '>다음</button>');
    return;
  }
  const opt = o => '<button type="button" class="bxs-big' + (BXT.rem === o[0] ? ' on' : '') + '" aria-pressed="' + (BXT.rem === o[0]) + '" data-bxt-rem="' + o[0] + '">' + o[1] + '</button>';
  const isCust = BXT.rem === 'custom';
  bxStartOverlay(top +
    '<h1 class="bxs-h big">수업 몇 분 전에<br>알려 드릴까요?</h1><p class="bxs-p">' + n + '개 모두 같은 시각에 알려요. 수업마다 따로 바꿀 수도 있어요.</p>' +
    '<div class="bxs-grid">' + BXT_REMS.map(opt).join('') + '</div>' +
    '<button type="button" class="bxs-cust' + (isCust ? ' on' : '') + '" aria-pressed="' + isCust + '" data-bxt-rem="custom">' + ICON.edit + '직접 입력</button>' +
    (isCust ? '<label class="bxs-custbox"><span>몇 분 전</span><input type="number" id="bxt-cust" min="1" max="240" inputmode="numeric" value="' + esc(BXT.cust) + '"></label>' : '') +
    '<div class="bxs-links"><button type="button" data-bxt-rem=""' + (BXT.rem === '' ? ' class="on"' : '') + '>안 받을래요</button></div>' +
    '<div class="bxs-sp"></div><button type="button" class="btn primary bxs-go" data-bxt-nav="make">시간표 만들기</button>');
}
const BXT_MIC = '<svg class="i" viewBox="0 0 24 24"><rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/></svg>';
document.addEventListener('input', ev => {
  if (!BXT || !ev.target || ev.target.id !== 'bxt-in') return;
  BXT.text = ev.target.value;
  const pv = $('#bxt-prev'); if (pv) pv.innerHTML = bxTtPrevHtml();
  const go = $('[data-bxt-nav="next"]'); if (go) go.disabled = !bxTtParsed().some(r => r.p.name && r.p.days.length && r.p.start);
});
document.addEventListener('click', ev => {
  if (!BXT || !ev.target.closest) return;
  const t = ev.target.closest('[data-bxt-nav],[data-bxt-rem]'); if (!t) return;
  ev.preventDefault(); ev.stopPropagation();
  const ta = $('#bxt-in'); if (ta) BXT.text = ta.value;
  const ci = $('#bxt-cust'); if (ci && ci.value) BXT.cust = ci.value;
  if (t.dataset.bxtRem != null) { BXT.rem = t.dataset.bxtRem; bxTtHelpDraw(); if (BXT.rem === 'custom') setTimeout(() => { const i = $('#bxt-cust'); if (i) { i.focus(); i.select(); } }, 50); return; }
  const nav = t.dataset.bxtNav;
  if (nav === 'back') { if (BXT.q) { BXT.q = 0; bxTtHelpDraw(); } else bxTtHelpClose(); return; }
  if (nav === 'skip') { saveSettings({bxTtHelp: {at: nowIso(), skipped: true}}); bxTtHelpClose(); return; }
  if (nav === 'manual') { saveSettings({bxTtHelp: {at: nowIso(), skipped: true}}); bxTtHelpClose(); ttOpen(null); return; }
  if (nav === 'next') { BXT.q = 1; bxTtHelpDraw(); return; }
  if (nav === 'make') {
    const rem = BXT.rem === 'custom' ? String(Math.max(1, Math.min(240, Math.round(+BXT.cust) || 15))) : BXT.rem;
    const ok = bxTtParsed().filter(r => r.p.name && r.p.days.length && r.p.start), base = ttList().length, ids = [];
    ok.forEach((r, i) => ids.push(ttSave({id: null, name: r.p.name, days: r.p.days, start: r.p.start, end: r.p.end, place: r.p.place, remind: rem, color: TT_COLORS[(base + i) % TT_COLORS.length]})));
    saveSettings({bxTtHelp: {at: nowIso(), made: ids.length}});
    bxTtHelpClose();
    toast('시간표에 ' + ids.length + '개 넣었어요', [['되돌리기', () => ids.forEach(id => removeDoc(id))]]);
  }
}, true);

/* 17. 홈 화면 위젯 두기: 홈의 안내 카드 대신 설정 › 화면의 한 줄(정리판 1번, 대표 결정 11/1). 위젯 두 가지를 보여 주고 고른 것을 놓는다 */
const BX_WIDGETS = [['now', '지금 단계', '2×2 · 루틴 중 지금 할 단계와 출발까지 남은 시간'], ['list', '오늘 일정', '4×2 · 오늘 일정 네 줄과 시각']];
const BX_WIDGET_ICON = '<svg class="i" viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1.8"/><rect x="13" y="4" width="7" height="7" rx="1.8"/><rect x="4" y="13" width="7" height="7" rx="1.8"/><rect x="13" y="13" width="7" height="7" rx="1.8"/></svg>';
function bxWidgetRowHtml(){
  const w = window.BX_WPLACED || {}, n = (w.now ? 1 : 0) + (w.list ? 1 : 0);
  return '<div class="set-menu"><button type="button" class="menu-row" data-act="bx-widget-open"><span class="mi">' + BX_WIDGET_ICON + '</span><span class="ml">홈 화면 위젯 두기</span><span class="mv">' + (n ? n + '개 놓음' : '') + ICON.chevR + '</span></button></div>';
}
function bxWidgetOpen(){
  openSheet({title: '홈 화면 위젯', draw: () => {
    const w = window.BX_WPLACED || {}, can = !!w.canPin;
    setSheet('<p class="p small" style="margin:0 0 12px">앱을 열지 않아도 홈 화면에서 바로 봐요. 잠금 화면에는 안 보여요.</p>' +
      BX_WIDGETS.map(([k, name, sub]) => '<div class="bx-wg-row"><span class="bxs-t"><b>' + name + '</b><small>' + sub + '</small></span>' +
        (w[k] ? '<span class="bx-wg-on">' + ICON.check + '놓았어요</span>' : can ? '<button type="button" class="btn sm" data-bx-wpin="' + k + '">두기</button>' : '') + '</div>').join('') +
      '<p class="p small" style="margin:12px 0 0">' + (can ? '두기를 누르면 휴대폰이 놓을 자리를 물어요. ' : '') + '홈 화면을 꾹 누른 뒤 위젯 › 박스웍스에서도 놓을 수 있어요.</p>', '');
  }});
}
document.addEventListener('click', async ev => {
  const b = window.BX_APP && ev.target.closest && ev.target.closest('[data-act="bx-widget-open"],[data-bx-wpin]'); if (!b) return;
  ev.preventDefault(); ev.stopPropagation();
  if (b.dataset.act === 'bx-widget-open') { bxWidgetOpen(); return; }
  try {
    if (window.BX_widgetPin) await window.BX_widgetPin(b.dataset.bxWpin);
    toast('휴대폰 화면에서 위젯 놓을 자리를 골라 주세요');
  } catch (e) {
    toast('홈 화면을 꾹 누른 뒤 위젯 › 박스웍스에서 놓을 수 있어요');
  }
}, true);

/* 18. 울리는 방식: 종류마다 기본값(삼성 리마인더 조사 반영 10/31). 알람 = 잠금 화면에 크게·확인할 때까지, 알림 = 위에서 내려옴·소리 한 번, 조용히 = 알림창에만 */
const BX_LV_DEF = {routine: 'alarm', item: 'notice', tt: 'notice'};
const BX_LV_KINDS = [['routine', '루틴 단계 · 출발'], ['item', '일정'], ['tt', '시간표 수업']];
function bxLevel(k){ const v = M && M.settings && M.settings.bxLevels && M.settings.bxLevels[k]; return v === 'alarm' || v === 'notice' || v === 'quiet' ? v : BX_LV_DEF[k]; }
function bxLevelSetHtml(){
  return '<div class="bx-lvset"><b class="bx-lock-h">울리는 방식</b><p class="p small" style="margin:2px 0 6px">종류마다 정해 두었어요. 바꿀 것만 바꾸세요.</p>' +
    BX_LV_KINDS.map(([k, label]) => setRow(label, segHtml('data-bxlv-' + k, [['alarm', '알람'], ['notice', '알림'], ['quiet', '조용히']], bxLevel(k), label + ' 울리는 방식', 210))).join('') +
    // 바꿀 수 없는 줄(아침에 오늘 일정 · 명상)은 뺐다(정리판 20번)
    '<p class="p small bx-lv-note">알람: 잠금 화면에 크게, 확인할 때까지 · 알림: 위에서 내려오고 소리 한 번 · 조용히: 알림창에만. 5분 뒤로 미뤄도 처음과 같은 세기로 다시 울려요.</p></div>';
}
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const b = ev.target.closest('[data-bxlv-routine],[data-bxlv-item],[data-bxlv-tt]'); if (!b) return;
  ev.stopPropagation();
  const k = b.hasAttribute('data-bxlv-routine') ? 'routine' : b.hasAttribute('data-bxlv-item') ? 'item' : 'tt';
  const cur = Object.assign({}, (M.settings && M.settings.bxLevels) || {}); cur[k] = b.getAttribute('data-bxlv-' + k);
  saveSettings({bxLevels: cur});
}, true);

/* 19. 내가 쓸 기능 · 아래 메뉴: 기능을 끄면 홈·메뉴·알림에서 사라진다(넣어 둔 내용은 남음). 아래 메뉴는 누른 순서대로, 홈은 가운데 */
let FEAT = null;
const BX_FEAT = [['routines', '루틴'], ['report', '아침에 오늘 일정 받기'], ['tt', '시간표'], ['med', '명상']];
// 묶음(시험판 35): 시간 · 행동 관리가 주 목적, 명상 같은 그 밖의 기능은 켜도 아래 메뉴가 아니라 ⋯ 더보기에(원하면 아래 메뉴에 넣음)
const BX_FEAT_ETC = ['med'];
function bxFeatOpen(){
  FEAT = {mods: Object.assign({}, bxStartMods()), dock: bxDockKeys().slice()};
  openSheet({title: '내가 쓸 기능', draw: bxFeatDraw, refresh: bxFeatDraw, onClose: () => { FEAT = null; }});
}
function bxFeatDockOk(k){ return !(k === 'routines' || k === 'tt' || k === 'med') || FEAT.mods[k] !== false; }
function bxFeatDraw(){
  // 줄마다 무엇을 해 주는지 한 줄(대표 지적 11/3: '아침에 오늘 일정 받기'를 켰는데 어디서 무엇이 오는지 모름)
  const desc = k => (BX_MODS.find(m => m[0] === k) || [])[2] || '';
  const sw = (k, label) => '<div class="bx-ft-row"><span class="bx-ft-t"><b>' + label + '</b><small>' + esc(desc(k)) + '</small></span><button type="button" class="tog" role="switch" aria-checked="' + (FEAT.mods[k] !== false) + '" aria-label="' + label + ' 쓰기" data-bx-feat="' + k + '"><i></i></button></div>' +
    // 아침 일정을 켜 두면: 언제 어디로 오는지, 지금 한 번 받아 보기, 시각 바꾸기
    (k === 'report' && FEAT.mods.report !== false ? '<div class="bx-ft-more"><p class="p small">매일 아침 <b>' + esc(bxRepCfg().at) + '</b>에 오늘 일정이 휴대폰 알림창으로 와요. 아침 루틴이 있는 날은 첫 알람을 확인한 직후에 와요.</p>' +
      '<div class="bx-ft-acts"><button type="button" class="btn sm" data-bxset="alarm">시각 바꾸기</button><button type="button" class="btn sm primary" data-act="bx-rep-try">지금 한 번 받아 보기</button></div></div>' : '');
  const lab = k => BX_DOCK_ALL[k].label;
  const chip = k => { const i = FEAT.dock.indexOf(k), ok = bxFeatDockOk(k);
    return ok ? '<button type="button" class="bx-ft-chip' + (i >= 0 ? ' on' : '') + '" aria-pressed="' + (i >= 0) + '" data-bx-fdock="' + k + '">' + (i >= 0 ? ICON.check : '') + lab(k) + '</button>'
      : '<span class="bx-ft-chip off">' + lab(k) + ' · 꺼짐</span>'; };
  const half = Math.ceil(FEAT.dock.length / 2), prev = FEAT.dock.slice(0, half).map(lab).concat(['홈']).concat(FEAT.dock.slice(half).map(lab));
  setSheet(
    '<h3 class="bx-ft-h">시간 · 행동 관리</h3><p class="p small" style="margin:0 0 4px">이 앱의 주 기능이에요. 끄면 홈·메뉴·알림에서 사라지고, 넣어 둔 내용은 남아요.</p>' +
    '<div class="bx-ft-row"><span>일정 · 캘린더</span><span class="bx-lv-fix">늘 켜짐</span></div>' + BX_FEAT.filter(f => !BX_FEAT_ETC.includes(f[0])).map(f => sw(f[0], f[1])).join('') +
    '<h3 class="bx-ft-h">그 밖의 기능</h3><p class="p small" style="margin:0 0 4px">켜면 ⋯ 더보기에 있어요. 아래 메뉴에도 넣을 수 있어요.</p>' + BX_FEAT.filter(f => BX_FEAT_ETC.includes(f[0])).map(f => sw(f[0], f[1])).join('') +
    '<h3 class="bx-ft-h">아래 메뉴</h3><p class="p small" style="margin:0 0 10px">누른 순서대로 왼쪽부터 놓여요. 홈은 늘 가운데, 4개까지. 처음엔 시간 · 행동 관리와 더보기.</p>' +
    '<div class="bx-ft-chips">' + Object.keys(BX_DOCK_ALL).map(chip).join('') + '</div>' +
    '<span class="bx-ft-pv-h">미리 보기</span><div class="bx-ft-pv" aria-hidden="true" style="grid-template-columns:repeat(' + prev.length + ',minmax(0,1fr))">' + prev.map(x => '<span class="' + (x === '홈' ? 'on' : '') + '">' + x + '</span>').join('') + '</div>',
    '<button type="button" class="btn grow" data-bx-fnav="reset">처음대로</button>');
}
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const t = ev.target.closest('[data-act="bx-feat"],[data-bx-feat],[data-bx-fdock],[data-bx-fnav]'); if (!t) return;
  ev.preventDefault(); ev.stopPropagation();
  if (t.dataset.act === 'bx-feat') { closeSheet(); bxFeatOpen(); return; }
  if (!FEAT) return;
  const k = t.dataset.bxFeat, d = t.dataset.bxFdock, nav = t.dataset.bxFnav;
  if (k) {
    const on = FEAT.mods[k] === false; FEAT.mods[k] = on;
    if (!on) FEAT.dock = FEAT.dock.filter(x => x !== k);
    // 시간 · 행동 관리 기능은 켜면 아래 메뉴에(자리가 있으면 '더보기' 앞에). 그 밖의 기능은 ⋯ 더보기에
    else if ((k === 'routines' || k === 'tt') && FEAT.dock.length < 4 && !FEAT.dock.includes(k)) { const at = FEAT.dock.indexOf('more'); if (at >= 0) FEAT.dock.splice(at, 0, k); else FEAT.dock.push(k); }
    bxFeatApply(); bxFeatDraw(); return;
  }
  if (d) {
    if (FEAT.dock.includes(d)) FEAT.dock = FEAT.dock.filter(x => x !== d);
    else if (FEAT.dock.length < 4) FEAT.dock.push(d);
    else { toast('4개까지 고를 수 있어요. 하나를 먼저 빼 주세요'); return; }
    bxFeatApply(); bxFeatDraw(); return;
  }
  if (nav === 'reset') { FEAT = {mods: {report: true, routines: true, tt: true, med: true}, dock: BX_DOCK_DEF.slice()}; bxFeatApply(); bxFeatDraw(); return; }
}, true);
// 누르는 대로 바로 저장(아래 메뉴·홈·알람이 그 자리에서 바뀐다)
function bxFeatApply(){
  if (!FEAT) return;
  const st = Object.assign({at: nowIso()}, (M.settings && M.settings.bxStart) || {}, {mods: Object.assign({}, FEAT.mods)});
  const rep = Object.assign({}, bxRepCfg(), {on: FEAT.mods.report !== false});
  saveSettings({bxStart: st, bxDock: FEAT.dock.slice(), bxDockMig: 1, bxReport: rep});
}
window.BX_rerender = function(){ if (S.view === 'today' && !SH && !document.getElementById('bx-start')) render(); };

/* 일정 꾹 누르기 메뉴(대표 요청 10/31: 지우려고 매번 들어가는 건 비효율). 홈·날짜 창·주간·찾기·월간 칩 어디서든 같다 */
let bxIlp = null, bxIlpAt = 0;
function bxItemOf(id){ return getDoc(id) || M.items.find(i => i.id === id) || null; }
function bxItemMenu(id, el){
  const it = bxItemOf(id); if (!it) return;
  const pc = !!it.pc || /^pc_/.test(id);
  const row = (act, icon, label, sub, warn) => '<button type="button" class="menu-row' + (warn ? ' bx-im-del' : '') + '" data-bx-im="' + act + '"><span class="mi">' + icon + '</span><span class="ml">' + label + '</span>' + (sub ? '<span class="mv">' + esc(sub) + '</span>' : '') + '</button>';
  const when = (isDate(it.date) ? relDay(it.date, M.today) + ' ' : '') + timeText(it);
  openSheet({title: it.title || '(제목 없음)', draw: () => setSheet(
    '<p class="p small" style="margin:-6px 0 10px">' + esc(when) + (it.location ? ' · ' + esc(it.location) : '') + '</p><div class="menu">' +
    row('edit', ICON.edit, pc ? '알림·이동 시간 고치기' : '고치기', '') +
    (pc ? '' : row('done', ICON.check, it.done ? '완료 취소' : '다 했어요', '') +
      row('tmr', ICON.clock, '내일로 미루기', fmtMD(ymd(addDays(parseYmd(M.today), 1))) + (it.start ? ' ' + it.start : '')) +
      row('del', ICON.trash, '지우기', '휴지통에 30일', true)) +
    '</div>' + (pc ? '<p class="p small" style="margin:10px 0 0">휴대폰 캘린더에서 읽어 온 일정은 그 캘린더 앱에서 지우거나 옮겨요.</p>' : ''), '')});
  SH.bxIm = {id, el};
}
document.addEventListener('pointerdown', ev => {
  if (!window.BX_APP || (ev.button != null && ev.button > 0) || !ev.target.closest) return;
  const el = ev.target.closest('.row .row-main[data-id], .row .chk[data-id], .c-chip[data-item]'); if (!el || el.closest('.tt-wrap')) return;
  const id = el.dataset.id || el.dataset.item; if (!id) return;
  if (bxIlp) clearTimeout(bxIlp.t);
  bxIlp = {id, x: ev.clientX, y: ev.clientY, t: setTimeout(() => {
    bxIlp = null; bxIlpAt = Date.now();
    try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) { /* 진동 없음 */ }
    bxItemMenu(id, el);
  }, 480)};
}, true);
document.addEventListener('pointermove', ev => { if (bxIlp && (Math.abs(ev.clientX - bxIlp.x) > 10 || Math.abs(ev.clientY - bxIlp.y) > 10)) { clearTimeout(bxIlp.t); bxIlp = null; } }, true);
['pointerup', 'pointercancel'].forEach(t => document.addEventListener(t, () => { if (bxIlp) { clearTimeout(bxIlp.t); bxIlp = null; } }, true));
// 꾹 누른 뒤 손을 떼며 생기는 누르기는 삼킨다(창이 열리자마자 고치기 창으로 넘어가지 않게)
window.addEventListener('click', ev => { if (Date.now() - bxIlpAt < 700 && ev.target.closest && !ev.target.closest('#sheet-root')) { ev.preventDefault(); ev.stopPropagation(); } }, true);
document.addEventListener('contextmenu', ev => { if (window.BX_APP && ev.target.closest && ev.target.closest('.row, .c-chip')) ev.preventDefault(); }, true);
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-bx-im]'); if (!b || !SH || !SH.bxIm) return;
  ev.preventDefault(); ev.stopPropagation();
  const {id} = SH.bxIm, it = bxItemOf(id), op = b.dataset.bxIm; if (!it) { closeSheet(); return; }
  closeSheet();
  if (op === 'edit') {
    const el = document.querySelector('.row-main[data-act="edit"][data-id="' + CSS.escape(id) + '"], .c-chip[data-item="' + CSS.escape(id) + '"]');
    if (/^pc_/.test(id) && el) { bxIlpAt = 0; el.click(); } else openEdit(id);
    return;
  }
  if (op === 'done') { toggleDone(id); return; }
  if (op === 'del') { softDelete(id); return; }
  if (op === 'tmr') {
    const patch = {date: ymd(addDays(parseYmd(M.today), 1)), slips: (it.slips || 0) + 1, ackAt: null, snoozeUntil: null, lateKeep: null};
    if (!it.origDate) { patch.origDate = it.date; patch.origStart = it.start || null; }
    record([id]); patchDoc(id, patch);
    toast('내일로 미뤘어요', [['되돌리기', doUndo]]);
  }
}, true);
