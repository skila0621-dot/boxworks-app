/* ---------- 아침 보고 (1차 #6, 4안-5) · 홈 화면 위젯 데이터 (1차 #7, 4안-6) ----------
   아침 보고: 그날 아침 루틴(11시 전 첫 루틴 알람)이 있으면 그 알람을 '확인'한 직후, 없으면 정한 시각(기본 07:30)에
   휴대폰 알림으로 오늘 일정을 요약해 보낸다. 내용은 휴대폰에 알람을 다시 걸 때마다(앱을 열 때마다) 새로 계산한다.
   설정: M.settings.bxReport = {on: true, at: 'HH:MM'} */
const BX_REP_DEF = {on: true, at: '07:30'};
function bxRepCfg(){ const r = (M && M.settings && M.settings.bxReport) || {}; return {on: r.on !== false, at: isHM(r.at) ? r.at : BX_REP_DEF.at}; }
function bxShortDay(ds){ const d = parseYmd(ds); return (d.getMonth() + 1) + '/' + d.getDate() + ' (' + WD[d.getDay()] + ')'; }
function bxReportFor(ds){
  // 시험판 39: '홈에 보이기'를 끈 캘린더는 빼고, 여러 날 일정은 '부산 여행 (2/3일째)'로
  const items = dayItems(ds).filter(i => !i.done && (typeof bxHomeOk !== 'function' || bxHomeOk(i)));
  const rows = items.map(i => { const sp = typeof bxSpan === 'function' && bxSpan(i), first = !sp || i.date === ds, p = first ? tvPlan(i) : null; return {start: first ? i.start || '' : '', title: (i.title || '(제목 없음)') + (sp ? ' (' + bxSpanLabel(i, ds).split(' · ')[0] + ')' : ''), place: i.location || '', go: p && p.travel ? hm(p.leave) : ''}; })
    .concat(ttList().filter(e => ttOn(e, ds) && (typeof bxTtHome !== 'function' || bxTtHome(e))).map(e => ({start: e.start, title: e.name, place: e.place || '', go: ''})))
    .sort((a, b) => (a.start ? 1 : 0) - (b.start ? 1 : 0) || a.start.localeCompare(b.start));
  // 이어서 할 일: 지금 이미 지난(어제까지) 일만. 미래 날의 보고에서 그 사이 일을 지났다고 짐작하지 않는다
  const late = M.items.filter(i => !i.done && !i.pc && i.date < M.today && !(typeof bxSpan === 'function' && bxSpan(i)));
  const first = rows.find(r => r.start);
  let title = rows.length ? '오늘 ' + rows.length + '건' + (first ? ' · 첫 일정 ' + bxT(first.start) + ' ' + first.title : '') : '오늘은 정해진 일정이 없어요';
  if (late.length) title += ' · 이어서 ' + late.length + '건';
  const lines = [];
  if (late.length) lines.push('이어서 할 일: ' + late.slice(0, 3).map(i => i.title).join(' · ') + (late.length > 3 ? ' 외 ' + (late.length - 3) + '건' : ''));
  rows.slice(0, 6).forEach(r => lines.push((r.start ? bxT(r.start) : '종일') + '  ' + r.title + (r.place ? ' · ' + r.place : '') + (r.go ? ' · ' + bxT(r.go) + ' 출발' : '')));
  if (rows.length > 6) lines.push('외 ' + (rows.length - 6) + '건');
  // 다가오는 일: 다음 사흘 안의 시간 있는 일정 하나(출발이 있으면 출발 시각도)
  for (let k = 1; k <= 3; k++) {
    const d2 = ymd(addDays(parseYmd(ds), k)), nx = dayItems(d2).find(i => !i.done && i.start && i.date === d2 && (typeof bxHomeOk !== 'function' || bxHomeOk(i)));
    if (nx) { const p = tvPlan(nx); lines.push('다가오는 일: ' + bxShortDay(d2) + ' ' + bxT(nx.start) + ' ' + nx.title + (p && p.travel ? ' · ' + bxT(p.leave) + ' 출발' : '')); break; }
  }
  return {title, text: lines.join('\n') || '오늘 할 일을 넣으려면 앱을 열어 말해 보세요.'};
}
// BX_alarmPlan이 만든 목록에 아침 보고를 붙이거나 끼워 넣는다
function bxAddReports(out, days){
  const cfg = bxRepCfg(); if (!cfg.on) return out;
  const now = Date.now();
  for (let k = 0; k <= days; k++) {
    const day = addDays(sod(new Date(now)), k), ds = ymd(day), noon = addMin(day, 11 * 60).getTime();
    const rep = bxReportFor(ds);
    // 확인을 받는 알람(꼭 울림)에만 붙인다. 짧게 한 번 · 소리 없이는 누를 것이 없어 아침 요약이 뜰 때가 없다(시험판 52)
    const firstRt = out.filter(a => a.kind === 'routine' && /^r_/.test(a.id) && !/_r\d+$/.test(a.id) && a.ring !== 'short' && a.ring !== 'silent' && a.at >= day.getTime() && a.at < noon).sort((a, b) => a.at - b.at)[0];
    if (firstRt) { firstRt.report = rep; continue; }
    const t = addMin(day, toMin(cfg.at)).getTime();
    if (t <= now) continue;
    out.push({id: 'rep_' + ds, at: t, kind: 'report', group: '오늘 일정', title: rep.title, sub: rep.text, body: rep.text, report: rep});
  }
  return out;
}
// 설정 > 알림의 '아침 요약' 줄. 울리는 방식 · 잠금 화면 표시는 시험판 37부터 저마다 상자(tidy.js)
function bxReportSetHtml(){
  const cfg = bxRepCfg();
  return setRow('아침 요약', bxSwitch('data-bxrep', cfg.on, '아침 요약')) +
    // 스위치를 켠 자리 바로 아래 오른쪽에 시각(대표 지적 11/2, 규칙 12). 누르면 휴대폰 시계 창이 열린다
    (cfg.on ? '<div class="bx-setsub"><span class="p small">아침 루틴이 있는 날은 루틴 첫 알람을 확인한 직후에 와요</span>' + bxTimeChip('bx-rep-t', cfg.at, '아침에 일정 받는 시각') + '</div>' : '');
}
/* 잠금 화면에 보여 줄 것(대표 결정 10/31: 개인 일정은 잠금 화면에 보이지 않게) */
const BX_LOCK = [['alarm', '알람만', '“씻기 · 출발까지 30분”. 일정 제목·장소는 잠금을 풀면 보여요'], ['title', '일정 제목', '“치과 · 오후 2:30 출발”처럼 제목도 보여요'], ['none', '표시 안 함', '알람도 “' + window.BX_NAME + ' 알람”으로만 보여요']];
function bxLockMode(){ const m = M && M.settings && M.settings.bxLock; return m === 'title' || m === 'none' ? m : 'alarm'; }
window.BX_lockMode = bxLockMode;
function bxLockSetHtml(){
  const cur = bxLockMode();
  return '<div class="bx-lockset" role="radiogroup" aria-label="잠금 화면 표시"><b class="bx-lock-h">잠금 화면 표시</b>' +
    BX_LOCK.map(o => '<button type="button" class="bx-lock-o" role="radio" aria-checked="' + (o[0] === cur) + '" data-bxlock="' + o[0] + '"><i aria-hidden="true"></i><span><b>' + o[1] + (o[0] === 'alarm' ? ' <small>기본</small>' : '') + '</b><small>' + o[2] + '</small></span></button>').join('') +
    '<p class="p small">아침에 오늘 일정 알림과 루틴 진행 알림은 늘 잠금을 풀어야 보여요.</p></div>';
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-bxlock]'); if (!b || !window.BX_APP) return;
  ev.stopPropagation();
  saveSettings({bxLock: b.dataset.bxlock});
}, true);
document.addEventListener('click', ev => {
  if (!window.BX_APP) return;
  const b = ev.target.closest('[data-bxrep]'); if (!b) return;
  ev.stopPropagation();
  saveSettings({bxReport: Object.assign({}, bxRepCfg(), {on: b.dataset.bxrep === '1'})});
}, true);
document.addEventListener('change', ev => {
  if (!window.BX_APP || ev.target.id !== 'bx-rep-t' || !isHM(ev.target.value)) return;
  saveSettings({bxReport: Object.assign({}, bxRepCfg(), {at: ev.target.value})});
});

