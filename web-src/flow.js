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

/* + 단추 팁: 앱을 처음 세 번 여는 동안 홈에서 '꾹 누르면 말로 넣어요'. 누르면 다시 안 나온다 */
let bxFabTipSeen = false;
function bxFlowDecorate(){
  const old = document.querySelector('.bx-fab-tip');
  const want = window.BX_APP && S.view === 'today' && !S.homeDay && !SH && !document.getElementById('bx-start') && bxFabTipLeft() > 0;
  if (!want) { if (old) old.remove(); return; }
  if (old) return;
  if (!bxFabTipSeen) { bxFabTipSeen = true; lsSet('bx:fabTip', String(bxFabTipLeft() - 1)); }
  const tip = document.createElement('button');
  tip.type = 'button'; tip.className = 'bx-fab-tip'; tip.textContent = '꾹 누르면 말로 넣어요';
  tip.setAttribute('aria-label', '팁: + 단추를 꾹 누르면 말로 넣어요. 누르면 닫혀요');
  tip.addEventListener('click', e => { e.stopPropagation(); lsSet('bx:fabTip', '0'); tip.remove(); });
  document.body.appendChild(tip);
}
function bxFabTipLeft(){ const v = lsGet('bx:fabTip'); return v == null ? 3 : Math.max(0, +v || 0); }

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
  if (op === 'pick') { closeSheet(); openLate(id); return; }
  if (op === 'keep') { bxLatePatch(id, {lateKeep: +dueAt(it)}, '그대로 뒀어요. 확인 필요에서 빠져요'); return; }
  const base = {slips: (it.slips || 0) + 1, ackAt: null, snoozeUntil: null, lateKeep: null};
  if (!it.origDate) { base.origDate = it.date; base.origStart = it.start || null; }
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

/* 17. 위젯 두기 제안: 루틴을 만든 지 사흘이 지나고, 홈 화면에 '지금 단계' 위젯이 없을 때 한 번(닫으면 다시 안 나옴) */
function bxWidgetTipHtml(){
  const w = window.BX_WPLACED;
  if (!window.BX_APP || !w || !w.canPin || w.now || (M.settings && M.settings.bxWidgetTip)) return '';
  const born = M.routines.filter(r => r.on !== false).map(r => { const d = getDoc(r.id); return d && d.createdAt ? Date.parse(d.createdAt) : NaN; }).filter(x => !isNaN(x));
  if (!born.length || Date.now() - Math.min.apply(null, born) < 3 * 864e5) return '';
  return '<div class="bx-nudge bx-wtip"><span class="bx-wtip-mini" aria-hidden="true"><small>지금</small><b>씻기</b><em>출발까지 29분</em><i></i></span><span class="bxs-t"><b>홈 화면에 두면 앱을 안 열어도 돼요</b><small>지금 할 단계와 남은 시간이 보여요. 잠금 화면에는 안 보여요.</small><span class="bx-nudge-go"><button type="button" class="btn sm primary" data-act="bx-wtip-pin">위젯 두기</button></span></span><button type="button" class="icon-btn bx-nudge-x" data-act="bx-wtip-x" aria-label="안내 닫기">' + ICON.close + '</button></div>';
}
document.addEventListener('click', async ev => {
  const b = ev.target.closest && ev.target.closest('[data-act="bx-wtip-pin"],[data-act="bx-wtip-x"]'); if (!b || !window.BX_APP) return;
  ev.preventDefault(); ev.stopPropagation();
  if (b.dataset.act === 'bx-wtip-x') { saveSettings({bxWidgetTip: {at: nowIso(), closed: true}}); return; }
  try {
    if (window.BX_widgetPin) await window.BX_widgetPin('now');
    saveSettings({bxWidgetTip: {at: nowIso(), pinned: true}});
    toast('휴대폰 화면에서 위젯 놓을 자리를 골라 주세요');
  } catch (e) {
    toast('이 휴대폰은 홈 화면을 길게 눌러 위젯 → 박스웍스에서 놓을 수 있어요');
  }
}, true);

