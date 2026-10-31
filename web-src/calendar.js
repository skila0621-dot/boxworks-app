/* ---------- 휴대폰 캘린더 읽기 (D-05, 1차 #9) ----------
   휴대폰 캘린더(구글 캘린더 등)의 일정을 읽어 박스웍스 일정처럼 오늘·주간·월간·검색에 함께 보여 준다. 읽기만 한다.
   화면용 id: 'pc_' + 일정 id + '_' + 시작 밀리초(여러 날 종일 일정은 뒤에 '_n').
   박스웍스에서 정한 알림·이동 시간·준비 루틴·완료는 문서 'px_' + 같은 열쇠(type 'pcx')에 따로 적는다(백업에 들어감).
   설정(켜기, 고른 캘린더, 알람 걸기)과 읽어 온 일정 사본은 이 휴대폰에만 둔다(localStorage). */
const PC_CFG = 'bx:pcal', PC_CACHE = 'bx:pcache';
const PC = {events: null, at: 0, busy: false, cals: null, calBusy: false, granted: null, colors: new Map()};
const PC_SKIP = /공휴일|휴일|기념일|생일|holiday|birthday/i;
const pcTvMemo = new Map();
function pcPlug(){ return (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.BxCalendar) || null; }
function pcCfg(){
  let o = {}; try { o = JSON.parse(lsGet(PC_CFG) || '{}') || {}; } catch (e) { o = {}; }
  return {on: !!o.on, ids: Array.isArray(o.ids) ? o.ids.map(String) : null, alarm: o.alarm !== false};
}
function pcSetCfg(o){ lsSet(PC_CFG, JSON.stringify(Object.assign(pcCfg(), o))); }
function pcLoadCache(){
  if (PC.events) return;
  try { const c = JSON.parse(lsGet(PC_CACHE) || 'null'); if (c && Array.isArray(c.events)) { PC.events = c.events; PC.at = c.at || 0; } } catch (e) { /* 사본이 없거나 깨짐 */ }
}
function pcColor(n){ return '#' + ((+n || 0) >>> 0 & 0xffffff).toString(16).padStart(6, '0'); }
async function pcRefresh(force){
  const cfg = pcCfg(), pl = pcPlug();
  if (!cfg.on || !pl || PC.busy) return;
  if (!force && Date.now() - PC.at < 60000) return;
  PC.busy = true;
  try {
    const st = await pl.status(); PC.granted = !!(st && st.granted);
    if (!PC.granted) { scheduleRender(); return; }
    const t0 = addDays(sod(new Date()), -14).getTime(), t1 = addDays(sod(new Date()), 63).getTime();
    const r = cfg.ids && !cfg.ids.length ? {events: []} : await pl.events(Object.assign({from: t0, to: t1}, cfg.ids ? {ids: cfg.ids} : {}));
    PC.events = ((r && r.events) || []).map(e => Object.assign({}, e, {description: String(e.description || '').slice(0, 600)}));
    PC.at = Date.now();
    try { lsSet(PC_CACHE, JSON.stringify({at: PC.at, events: PC.events})); } catch (e) { /* 저장 공간 부족: 사본 없이 씀 */ }
    pcCleanup();
    scheduleRender();
  } catch (e) {
    console.warn('휴대폰 캘린더 읽기 실패', e);
  } finally { PC.busy = false; }
}
async function pcLoadCals(){
  const pl = pcPlug(); if (!pl || PC.calBusy) return;
  PC.calBusy = true;
  try { const r = await pl.calendars(); PC.cals = ((r && r.calendars) || []).filter(c => c.visible !== false); }
  catch (e) { PC.cals = []; }
  finally { PC.calBusy = false; scheduleRender(); }
}
// 60일 넘게 지난 일정의 박스웍스 메모는 지운다
function pcCleanup(){
  const lim = Date.now() - 60 * 864e5;
  allDocs().forEach((d, id) => { if (d && d.type === 'pcx') { const b = +String(d.key || '').split('_')[1]; if (b && b < lim) removeDoc(id); } });
}
function pcKey(e){ return e.eventId + '_' + e.begin; }
function pcTravel(e){
  const k = pcKey(e) + '|' + (e.title || '') + '|' + (e.description || '').length;
  if (!pcTvMemo.has(k)) { const t = tvExtract(e.description || '') || tvExtract(e.title || ''); pcTvMemo.set(k, t ? t.min : 0); }
  return pcTvMemo.get(k);
}
function pcPrepFromText(e){
  const d = String(e.description || ''); if (!d) return null;
  const r = tvPrepExtract(d); return r ? {id: r.id || null} : null;
}
// buildModel 안에서 부른다: 휴대폰 캘린더 일정을 박스웍스 일정 모양으로
function pcItems(settings){
  const cfg = pcCfg(); if (!cfg.on) return [];
  pcLoadCache(); if (!PC.events) return [];
  const out = [];
  PC.events.forEach(e => {
    const key = pcKey(e), ov = getDoc('px_' + key) || {};
    let days;
    if (e.allDay) {
      const s = new Date(e.begin).toISOString().slice(0, 10), n = Math.max(1, Math.min(14, Math.round((Math.max(e.end, e.begin + 864e5) - e.begin) / 864e5)));
      days = Array.from({length: n}, (_, i) => ymd(addDays(parseYmd(s), i)));
    } else days = [ymd(new Date(e.begin))];
    days.forEach((date, i) => {
      const timed = !e.allDay, b = new Date(e.begin), en = new Date(e.end);
      const start = timed ? hm(b) : null;
      let end = timed && ymd(en) === date && e.end > e.begin ? hm(en) : null;
      if (end && start && end <= start) end = null;
      const travel = !timed ? 0 : ov.travel != null ? ov.travel : pcTravel(e) || (tvRecall(e.title, e.location) || {}).min || 0;
      const pf = timed && ov.prep === undefined ? pcPrepFromText(e) : null;
      const cid = 'pcc_' + e.calendarId; if (!PC.colors.has(cid)) PC.colors.set(cid, pcColor(e.color));
      out.push({id: 'pc_' + key + (i ? '_' + i : ''), type: 'item', pc: true, pcKey: key, pcEv: e, title: e.title || '(제목 없음)', date, start, end,
        location: e.location || '', note: e.description || '', categoryId: cid,
        remind: ov.remind != null ? ov.remind : !cfg.alarm ? '' : timed ? remNorm(settings.defaultRemind, true, start) : remNorm(settings.defaultRemindDay, false),
        travel, prep: timed ? (ov.prep !== undefined ? ov.prep : pf && pf.id) || null : null, prepOut: !!(pf && !pf.id), done: !!ov.done, doneAt: ov.doneAt || null, slips: 0, createdAt: '', updatedAt: ''});
    });
  });
  return out;
}
function pcMeta(it){ const e = it.pcEv || {}; return '<span class="meta bx-pc"><i class="dot" style="--c:' + pcColor(e.color) + '"></i>' + esc(e.calendar || '휴대폰 캘린더') + '</span>'; }
function pcSetOv(key, patch){
  const id = 'px_' + key, cur = getDoc(id) || {type: 'pcx', key, createdAt: nowIso()};
  writeDoc(id, Object.assign({}, cur, patch, {updatedAt: nowIso()}));
  M = buildModel();
}

