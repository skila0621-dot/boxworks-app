/* ---------- 첫 실행 · 루틴 도우미 (대표 결정 2026-10-31, 개편_검토.md 2절) ----------
   첫 실행: (1) 쓸 기능 고르기 → (2) 고른 기능이 무엇을 해 주는지, 아래 메뉴 어디에 있는지. 질문은 없다.
   설정 질문은 그 기능에 처음 들어갈 때: 루틴 탭에 처음 들어가면 '루틴 도우미'(한 화면에 질문 하나, 1/3 → 3/3 → 만든 것).
   루틴을 켰는데 하나도 없으면 홈 '오늘 할 일'에 '아침 루틴 30초 만에 만들기' 카드. 고르는 칸에는 늘 '직접 입력'과 '나중에'. */
const BX_MODS = [
  ['report', '아침에 오늘 일정 받기', '아침 알림 하나로 오늘 할 일 한눈에', 'sun'],
  ['routines', '루틴', '아침 준비·약 먹기를 단계마다 알람으로', 'loop'],
  ['tt', '시간표', '매주 반복되는 수업·학원·알바', 'school'],
  ['med', '명상', '싱잉볼 소리로 시작과 끝을 알려 줘요', 'lotus']
];
let BXS = null;
if (!ICON.flag) ICON.flag = '<svg class="i" viewBox="0 0 24 24"><path d="M5 21V4h11l-2 4 2 4H5"/></svg>';
function bxStartMods(){ const st = M && M.settings && M.settings.bxStart; return st && st.mods ? st.mods : {report: true, routines: true, tt: true, med: true}; }
function bxStartOverlay(html){
  let el = document.getElementById('bx-start');
  if (!el) { el = document.createElement('div'); el.id = 'bx-start'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); document.body.appendChild(el); document.documentElement.classList.add('locked'); }
  el.innerHTML = '<div class="bxs-in">' + html + '</div>';
  el.scrollTop = 0;
}
function bxStartClose(){
  const el = document.getElementById('bx-start'); if (el) el.remove(); document.documentElement.classList.remove('locked'); BXS = null; PERM = null; render();
  // 루틴 도우미를 하는 동안 미뤄 둔 알람 허락 화면
  if (PERM_PENDING && !BXR) { const p = PERM_PENDING; PERM_PENDING = null; setTimeout(() => window.BX_permOpen(p.at, p.st), 250); }
}
function bxDots(n, cur){ let h = '<div class="bxs-dots" aria-label="' + n + '단계 중 ' + cur + '단계">'; for (let i = 1; i <= n; i++) h += '<span class="' + (i === cur ? 'on' : i < cur ? 'done' : '') + '"></span>'; return h + '</div>'; }
function bxCheck(on){ return '<span class="bxs-chk' + (on ? ' on' : '') + '" aria-hidden="true">' + (on ? ICON.check : '') + '</span>'; }

