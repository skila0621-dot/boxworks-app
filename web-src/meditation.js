/* ---------- 명상 (대표 요청 2026-10-31, 결정 기록 D-07) ----------
   한 앱에서 자기 관리를 하도록(P-07). 시간을 고르고 시작하면 싱잉볼 소리로 시작을 알리고, 휴대폰을 내려놓아도
   중간 종·끝 종이 휴대폰 알림으로 울린다(BxAlarm.local). 소리는 우리가 합성한 파일(scripts/sound/make-bowl.py)이라 저작권 걱정이 없다.
   진행 중인 명상과 설정은 이 휴대폰에만(localStorage), 명상한 시간 기록은 'medlog' 문서(백업에 들어감).
   앱 안 문구는 생활 습관 말로 쓴다(치료·증상 같은 말은 쓰지 않음: Play 건강 앱 분류). */
// 고르는 칸 규칙(규칙 11, D-10): 시간은 5·10·20분 + 직접 입력. 예전에 고른 3·15분은 직접 입력 값으로 보인다
const MED_KEY = 'bx:med', MED_MINS = [5, 10, 20];
// 싱잉볼 종류(2판, 대표 지적 10/31: 울림이 짧고 비어 버림 → 더 맑고 길게, 여러 가지). 루틴의 싱잉볼에도 같은 종류를 쓴다
const BX_BOWLS = [['clear', '맑은 볼'], ['deep', '깊은 볼'], ['crystal', '크리스탈 볼'], ['chime', '작은 종']];
function bxBowlType(){ const v = M && M.settings && M.settings.bxBowl; return BX_BOWLS.some(b => b[0] === v) ? v : 'clear'; }
// 배경 소리(시험판 33, 대표 요청·결정 11/3, 결정 기록 D-12): 고른 소리가 명상하는 동안 이어지다가 끝 종과 함께 꺼진다.
// 공부할 때는 '소리만 틀기'(화면을 꺼도 계속, 알림창의 '끄기'로도 끔). 휴대폰 쪽 BxSound(미디어 재생 서비스)가 튼다.
// 녹음은 모두 CC0 공개 녹음(scripts/sound/BG-SOURCES.md), 백색소음은 휴대폰에서 만든다. 효과(집중·불안 등)를 말하는 글은 쓰지 않는다
const BX_BGS = [['', '없음'], ['waves', '파도'], ['birds', '숲속 새소리'], ['wind', '바람'], ['reeds', '갈대'], ['noise', '백색소음']];
function bgPlug(){ const p = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.BxSound; return p && p.play ? p : null; }
function bgName(k){ const b = k && BX_BGS.find(x => x[0] === k); return b ? b[1] : ''; }
function bgCur(){ return BX_BGS.some(b => b[0] === MED.bg) ? MED.bg : ''; }
// 지금 휴대폰에서 나오는 배경 소리. sound가 ''이면 꺼짐, mode: only(소리만 틀기) | med(명상)
let BG = {sound: '', mode: ''};
// 명상의 배경 소리는 끝 종 2초 전부터 줄어든다(휴대폰 쪽에서 3초 동안)
const BG_END_LEAD = 2000;
function bgSet(st){
  const s = st && st.playing && st.sound ? {sound: st.sound, mode: st.mode === 'med' ? 'med' : 'only'} : {sound: '', mode: ''};
  // 명상이 끝났는데 명상 배경 소리가 남아 있으면 끈다(앱으로 돌아왔을 때)
  if (s.sound && s.mode === 'med' && (!MED.run || Date.now() > MED.run.endAt + 5000)) { bgStop(); if (S.view === 'med' && !SH) render(); return; }
  if (s.sound === BG.sound && s.mode === BG.mode) return;
  BG = s;
  const typing = document.activeElement && document.activeElement.tagName === 'INPUT';
  if (!SH && !typing && S.view === 'med') render();
}
function bgOnly(){
  const p = bgPlug(), k = bgCur(); if (!p || !k) return;
  p.play({sound: k, mode: 'only'}).then(() => toast(bgName(k) + bxJosaUl(bgName(k)) + ' 틀었어요')).catch(() => toast('소리를 틀지 못했어요'));
  BG = {sound: k, mode: 'only'}; render();
}
function bgStop(){ const p = bgPlug(); if (p) p.stop().catch(() => {}); BG = {sound: '', mode: ''}; }
// 알림창의 '끄기'·명상 끝·이어폰 빠짐으로 꺼지면 휴대폰이 알려 준다. 앱으로 돌아올 때도 한 번 물어본다
(function bgWatch(){
  const p = bgPlug(); if (!p) return;
  try { if (p.addListener) p.addListener('state', bgSet); } catch (e) { /* 알림을 받을 수 없음 */ }
  const ask = () => { try { p.status().then(bgSet).catch(() => {}); } catch (e) { /* 물어볼 수 없음 */ } };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) ask(); });
  setTimeout(ask, 800);
})();
// 중간 종 간격(초). 30초~10분, 직접 입력(분). 명상 시간보다 짧은 것만 보인다
// 규칙 11: 셋 + 직접 입력, '없음'은 아래 글자 단추. 예전에 고른 30초·2분·10분은 직접 입력 값으로 보인다
const MED_BELLS = [[60, '1분'], [180, '3분'], [300, '5분']];
function medBellText(sec){ return sec < 60 ? sec + '초' : (sec % 60 ? Math.floor(sec / 60) + '분 ' + (sec % 60) + '초' : sec / 60 + '분'); }
// 직접 입력한 분(1–120)·중간 종 간격(분)은 바로 반영된다
document.addEventListener('change', ev => {
  if (!ev.target) return;
  if (ev.target.id === 'bx-med-cbell') { MED.bellS = Math.max(1, Math.min(60, Math.round(+ev.target.value) || 5)) * 60; MED.bellCust = true; if (MED.bellS >= MED.min * 60) MED.bellS = 0; medSave(); render(); return; }
  if (ev.target.id !== 'bx-med-cmin') return;
  const v = Math.max(1, Math.min(120, Math.round(+ev.target.value) || 10));
  MED.min = v; MED.cust = !MED_MINS.includes(v);
  if (MED.bellS >= MED.min * 60) MED.bellS = 0;
  medSave(); render();
});
let MED = (() => { try { return Object.assign({min: 10, bell: 0, breath: true, run: null}, JSON.parse(lsGet(MED_KEY) || '{}')); } catch (e) { return {min: 10, bell: 0, breath: true, run: null}; } })();
// 예전 판의 '중간 종(분)'을 초로 옮긴다
if (MED.bellS == null) MED.bellS = (+MED.bell || 0) * 60;
let medTimer = null;
function medSave(){ try { lsSet(MED_KEY, JSON.stringify(MED)); } catch (e) { /* 저장 공간 없음 */ } }
function medAlarm(){ return window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.BxAlarm && Capacitor.Plugins.BxAlarm.local ? Capacitor.Plugins.BxAlarm : null; }
// 앱 안에서도 휴대폰 쪽 플레이어로 튼다(res/raw 파일, 알람 소리 크기). type이 'stop'이면 멈춤
function medPlay(name, type){
  type = type || bxBowlType();
  const pl = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.BxAlarm;
  if (pl && pl.bowl) { pl.bowl({sound: name, type}).catch(() => {}); return; }
  if (type === 'stop') { if (medPlay.a) medPlay.a.pause(); return; }
  try { if (medPlay.a) medPlay.a.pause(); const a = new Audio('sounds/bx_bowl_' + type + (name === 'bowl3' ? '_end' : '') + '.ogg'); a.volume = name === 'bowl_soft' ? 0.5 : 0.9; medPlay.a = a; const p = a.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* 소리를 낼 수 없음 */ }
}
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
function medMoreText(){
  const b = (BX_BOWLS.find(x => x[0] === bxBowlType()) || BX_BOWLS[0])[1];
  const bell = MED.bellS && MED.bellS < MED.min * 60 ? '중간 종 ' + medBellText(MED.bellS) + '마다' : '중간 종 없음';
  return b + (MED.startBell === false ? ' · 시작 종 없음' : '') + ' · ' + bell + ' · 호흡 안내 ' + (MED.breath ? '켬' : '끔') + (bgPlug() ? ' · 배경 소리 ' + (bgName(bgCur()) || '없음') : '');
}
document.addEventListener('toggle', ev => { const d = ev.target; if (d && d.classList && d.classList.contains('bx-med-more')) { MED.moreOpen = d.open; medSave(); } }, true);
function medHtml(){
  const now = Date.now(), run = MED.run, live = run && run.endAt > now, done = run && run.endAt <= now;
  const head = '<div class="page-head"><div class="ph-t"><h1>명상</h1><p>' + (medLog()[M.today] ? '오늘 ' + medLog()[M.today] + '분' + (medWeek() > medLog()[M.today] ? ' · 이번 주 ' + medWeek() + '분' : '') : '편하게 앉아 숨에 집중해 보세요') + '</p></div></div>';
  if (live || done) {
    const left = live ? (run.endAt - now) / 1000 : 0, lead = live && now < run.startAt;
    // 시작 전 5초(lead): 원은 멈춰 있고 가운데에 남은 초, 아래에 '휴대폰을 내려놓고 편히 앉으세요'. 첫 종과 함께 호흡 안내가 시작된다
    return head + '<section class="bx-med-run' + (lead ? ' lead' : MED.breath && live ? ' breath' : '') + (done ? ' done' : '') + '" aria-live="polite">' +
      '<div class="bx-med-circle"' + (live && MED.breath && !lead ? ' style="animation-delay:-' + ((now - run.startAt) % 10000) + 'ms"' : '') + '><span class="bx-med-left tnum" id="bx-med-left">' + (done ? '끝' : lead ? String(Math.ceil((run.startAt - now) / 1000)) : medMinText(left)) + '</span><span class="bx-med-cue" id="bx-med-cue">' + (done ? run.min + '분 명상을 마쳤어요' : lead ? '휴대폰을 내려놓고 편히 앉으세요' : MED.breath ? '들이쉬고' : '') + '</span></div>' +
      (done ? '<div class="bx-med-acts"><button type="button" class="btn grow" data-act="bx-med-close">닫기</button><button type="button" class="btn primary grow" data-act="bx-med-again">한 번 더</button></div>'
        : '<p class="p small bx-med-note">휴대폰을 내려놓아도 ' + (run.bellS ? medBellText(run.bellS) + '마다 종이, 끝나면 ' : '끝나면 ') + '세 번 울려요.' + (run.bg && bgName(run.bg) ? ' ' + bgName(run.bg) + '는 끝 종 앞에서 줄어들어요.' : '') + '</p><button type="button" class="btn bx-med-stop" data-act="bx-med-stop">끝내기</button>') +
      '</section>';
  }
  const pick = (attr, v, cur, label) => '<button type="button" class="pick" ' + attr + '="' + v + '" aria-pressed="' + (cur === v) + '">' + label + '</button>';
  // 정해진 간격에 없는 값(직접 입력·예전 값)은 그 자리에서 입력칸으로
  const bellCust = !!MED.bellS && (MED.bellCust || MED.bellOpen || !MED_BELLS.some(b => b[0] === MED.bellS));
  const startOn = MED.startBell !== false;
  // 소리만 틀어 둔 중이면 맨 위에 무엇이 나오는지와 끄기(잊고 켜 두지 않게)
  const bgNow = bgPlug() && BG.sound && BG.mode === 'only' ? '<div class="bx-bg-now" role="status"><span class="bx-bg-now-t">' + bxIconSpan('music', '') + '<span><b>' + esc(bgName(BG.sound)) + ' 나오는 중</b><small>화면을 꺼도 계속 나와요</small></span></span><button type="button" class="btn" data-act="bx-med-bgstop">끄기</button></div>' : '';
  // 배경 소리: 종소리·중간 종 다음, 호흡 안내 앞(소리 먼저, 숨은 나중). 고르면 '소리만 틀기'(공부할 때)
  const bgBlock = !bgPlug() ? '' : '<div class="fg-l tv-h">배경 소리</div><div class="picks bx-bg-picks">' + BX_BGS.map(b => '<button type="button" class="pick" data-bxbg="' + (b[0] || 'none') + '" aria-pressed="' + (bgCur() === b[0]) + '">' + b[1] + '</button>').join('') + '</div>' +
    '<p class="p small bx-med-note">누르면 잠깐 들려요. 명상하는 동안 이어지다가 끝날 때 함께 꺼져요. 소리 크기는 휴대폰 음량 단추로 맞춰요.</p>' +
    (bgCur() ? '<div class="bx-bg-only">' + (BG.sound && BG.mode === 'only' ? '<button type="button" class="btn" data-act="bx-med-bgstop">' + bxIconSpan('music', '') + '소리 끄기</button>' : '<button type="button" class="btn" data-act="bx-med-bgonly">' + bxIconSpan('music', '') + '소리만 틀기</button>') +
      '<span class="p small">명상 없이 소리만 틀어요(공부할 때). 화면을 꺼도 계속 나와요.</span></div>' : '');
  return head + '<section class="set-sec bx-med-set">' + bgNow +
    // '직접 입력'은 그 칩 자리에서 입력칸이 된다(규칙 9·12)
    '<div class="fg-l">시간</div><div class="picks">' + MED_MINS.map(m => pick('data-med-min', m, MED.cust ? -1 : MED.min, m + '분')).join('') +
      (MED_MINS.includes(MED.min) && !MED.cust ? '<button type="button" class="pick" data-med-custom="1" aria-pressed="false">직접 입력</button>'
        : '<span class="bx-cpick"><input id="bx-med-cmin" type="number" inputmode="numeric" min="1" max="120" value="' + MED.min + '" aria-label="명상 시간(분)"><span>분</span></span>') + '</div>' +
    // 종소리·중간 종·호흡 안내는 한 줄로 접는다(정리판 14번, 대표 결정 11/1). 접힌 줄에 지금 고른 값이 보인다
    '<details class="bx-med-more"' + (MED.moreOpen ? ' open' : '') + '><summary><span class="bx-mm-t"><b>소리와 호흡</b><small>' + esc(medMoreText()) + '</small></span>' + ICON.chevR + '</summary>' +
    '<div class="fg-l tv-h">종소리</div><div class="picks bx-bowl-picks">' + BX_BOWLS.map(b => '<button type="button" class="pick" data-bxbowl="' + b[0] + '" aria-pressed="' + (bxBowlType() === b[0]) + '">' + b[1] + '</button>').join('') + '</div>' +
    '<p class="p small bx-med-note">누르면 바로 들어 볼 수 있어요. 끝날 때는 늘 세 번 울려요(눈을 감고 있어도 끝을 알게).</p>' +
    // 시작 종 스위치(대표 요청 11/3 오후: 배경 소리만 듣고 싶을 수도, 종소리와 섞고 싶을 수도). 끝 종은 끄지 않는다(대표 지적 11/3: 끝을 소리로 알아야 함)
    '<div class="bx-swrow tv-h"><span>시작 종</span>' + bxSwitch('data-med-startbell', startOn, '시작 종') + '</div>' +
    (startOn ? '' : '<p class="p small bx-med-note">첫 종 없이 시작해요. 배경 소리를 고르면 그 소리로 시작해요.</p>') +
    // 중간 종: 켜기·끄기 스위치, 켰을 때만 간격(대표 결정 11/2 밤, 일정 알림과 같은 모양)
    '<div class="bx-swrow tv-h"><span>중간 종 · 다시 치는 간격</span><button type="button" class="tog" role="switch" aria-checked="' + !!MED.bellS + '" aria-label="중간 종" data-med-bellsw="1"><i></i></button></div>' +
    (MED.bellS ? '<div class="picks">' +
      MED_BELLS.filter(b => b[0] < MED.min * 60).map(b => pick('data-med-bell', b[0], bellCust ? -1 : MED.bellS, b[1] + '마다')).join('') +
      (bellCust ? '<span class="bx-cpick"><input id="bx-med-cbell" type="number" inputmode="numeric" min="1" max="60" value="' + (MED.bellS ? Math.max(1, Math.round(MED.bellS / 60)) : 5) + '" aria-label="중간 종 간격(분)"><span>분마다</span></span>'
        : '<button type="button" class="pick" data-med-bellc="1" aria-pressed="false">직접 입력</button>') + '</div>' : '') +
    bgBlock +
    // 호흡 안내도 같은 스위치(켜고 끄는 칸은 앱 어디서나 스위치 하나)
    '<div class="bx-swrow tv-h"><span>호흡 안내</span>' + bxSwitch('data-med-breath', MED.breath, '호흡 안내') + '</div>' +
    '<p class="p small bx-med-note">호흡 안내를 켜면 원이 커질 때 들이쉬고(4초), 작아질 때 내쉬어요(6초).</p>' +
    (bgPlug() ? '<p class="p small bx-bg-credit">배경 소리 녹음: BigSoundBank · Freesound의 공개 녹음(CC0)</p>' : '') + '</details>' +
    '<div class="bx-med-acts"><button type="button" class="btn" data-act="bx-med-hear">' + bxIconSpan('music', '') + '종소리 듣기</button><button type="button" class="btn primary grow" data-act="bx-med-start">' + MED.min + '분 시작</button></div>' +
    '</section>';
}
// 시작을 누르면 5초를 센 뒤 첫 종(대표 요청 11/3: 휴대폰을 내려놓고 자세와 자리를 잡을 시간). 첫 종도 휴대폰 알람으로 걸어 화면을 꺼도 울린다
const MED_LEAD = 5000;
function medStart(){
  const now = Date.now(), start = now + MED_LEAD, min = MED.min, startBell = MED.startBell !== false, bellS = MED.bellS && MED.bellS < min * 60 ? MED.bellS : 0, type = bxBowlType();
  const bg = bgPlug() ? bgCur() : '';
  MED.run = {startAt: start, endAt: start + min * 60000, min, bellS, leadAt: now, bg, startBell};
  medSave();
  // 배경 소리: 첫 종과 함께 서서히 커지고, 끝 종 2초 전부터 3초 동안 줄어 끝 종이 또렷하게 들린다(대표 지적 11/3: 끝나도 소리가 계속 나와 끝을 모름).
  // 휴대폰이 시각을 알고 있어 화면이 꺼져도 맞게 꺼진다
  if (bg) { bgPlug().play({sound: bg, mode: 'med', startAt: start, until: MED.run.endAt - BG_END_LEAD}).catch(() => {}); BG = {sound: bg, mode: 'med'}; }
  else if (BG.sound) bgStop();
  const al = medAlarm();
  if (!al && startBell) setTimeout(() => { if (MED.run && MED.run.startAt === start) medPlay('bowl', type); }, MED_LEAD);
  if (al) {
    // 시작 종을 끄면 첫 종 알람만 빼고, 끝 종(세 번)은 늘 건다
    const list = [{id: 'med_end', at: MED.run.endAt, kind: 'item', sound: 'bowl3', bowl: type, group: '명상', title: '명상을 마쳤어요', sub: min + '분 동안 잘했어요'}];
    if (startBell) list.unshift({id: 'med_start', at: start, kind: 'item', sound: 'bowl', bowl: type, group: '명상', title: '명상을 시작해요', sub: min + '분 · 편하게 숨 쉬어요'});
    // 중간 종: 다시 치는 간격마다(소리가 40초 넘게 울려서 짧은 간격이면 겹쳐 이어진다). 휴대폰 알람은 150개까지
    if (bellS) for (let t = bellS; t < min * 60 && list.length < 150; t += bellS) list.push({id: 'med_b' + t, at: start + t * 1000, kind: 'item', sound: 'bowl_soft', bowl: type, group: '명상', title: '명상 ' + medMinText(t), sub: medMinText(min * 60 - t) + ' 남았어요'});
    al.cancelLocal({prefix: 'med_'}).catch(() => {}).then(() => al.local({alarms: list})).catch(() => {});
  }
  render(); medTick();
}
function medStop(record){
  const run = MED.run; MED.run = null; medSave();
  const al = medAlarm(); if (al) al.cancelLocal({prefix: 'med_'}).catch(() => {});
  medPlay('bowl', 'stop');
  if (bgPlug() && (run && run.bg || BG.mode === 'med')) bgStop();
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
      // 휴대폰이 배경 소리를 끝 종 앞에서 끄지만, 혹시 남아 있으면 앱이 한 번 더 끈다
      if (BG.sound && BG.mode === 'med') setTimeout(() => { if (BG.sound && BG.mode === 'med' && (!MED.run || Date.now() >= MED.run.endAt)) bgStop(); }, 3000);
      if (S.view === 'med') render();
      return;
    }
    const el = document.getElementById('bx-med-left'), cue = document.getElementById('bx-med-cue');
    if (now < MED.run.startAt) {
      // 시작 전 5초: 남은 초를 크게, 안내 한 줄
      if (el) el.textContent = String(Math.ceil((MED.run.startAt - now) / 1000));
      if (cue) cue.textContent = '휴대폰을 내려놓고 편히 앉으세요';
      return;
    }
    const sec = document.querySelector('.bx-med-run.lead'); if (sec) { sec.classList.remove('lead'); if (MED.breath) sec.classList.add('breath'); }
    if (el) el.textContent = medMinText(Math.min(left, MED.run.min * 60));
    if (cue) cue.textContent = MED.breath ? (((now - MED.run.startAt) / 1000) % 10 < 4 ? '들이쉬고' : '내쉬고') : '';
  }, 1000);
}
if (MED.run && MED.run.endAt > Date.now()) setTimeout(medTick, 500);
else if (MED.run && MED.run.endAt <= Date.now() && !MED.run.logged) setTimeout(() => { if (M && MED.run && !MED.run.logged) { MED.run.logged = true; medSave(); medAddLog(MED.run.min); } }, 1500);
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const t = ev.target.closest('[data-act^="bx-med-"],[data-med-min],[data-med-bell],[data-med-bellc],[data-med-bellsw],[data-med-breath],[data-med-startbell],[data-med-custom],[data-bxbowl],[data-bxbg]'); if (!t) return;
  ev.stopPropagation();
  const act = t.dataset.act;
  if (t.dataset.bxbowl) {
    const k = t.dataset.bxbowl;
    $$('[data-bxbowl]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.bxbowl === k)));
    medPlay('bowl', k);
    if (k !== bxBowlType()) saveSettings({bxBowl: k});
    return;
  }
  if (t.dataset.bxbg != null) {
    // 고르면 6초 들려 준다. 소리만 틀어 둔 중이면 그 자리에서 바꾼다('없음'이면 끔)
    const k = t.dataset.bxbg === 'none' ? '' : t.dataset.bxbg, p = bgPlug();
    MED.bg = BX_BGS.some(b => b[0] === k) ? k : ''; medSave();
    if (p) {
      if (BG.sound && BG.mode === 'only') {
        if (MED.bg) { p.play({sound: MED.bg, mode: 'only'}).catch(() => {}); BG = {sound: MED.bg, mode: 'only'}; } else bgStop();
      } else p.preview({sound: MED.bg}).catch(() => {});
    }
    render(); return;
  }
  if (t.dataset.medBellsw != null) {
    // 끄면 간격을 기억해 두었다가 다시 켜면 그 간격(처음엔 3분, 명상 시간보다 짧게)
    if (MED.bellS) { MED.bellLast = MED.bellS; MED.bellS = 0; MED.bellCust = false; MED.bellOpen = false; }
    else { const v = MED.bellLast || 180; MED.bellS = v < MED.min * 60 ? v : 60; }
    medSave(); render(); return;
  }
  if (t.dataset.medBellc != null) { MED.bellOpen = true; MED.bellCust = true; if (!MED.bellS) MED.bellS = 300; medSave(); render(); setTimeout(() => { const i = $('#bx-med-cbell'); if (i) { i.focus(); i.select(); } }, 50); return; }
  if (t.dataset.medCustom != null) { MED.cust = true; render(); setTimeout(() => { const i = $('#bx-med-cmin'); if (i) { i.focus(); i.select(); } }, 50); return; }
  if (t.dataset.medMin != null) { MED.cust = false; MED.min = +t.dataset.medMin; if (MED.bellS >= MED.min * 60) MED.bellS = 0; medSave(); render(); return; }
  if (t.dataset.medBell != null) { MED.bellS = +t.dataset.medBell; MED.bellCust = false; MED.bellOpen = false; medSave(); render(); return; }
  if (t.dataset.medBreath != null) { MED.breath = t.dataset.medBreath === '1'; medSave(); render(); return; }
  if (t.dataset.medStartbell != null) { MED.startBell = t.dataset.medStartbell === '1'; medSave(); render(); return; }
  if (act === 'bx-med-open') { closeSheet(); go('med'); return; }
  if (act === 'bx-med-hear') { medPlay('bowl'); return; }
  if (act === 'bx-med-bgonly') { bgOnly(); return; }
  if (act === 'bx-med-bgstop') { bgStop(); render(); toast('배경 소리를 껐어요'); return; }
  if (act === 'bx-med-start') { medStart(); return; }
  if (act === 'bx-med-stop') { medStop(true); toast('명상을 끝냈어요'); return; }
  if (act === 'bx-med-again') { MED.run = null; medStart(); return; }
  if (act === 'bx-med-close') { MED.run = null; medSave(); render(); return; }
}, true);