/* 18. 울리는 방식: 종류마다 기본값(삼성 리마인더 조사 반영 10/31). 알람 = 잠금 화면에 크게·확인할 때까지, 알림 = 위에서 내려옴·소리 한 번, 조용히 = 알림창에만 */
const BX_LV_DEF = {routine: 'alarm', item: 'notice', tt: 'notice'};
const BX_LV_KINDS = [['routine', '루틴 단계 · 출발'], ['item', '일정'], ['tt', '시간표 수업']];
function bxLevel(k){ const v = M && M.settings && M.settings.bxLevels && M.settings.bxLevels[k]; return v === 'alarm' || v === 'notice' || v === 'quiet' ? v : BX_LV_DEF[k]; }
function bxLevelSetHtml(){
  return '<div class="bx-lvset"><b class="bx-lock-h">울리는 방식</b><p class="p small" style="margin:2px 0 6px">종류마다 정해 두었어요. 바꿀 것만 바꾸세요.</p>' +
    BX_LV_KINDS.map(([k, label]) => setRow(label, segHtml('data-bxlv-' + k, [['alarm', '알람'], ['notice', '알림'], ['quiet', '조용히']], bxLevel(k), label + ' 울리는 방식', 210))).join('') +
    setRow('아침에 오늘 일정', '<span class="bx-lv-fix">조용한 알림</span>') + setRow('명상', '<span class="bx-lv-fix">싱잉볼 종소리</span>') +
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
function bxFeatOpen(){
  FEAT = {mods: Object.assign({}, bxStartMods()), dock: bxDockKeys().slice()};
  openSheet({title: '내가 쓸 기능', draw: bxFeatDraw, refresh: bxFeatDraw});
}
function bxFeatDockOk(k){ return !(k === 'routines' || k === 'tt' || k === 'med') || FEAT.mods[k] !== false; }
function bxFeatDraw(){
  const sw = (k, label) => '<div class="bx-ft-row"><span>' + label + '</span><button type="button" class="tog" role="switch" aria-checked="' + (FEAT.mods[k] !== false) + '" aria-label="' + label + ' 쓰기" data-bx-feat="' + k + '"><i></i></button></div>';
  const lab = k => BX_DOCK_ALL[k].label;
  const chip = k => { const i = FEAT.dock.indexOf(k), ok = bxFeatDockOk(k);
    return ok ? '<button type="button" class="bx-ft-chip' + (i >= 0 ? ' on' : '') + '" aria-pressed="' + (i >= 0) + '" data-bx-fdock="' + k + '">' + (i >= 0 ? '<em>' + (i + 1) + '</em>' : '') + lab(k) + '</button>'
      : '<span class="bx-ft-chip off">' + lab(k) + ' · 꺼짐</span>'; };
  const half = Math.ceil(FEAT.dock.length / 2), prev = FEAT.dock.slice(0, half).map(lab).concat(['홈']).concat(FEAT.dock.slice(half).map(lab));
  setSheet(
    '<h3 class="bx-ft-h">기능</h3><p class="p small" style="margin:0 0 4px">끄면 홈·메뉴·알림에서 사라져요. 넣어 둔 내용은 남아요.</p>' +
    '<div class="bx-ft-row"><span>일정 · 캘린더</span><span class="bx-lv-fix">늘 켜짐</span></div>' + BX_FEAT.map(f => sw(f[0], f[1])).join('') +
    '<h3 class="bx-ft-h">아래 메뉴</h3><p class="p small" style="margin:0 0 10px">누른 순서대로 왼쪽부터 놓여요. 홈은 늘 가운데, 4개까지.</p>' +
    '<div class="bx-ft-chips">' + Object.keys(BX_DOCK_ALL).map(chip).join('') + '</div>' +
    '<span class="bx-ft-pv-h">미리 보기</span><div class="bx-ft-pv" aria-hidden="true" style="grid-template-columns:repeat(' + prev.length + ',minmax(0,1fr))">' + prev.map(x => '<span class="' + (x === '홈' ? 'on' : '') + '">' + x + '</span>').join('') + '</div>',
    '<button type="button" class="btn" data-bx-fnav="reset">처음대로</button><button type="button" class="btn primary grow" data-bx-fnav="save">저장</button>');
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
    else if ((k === 'routines' || k === 'tt' || k === 'med') && FEAT.dock.length < 4 && !FEAT.dock.includes(k)) FEAT.dock.push(k);
    bxFeatDraw(); return;
  }
  if (d) {
    if (FEAT.dock.includes(d)) FEAT.dock = FEAT.dock.filter(x => x !== d);
    else if (FEAT.dock.length < 4) FEAT.dock.push(d);
    else { toast('4개까지 고를 수 있어요. 하나를 먼저 빼 주세요'); return; }
    bxFeatDraw(); return;
  }
  if (nav === 'reset') { FEAT = {mods: {report: true, routines: true, tt: true, med: true}, dock: BX_DOCK_DEF.slice()}; bxFeatDraw(); return; }
  if (nav === 'save') {
    const st = Object.assign({at: nowIso()}, (M.settings && M.settings.bxStart) || {}, {mods: FEAT.mods});
    const rep = Object.assign({}, bxRepCfg(), {on: FEAT.mods.report !== false});
    const dock = FEAT.dock.slice();
    FEAT = null; closeSheet();
    saveSettings({bxStart: st, bxDock: dock, bxReport: rep});
    toast('내가 쓸 기능을 바꿨어요');
  }
}, true);
window.BX_rerender = function(){ if (S.view === 'today' && !SH && !document.getElementById('bx-start')) render(); };