/* 첫 실행 */
function bxStartDraw(){
  if (BXS.step === 1) {
    const n = 1 + BX_MODS.filter(m => BXS.sel[m[0]]).length;
    bxStartOverlay(
      '<div class="bxs-top">' + bxDots(2, 1) + '<button type="button" class="bxs-skip" data-bxs="skip">건너뛰기</button></div>' +
      '<h1 class="bxs-h">무엇을 도와드릴까요?</h1><p class="bxs-p">쓸 것만 골라 주세요. 고른 것만 홈과 아래 메뉴에 나와요. 나중에 언제든 바꿀 수 있어요.</p>' +
      '<div class="bxs-list">' +
        '<div class="bxs-opt fixed">' + '<span class="bxs-ic">' + bxIconSpan('home', '') + '</span><span class="bxs-t"><b>일정 · 캘린더</b><small>말하면 날짜·시간을 알아서 넣어요. 휴대폰 캘린더 일정도 함께 볼 수 있어요 · 기본</small></span>' + bxCheck(true) + '</div>' +
        BX_MODS.map(m => '<button type="button" class="bxs-opt" role="checkbox" aria-checked="' + !!BXS.sel[m[0]] + '" data-bxs-mod="' + m[0] + '"><span class="bxs-ic">' + bxIconSpan(m[3], '') + '</span><span class="bxs-t"><b>' + m[1] + '</b><small>' + m[2] + '</small></span>' + bxCheck(BXS.sel[m[0]]) + '</button>').join('') +
      '</div><div class="bxs-sp"></div>' +
      '<button type="button" class="btn primary bxs-go" data-bxs="next">다음 · ' + n + '개 고름</button>');
    return;
  }
  const keys = bxStartDock(), pos = k => { const i = keys.indexOf(k); return i < 0 ? '' : '아래 메뉴 ' + (i < Math.ceil(keys.length / 2) ? i + 1 : i + 2) + '번째'; };
  const card = (icon, name, where, text) => '<div class="bxs-card"><span class="bxs-ic">' + bxIconSpan(icon, '') + '</span><span class="bxs-t"><span class="bxs-cn"><b>' + name + '</b>' + (where ? '<em>' + where + '</em>' : '') + '</span><small>' + text + '</small></span></div>';
  const cards = [];
  if (BXS.sel.routines) cards.push(card('loop', '루틴', pos('routines'), '아침 준비·약 먹기처럼 반복하는 일을 단계로 나눠, 단계마다 알람으로 알려 주고 다 했는지 챙겨 줘요. 처음 들어가면 몇 가지만 물어볼게요.'));
  cards.push(card('home', '일정 · 캘린더', '오른쪽 아래 +', '“내일 3시 치과”처럼 말하거나 적으면 날짜·시간이 알아서 들어가요. 삼성 캘린더 같은 휴대폰 캘린더 일정도 함께 볼 수 있어요. 달력은 ' + (pos('month') || '⋯ 메뉴') + '.'));
  if (BXS.sel.report) cards.push(card('sun', '아침에 오늘 일정 받기', '', '매일 아침 알림 하나로 오늘 할 일을 보여 줘요. 처음엔 7:30, 아침 루틴을 만들면 그 시각에 맞춰요.'));
  if (BXS.sel.tt) cards.push(card('school', '시간표', pos('tt'), '“월수 10시 반 경영학원론”처럼 말하면 채워지고, 수업 전에 알려 줘요.'));
  if (BXS.sel.med) cards.push(card('lotus', '명상', pos('med'), '시간을 고르면 싱잉볼 소리로 시작과 끝을 알려 줘요.'));
  const lab = {med: '명상', routines: '루틴', month: '캘린더', tt: '시간표'}, half = Math.ceil(keys.length / 2);
  const dock = keys.slice(0, half).map(k => lab[k]).concat(['홈']).concat(keys.slice(half).map(k => lab[k]));
  bxStartOverlay(
    '<div class="bxs-top">' + bxDots(2, 2) + '</div>' +
    '<h1 class="bxs-h">이렇게 도와드려요</h1><p class="bxs-p">고른 기능은 아래 메뉴에 있어요. 설정할 게 있으면 그 기능에 처음 들어갈 때 물어볼게요.</p>' +
    '<div class="bxs-list">' + cards.join('') + '</div>' +
    '<div class="bxs-note">' + ICON.bell + '<span>알람이 처음 필요할 때 휴대폰 허락을 한 번 물어볼게요.</span></div><div class="bxs-sp"></div>' +
    '<div class="bxs-dock" aria-label="아래 메뉴 미리 보기" style="grid-template-columns:repeat(' + dock.length + ',minmax(0,1fr))">' + dock.map(x => '<span class="' + (x === '홈' ? 'on' : '') + '">' + x + '</span>').join('') + '</div>' +
    '<div class="bxs-row"><button type="button" class="btn bxs-back" data-bxs="back">이전</button><button type="button" class="btn primary bxs-go" data-bxs="done">시작하기</button></div>');
}
function bxStartDock(){ return ['med', 'routines', 'month', 'tt'].filter(k => k === 'month' || BXS.sel[k]); }
function bxStartOpen(){ BXS = {step: 1, sel: Object.assign({}, bxStartMods())}; if (!(M.settings && M.settings.bxStart)) BXS.sel.tt = false; bxStartDraw(); }