/* 휴대폰 캘린더 일정 창: 내용은 읽기만, 알림·이동 시간·준비 루틴·완료만 박스웍스에서 정한다 */
function pcOpen(id){ openSheet({title: '휴대폰 캘린더 일정', draw: () => pcDraw(id)}); }
function pcDraw(id){
  const it = M.items.find(i => i.id === id); if (!it) { closeSheet(); return; }
  const e = it.pcEv || {}, timed = !!it.start;
  const remCur = remList(it.remind)[0] || '';
  const remOpts = (timed ? REMIND_TIMED : REMIND_DAY).slice(0, timed ? 6 : 5);
  if (remCur && !remOpts.some(o => o[0] === remCur)) remOpts.push([remCur, remLabel(remCur)]);
  const pick = (attr, v, cur, label) => '<button type="button" class="pick" ' + attr + '="' + esc(v) + '" aria-pressed="' + (cur === v) + '">' + label + '</button>';
  let body = '<div class="pc-cal-name"><i class="dot" style="--c:' + pcColor(e.color) + '"></i>' + esc(e.calendar || '휴대폰 캘린더') + '</div>' +
    '<h3 class="pc-title">' + esc(it.title) + '</h3>' +
    '<p class="pc-when tnum">' + esc(fmtMD(it.date)) + ' · ' + (timed ? esc(it.start) + (it.end ? '–' + esc(it.end) : '') : '종일') + '</p>' +
    (it.location ? '<p class="pc-loc">' + ICON.pin + esc(it.location) + '</p>' : '') +
    (it.note ? '<p class="pc-note">' + esc(it.note.slice(0, 300)) + (it.note.length > 300 ? '…' : '') + '</p>' : '') +
    '<div class="fg-l tv-h">알림</div><div class="picks">' + remOpts.map(o => pick('data-pcrem', o[0], remCur, o[1])).join('') + '</div>';
  if (timed) {
    const tvv = +it.travel || 0, tvs = [0].concat(TV_PICKS.includes(tvv) || !tvv ? [] : [tvv]).concat(TV_PICKS);
    const curPrep = it.prep || (it.prepOut ? 'new' : '');
    body += '<div class="fg-l tv-h">가는 데 걸리는 시간</div><div class="picks">' + tvs.map(v => pick('data-pctv', String(v), String(tvv), v ? tvMinText(v) : '없음')).join('') + '</div>' +
      '<div class="fg-l tv-h">준비 루틴 <small>출발 시각에 끝나게 거꾸로 놓여요</small></div><div class="picks">' + pick('data-pcprep', '', curPrep, '없음') +
      tvPrepNames().map(r => pick('data-pcprep', r.id || 'new', curPrep, esc(r.name) + (r.id ? '' : ' <small>새로</small>'))).join('') + '</div>';
    const p = tvPlan(it);
    if (p) body += tvLineHtml(p, it.start, it.title);
  }
  body += '<p class="p small pc-ro">제목·날짜·시간은 휴대폰 캘린더 앱에서 고쳐요. 박스웍스는 읽기만 해요.</p>';
  setSheet(body, '<button type="button" class="btn grow" data-act="pc-open-app" data-id="' + esc(id) + '">' + ICON.cal + '캘린더 앱에서 열기</button>' +
    '<button type="button" class="btn grow' + (it.done ? '' : ' primary') + '" data-act="pc-done" data-id="' + esc(id) + '">' + (it.done ? '완료 취소' : ICON.check + '완료') + '</button>');
}