/* 홈 화면 위젯에 넘길 것(전체 흐름 와이어프레임 10)
   items: 오늘(지난 것·완료 포함)부터 사흘의 시간 있는 일정·시간표·루틴. c = 분류 색, done = 완료
   routines: 오늘·내일 루틴의 단계표('지금 단계' 2×2 위젯). late: 홈의 '확인 필요'와 같은 숫자 */
function bxHex(c){ return /^#[0-9a-f]{6}$/i.test(String(c || '')) ? c : ''; }
window.BX_widgetData = function(plan){
  if (!M || !S.firstServer) return null;
  // 시험판 36(대표 결정 11/3 17:01): 위젯은 하루씩 보고 ‹ ›로 넘긴다 → 지난 7일 ~ 앞으로 14일. 종일 일정도(시각 칸에 '종일')
  const BACK = 7, AHEAD = 14;
  const now = Date.now(), t0 = addDays(sod(new Date(now)), -BACK).getTime(), until = addDays(sod(new Date(now)), AHEAD + 1).getTime(), list = [];
  M.items.forEach(i => {
    if (!isDate(i.date) || i.deletedAt) return;
    // 시험판 39: '홈에 보이기'를 끈 캘린더는 위젯에서도 뺀다(놓친 일정은 그대로)
    if (typeof bxHomeOk === 'function' && !bxHomeOk(i)) return;
    // 여러 날 일정: 날마다 한 줄 '부산 여행 · 2/3일째'. 시간이 있으면 첫날은 그 시각부터
    if (typeof bxSpan === 'function' && bxSpan(i)) {
      const n = bxSpanN(i), cat = M.catMap.get(i.categoryId), hex = i.color && !i.pc ? i.color : cat ? cat.color : '';
      for (let k = 0; k < n; k++) {
        const d0 = addDays(parseYmd(i.date), k).getTime(); if (d0 + 864e5 <= t0 || d0 >= until) continue;
        const timed = k === 0 && !!i.start, at0 = timed ? at(i.date, i.start).getTime() : d0;
        list.push({at: at0, end: d0 + 864e5 - 1, allDay: !timed, title: (i.title || '(제목 없음)') + ' · ' + (k + 1) + '/' + n + '일째', place: i.location || '', go: 0,
          c: M.settings.catColors !== false && hex ? bxHex(hex) : '', k: 'item', id: i.id, done: !!i.done});
      }
      return;
    }
    if (!i.start) {
      const d0 = parseYmd(i.date).getTime();
      if (d0 < t0 || d0 >= until) return;
      const cat = M.catMap.get(i.categoryId);
      list.push({at: d0, end: d0 + 864e5 - 1, allDay: true, title: i.title || '(제목 없음)', place: i.location || '', go: 0,
        c: M.settings.catColors !== false && (i.color || cat) ? bxHex(i.color && !i.pc ? i.color : cat.color) : '', k: 'item', id: i.id, done: !!i.done});
      return;
    }
    const s = at(i.date, i.start).getTime(), e = i.end ? at(i.date, i.end).getTime() : s + 3600e3;
    if (e < t0 || s >= until) return;
    const p = tvPlan(i), cat = M.catMap.get(i.categoryId);
    list.push({at: s, end: e, title: i.title || '(제목 없음)', place: i.location || '', go: p && p.travel ? p.leave.getTime() : 0,
      c: M.settings.catColors !== false && (i.color || cat) ? bxHex(i.color && !i.pc ? i.color : cat.color) : '', k: 'item', id: i.id, done: !!i.done});
  });
  const routines = [];
  for (let k = -BACK; k <= AHEAD; k++) {
    const day = addDays(sod(new Date(now)), k), ds = ymd(day);
    if (bxModOn('tt')) ttList().forEach(e => {
      if (!ttOn(e, ds) || !isHM(e.start) || (typeof bxTtHome === 'function' && !bxTtHome(e))) return;
      const s = addMin(day, toMin(e.start)).getTime(), en = isHM(e.end) ? addMin(day, toMin(e.end)).getTime() : s + 3600e3;
      // 시험판 57: 그날 다녀왔어요(수업 체크, doneOn)도 위젯에 — 끝난 일정 모양이 앱과 같게
      if (en >= t0 && s <= until) list.push({at: s, end: en, title: e.name, place: e.place || '', go: 0, c: bxHex(e.color), k: 'tt', done: !!(e.doneOn && e.doneOn[ds])});
    });
    if (bxModOn('routines')) M.routines.forEach(rt => {
      if (!rtActiveOn(rt, ds) || rt.sound === 'bowl') return;
      const p = rtPlan(rt); if (p.bad) return;
      const lg = M.rlogs.get(rt.id + '|' + ds) || {}; if (lg.skip) return;
      const rows = p.rows.filter(r => r.kind !== 'wait'); if (!rows.length) return;
      const done = lg.done || {}, from = addMin(day, p.start).getTime(), leave = p.leave != null ? addMin(day, p.leave).getTime() : 0;
      const last = rows[rows.length - 1], end = leave || addMin(day, last.at + (last.min || 5)).getTime();
      // 시험판 52: 꼭 울림 단계(기상 · 약 · 출발)는 확인, 짧게 한 번 단계는 시각이 지나면 끝난 것으로 본다
      const allDone = rows.every(r => done[r.id] || (r.ring !== 'must' && addMin(day, r.at + (r.min || 0)).getTime() <= now));
      // miss: 오늘 먹었는지 확인하지 않은 약 단계(확인 필요). 위젯은 그 줄에 확인 필요 아이콘(시험판 57)
      list.push({at: from, end, title: rt.name || '루틴', place: '', go: 0, c: '#7C3AED', k: 'routine', done: allDone, miss: k === 0 && typeof bxRtMissedOf === 'function' && bxRtMissedOf(rt).length > 0});
      if (rows.length >= 2 && k >= 0 && k <= 3) routines.push({rid: rt.id, ds, name: rt.name || '루틴', from, leave,
        // r: 세기(m 꼭 울림 · s 짧게 한 번 · w 소리 없이). '지금 단계' 위젯의 확인 단추는 꼭 울림 단계에만(BX_alarmPlan 단계표와 같게)
        steps: p.rows.map(r => Object.assign({at: addMin(day, r.at).getTime(), n: r.leave ? '출발' : r.name, s: 'r_' + rt.id + '_' + ds + '_' + r.id, min: r.min || 0, d: !!done[r.id],
          r: r.kind === 'wait' ? 'w' : r.ring === 'must' ? 'm' : 's'}, r.leave ? {ok: '다 했어요'} : {}))});
    });
  }
  list.sort((a, b) => a.at - b.at);
  // lateI: 지난 일정만(위젯 '일정만'일 때 확인 필요 숫자, 시험판 36). 위젯 목록은 밀어 보므로 40개까지
  const lateI = M.items.filter(isLate).length, late = lateI + bxRtMissed().length;
  // only: 위젯에서 루틴을 뺄지(앱 ⋯ › 위젯 추가의 '루틴도 보기' 스위치)
  // memo: 위젯 ✎ 단추를 보일지(시험판 41, '기능 · 메뉴 편집'에서 메모를 끄면 숨김)
  return {items: list.slice(0, 300), routines, late, lateI, made: now, back: BACK, ahead: AHEAD, only: M.settings.bxWidgetRt === false, memo: typeof bxMemoOn !== 'function' || bxMemoOn()};
};

/* ---------- 루틴 단계를 확인하지 않았을 때(대표 요청) ----------
   1) 휴대폰 알람에서 '확인'을 누른 단계는 앱에도 '했어요'로 옮긴다(BxAlarm.confirmed → rlog done)
   2) 시각이 10분 넘게 지났는데 하지 않은 단계는 오늘 화면 루틴 카드에 주의로 보이고, 아래 메뉴 '오늘'의 빨간 숫자에 더한다
   3) 루틴이 끝난 10분 뒤에도 확인하지 않은 단계가 있으면 휴대폰이 한 번 더 알린다(BX_alarmPlan의 rcheck)
   시험판 52(대표 11/4 16:58, D-25): 2) · 3)은 약 단계(꼭 울림)에만. 다른 단계는 확인을 받지 않으므로 '놓침'도 없다 */
window.BX_applyConfirmed = function(map){
  if (!M || !map) return 0;
  let n = 0;
  Object.keys(map).forEach(k => {
    const m = /^r_(.+)_(\d{4}-\d{2}-\d{2})_([^_]+)$/.exec(k); if (!m) return;
    const rid = m[1], ds = m[2], sid = m[3];
    if (!M.routines.some(r => r.id === rid)) return;
    const id = rtLogId(rid, ds), cur = getDoc(id) || {type: 'rlog', rid, date: ds, done: {}, started: {}, extra: {}, skip: false, createdAt: nowIso()};
    if (cur.done && cur.done[sid]) return;
    const nx = JSON.parse(JSON.stringify(cur)); nx.done = nx.done || {};
    nx.done[sid] = new Date(+map[k] || Date.now()).toISOString(); nx.updatedAt = nowIso();
    writeDoc(id, nx); n++;
  });
  return n;
};
// 루틴을 만든 시각(오늘 만든 루틴이면 그 전에 지난 단계는 놓친 것으로 치지 않는다)
function bxRtBornM(rt, ds){ const d = getDoc(rt.id), c = d && d.createdAt ? new Date(d.createdAt) : null; return c && !isNaN(c) && ymd(c) === ds ? c.getHours() * 60 + c.getMinutes() : -1; }
function bxRtMissedOf(rt){
  if (!rtActiveOn(rt, M.today)) return [];
  const s = rtToday(rt); if (s.skip || s.finished) return [];
  const born = bxRtBornM(rt, M.today);
  return s.rows.filter(r => r.kind !== 'wait' && r.ring === 'must' && bxIsMed(r.name) && !r.done && r.at + 10 <= s.nowM && r.at >= born);
}
function bxRtMissed(){ return M && M.routines ? M.routines.reduce((a, rt) => a.concat(bxRtMissedOf(rt).map(r => ({rt, r}))), []) : []; }
// 오늘 화면 루틴 카드에 주의 줄 붙이기(render 끝의 bxFoldDecorate에서 부름)
function bxRtMissDecorate(){
  if (S.view !== 'today' || S.homeDay) return;
  let total = 0;
  // 시험판 56: 홈에는 루틴 카드 대신 목록 줄(둘째 줄 '먹었는지 확인 · …'), 주의 줄 · '먹었어요'는 줄을 누르면 나오는 단계 창에
  $$('.rt-sec .rt-card[data-rid], #sheet-root .bx-rtpage .rt-card[data-rid]').forEach(c => {
    const rt = M.routines.find(r => r.id === c.dataset.rid); if (!rt || c.querySelector('.bx-miss-line')) return;
    const miss = bxRtMissedOf(rt); if (!miss.length) return;
    total += miss.length;
    c.classList.add('bx-miss');
    const line = document.createElement('div');
    line.className = 'bx-miss-line';
    // 시험판 52: 약 단계만 남아 '놓친 단계' 대신 무엇을 확인할지 그대로
    line.innerHTML = ICON.alert + '<span>먹었는지 확인하지 않은 약 · ' + esc(miss.map(r => r.name).join(', ')) + '</span><button type="button" class="btn sm" data-act="bx-rt-alldone" data-rid="' + esc(rt.id) + '">먹었어요</button>';
    const hd = c.querySelector('.rt-h'); if (hd) hd.after(line); else c.prepend(line);
  });
  // 루틴 머리의 '확인 N' 칩은 뺐다(홈 요약 '확인 필요' 숫자 하나로 통일, 10/31)
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-act="bx-rt-alldone"]'); if (!b || !window.BX_APP) return;
  ev.stopPropagation();
  const rt = M.routines.find(r => r.id === b.dataset.rid); if (!rt) return;
  const miss = bxRtMissedOf(rt), id = rtLogId(rt.id, M.today);
  const cur = getDoc(id) || {type: 'rlog', rid: rt.id, date: M.today, done: {}, started: {}, extra: {}, skip: false, createdAt: nowIso()};
  const keep = getDoc(id) ? JSON.parse(JSON.stringify(cur)) : null;
  const nx = JSON.parse(JSON.stringify(cur)); nx.done = nx.done || {};
  miss.forEach(r => { nx.done[r.id] = nowIso(); }); nx.updatedAt = nowIso();
  writeDoc(id, nx);
  toast(miss.map(r => r.name).join(', ') + ' · 먹었어요로 표시했어요', [['되돌리기', () => { if (keep) writeDoc(id, keep); else removeDoc(id); }]]);
}, true);