/* 루틴 도우미: 질문 하나씩 */
const BX_RH_Q = [
  {k: 'out', h: '아침에 보통\n몇 시에 나가요?', p: '나가는 시각에 맞춰 준비 루틴을 거꾸로 짜 드려요.', opts: [['07:30', '7:30'], ['08:00', '8:00'], ['08:30', '8:30'], ['09:00', '9:00']], none: '안 나가요', custom: '나가는 시각', def: '07:50'},
  {k: 'med', h: '챙겨 먹는 약이\n있어요?', p: '약 먹을 때 알려 드려요. 약 이름은 묻지 않아요.', opts: [['am', '아침'], ['noon', '점심'], ['pm', '저녁'], ['bed', '자기 전']], none: '없어요', custom: '약 먹는 시각', def: '21:00'},
  {k: 'rep', h: '아침에 오늘 일정도\n알려 드릴까요?', p: '알림 하나로 오늘 할 일·수업·루틴을 보여 줘요.', opts: [['attach', '루틴 첫 알람에 같이'], ['07:00', '7:00'], ['08:00', '8:00']], none: '안 받을래요', custom: '알림 시각', def: '07:30', wide: true}
];
const BX_MED_AT = {am: '08:00', noon: '12:30', pm: '19:00', bed: '22:30'};
let BXR = null;
function bxRtHelpOpen(){ BXR = {q: 0, a: {}, cust: {}}; bxRtHelpDraw(); }
function bxRtHelpDraw(){
  if (BXR.q >= BX_RH_Q.length) { bxRtHelpResult(); return; }
  const Q = BX_RH_Q[BXR.q], cur = BXR.a[Q.k], isCust = cur === 'custom';
  if (Q.k === 'rep' && !(BXR.a.out && /^\d/.test(BXR.a.out) || BXR.a.out === 'custom')) Q.opts[0][1] = '7:30';
  const opt = o => '<button type="button" class="bxs-big' + (cur === o[0] ? ' on' : '') + '" aria-pressed="' + (cur === o[0]) + '" data-bxr="' + o[0] + '">' + o[1] + '</button>';
  bxStartOverlay(
    '<div class="bxs-top"><button type="button" class="bxs-back-i" data-bxr-nav="back" aria-label="뒤로">' + ICON.chevL + '</button><span class="bxs-tt">루틴 도우미</span><button type="button" class="bxs-skip" data-bxr-nav="skip">건너뛰기</button></div>' +
    '<div class="bxs-prog"><span style="width:' + Math.round((BXR.q + 1) / BX_RH_Q.length * 100) + '%"></span></div><span class="bxs-pn">' + (BXR.q + 1) + ' / ' + BX_RH_Q.length + '</span>' +
    '<h1 class="bxs-h big">' + esc(Q.h).replace('\n', '<br>') + '</h1><p class="bxs-p">' + Q.p + '</p>' +
    '<div class="bxs-grid' + (Q.wide ? ' wide' : '') + '">' + Q.opts.map(opt).join('') + '</div>' +
    '<button type="button" class="bxs-cust' + (isCust ? ' on' : '') + '" aria-pressed="' + isCust + '" data-bxr="custom">' + ICON.edit + '직접 입력</button>' +
    (isCust ? '<label class="bxs-custbox"><span>' + Q.custom + '</span><input type="time" id="bxr-time" value="' + (BXR.cust[Q.k] || Q.def) + '"></label>' : '') +
    '<div class="bxs-links"><button type="button" data-bxr="none"' + (cur === 'none' ? ' class="on"' : '') + '>' + Q.none + '</button><button type="button" data-bxr="later">나중에 할게요</button></div>' +
    '<div class="bxs-sp"></div>' +
    '<button type="button" class="btn primary bxs-go" data-bxr-nav="next"' + (cur ? '' : ' disabled') + '>' + (BXR.q < BX_RH_Q.length - 1 ? '다음' : '루틴 만들기') + '</button>');
}
function bxMakeRoutine(o){
  const id = rid('rt_'), r = rtNorm(o);
  const doc = Object.assign(r, {order: M.routines.length, createdAt: nowIso(), updatedAt: nowIso()});
  doc.steps = r.steps.map((s, i) => ({id: 's' + i + Math.random().toString(36).slice(2, 6), name: String(s.name || '').slice(0, 30) || '단계 ' + (i + 1), min: clampInt(s.min, 0, 600, 0), kind: s.kind === 'wait' ? 'wait' : 'do'}));
  writeDoc(id, doc); M = buildModel();
  return id;
}
function bxRtHelpResult(){
  if (!BXR.made) {
    const a = BXR.a, made = [], tv = k => a[k] === 'custom' ? (BXR.cust[k] || BX_RH_Q.find(q => q.k === k).def) : a[k];
    const outT = a.out && a.out !== 'none' && a.out !== 'later' ? tv('out') : null;
    const medT = a.med && a.med !== 'none' && a.med !== 'later' ? (a.med === 'custom' ? tv('med') : a.med) : null;
    if (outT) {
      const steps = [['기상', 5], ['씻기', 20], ['옷 입기', 10], ['짐 챙기기', 5]];
      if (medT === 'am') steps.splice(1, 0, ['약 먹기', 2]);
      made.push(bxMakeRoutine({name: '아침 준비', days: RT_WD, mode: 'arrive', target: outT, travel: 0, buffer: 0, every: 5, times: 6, steps}));
    }
    if (medT && !(medT === 'am' && outT)) {
      const at = BX_MED_AT[medT] || medT, nm = {am: '아침 약', noon: '점심 약', pm: '저녁 약', bed: '자기 전 약'}[medT] || '약 먹기';
      made.push(bxMakeRoutine({name: nm, days: RT_ALL, mode: 'start', target: at, every: 10, times: 6, steps: [['약 먹기', 0]]}));
    }
    if (a.rep === 'none') saveSettings({bxReport: {on: false, at: bxRepCfg().at}});
    else if (a.rep && a.rep !== 'later') saveSettings({bxReport: {on: true, at: a.rep === 'attach' ? '07:30' : tv('rep')}});
    saveSettings({bxRtHelp: {at: nowIso(), made}});
    BXR.made = made;
  }
  // 만든 루틴은 거꾸로 짠 시각표를 그대로 보여 준다(전체 흐름 와이어프레임 5)
  const rows = BXR.made.map(id => { const rt = getDoc(id); if (!rt) return ''; const p = rtPlan(rt);
    const tot = rt.steps.reduce((a, s) => a + (+s.min || 0), 0);
    const tl = p.rows.filter(r => r.kind !== 'wait').map(r => '<li class="' + (r.leave ? 'lv' : '') + '"><span class="bxs-tm">' + mm(r.at) + '</span>' + (r.leave ? '<span class="bxs-flag" aria-hidden="true">' + ICON.flag + '</span>' : '<i aria-hidden="true"></i>') + '<span class="bxs-sn">' + esc(r.leave ? '출발' : r.name) + '</span>' + (r.leave ? '' : '<span class="bxs-sm">' + (+r.min || 0) + '분</span>') + '</li>').join('');
    return '<div class="bxs-res col"><div class="bxs-rh"><span class="bxs-t"><b>' + esc(rt.name) + '</b><small>' + esc(rtWhenText(rt) + ' · 단계 ' + rt.steps.length + '개' + (tot ? ' · ' + tot + '분' : '') + (rt.mode === 'arrive' ? ' · ' + mm(p.start) + ' 시작' : '')) + '</small></span>' +
      '<span class="bx-togw"><span>알람</span><button type="button" class="tog" role="switch" aria-checked="' + (rt.on !== false) + '" aria-label="' + esc(rt.name) + ' 알람 켜기" data-bxr-tog="' + esc(id) + '"><i></i></button></span></div>' +
      '<ol class="bxs-tl">' + tl + '</ol></div>'; }).join('');
  const rep = bxRepCfg();
  const repRow = '<div class="bxs-res"><span class="bxs-ic">' + bxIconSpan('sun', '') + '</span><span class="bxs-t"><b>아침에 오늘 일정 받기</b><small>' + (rep.on ? '매일 · 아침 루틴이 있으면 첫 알람과 함께' : '받지 않아요 · 설정에서 켤 수 있어요') + '</small></span>' +
    '<button type="button" class="tog" role="switch" aria-checked="' + rep.on + '" aria-label="아침 일정 받기" data-bxr-rep="1"><i></i></button></div>';
  const tpls = RT_TEMPLATES.filter(t => !['work', 'meds'].includes(t.key)).slice(0, 4).map(t => '<button type="button" class="bxs-chip" data-act="rt-tpl" data-key="' + t.key + '">+ ' + esc(t.name) + '</button>').join('');
  const first = BXR.made.map(getDoc).filter(Boolean).find(rt => rt.mode === 'arrive');
  const lead = first ? (() => { const p = rtPlan(first); return mm(p.leave) + '에 나가려면 ' + mm(p.start) + '에 시작해요.'; })() : '';
  bxStartOverlay(
    '<div class="bxs-top"><span class="bxs-tt">루틴 도우미</span></div>' +
    '<h1 class="bxs-h">' + (BXR.made.length ? '이렇게 만들어 뒀어요' : '언제든 다시 만들 수 있어요') + '</h1><p class="bxs-p">' + (BXR.made.length ? (lead ? lead + ' ' : '') + '루틴을 누르면 단계·시간을 고쳐요. “씻기 30분으로”처럼 말로 고쳐도 돼요.' : '루틴 탭의 ‘+ 새 루틴’에서 템플릿을 고르거나 말로 만들 수 있어요.') + '</p>' +
    '<div class="bxs-box">' + rows + repRow + '</div>' +
    '<h2 class="bxs-h2">이런 루틴도 있어요</h2><div class="bxs-chips">' + tpls + '</div><p class="bxs-p small">누르면 바로 열리고, 시각만 고쳐 저장하면 돼요.</p>' +
    '<div class="bxs-sp"></div><button type="button" class="btn primary bxs-go" data-bxr-nav="close">' + (BXR.made.length && PERM_PENDING ? '알람 켜기' : '내 루틴 보기') + '</button>');
}

