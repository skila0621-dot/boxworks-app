/* ---------- 출발 시각 계산 (1차 #3) · 일정에 준비 루틴 붙이기 (1차 #4) ----------
   item.travel  가는 데 걸리는 분(0 = 없음). 시간이 정해진 일정에서만 쓴다.
   item.prep    붙인 루틴 id. 그 루틴 단계가 출발 시각에 끝나도록 거꾸로 놓인다.
   출발 = 시작 − travel. 알람: 루틴이 없으면 '출발 10분 전'과 '출발', 루틴이 있으면 단계마다와 '출발'.
   장소·제목별 이동 시간은 문서 'travelmem' 하나에 기억한다(백업에 함께 들어감). */
const TV_MEM = 'travelmem';
const TV_PICKS = [10, 20, 30, 45, 60, 90];
const TV_PRE = 10;
const TV_OUT = {name: '외출 준비', steps: [['씻기', 20], ['옷 입기', 10], ['짐 챙기기', 5]]};
const ICON_GO = '<svg class="i" viewBox="0 0 24 24"><path d="M4 12h11.5M11 7.5l4.5 4.5-4.5 4.5"/><path d="M20 4.5v15"/></svg>';
let tvNote = '';
// 휴대폰 캘린더 일정 출발·준비 페이지의 '루틴에도 저장'(시험판 62): 페이지가 열려 있는 동안만, '완료'에서 루틴으로 넘긴다(v45.js)
let tvPcSave = false;

// 이동 시간 칸(4칸) 글: 정시는 'N시간', 나머지는 'N분'(90분 · 75분). '1시간 30분'은 폭 360 · 384의 칸에 안 들어감(시험판 55 정렬 점검)
function tvPickText(m){ m = Math.round(+m || 0); return m >= 60 && m % 60 === 0 ? m / 60 + '시간' : m + '분'; }
function tvMinText(m){ m = Math.round(+m || 0); const h = Math.floor(m / 60), r = m % 60; return h ? h + '시간' + (r ? ' ' + r + '분' : '') : r + '분'; }
function tvKey(s){ return String(s || '').replace(/\s+/g, '').replace(/(?:에서|에|으로|로|까지)$/, '').slice(0, 30); }
function tvMem(){ const d = getDoc(TV_MEM); return d && d.map && typeof d.map === 'object' ? d.map : {}; }
function tvRecall(title, loc){
  const map = tvMem();
  for (const k of [tvKey(loc), tvKey(title)]) if (k.length >= 2 && map[k] > 0) return {min: map[k], key: k};
  return null;
}
// 바뀐 것이 있으면 true
function tvRemember(title, loc, min){
  const keys = Array.from(new Set([tvKey(loc), tvKey(title)])).filter(k => k.length >= 2);
  if (!keys.length || !(min > 0)) return false;
  const map = Object.assign({}, tvMem()); let ch = false;
  keys.forEach(k => { if (map[k] !== min) { delete map[k]; map[k] = min; ch = true; } });
  if (!ch) return false;
  const ks = Object.keys(map); if (ks.length > 300) ks.slice(0, ks.length - 300).forEach(k => { delete map[k]; });
  writeDoc(TV_MEM, {type: 'travelmem', map, updatedAt: nowIso()});
  return true;
}

