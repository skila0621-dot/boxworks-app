/* ---------- 명상 (대표 요청 2026-10-31, 결정 기록 D-07) ----------
   한 앱에서 자기 관리를 하도록(P-07). 시간을 고르고 시작하면 싱잉볼 소리로 시작을 알리고, 휴대폰을 내려놓아도
   중간 종·끝 종이 휴대폰 알림으로 울린다(BxAlarm.local). 소리는 우리가 합성한 파일(scripts/sound/make-bowl.py)이라 저작권 걱정이 없다.
   진행 중인 명상과 설정은 이 휴대폰에만(localStorage), 명상한 시간 기록은 'medlog' 문서(백업에 들어감).
   앱 안 문구는 생활 습관 말로 쓴다(치료·증상 같은 말은 쓰지 않음: Play 건강 앱 분류). */
const MED_KEY = 'bx:med', MED_MINS = [3, 5, 10, 15, 20];
// 직접 입력한 분(1–120)은 바로 반영된다
document.addEventListener('change', ev => {
  if (!ev.target || ev.target.id !== 'bx-med-cmin') return;
  const v = Math.max(1, Math.min(120, Math.round(+ev.target.value) || 10));
  MED.min = v; MED.cust = !MED_MINS.includes(v);
  if (MED.bell && (MED.min <= 3 || (MED.bell === 5 && MED.min < 10) || (MED.bell === 1 && MED.min >= 10))) MED.bell = 0;
  medSave(); render();
});
let MED = (() => { try { return Object.assign({min: 10, bell: 0, breath: true, run: null}, JSON.parse(lsGet(MED_KEY) || '{}')); } catch (e) { return {min: 10, bell: 0, breath: true, run: null}; } })();
let medTimer = null;
function medSave(){ try { lsSet(MED_KEY, JSON.stringify(MED)); } catch (e) { /* 저장 공간 없음 */ } }
function medAlarm(){ return window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.BxAlarm && Capacitor.Plugins.BxAlarm.local ? Capacitor.Plugins.BxAlarm : null; }
function medPlay(name){ try { const a = new Audio('sounds/bx_' + name + '.ogg'); a.volume = 0.9; const p = a.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* 소리를 낼 수 없음 */ } }
function medMinText(sec){ sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }
function medLog(){ const d = getDoc('medlog'); return d && d.days && typeof d.days === 'object' ? d.days : {}; }
function medAddLog(min){
  const days = Object.assign({}, medLog()); days[M.today] = (days[M.today] || 0) + min;
  const keys = Object.keys(days).sort(); while (keys.length > 400) delete days[keys.shift()];
  writeDoc('medlog', {type: 'medlog', days, updatedAt: nowIso()});
}
function medWeek(){ const days = medLog(); let n = 0; for (let k = 0; k < 7; k++) n += days[ymd(addDays(parseYmd(M.today), -k))] || 0; return n; }
// 루틴 탭 위쪽 카드
function medCardHtml(){
  const run = MED.run && MED.run.endAt > Date.now();
  return '<section class="set-sec bx-med-card" aria-labelledby="bx-med-h"><div class="bx-med-row">' + bxIconSpan('lotus', 'rt') +
    '<div class="bx-med-t"><h2 id="bx-med-h">명상</h2><p class="p small">' + (run ? '진행 중 · ' + medMinText((MED.run.endAt - Date.now()) / 1000) + ' 남음' : '싱잉볼 소리로 시작과 끝을 알려 줘요' + (medWeek() ? ' · 이번 주 ' + medWeek() + '분' : '')) + '</p></div>' +
    '<button type="button" class="btn primary" data-act="bx-med-open">' + (run ? '이어 보기' : '시작') + '</button></div></section>';
}
function medHtml(){
  const now = Date.now(), run = MED.run, live = run && run.endAt > now, done = run && run.endAt <= now;
  const head = '<div class="page-head"><div class="ph-t"><h1>명상</h1><p>' + (medLog()[M.today] ? '오늘 ' + medLog()[M.today] + '분' + (medWeek() > medLog()[M.today] ? ' · 이번 주 ' + medWeek() + '분' : '') : '편하게 앉아 숨에 집중해 보세요') + '</p></div></div>';
  if (live || done) {
    const left = live ? (run.endAt - now) / 1000 : 0;
    return head + '<section class="bx-med-run' + (MED.breath && live ? ' breath' : '') + (done ? ' done' : '') + '" aria-live="polite">' +
      '<div class="bx-med-circle"' + (live && MED.breath ? ' style="animation-delay:-' + ((now - run.startAt) % 10000) + 'ms"' : '') + '><span class="bx-med-left tnum" id="bx-med-left">' + (done ? '끝' : medMinText(left)) + '</span><span class="bx-med-cue" id="bx-med-cue">' + (done ? run.min + '분 명상을 마쳤어요' : MED.breath ? '들이쉬고' : '') + '</span></div>' +
      (done ? '<div class="bx-med-acts"><button type="button" class="btn grow" data-act="bx-med-close">닫기</button><button type="button" class="btn primary grow" data-act="bx-med-again">한 번 더</button></div>'
        : '<p class="p small bx-med-note">휴대폰을 내려놓아도 ' + (run.bell ? run.bell + '분마다 작은 종이, 끝나면 ' : '끝나면 ') + '세 번 울려요.</p><button type="button" class="btn bx-med-stop" data-act="bx-med-stop">끝내기</button>') +
      '</section>';
  }
  const pick = (attr, v, cur, label) => '<button type="button" class="pick" ' + attr + '="' + v + '" aria-pressed="' + (cur === v) + '">' + label + '</button>';
  return head + '<section class="set-sec bx-med-set">' +
    '<div class="fg-l">시간</div><div class="picks">' + MED_MINS.map(m => pick('data-med-min', m, MED.min, m + '분')).join('') +
      '<button type="button" class="pick" data-med-custom="1" aria-pressed="' + !MED_MINS.includes(MED.min) + '">직접 입력</button></div>' +
    (MED_MINS.includes(MED.min) && !MED.cust ? '' : '<label class="bx-med-cmin"><input id="bx-med-cmin" class="inp" type="number" inputmode="numeric" min="1" max="120" value="' + MED.min + '"><span>분</span></label>') +
    '<div class="fg-l tv-h">중간 종</div><div class="picks">' + pick('data-med-bell', 0, MED.bell, '없음') + (MED.min > 3 ? pick('data-med-bell', MED.min >= 10 ? 5 : 1, MED.bell, (MED.min >= 10 ? 5 : 1) + '분마다') : '') + '</div>' +
    '<div class="fg-l tv-h">호흡 안내</div><div class="picks">' + pick('data-med-breath', 1, MED.breath ? 1 : 0, '켜기') + pick('data-med-breath', 0, MED.breath ? 1 : 0, '끄기') + '</div>' +
    '<p class="p small bx-med-note">호흡 안내를 켜면 원이 커질 때 들이쉬고(4초), 작아질 때 내쉬어요(6초).</p>' +
    '<div class="bx-med-acts"><button type="button" class="btn" data-act="bx-med-hear">' + bxIconSpan('music', '') + '종소리 듣기</button><button type="button" class="btn primary grow" data-act="bx-med-start">' + MED.min + '분 시작</button></div>' +
    '</section>';
}
function medStart(){
  const now = Date.now(), min = MED.min, bell = MED.min > 3 ? MED.bell : 0;
  MED.run = {startAt: now, endAt: now + min * 60000, min, bell};
  medSave(); medPlay('bowl');
  const al = medAlarm();
  if (al) {
    const list = [{id: 'med_end', at: MED.run.endAt, kind: 'item', sound: 'bowl3', group: '명상', title: '명상을 마쳤어요', sub: min + '분 동안 잘했어요'}];
    if (bell) for (let t = bell; t < min; t += bell) list.push({id: 'med_b' + t, at: now + t * 60000, kind: 'item', sound: 'bowl_soft', group: '명상', title: '명상 ' + t + '분', sub: (min - t) + '분 남았어요'});
    al.cancelLocal({prefix: 'med_'}).catch(() => {}).then(() => al.local({alarms: list})).catch(() => {});
  }
  render(); medTick();
}
function medStop(record){
  const run = MED.run; MED.run = null; medSave();
  const al = medAlarm(); if (al) al.cancelLocal({prefix: 'med_'}).catch(() => {});
  if (record && run) { const m = Math.floor((Date.now() - run.startAt) / 60000); if (m >= 1) medAddLog(m); }
  render();
}
// 진행 중에는 1초마다 남은 시간과 호흡 안내 글만 바꾼다(화면 전체를 다시 그리지 않음)
function medTick(){
  clearInterval(medTimer); medTimer = null;
  if (!MED.run) return;
  medTimer = setInterval(() => {
    if (!MED.run) { clearInterval(medTimer); return; }
    const now = Date.now(), left = (MED.run.endAt - now) / 1000;
    if (left <= 0) {
      clearInterval(medTimer); medTimer = null;
      if (!MED.run.logged) { MED.run.logged = true; medSave(); medAddLog(MED.run.min); if (!medAlarm()) medPlay('bowl3'); }
      if (S.view === 'med') render();
      return;
    }
    const el = document.getElementById('bx-med-left'); if (el) el.textContent = medMinText(left);
    const cue = document.getElementById('bx-med-cue');
    if (cue && MED.breath) cue.textContent = ((now - MED.run.startAt) / 1000) % 10 < 4 ? '들이쉬고' : '내쉬고';
  }, 1000);
}
if (MED.run && MED.run.endAt > Date.now()) setTimeout(medTick, 500);
else if (MED.run && MED.run.endAt <= Date.now() && !MED.run.logged) setTimeout(() => { if (M && MED.run && !MED.run.logged) { MED.run.logged = true; medSave(); medAddLog(MED.run.min); } }, 1500);
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const t = ev.target.closest('[data-act^="bx-med-"],[data-med-min],[data-med-bell],[data-med-breath],[data-med-custom]'); if (!t) return;
  ev.stopPropagation();
  const act = t.dataset.act;
  if (t.dataset.medCustom != null) { MED.cust = true; render(); setTimeout(() => { const i = $('#bx-med-cmin'); if (i) { i.focus(); i.select(); } }, 50); return; }
  if (t.dataset.medMin != null) { MED.cust = false; MED.min = +t.dataset.medMin; if (MED.bell && (MED.min <= 3 || (MED.bell === 5 && MED.min < 10) || (MED.bell === 1 && MED.min >= 10))) MED.bell = 0; medSave(); render(); return; }
  if (t.dataset.medBell != null) { MED.bell = +t.dataset.medBell; medSave(); render(); return; }
  if (t.dataset.medBreath != null) { MED.breath = t.dataset.medBreath === '1'; medSave(); render(); return; }
  if (act === 'bx-med-open') { closeSheet(); go('med'); return; }
  if (act === 'bx-med-hear') { medPlay('bowl'); return; }
  if (act === 'bx-med-start') { medStart(); return; }
  if (act === 'bx-med-stop') { medStop(true); toast('명상을 끝냈어요'); return; }
  if (act === 'bx-med-again') { MED.run = null; medStart(); return; }
  if (act === 'bx-med-close') { MED.run = null; medSave(); go('routines'); return; }
}, true);
