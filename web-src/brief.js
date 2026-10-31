/* ---------- 아침 보고 (1차 #6, 4안-5) · 홈 화면 위젯 데이터 (1차 #7, 4안-6) ----------
   아침 보고: 그날 아침 루틴(11시 전 첫 루틴 알람)이 있으면 그 알람을 '확인'한 직후, 없으면 정한 시각(기본 07:30)에
   휴대폰 알림으로 오늘 일정을 요약해 보낸다. 내용은 휴대폰에 알람을 다시 걸 때마다(앱을 열 때마다) 새로 계산한다.
   설정: M.settings.bxReport = {on: true, at: 'HH:MM'} */
const BX_REP_DEF = {on: true, at: '07:30'};
function bxRepCfg(){ const r = (M && M.settings && M.settings.bxReport) || {}; return {on: r.on !== false, at: isHM(r.at) ? r.at : BX_REP_DEF.at}; }
function bxShortDay(ds){ const d = parseYmd(ds); return (d.getMonth() + 1) + '/' + d.getDate() + ' (' + WD[d.getDay()] + ')'; }
function bxReportFor(ds){
  const items = dayItems(ds).filter(i => !i.done);
  const rows = items.map(i => { const p = tvPlan(i); return {start: i.start || '', title: i.title || '(제목 없음)', place: i.location || '', go: p && p.travel ? hm(p.leave) : ''}; })
    .concat(ttList().filter(e => ttOn(e, ds)).map(e => ({start: e.start, title: e.name, place: e.place || '', go: ''})))
    .sort((a, b) => (a.start ? 1 : 0) - (b.start ? 1 : 0) || a.start.localeCompare(b.start));
  // 이어서 할 일: 지금 이미 지난(어제까지) 일만. 미래 날의 보고에서 그 사이 일을 지났다고 짐작하지 않는다
  const late = M.items.filter(i => !i.done && !i.pc && i.date < M.today);
  const first = rows.find(r => r.start);
  let title = rows.length ? '오늘 ' + rows.length + '건' + (first ? ' · 첫 일정 ' + first.start + ' ' + first.title : '') : '오늘은 정해진 일정이 없어요';
  if (late.length) title += ' · 이어서 ' + late.length + '건';
  const lines = [];
  if (late.length) lines.push('이어서 할 일: ' + late.slice(0, 3).map(i => i.title).join(' · ') + (late.length > 3 ? ' 외 ' + (late.length - 3) + '건' : ''));
  rows.slice(0, 6).forEach(r => lines.push((r.start || '종일') + '  ' + r.title + (r.place ? ' · ' + r.place : '') + (r.go ? ' · ' + r.go + ' 출발' : '')));
  if (rows.length > 6) lines.push('외 ' + (rows.length - 6) + '건');
  // 다가오는 일: 다음 사흘 안의 시간 있는 일정 하나(출발이 있으면 출발 시각도)
  for (let k = 1; k <= 3; k++) {
    const d2 = ymd(addDays(parseYmd(ds), k)), nx = dayItems(d2).find(i => !i.done && i.start);
    if (nx) { const p = tvPlan(nx); lines.push('다가오는 일: ' + bxShortDay(d2) + ' ' + nx.start + ' ' + nx.title + (p && p.travel ? ' · ' + hm(p.leave) + ' 출발' : '')); break; }
  }
  return {title, text: lines.join('\n') || '오늘 할 일을 넣으려면 박스웍스를 열어 말해 보세요.'};
}
// BX_alarmPlan이 만든 목록에 아침 보고를 붙이거나 끼워 넣는다
function bxAddReports(out, days){
  const cfg = bxRepCfg(); if (!cfg.on) return out;
  const now = Date.now();
  for (let k = 0; k <= days; k++) {
    const day = addDays(sod(new Date(now)), k), ds = ymd(day), noon = addMin(day, 11 * 60).getTime();
    const rep = bxReportFor(ds);
    const firstRt = out.filter(a => a.kind === 'routine' && /^r_/.test(a.id) && !/_r\d+$/.test(a.id) && a.at >= day.getTime() && a.at < noon).sort((a, b) => a.at - b.at)[0];
    if (firstRt) { firstRt.report = rep; continue; }
    const t = addMin(day, toMin(cfg.at)).getTime();
    if (t <= now) continue;
    out.push({id: 'rep_' + ds, at: t, kind: 'report', group: '아침 보고', title: rep.title, sub: rep.text, body: rep.text, report: rep});
  }
  return out;
}
// 설정 > 알림의 '아침 보고' 줄
function bxReportSetHtml(){
  const cfg = bxRepCfg();
  return setRow('아침 보고', segHtml('data-bxrep', [['0', '끄기'], ['1', '켜기']], cfg.on ? '1' : '0', '아침 보고', 150), 'tall') +
    (cfg.on ? '<div class="set-ctl"><input type="time" id="bx-rep-t" class="inp big-time" step="300" value="' + cfg.at + '"><span class="p small">아침 루틴이 있는 날은 루틴 첫 알람을 확인한 직후에 와요</span></div>' : '');
}
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

/* 홈 화면 위젯에 넘길 것: 앞으로 사흘의 시간 있는 일정·시간표, 다가오는 알람 시각. 위젯이 지금 시각에 맞춰 고른다 */
window.BX_widgetData = function(plan){
  if (!M || !S.firstServer) return null;
  const now = Date.now(), until = now + 3 * 864e5, list = [];
  M.items.forEach(i => {
    if (i.done || !i.start || !isDate(i.date)) return;
    const s = at(i.date, i.start).getTime(), e = i.end ? at(i.date, i.end).getTime() : s + 3600e3;
    if (e <= now || s > until) return;
    const p = tvPlan(i);
    list.push({at: s, end: e, title: i.title || '(제목 없음)', place: i.location || '', go: p && p.travel ? p.leave.getTime() : 0});
  });
  for (let k = 0; k <= 3; k++) {
    const day = addDays(sod(new Date(now)), k), ds = ymd(day);
    ttList().forEach(e => {
      if (!ttOn(e, ds) || !isHM(e.start)) return;
      const s = addMin(day, toMin(e.start)).getTime(), en = isHM(e.end) ? addMin(day, toMin(e.end)).getTime() : s + 3600e3;
      if (en > now && s <= until) list.push({at: s, end: en, title: e.name, place: e.place || '', go: 0});
    });
  }
  list.sort((a, b) => a.at - b.at);
  const alarms = (plan || []).map(a => a.at).filter(t => t > now).sort((a, b) => a - b).slice(0, 30);
  return {items: list.slice(0, 15), alarms, made: now};
};