/* 말에서 이동 시간 찾기: "가는 데 30분", "이동 시간 1시간 반", "차로 40분", "치과까지 30분", "30분 거리" */
const TV_DUR = '(?:(\\d+(?:\\.\\d+)?|한|두|세)\\s*시간\\s*(반)?(?:\\s*(\\d{1,2})\\s*분)?|(\\d{1,3})\\s*분)';
const TV_TAIL = '\\s*(?:정도|쯤|가량|이면|면)?\\s*(?:걸려요|걸려|걸림|걸린대|걸린다|걸리니까|걸리고|걸릴\\s?거야|걸릴\\s?듯|소요|이야|이에요|거든)?';
const TV_RX = [
  {rx: new RegExp('(?:가는\\s?데|가는\\s?길|오가는\\s?데|이동\\s?시간|이동)(?:은|는|이|가|만|에)?\\s*(?:대략|약|거의|한)?\\s*' + TV_DUR + TV_TAIL), g: 1},
  {rx: new RegExp('(?:차로|버스로|지하철로|전철로|택시로|기차로|걸어서|자전거로|운전해서|대중교통으로)\\s*(?:대략|약|한)?\\s*' + TV_DUR + TV_TAIL), g: 1},
  {rx: new RegExp('([가-힣A-Za-z0-9]{1,12})까지\\s*(?:대략|약|한)?\\s*' + TV_DUR + TV_TAIL), g: 2, keep: 1},
  {rx: new RegExp(TV_DUR + '\\s*(?:정도|쯤)?\\s*거리(?:야|예요|에요|임)?'), g: 1}
];
function tvNum(s){ return s === '한' ? 1 : s === '두' ? 2 : s === '세' ? 3 : +s; }
function tvExtract(text){
  const s = String(text || '');
  for (const o of TV_RX) {
    const m = o.rx.exec(s); if (!m) continue;
    if (o.keep && /(?:\d|시|분|반|일|요일|오늘|내일|모레|낮|밤|저녁|아침|점심|오전|오후)$/.test(m[o.keep])) continue;
    const g = o.g, min = m[g] != null ? Math.round(tvNum(m[g]) * 60 + (m[g + 1] ? 30 : 0) + (m[g + 2] ? +m[g + 2] : 0)) : +m[g + 3];
    if (!(min > 0) || min > 300) continue;
    return {min, text: s.slice(0, m.index) + ' ' + (o.keep ? m[o.keep] + ' ' : '') + s.slice(m.index + m[0].length)};
  }
  return null;
}
/* 말에서 알림 찾기: "30분 전에 알려 줘", "1시간 전에 알람", "하루 전에 알려 줘" */
function tvRemExtract(text){
  const s = String(text || '');
  const m = /(?:(\d{1,3})\s*분|(\d{1,2}|한|두|세)\s*시간|(하루))\s*전(?:에)?\s*(?:미리\s*)?(?:알려\s*(?:줘요|줘|주세요|줄래)|알림(?:\s*(?:줘|해\s*줘))?|알람(?:\s*(?:줘|맞춰\s*줘|해\s*줘|울려\s*줘))?|깨워\s*줘|리마인드(?:\s*해\s*줘)?)/.exec(s);
  if (!m) return null;
  const min = m[1] ? +m[1] : m[2] ? tvNum(m[2]) * 60 : 1440;
  if (!(min >= 0) || min > 43200) return null;
  return {min, text: s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length)};
}
/* 말에서 붙일 루틴 찾기: "외출 준비 붙여 줘", "가기 전에 외출 준비", "출근 루틴 하고 나갈게" */
function tvPrepNames(){
  const list = (M && M.routines ? M.routines : []).map(r => ({id: r.id, name: r.name}));
  if (!list.some(r => tvKey(r.name) === tvKey(TV_OUT.name))) list.push({id: null, name: TV_OUT.name});
  return list.filter(r => tvKey(r.name).length >= 2).sort((a, b) => tvKey(b.name).length - tvKey(a.name).length);
}
function tvPrepExtract(text){
  const s = String(text || '');
  const esc2 = c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const n of tvPrepNames()) {
    const nm = tvKey(n.name).split('').map(esc2).join('\\s*');
    const pre = '(?:(?:가기|나가기|출발하기|나서기|가는\\s?거)\\s*)?전에\\s*';
    const verb = '(?:\\s*루틴)?\\s*(?:도|을|를|은|는)?\\s*(?:붙여\\s*(?:줘요|줘|주세요|줄래|놔|둬)?|붙이기|붙이고|붙여서|넣어\\s*(?:줘|주세요)|같이\\s*(?:넣어\\s*줘|해\\s*줘)|포함(?:해\\s*줘)?|하고\\s*(?:갈게|가야\\s*돼|가|나갈게|나가|출발))';
    let m = new RegExp('(?:' + pre + ')?' + nm + verb).exec(s) || new RegExp(pre + nm + '(?:\\s*루틴)?(?:\\s*(?:해야\\s*(?:돼|해)|할게|하고|해))?').exec(s);
    if (m) return {id: n.id, name: n.name, text: s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length)};
  }
  return null;
}