/* 설정 > 휴대폰 캘린더 */
function pcSetHtml(){
  if (!pcPlug()) return '';
  const cfg = pcCfg();
  let h = '<section class="set-sec" aria-labelledby="s-pcal"><h2 id="s-pcal">휴대폰 캘린더</h2>' +
    setRow('휴대폰 캘린더 일정 함께 보기', segHtml('data-pc-on', [['0', '끄기'], ['1', '켜기']], cfg.on ? '1' : '0', '휴대폰 캘린더 일정 함께 보기', 150), 'tall') +
    '<p class="p small pc-set-note">구글 캘린더 같은 휴대폰 캘린더의 일정을 오늘·주간·월간에 함께 보여 줘요. 박스웍스는 읽기만 하고 고치지 않아요. Claude나 Gemini에게 말해서 넣은 일정도 이 길로 들어와요.</p>';
  if (cfg.on) {
    if (PC.granted === false) {
      h += '<div class="set-menu"><button type="button" class="menu-row" data-act="pc-perm"><span class="mi">' + ICON.alert + '</span><span class="ml">캘린더 읽기 권한 허용하기</span><span class="mv">' + ICON.chevR + '</span></button></div>';
    } else {
      if (PC.cals == null) pcLoadCals();
      h += setRow('이 일정에도 알람 걸기', segHtml('data-pc-alarm', [['0', '끄기'], ['1', '켜기']], cfg.alarm ? '1' : '0', '휴대폰 캘린더 일정 알람', 150), 'tall') +
        '<p class="p small pc-set-note">켜 두면 위 알림 설정의 사전 알림이 휴대폰 캘린더 일정에도 걸려요. 캘린더 앱 알림과 겹쳐서 번거로우면 끄세요. 일정마다 따로 바꿀 수도 있어요.</p>';
      if (PC.cals && PC.cals.length) {
        const on = c => !cfg.ids || cfg.ids.includes(String(c.id));
        h += '<div class="set-sub">보여 줄 캘린더</div><div class="pc-cals">' + PC.cals.map(c => '<button type="button" class="pc-calb" data-pc-cal="' + esc(String(c.id)) + '" aria-pressed="' + on(c) + '"><i class="dot" style="--c:' + pcColor(c.color) + '"></i><span>' + esc(c.name || '이름 없음') + (c.account && c.account !== c.name ? '<small>' + esc(c.account) + '</small>' : '') + '</span>' + ICON.check + '</button>').join('') + '</div>';
      }
      h += '<div class="set-menu"><button type="button" class="menu-row" data-act="pc-refresh"><span class="mi">' + ICON.loop + '</span><span class="ml">지금 다시 읽기</span><span class="mv">' + (PC.at ? esc(hm(new Date(PC.at))) + ' · ' + (PC.events ? PC.events.length : 0) + '개' : '') + ICON.chevR + '</span></button></div>';
    }
  }
  return h + '</section>';
}
async function pcEnable(){
  const pl = pcPlug(); if (!pl) return;
  let st = null;
  try { st = await pl.request(); } catch (e) { st = null; }
  PC.granted = !!(st && st.granted);
  pcSetCfg({on: true});
  if (!PC.granted) { toast('캘린더 읽기 권한이 있어야 휴대폰 캘린더 일정을 보여 줄 수 있어요.'); scheduleRender(); return; }
  await pcLoadCals();
  if (!pcCfg().ids && PC.cals && PC.cals.length) {
    const ids = PC.cals.filter(c => !PC_SKIP.test(String(c.name || '')) && !PC_SKIP.test(String(c.account || ''))).map(c => String(c.id));
    if (ids.length && ids.length < PC.cals.length) pcSetCfg({ids});
  }
  await pcRefresh(true);
  toast('휴대폰 캘린더 일정 ' + (PC.events ? PC.events.length : 0) + '개를 읽었어요.');
}
window.BX_pcRefresh = pcRefresh;