/* ---------- 알람 허락 (전체 흐름 와이어프레임 6, 대표 결정 A: 처음 알람이 생길 때) ----------
   첫 실행에서 묻지 않고, 처음 알람이 생겼을 때 그 알람('내일 07:18')을 이유로 든다. 허락된 줄은 '허락됨'.
   휴대폰 설정에서 돌아오면(resume) 다시 확인해 줄을 고친다. 절전 예외는 '권장'(대표 결정 B) */
let PERM = null, PERM_PENDING = null;
window.BX_permOpen = function(at, st){
  if (!window.BX_APP || !window.BX_perm) return;
  if (BXS || BXR) { PERM_PENDING = {at, st}; if (BXR && BXR.made) bxRtHelpResult(); return; }
  PERM = {at: at || 0, st: st || {}};
  bxPermDraw();
};
window.BX_permRefresh = async function(){
  if (!PERM || !window.BX_perm) return;
  try { PERM.st = await window.BX_perm.status(); if (PERM && document.getElementById('bx-start')) bxPermDraw(); } catch (e) {}
};
function bxPermDraw(){
  const st = PERM.st || {}, d = PERM.at ? new Date(PERM.at) : null;
  const when = d ? relDay(ymd(d), M.today) + (d.getHours() < 12 ? ' 아침 ' : ' ') + hm(d) : '';
  const rows = [
    ['notifications', '알림 보내기', '알람과 아침 일정을 알려 줘요'],
    ['exact', '정확한 시각에 울리기', when ? hm(d) + ' 알람이 늦게 울리지 않게' : '정한 시각에 늦지 않게'],
    ['fullScreen', '잠금 화면에 알람 띄우기', '화면이 꺼져 있어도 알람처럼 크게. 일정 내용은 안 보여요'],
    ['battery', '절전에서 빼기', '며칠 안 열어도 알람이 멈추지 않게', true]
  ];
  const row = r => '<li class="bxp-row"><span class="bxs-t"><b>' + r[1] + (r[3] ? ' <small class="bxp-tag">권장</small>' : '') + '</b><small>' + r[2] + '</small></span>' +
    (st[r[0]] ? '<span class="bxp-ok">' + ICON.check + '허락됨</span>' : '<button type="button" class="btn sm' + (r[3] ? '' : ' primary') + '" data-bxp="' + r[0] + '">' + (r[3] ? '설정 열기' : '허락하기') + '</button>') + '</li>';
  bxStartOverlay(
    '<div class="bxs-top"><button type="button" class="bxs-back-i" data-bxp-nav="later" aria-label="닫기">' + ICON.chevL + '</button></div>' +
    '<span class="bxp-ic" aria-hidden="true">' + ICON.bell + '</span>' +
    '<h1 class="bxs-h">' + (when ? esc(when) + '에<br>울리려면 허락이 필요해요' : '알람이 울리려면<br>허락이 필요해요') + '</h1>' +
    '<p class="bxs-p">휴대폰은 허락한 앱만 정한 시각에 알람을 울려요. 한 번만 하면 돼요.</p>' +
    '<ul class="bxs-box bxp-list">' + rows.map(row).join('') + '</ul>' +
    (st.battery ? '' : '<p class="bxs-p small">절전에서 빼기: 목록에서 박스웍스를 찾아 ‘제한 없음’이나 ‘최적화 안 함’으로 바꿔요.</p>') +
    '<div class="bxs-sp"></div>' +
    '<button type="button" class="btn bxs-test" data-bxp-nav="test"' + (st.notifications ? '' : ' disabled') + '>' + ICON.bell + '알람 한 번 들어 보기 · 10초 뒤</button>' +
    '<button type="button" class="btn primary bxs-go" data-bxp-nav="done">다 됐어요</button>' +
    '<button type="button" class="bxp-later" data-bxp-nav="later">나중에' + (st.notifications ? '' : ' · 그동안은 알람이 울리지 않아요') + '</button>');
}
function bxPermClose(){ PERM = null; const el = document.getElementById('bx-start'); if (el) el.remove(); document.documentElement.classList.remove('locked'); render(); }
document.addEventListener('click', async ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const t = ev.target.closest('[data-bxp],[data-bxp-nav]'); if (!t || !PERM) return;
  ev.preventDefault(); ev.stopPropagation();
  const P = window.BX_perm, k = t.dataset.bxp, nav = t.dataset.bxpNav;
  try {
    if (k === 'notifications') { PERM.st = await P.notifications(); if (!PERM.st.notifications) P.open('notifications'); bxPermDraw(); return; }
    if (k === 'exact') { P.open('exact'); return; }
    if (k === 'fullScreen') { P.open('fullscreen'); return; }
    if (k === 'battery') { P.open('battery'); return; }
    if (nav === 'test') { await P.test(); toast('10초 뒤 알람이 울려요. 화면을 끄고 기다려 보세요.'); return; }
  } catch (e) { toast('휴대폰 설정을 열지 못했어요'); return; }
  if (nav === 'done' || nav === 'later') bxPermClose();
}, true);
function bxRtUserCount(){ return M.routines.filter(r => r.on !== false || r.name !== '외출 준비').length; }
// 루틴 탭에 처음 들어가면 도우미(루틴이 하나도 없을 때만)
function bxStartCheck(){
  if (!window.BX_APP || !M || !M.settings || !S.firstServer || S.widget || SH || BXS || BXR || document.getElementById('bx-start')) return;
  if (!M.settings.bxStart) { setTimeout(() => { if (!SH && !BXS && !document.getElementById('bx-start')) bxStartOpen(); }, 300); return; }
  if (S.view === 'routines' && !M.settings.bxRtHelp && bxStartMods().routines !== false && !bxRtUserCount()) setTimeout(() => { if (!SH && !BXR && S.view === 'routines') bxRtHelpOpen(); }, 250);
}
// 홈 '오늘 할 일' 맨 위 안내 카드
function bxRtNudgeHtml(){
  if (!window.BX_APP || !M.settings || M.settings.bxRtHelp || bxStartMods().routines === false || bxRtUserCount() || S.homeDay) return '';
  return '<div class="bx-nudge"><span class="bxs-ic">' + bxIconSpan('sun', '') + '</span><span class="bxs-t"><b>아침 루틴, 30초면 만들어요</b><small>나가는 시각만 고르면 준비 단계를 거꾸로 짜 드려요</small><span class="bx-nudge-go"><button type="button" class="btn sm primary" data-act="bx-rt-help">루틴 만들기</button></span></span><button type="button" class="icon-btn bx-nudge-x" data-act="bx-rt-help-x" aria-label="안내 닫기">' + ICON.close + '</button></div>';
}
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const t = ev.target.closest('[data-bxs],[data-bxs-mod],[data-bxr],[data-bxr-nav],[data-bxr-tog],[data-bxr-rep],[data-act="bx-rt-help"],[data-act="bx-rt-help-x"],[data-act="bx-start-again"]');
  if (!t) return;
  if (t.dataset.act === 'rt-tpl') return;
  ev.preventDefault(); ev.stopPropagation();
  const act = t.dataset.act;
  if (act === 'bx-rt-help') { bxRtHelpOpen(); return; }
  if (act === 'bx-rt-help-x') { saveSettings({bxRtHelp: {at: nowIso(), skipped: true}}); toast('루틴 탭의 ‘+ 새 루틴’에서 언제든 만들 수 있어요'); return; }
  if (act === 'bx-start-again') { closeSheet(); bxStartOpen(); return; }
  if (t.dataset.bxsMod) { BXS.sel[t.dataset.bxsMod] = !BXS.sel[t.dataset.bxsMod]; bxStartDraw(); return; }
  const s = t.dataset.bxs;
  if (s === 'skip') { saveSettings({bxStart: {at: nowIso(), skipped: true, mods: {report: true, routines: true, tt: true, med: true}}}); bxStartClose(); return; }
  if (s === 'next') { BXS.step = 2; bxStartDraw(); return; }
  if (s === 'back') { BXS.step = 1; bxStartDraw(); return; }
  if (s === 'done') {
    const sel = BXS.sel, dock = bxStartDock();
    saveSettings({bxStart: {at: nowIso(), mods: sel}, bxDock: dock, bxReport: Object.assign({}, (M.settings && M.settings.bxReport) || {}, {on: !!sel.report})});
    bxStartClose(); return;
  }
  // 루틴 도우미
  if (t.dataset.bxr) {
    const Q = BX_RH_Q[BXR.q], v = t.dataset.bxr;
    const ti = $('#bxr-time'); if (ti && ti.value) BXR.cust[Q.k] = ti.value;
    if (v === 'later') { BXR.a[Q.k] = 'later'; BXR.q++; bxRtHelpDraw(); return; }
    BXR.a[Q.k] = v; bxRtHelpDraw();
    if (v === 'custom') setTimeout(() => { const i = $('#bxr-time'); if (i) i.focus(); }, 50);
    return;
  }
  const nav = t.dataset.bxrNav;
  if (nav) {
    const Q = BX_RH_Q[BXR.q]; const ti = $('#bxr-time'); if (Q && ti && ti.value) BXR.cust[Q.k] = ti.value;
    if (nav === 'skip') { saveSettings({bxRtHelp: {at: nowIso(), skipped: true}}); bxStartClose(); BXR = null; return; }
    if (nav === 'back') { if (BXR.q > 0 && !BXR.made) { BXR.q--; bxRtHelpDraw(); } else { bxStartClose(); BXR = null; } return; }
    if (nav === 'next') { BXR.q++; bxRtHelpDraw(); return; }
    if (nav === 'close') { BXR = null; bxStartClose(); return; }
  }
  if (t.dataset.bxrTog) { const id = t.dataset.bxrTog, d = getDoc(id); if (d) { patchDoc(id, {on: d.on === false}); M = buildModel(); bxRtHelpResult(); } return; }
  if (t.dataset.bxrRep) { const c = bxRepCfg(); saveSettings({bxReport: {on: !c.on, at: c.at}}); bxRtHelpResult(); return; }
}, true);
// 도우미 결과 화면에서 템플릿을 누르면 도우미를 닫고 루틴 창을 연다
document.addEventListener('click', ev => {
  const t = ev.target.closest && ev.target.closest('#bx-start [data-act="rt-tpl"]'); if (!t) return;
  const el = document.getElementById('bx-start'); if (el) el.remove(); document.documentElement.classList.remove('locked'); BXR = null;
}, true);