/* 계획: 일정 하나의 준비·출발·도착 시각 */
function tvRoutine(id){ return id && M && M.routines ? M.routines.find(r => r.id === id) || null : null; }
// 아직 만들지 않은 기본 '외출 준비'(말이나 캘린더 메모로 붙였을 때 미리 보기용)
let tvOutV = null;
function tvOutVirtual(){ return tvOutV || (tvOutV = Object.assign(rtNorm({name: TV_OUT.name, mode: 'start', steps: TV_OUT.steps, on: false}), {id: ''})); }
function tvPlan(it, rtOverride){
  if (!it || it.done || !isHM(it.start) || !isDate(it.date)) return null;
  const travel = Math.max(0, Math.min(300, Math.round(+it.travel || 0)));
  const rt = rtOverride || tvRoutine(it.prep) || (it.prepOut ? tvOutVirtual() : null);
  if (!travel && !rt) return null;
  const arrive = at(it.date, it.start), leave = addMin(arrive, -travel), rows = [];
  // 시험판 62(대표 11/6 선택실 4 · 2번 가 · 3번 ㄱ): 이 일정만 바꾼 단계 시간(it.prepMin: 단계 id → 분)과
  // 알람 켜고 끄기(it.prepRing: 단계 id · 'leave' · 'pre' → 0 끔 · 1 켬). 루틴 탭의 루틴은 그대로
  const pm = it.prepMin || {}, pr = it.prepRing || {};
  if (rt) {
    const steps = rt.steps.map(s => pm[s.id] != null ? Object.assign({}, s, {min: clampInt(pm[s.id], 0, 600, +s.min || 0)}) : s);
    // 시험판 52: 단계 세기는 루틴과 같다(첫 단계 · 약은 꼭 울림, 중간은 짧게 한 번, 기다리기는 소리 없이).
    // 끈 단계는 소리 없이, 루틴에서 소리 없이인 단계를 켜면 짧게 한 번. 앞 단계를 이 일정에서 껐으면 남은 첫 단계가 준비 시작이라
    // 꼭 울림(결정 사안 s06 '준비 시작을 꼭 울림에'). 루틴에서 세기를 정한 단계는 그 세기 그대로
    const rings = steps.map((s, i) => { const b = bxStepRing(s, i, rt.steps); return pr[s.id] === 0 ? 'silent' : pr[s.id] === 1 && b === 'silent' ? 'short' : b; });
    const fi = rings.findIndex(r => r !== 'silent'); if (fi >= 0 && rings[fi] === 'short' && !steps[fi].ring) rings[fi] = 'must';
    let t = addMin(leave, -steps.reduce((a, s) => a + (+s.min || 0), 0));
    steps.forEach((s, i) => { rows.push({id: s.id, name: s.name, at: t, min: +s.min || 0, kind: s.kind, ring: rings[i], own: pm[s.id] != null}); t = addMin(t, +s.min || 0); });
  } else rows.push({id: 'pre', name: '출발 ' + TV_PRE + '분 전', at: addMin(leave, -TV_PRE), min: 0, kind: 'do', pre: true, ring: pr.pre === 0 ? 'silent' : 'short'});
  if (travel) rows.push({id: 'leave', name: '출발', at: leave, min: 0, kind: 'do', leave: true, ring: pr.leave === 0 ? 'silent' : 'must'});
  return {it, rt, travel, arrive, leave, rows, start: rows[0].at};
}
function tvAlarms(it){
  const p = tvPlan(it); if (!p) return [];
  // 짧게 한 번 단계는 같은 시각에 꼭 울림 단계가 있거나 앞 단계와 시각이 같으면(0분 단계) 따로 울리지 않는다(BX_alarmPlan 루틴과 같게)
  const al0 = p.rows.filter(r => r.ring !== 'silent'), end = p.travel ? p.leave : p.arrive;
  const al = al0.filter((r, i) => r.ring !== 'short' || !al0.some((x, q) => q !== i && +x.at === +r.at && (x.ring === 'must' || q < i)));
  return al.map((r, i) => {
    const nx = al[i + 1], left = Math.round((end - r.at) / 60000);
    let title, sub, next;
    if (r.leave) { title = '출발할 시간'; sub = it.title + ' · ' + bxT(it.start) + ' 도착' + (it.location ? ' · ' + it.location : ''); next = bxT(it.start) + ' 도착'; }
    else if (r.pre) { title = it.title || '(제목 없음)'; sub = TV_PRE + '분 뒤 출발 · ' + bxT(it.start) + ' 도착'; next = bxT(p.leave) + ' 출발'; }
    else { title = r.name; sub = (p.travel ? '출발까지 ' : '시작까지 ') + left + '분'; next = nx ? bxT(nx.at) + ' ' + (nx.leave ? '출발' : nx.name) : bxT(it.start) + ' ' + (it.title || ''); }
    // 시험판 67(결정 사안 s05): 붙인 준비 루틴이 이름 읽어 주기를 켰으면 단계 · 출발도 읽어 줌(일정 제목은 읽지 않음)
    const say = p.rt && p.rt.say && !r.pre ? (r.leave ? '출발할 시간' : r.name + ', ' + sub) : undefined;
    // 시험판 69(결정 사안 s10): 붙인 준비 루틴의 첫 단계 = 준비 시작(시험 기록이 '알람 → 시작까지'를 잼)
    const first = !!p.rt && !r.pre && !r.leave && al.findIndex(x => !x.pre && !x.leave) === i;
    return {id: r.id, at: r.at.getTime(), title, sub, next, say, first, routine: !!p.rt, pre: !!r.pre, ring: r.ring === 'short' ? 'short' : 'must', ok: r.leave && p.rt ? '다 했어요' : '',
      group: p.rt ? p.rt.name + ' · ' + (it.title || '') : '일정', from: p.start.getTime(), to: end.getTime()};
  });
}
// 일정 알림 중 휴대폰에 걸 것: 출발·준비 알람과 같은 시각이거나, 이동하는 동안(출발~도착 사이)이면 뺀다
function tvRemTimes(it, tvs){
  const p = tvPlan(it); tvs = tvs || tvAlarms(it);
  return remindAt(it).filter(r => { const t = r.getTime(); if (tvs.some(a => Math.abs(a.at - t) < 60000)) return false; return !(p && p.travel && t > p.leave.getTime() && t < p.arrive.getTime()); });
}
function bxNextAlarm(it){
  const tvs = tvAlarms(it);
  const xs = tvRemTimes(it, tvs).concat(tvs.map(a => new Date(a.at))).filter(d => d > M.now).sort((a, b) => a - b);
  return xs[0] || null;
}
function tvRowMeta(it){
  const p = tvPlan(it); if (!p || isLate(it)) return '';
  return '<span class="meta bx-go">' + ICON_GO + (p.rt && !p.travel ? '준비 ' + bxT(p.start) + '부터' : (p.rt ? '준비 ' + bxT(p.start) + ' · ' : '') + bxT(p.leave) + ' 출발') + '</span>';
}
function tvPrepUses(rid){ return M.items.filter(i => !i.done && i.prep === rid && i.date >= M.today).length; }
function tvRtSum(rt){
  const n = tvPrepUses(rt.id), tot = rt.steps.reduce((a, s) => a + s.min, 0);
  return '일정에 붙여 써요' + (n ? ' · 일정 ' + n + '개' : '') + ' · ' + rt.steps.length + '단계 ' + tvMinText(tot);
}