document.addEventListener('click', ev => {
  if (!window.BX_APP) return;
  const t = ev.target;
  // 휴대폰 캘린더 일정 줄: 완료 표시·열기는 박스웍스 메모로 처리(원래 일정은 건드리지 않음)
  const row = t.closest('[data-act="toggle"][data-id^="pc_"],[data-act="edit"][data-id^="pc_"]');
  if (row) {
    ev.preventDefault(); ev.stopPropagation();
    const it = M.items.find(i => i.id === row.dataset.id); if (!it) return;
    if (row.dataset.act === 'toggle') { pcSetOv(it.pcKey, {done: !it.done, doneAt: it.done ? null : nowIso()}); toast(it.done ? '완료를 취소했어요.' : '완료로 표시했어요 · ' + it.title); }
    else pcOpen(it.id);
    return;
  }
  const sid = SH && $('#sheet-b') && (t.closest('[data-pcrem],[data-pctv],[data-pcprep],[data-act="pc-done"],[data-act="pc-open-app"]'));
  if (sid) {
    ev.preventDefault(); ev.stopPropagation();
    const idEl = $('#sheet-f [data-act="pc-done"]'), id = idEl ? idEl.dataset.id : null;
    const it = id ? M.items.find(i => i.id === id) : null; if (!it) return;
    if (sid.dataset.pcrem != null) pcSetOv(it.pcKey, {remind: sid.dataset.pcrem});
    else if (sid.dataset.pctv != null) { const v = +sid.dataset.pctv || 0; pcSetOv(it.pcKey, {travel: v}); if (v) tvRemember(it.title, it.location, v); }
    else if (sid.dataset.pcprep != null) { const v = sid.dataset.pcprep; pcSetOv(it.pcKey, {prep: v === 'new' ? tvEnsureOut() : v || null}); }
    else if (sid.dataset.act === 'pc-done') { pcSetOv(it.pcKey, {done: !it.done, doneAt: it.done ? null : nowIso()}); closeSheet(); toast(it.done ? '완료를 취소했어요.' : '완료로 표시했어요 · ' + it.title); return; }
    else if (sid.dataset.act === 'pc-open-app') { const e = it.pcEv || {}; const pl = pcPlug(); if (pl) pl.open({eventId: e.eventId, begin: e.begin, end: e.end}).catch(() => toast('캘린더 앱을 열지 못했어요.')); return; }
    pcDraw(id);
    return;
  }
  const on = t.closest('[data-pc-on]');
  if (on) { ev.stopPropagation(); if (on.dataset.pcOn === '1') pcEnable(); else { pcSetCfg({on: false}); M = buildModel(); scheduleRender(); } return; }
  const al = t.closest('[data-pc-alarm]');
  if (al) { ev.stopPropagation(); pcSetCfg({alarm: al.dataset.pcAlarm === '1'}); M = buildModel(); scheduleRender(); return; }
  const cb = t.closest('[data-pc-cal]');
  if (cb) {
    ev.stopPropagation();
    const cfg = pcCfg(), id = cb.dataset.pcCal;
    let ids = cfg.ids || (PC.cals || []).map(c => String(c.id));
    ids = ids.includes(id) ? ids.filter(x => x !== id) : ids.concat([id]);
    pcSetCfg({ids}); pcRefresh(true); scheduleRender(); return;
  }
  const act = t.closest('[data-act="pc-refresh"],[data-act="pc-perm"]');
  if (act) {
    ev.stopPropagation();
    if (act.dataset.act === 'pc-refresh') pcRefresh(true).then(() => toast('휴대폰 캘린더를 다시 읽었어요 · ' + (PC.events ? PC.events.length : 0) + '개'));
    else pcEnable().then(() => { if (!PC.granted) { const a = Capacitor.Plugins.BxAlarm; if (a && a.openSettings) a.openSettings({which: 'app'}); toast('휴대폰 설정 > 권한 > 캘린더에서 허용해 주세요.'); } });
  }
}, true);
setTimeout(() => pcRefresh(true), 1200);
setInterval(() => pcRefresh(false), 10 * 60000);