/* 새 일정 창: '출발' 칸 */
function tvFormRt(){ return F.prep ? tvRoutine(F.prep) : F.prepNew ? tvOutVirtual() : null; }
function tvFormPlan(){
  if (!F || !F.timed || !isHM(F.start) || !isDate(F.date)) return null;
  return tvPlan({date: F.date, start: F.start, title: F.title, travel: F.travel, prep: F.prep, prepMin: F.prepMin, prepRing: F.prepRing}, tvFormRt());
}
function tvTab(tab){
  if (!F) return '';
  const p = tvFormPlan(), set = !!(F.travel || F.prep || F.prepNew);
  const label = p ? (p.travel ? bxT(p.leave) + ' 출발' : '준비 ' + bxT(p.start) + '부터') : F.travel ? '이동 ' + tvMinText(F.travel) : '출발·준비';
  return tab('go', ICON_GO, label, set);
}
function tvHint(){
  const p = tvFormPlan(), rm = F && F.remSaid && F.timed && remList(F.remT)[0] ? ' · ' + esc(remLabel(remList(F.remT)[0])) + ' 알림' : '';
  if (!p) return (F && F.travel ? ' · 이동 ' + tvMinText(F.travel) : '') + rm;
  let s = rm;
  if (p.travel) s += ' · <b>' + bxT(p.leave) + ' 출발</b> (이동 ' + tvMinText(p.travel) + (F.tvSrc === 'mem' ? ', 지난번 그대로' : '') + ')';
  if (p.rt) s += ' · ' + esc(p.rt.name) + ' ' + bxT(p.start) + '부터';
  return s;
}
function tvDrawPanel(){
  drawFChips();
  const el = $('#f-go'); if (!el || !F) return;
  if (!F.timed || !isHM(F.start)) {
    el.innerHTML = '<p class="p">시간을 정하면 출발 시각을 거꾸로 계산해 알람을 걸어요.</p><button type="button" class="btn" data-fpanel="time">' + ICON.clock + '시간 지정</button>';
    return;
  }
  const tvs = [0].concat(TV_PICKS.includes(+F.travel || 0) || !F.travel ? [] : [+F.travel]).concat(TV_PICKS);
  const rts = tvPrepNames().map(r => ({id: r.id || 'new', name: r.name, isNew: !r.id}));
  const curPrep = F.prep || (F.prepNew ? 'new' : '');
  const p = tvFormPlan();
  const line = p ? tvLineHtml(p, F.start, (F.parsed && F.parsed.title) || F.title, {save: !!F.prepSave}) : '';
  el.innerHTML =
    '<div class="fg-l">이동 시간</div><div class="picks">' + tvs.map(v => '<button type="button" class="pick" data-ftv="' + v + '" aria-pressed="' + ((+F.travel || 0) === v) + '">' + (v ? tvPickText(v) : '없음') + '</button>').join('') + '</div>' +
    '<div class="tv-cus"><span class="p small">직접</span>' + stepperHtml('f-travel', +F.travel || 0, 0, 300, null, 5) + '<span class="p small">분</span></div>' +
    (F.tvSrc === 'mem' && F.tvKey ? '<p class="p small tv-mem">‘' + esc(F.tvKey) + '’까지 지난번에 ' + tvMinText(F.travel) + '이 걸렸어요</p>' : '') +
    '<div class="fg-l tv-h">준비 루틴 <small>출발 시각에 끝나게 거꾸로 놓여요</small></div><div class="picks">' +
    '<button type="button" class="pick" data-fprep="" aria-pressed="' + !curPrep + '">없음</button>' +
    rts.map(r => '<button type="button" class="pick" data-fprep="' + esc(r.id) + '" aria-pressed="' + (curPrep === r.id) + '">' + esc(r.name) + (r.isNew ? ' <small>새로</small>' : '') + '</button>').join('') + '</div>' + line;
}
// 준비·출발·도착 시각 줄(새 일정 창, 휴대폰 캘린더 일정 창)
// 시험판 62(대표 11/6 선택실 4 · 2번 가 '단계마다 ± 늘 보임' · 3번 ㄱ '시각 왼쪽 종을 눌러 켜고 끄기', 결정 사안 d20261106-prepedit · s03).
// ed(고칠 수 있는 줄)가 있으면:
//  - 줄마다 시각 왼쪽에 종. 누르면 울림 ↔ 안 울림(빗금 · 흐리게). 울리는 세기는 루틴 · 설정 › 알림을 따른다(대표 메모 '울리는 방식은 설정에서')
//  - 단계 줄 오른쪽에 − N분 +(5분씩). 출발 시각은 그대로 두고 준비 시작이 앞뒤로 움직인다
//  - 출발 줄 오른쪽에 이동 시간 − + (위의 이동 시간과 같은 값). 늘리면 출발과 준비 단계가 함께 앞당겨진다
//  - 아래 '‘루틴’에도 저장'(끄면 이 일정만, 켜면 저장할 때 루틴을 고친다 — 루틴 탭과 이 루틴을 붙인 다른 일정도 바뀜)
//  - 폭 360에서 긴 단계 이름은 두 줄로(잘리지 않게)
function tvLineHtml(p, start, title, ed){
  const on = r => r.ring !== 'silent', arr = '<b class="tnum">' + esc(bxT(start)) + '</b><span class="nm">' + (p.travel ? '도착' : '시작') + (title ? ' · ' + esc(title) : '') + '</span>';
  if (!ed) {
    const al = new Set(p.rows.filter(on).map(r => r.id));
    return '<ol class="tv-line">' + p.rows.map(r => '<li class="' + (r.leave ? 'go' : r.pre ? 'pre' : '') + (r.ring === 'silent' ? ' wait' : '') + '"><b class="tnum">' + bxT(r.at) + '</b><span>' + esc(r.leave ? '출발' : r.name) + (r.min ? '<small>' + tvMinText(r.min) + '</small>' : '') + '</span>' + (al.has(r.id) ? ICON.bell : '') + '</li>').join('') +
      '<li class="arr">' + arr + '</li></ol>' +
      '<p class="p small">출발·준비 알람 ' + al.size + '개' + (p.rt ? ' · 루틴 단계 시간은 루틴 탭에서 고쳐요' : '') + '</p>';
  }
  const nm = r => r.leave ? '출발' : r.name;
  const stp = (k, v, lo, hi, label) => '<span class="bx-stp" role="group" aria-label="' + esc(label) + ' ' + tvMinText(v) + '">' +
    '<button type="button" data-tvl="' + esc(k) + '" data-d="-5" aria-label="' + esc(label) + ' 5분 줄이기"' + (v <= lo ? ' disabled' : '') + '>−</button>' +
    '<b class="tnum">' + tvMinText(v) + '</b>' +
    '<button type="button" data-tvl="' + esc(k) + '" data-d="5" aria-label="' + esc(label) + ' 5분 늘리기"' + (v >= hi ? ' disabled' : '') + '>+</button></span>';
  const bell = r => '<button type="button" class="bx-tvl-bell' + (on(r) ? '' : ' off') + '" data-tvl="bell" data-r="' + esc(String(r.id)) + '" aria-pressed="' + on(r) + '" aria-label="' + esc(nm(r)) + ' 알람 ' + (on(r) ? '울림' : '안 울림') + '">' + (on(r) ? ICON.bell : ICON.bellOff) + '</button>';
  const li = p.rows.map(r => '<li class="' + (r.leave ? 'go' : r.pre ? 'pre' : '') + (r.own ? ' chg' : '') + (on(r) ? '' : ' off') + '">' + bell(r) + '<b class="tnum">' + bxT(r.at) + '</b>' +
    '<span class="nm">' + esc(nm(r)) + (r.leave ? '<small>이동</small>' : '') + '</span>' +
    (r.leave ? stp('tv', p.travel, 5, 300, '이동 시간') : r.pre ? '' : stp('st:' + r.id, r.min, 5, 120, r.name)) + '</li>').join('');
  const n = p.rows.filter(on).length, off = p.rows.filter(r => !on(r)).map(nm);
  let note = '알람 ' + p.rows.length + '개 중 <b>' + n + '개</b> 울려요' + (off.length ? ' · 끈 것: ' + esc(off.join(' · ')) : '');
  if (p.rt) {
    const base = tvPlan(Object.assign({}, p.it, {prepMin: null}), p.rt), d = base ? Math.round((base.start - p.start) / 60000) : 0;
    note += ' · 준비 시작 <b>' + bxT(p.start) + '</b>' + (d ? '(루틴보다 ' + Math.abs(d) + '분 ' + (d > 0 ? '일찍' : '늦게') + ')' : '');
  }
  const save = p.rt ? '<button type="button" class="bx-tvl-save" data-tvl="save" role="checkbox" aria-checked="' + !!ed.save + '"><span class="chk' + (ed.save ? ' on' : '') + '" aria-hidden="true">' + ICON.check + '</span>' +
    '<span class="bx-tvl-st"><b>‘' + esc(p.rt.name) + '’ 루틴에도 저장</b><small>' + (ed.save ? '루틴 탭과 이 루틴을 붙인 다른 일정도 같이 바뀌어요' : '끄면 이 일정' + (title ? '(' + esc(title) + ')' : '') + '에만 바뀌어요') + '</small></span></button>' : '';
  return '<ol class="tv-line ed">' + li + '<li class="arr">' + arr + '</li></ol><p class="p small bx-tvl-note">' + note + '</p>' + save;
}
// 줄의 단추 하나를 누른 결과(바꿀 값만). st: 새 일정 창 F 또는 휴대폰 캘린더 일정의 덧붙인 값
function tvLineApply(st, p, b){
  const k = b.dataset.tvl, d = +b.dataset.d || 0;
  if (k === 'save') return {prepSave: !st.prepSave};
  if (k === 'tv') return {travel: Math.max(5, Math.min(300, (+p.travel || 0) + d))};
  if (k === 'bell') {
    const id = b.dataset.r, r = p.rows.find(x => String(x.id) === id); if (!r) return null;
    // 루틴(기본) 값으로 돌아가면 따로 적어 두지 않는다
    const base = tvPlan(Object.assign({}, p.it, {prepRing: null}), p.rt), br = base && base.rows.find(x => String(x.id) === id);
    const want = r.ring === 'silent', def = br ? br.ring !== 'silent' : true, pr = Object.assign({}, st.prepRing || {});
    if (want === def) delete pr[id]; else pr[id] = want ? 1 : 0;
    return {prepRing: pr};
  }
  if (k.startsWith('st:') && p.rt) {
    const id = k.slice(3), r = p.rows.find(x => String(x.id) === id), s = p.rt.steps.find(x => String(x.id) === id); if (!r || !s) return null;
    const v = Math.max(Math.min(5, r.min), Math.min(Math.max(120, r.min), r.min + d)), pm = Object.assign({}, st.prepMin || {});
    if (v === (+s.min || 0)) delete pm[id]; else pm[id] = v;
    return {prepMin: pm};
  }
  return null;
}
// '루틴에도 저장'(시험판 62): 이 일정에서 바꾼 단계 시간 · 알람을 루틴에 적는다. 출발 · 출발 10분 전은 일정의 것이라 넘기지 않는다
function tvSaveToRoutine(rid, pm, pr){
  const d = getDoc(rid); if (!d || !Array.isArray(d.steps)) return false;
  let ch = false;
  const steps = d.steps.map(s => {
    const o = Object.assign({}, s);
    if (pm[s.id] != null && +pm[s.id] !== +s.min) { o.min = clampInt(pm[s.id], 0, 600, +s.min || 0); ch = true; }
    if (pr[s.id] === 0 && s.kind !== 'wait') { o.kind = 'wait'; delete o.ring; ch = true; }
    else if (pr[s.id] === 1 && s.kind === 'wait') { o.kind = 'do'; delete o.ring; ch = true; }
    return o;
  });
  if (ch) writeDoc(rid, Object.assign({}, d, {steps, updatedAt: nowIso()}));
  return ch;
}
// 루틴으로 넘긴 단계 값은 이 일정에서 지운다(출발 · 출발 10분 전 알람만 남김)
function tvOwnLeft(pm, pr){ return {pm: {}, pr: Object.keys(pr || {}).filter(k => k === 'leave' || k === 'pre').reduce((o, k) => (o[k] = pr[k], o), {})}; }
// 기본 '외출 준비' 루틴이 없으면 만든다(일정에 붙여 쓰는 용도라 꺼 둠)
function tvEnsureOut(){
  const ex = M.routines.find(r => tvKey(r.name) === tvKey(TV_OUT.name));
  if (ex) return ex.id;
  const id = rid('rt_');
  writeDoc(id, Object.assign(rtNorm({name: TV_OUT.name, mode: 'start', steps: TV_OUT.steps, on: false}), {order: M.routines.length, createdAt: nowIso(), updatedAt: nowIso()}));
  M = buildModel();
  return id;
}
function tvRedraw(){ if (F && F.panel === 'go') tvDrawPanel(); else drawFChips(); drawFHint(); }
// 말·글에서 찾은 이동 시간·루틴을 창에 반영(손으로 고른 값은 그대로)
function tvOnParse(p){
  if (!F || F.mode !== 'new' || !p) return;
  if (!F.touchedTravel) {
    if (p.travel) { F.travel = p.travel; F.tvSrc = 'said'; F.tvKey = ''; }
    else {
      const r = tvRecall(p.title || F.title, F.location);
      if (r) { F.travel = r.min; F.tvSrc = 'mem'; F.tvKey = r.key; }
      else if (F.tvSrc) { F.travel = 0; F.tvSrc = ''; F.tvKey = ''; }
    }
  }
  if (!F.touchedPrep) {
    if (p.prepName) { F.prep = p.prep || null; F.prepNew = p.prep ? null : p.prepName; }
    else { F.prep = null; F.prepNew = null; }
  }
  if (!F.touchedRem) {
    if (p.remind != null) { F.remT = remNorm(p.remind, true, F.start); F.remSaid = true; }
    else if (F.remSaid) { F.remT = remNorm(M.settings.defaultRemind, true); F.remSaid = false; }
  }
  if (F.panel === 'go') tvDrawPanel();
}
// 저장할 때: 이동 시간·루틴을 일정에 넣고, 새 '외출 준비'를 만들고, 이동 시간을 기억
function tvFields(fields, start){
  tvNote = '';
  fields.travel = start ? Math.max(0, Math.min(300, Math.round(+F.travel || 0))) : 0;
  let prep = start ? F.prep : null;
  if (start && !prep && F.prepNew) prep = tvEnsureOut();
  fields.prep = prep && getDoc(prep) ? prep : null;
  // 시험판 62: 이 일정만 바꾼 단계 시간 · 알람. '루틴에도 저장'이면 루틴을 고치고 이 일정에는 출발 쪽 알람만 남긴다
  let pm = start && fields.prep ? Object.assign({}, F.prepMin || {}) : {}, pr = start ? Object.assign({}, F.prepRing || {}) : {};
  if (fields.prep && F.prepSave) { tvSaveToRoutine(fields.prep, pm, pr); const o = tvOwnLeft(pm, pr); pm = o.pm; pr = o.pr; }
  if (!fields.prep) Object.keys(pr).forEach(k => { if (k !== 'leave' && k !== 'pre') delete pr[k]; });
  fields.prepMin = Object.keys(pm).length ? pm : null;
  fields.prepRing = Object.keys(pr).length ? pr : null;
  if (fields.travel && tvRemember(fields.title, fields.location, fields.travel)) {
    const k = tvKey(fields.location).length >= 2 ? fields.location.trim() : fields.title;
    tvNote = k + '까지 ' + tvMinText(fields.travel) + ', 기억해 둘게요';
  }
}
function tvWhenTail(fields){
  if (!fields.start) return '';
  const p = tvPlan(Object.assign({done: false}, fields));
  return (p ? ' · ' + (p.travel ? bxT(p.leave) + ' 출발' : '준비 ' + bxT(p.start) + '부터') : '') + (tvNote ? ' · ' + tvNote : '');
}
document.addEventListener('click', ev => {
  if (!window.BX_APP || !F || !ev.target.closest) return;
  const b = ev.target.closest('#f-go [data-tvl]'); if (!b) return;
  ev.preventDefault(); ev.stopPropagation();
  const p = tvFormPlan(), ch = p && tvLineApply(F, p, b); if (!ch) return;
  if (ch.travel != null) { F.travel = ch.travel; F.touchedTravel = true; F.tvSrc = 'hand'; }
  if (ch.prepMin) F.prepMin = ch.prepMin;
  if (ch.prepRing) F.prepRing = ch.prepRing;
  if (ch.prepSave != null) F.prepSave = ch.prepSave;
  tvRedraw();
}, true);
// 휴대폰 캘린더 일정의 출발·준비 페이지: 고르면 바로 그 일정의 덧붙인 값(px 문서)에 적는다. ‹ 는 연 순간으로 되돌림(v45.js)
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const b = ev.target.closest('.bx-pc45-pg [data-tvl]'); if (!b) return;
  ev.preventDefault(); ev.stopPropagation();
  const idEl = document.querySelector('#sheet-f [data-act="pc-done"]'), it = idEl ? M.items.find(i => i.id === idEl.dataset.id) : null; if (!it) return;
  const p = tvPlan(it), ch = p && tvLineApply({prepMin: it.prepMin, prepRing: it.prepRing, prepSave: tvPcSave}, p, b); if (!ch) return;
  if (ch.prepSave != null) tvPcSave = ch.prepSave;
  const patch = {};
  if (ch.travel != null) { patch.travel = ch.travel; tvRemember(it.title, it.location, ch.travel); }
  if (ch.prepMin) patch.prepMin = Object.keys(ch.prepMin).length ? ch.prepMin : null;
  if (ch.prepRing) patch.prepRing = Object.keys(ch.prepRing).length ? ch.prepRing : null;
  if (Object.keys(patch).length) pcSetOv(it.pcKey, patch);
  pcDraw(it.id);
}, true);
document.addEventListener('click', ev => {
  if (!window.BX_APP || !F) return;
  const tv = ev.target.closest('[data-ftv]');
  if (tv) { F.travel = +tv.dataset.ftv || 0; F.touchedTravel = true; F.tvSrc = 'hand'; tvRedraw(); return; }
  const pr = ev.target.closest('[data-fprep]');
  if (pr) { const v = pr.dataset.fprep; F.touchedPrep = true; F.prep = v && v !== 'new' ? v : null; F.prepNew = v === 'new' ? TV_OUT.name : null;
    // 시험판 62: 루틴을 바꾸면 단계가 달라지니 이 일정만 바꾼 단계 값은 비운다(출발 쪽 알람은 그대로)
    const o = tvOwnLeft(F.prepMin, F.prepRing); F.prepMin = o.pm; F.prepRing = o.pr; F.prepSave = false; tvRedraw(); return; }
  if (ev.target.closest('[data-frem],[data-act="rem-add-rel"],[data-act="rem-add-abs"]')) { F.touchedRem = true; F.remSaid = false; }
}, true);
document.addEventListener('change', ev => {
  if (!window.BX_APP || !F || ev.target.id !== 'f-travel') return;
  F.travel = clampInt(ev.target.value, 0, 300, F.travel || 0); F.touchedTravel = true; F.tvSrc = 'hand'; tvRedraw();
});
document.addEventListener('input', ev => {
  if (!window.BX_APP || !F || ev.target.id !== 'f-loc' || F.touchedTravel || F.mode !== 'new') return;
  const r = tvRecall((F.parsed && F.parsed.title) || F.title, ev.target.value);
  if (r) { F.travel = r.min; F.tvSrc = 'mem'; F.tvKey = r.key; } else if (F.tvSrc === 'mem') { F.travel = 0; F.tvSrc = ''; F.tvKey = ''; }
  drawFChips(); drawFHint();
});
