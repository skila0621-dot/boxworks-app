/* ---------- 첫 실행 · 루틴 도우미 (대표 결정 2026-10-31, 개편_검토.md 2절) ----------
   첫 실행: (1) 쓸 기능 고르기 → (2) 고른 기능이 무엇을 해 주는지, 아래 메뉴 어디에 있는지. 질문은 없다.
   설정 질문은 그 기능에 처음 들어갈 때: 루틴 탭에 처음 들어가면 '루틴 도우미'(한 화면에 질문 하나, 1/3 → 3/3 → 만든 것).
   루틴을 켰는데 하나도 없으면 홈 '오늘 할 일'에 '아침 루틴 30초 만에 만들기' 카드. 고르는 칸에는 늘 '직접 입력'과 '나중에'. */
const BX_MODS = [
  ['report', '아침 요약', '아침 알림 하나로 오늘 할 일 한눈에', 'sun'],
  ['routines', '루틴', '아침 준비·약 먹기를 단계마다 알람으로', 'loop'],
  ['tt', '시간표', '매주 반복되는 수업·학원·알바', 'school'],
  // 시험판 41(대표 아이디어 11/3 15:17 · 요청 23:38): 떠오른 것을 바로 적는 메모. 시간 · 행동 관리 쪽(아래 메뉴)
  ['memo', '메모', '떠오른 것을 바로 적어 두면 그날에 모여요', 'note'],
  ['med', '명상', '싱잉볼 소리로 시작과 끝을 알려 줘요', 'lotus']
];
let BXS = null;
if (!ICON.flag) ICON.flag = '<svg class="i" viewBox="0 0 24 24"><path d="M5 21V4h11l-2 4 2 4H5"/></svg>';
function bxModOn(k){ return bxStartMods()[k] !== false; }
function bxStartMods(){ const st = M && M.settings && M.settings.bxStart; return st && st.mods ? st.mods : {report: true, routines: true, tt: true, memo: true, med: true}; }
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
        '<div class="bxs-opt fixed">' + '<span class="bxs-ic">' + bxIconSpan('home', '') + '</span><span class="bxs-t"><span class="bxs-cn"><b>일정 · 캘린더</b><em>추천 기본 기능</em></span><small>말하면 날짜·시간을 알아서 넣어요. 휴대폰 캘린더 일정도 함께 볼 수 있어요</small></span>' + bxCheck(true) + '</div>' +
        BX_MODS.map(m => '<button type="button" class="bxs-opt" role="checkbox" aria-checked="' + !!BXS.sel[m[0]] + '" data-bxs-mod="' + m[0] + '"><span class="bxs-ic">' + bxIconSpan(m[3], '') + '</span><span class="bxs-t"><b>' + m[1] + '</b><small>' + m[2] + '</small></span>' + bxCheck(BXS.sel[m[0]]) + '</button>').join('') +
      '</div><div class="bxs-sp"></div>' +
      '<button type="button" class="btn primary bxs-go" data-bxs="next">다음 · ' + n + '개 선택</button>');
    return;
  }
  const keys = bxStartDock(), pos = k => { const i = keys.indexOf(k); return i < 0 ? '' : '아래 메뉴 ' + (i < Math.ceil(keys.length / 2) ? i + 1 : i + 2) + '번째'; };
  const card = (icon, name, where, text) => '<div class="bxs-card"><span class="bxs-ic">' + bxIconSpan(icon, '') + '</span><span class="bxs-t"><span class="bxs-cn"><b>' + name + '</b>' + (where ? '<em>' + where + '</em>' : '') + '</span><small>' + text + '</small></span></div>';
  const cards = [];
  if (BXS.sel.routines) cards.push(card('loop', '루틴', pos('routines'), '아침 준비·약 먹기처럼 반복하는 일을 단계로 나눠, 단계마다 알람으로 알려 주고 다 했는지 챙겨 줘요. 처음 들어가면 몇 가지만 물어볼게요.'));
  cards.push(card('home', '일정 · 캘린더', '오른쪽 아래 +', '“내일 3시 치과”처럼 말하거나 적으면 날짜·시간이 알아서 들어가요. 삼성 캘린더 같은 휴대폰 캘린더 일정도 함께 볼 수 있어요. 달력은 ' + (pos('month') || '⋯ 메뉴') + '.'));
  if (BXS.sel.report) cards.push(card('sun', '아침 요약', '', '매일 아침 알림 하나로 오늘 할 일을 보여 줘요. 처음엔 7:30, 아침 루틴을 만들면 그 시각에 맞춰요.'));
  if (BXS.sel.tt) cards.push(card('school', '시간표', pos('tt'), '“월수 10시 반 경영학원론”처럼 말하면 채워지고, 수업 전에 알려 줘요.'));
  if (BXS.sel.memo) cards.push(card('note', '메모', pos('memo'), '떠오른 것을 바로 적거나 말해 두면 그날에 쌓여요. 휴대폰 홈 화면 위젯의 ✎ 단추로도 바로 적어요.'));
  if (BXS.sel.med) cards.push(card('lotus', '명상', pos('med') || '⋯ 더보기', '시간을 고르면 싱잉볼 소리로 시작과 끝을 알려 줘요. 배경 소리도 고를 수 있어요.'));
  bxStartOverlay(
    '<div class="bxs-top">' + bxDots(2, 2) + '</div>' +
    '<h1 class="bxs-h">이렇게 도와드려요</h1><p class="bxs-p">고른 기능은 아래 메뉴와 ⋯ 더보기에 있어요. 설정할 게 있으면 그 기능에 처음 들어갈 때 물어볼게요.</p>' +
    '<div class="bxs-list">' + cards.join('') + '</div>' +
    '<div class="bxs-note">' + ICON.bell + '<span>알람이 처음 필요할 때 휴대폰 허락을 한 번 물어볼게요.</span></div><div class="bxs-sp"></div>' +
    // 아래 메뉴 미리 보기는 뺐다: 카드마다 '아래 메뉴 N번째'가 있고, 잘려 보여서 끝난 화면처럼 보였음(점검 11/1)
    '<div class="bxs-row"><button type="button" class="btn bxs-back" data-bxs="back">이전</button><button type="button" class="btn primary bxs-go" data-bxs="done">시작</button></div>');
}
// 아래 메뉴: 고른 시간 · 행동 관리 기능 + 오른쪽 끝 더보기(시험판 35). 명상 같은 그 밖의 기능은 ⋯ 더보기에
// 시험판 38: 아래 메뉴에 '더보기'를 두지 않는다(왼쪽 위 메뉴 단추)
function bxStartDock(){ return ['routines', 'month', 'tt', 'memo'].filter(k => k === 'month' || BXS.sel[k]); }
// 처음에는 아무것도 골라 두지 않는다. 미리 골라 두면 예시 화면처럼 보이고 고르지 않은 기능까지 켜졌다(대표 확인 11/2, D-10 보완)
function bxStartOpen(){ BXS = {step: 1, sel: (M.settings && M.settings.bxStart) ? Object.assign({memo: true}, bxStartMods()) : {report: false, routines: false, tt: false, memo: false, med: false}}; bxStartDraw(); }

/* 루틴 도우미: 질문 하나씩. 정리판(대표 결정 11/1): 질문은 둘 — 나가는 시각 → 넣을 단계.
   약은 단계 하나로(점심·저녁 약은 새 루틴 템플릿 '약 먹기'), 아침 일정은 첫 실행·'내가 쓸 기능'에서 이미 골랐으니 묻지 않는다 */
const BX_RH_Q = [
  {k: 'out', h: '아침에 보통\n몇 시에 나가요?', p: '나가는 시각에 맞춰 준비 루틴을 거꾸로 짜 드려요.', opts: [['07:30', '7:30'], ['08:00', '8:00'], ['08:30', '8:30'], ['09:00', '9:00']], none: '안 나가요', custom: '나가는 시각', def: '07:50'},
  {k: 'steps', h: '어떤 단계를\n넣을까요?', p: '넣을 단계를 골라 주세요. 시간과 순서는 나중에 루틴에서 고쳐요.'}
];
// 적은 순서가 곧 루틴 순서. 처음에는 아무것도 골라 두지 않는다(D-10 보완 11/2)
const BX_RH_STEPS = [['기상', 5, false], ['약 먹기', 2, false], ['씻기', 20, false], ['아침 먹기', 15, false], ['옷 입기', 10, false], ['짐 챙기기', 5, false]];
let BXR = null;
function bxRtHelpOpen(){ BXR = {q: 0, a: {}, cust: {}, st: BX_RH_STEPS.map((x, i) => ({k: 's' + i, name: x[0], min: x[1], on: x[2]})), add: false}; bxRtHelpDraw(); }
function bxRtHelpDraw(){
  if (BXR.q >= BX_RH_Q.length) { bxRtHelpResult(); return; }
  const Q = BX_RH_Q[BXR.q], cur = BXR.a[Q.k], isCust = cur === 'custom';
  const top = '<div class="bxs-top"><button type="button" class="bxs-back-i" data-bxr-nav="back" aria-label="뒤로">' + ICON.chevL + '</button><span class="bxs-tt">루틴 도우미</span><button type="button" class="bxs-skip" data-bxr-nav="skip">건너뛰기</button></div>' +
    '<div class="bxs-prog"><span style="width:' + Math.round((BXR.q + 1) / BX_RH_Q.length * 100) + '%"></span></div><span class="bxs-pn">' + (BXR.q + 1) + ' / ' + BX_RH_Q.length + '</span>' +
    '<h1 class="bxs-h big">' + esc(Q.h).replace('\n', '<br>') + '</h1><p class="bxs-p">' + Q.p + '</p>';
  if (Q.k === 'steps') {
    const n = BXR.st.filter(x => x.on).length;
    bxStartOverlay(top +
      '<div class="bxr-steps" role="group" aria-label="넣을 단계">' + BXR.st.map(x => '<button type="button" class="bxr-st' + (x.on ? ' on' : '') + '" role="checkbox" aria-checked="' + x.on + '" data-bxr-st="' + x.k + '">' + bxCheck(x.on) + '<b>' + esc(x.name) + '</b><small>' + x.min + '분</small></button>').join('') + '</div>' +
      (BXR.add ? '<div class="bxs-custbox bxr-addbox"><input type="text" id="bxr-add" maxlength="20" placeholder="예) 고양이 밥 주기" aria-label="더 넣을 단계"><button type="button" class="btn sm primary" data-bxr-addok="1">넣기</button></div>'
        : '<button type="button" class="bxs-cust" data-bxr-add="1">' + ICON.edit + '직접 입력</button>') +
      '<div class="bxs-sp"></div>' +
      '<button type="button" class="btn primary bxs-go" data-bxr-nav="next"' + (n ? '' : ' disabled') + '>만들기</button>');
    return;
  }
  const opt = o => '<button type="button" class="bxs-big' + (cur === o[0] ? ' on' : '') + '" aria-pressed="' + (cur === o[0]) + '" data-bxr="' + o[0] + '">' + o[1] + '</button>';
  bxStartOverlay(top +
    '<div class="bxs-grid' + (Q.wide ? ' wide' : '') + '">' + Q.opts.map(opt).join('') + '</div>' +
    '<button type="button" class="bxs-cust' + (isCust ? ' on' : '') + '" aria-pressed="' + isCust + '" data-bxr="custom">' + ICON.edit + '직접 입력</button>' +
    (isCust ? '<label class="bxs-custbox"><span>' + Q.custom + '</span><input type="time" id="bxr-time" value="' + (BXR.cust[Q.k] || Q.def) + '"></label>' : '') +
    '<div class="bxs-links"><button type="button" data-bxr="none"' + (cur === 'none' ? ' class="on"' : '') + '>' + Q.none + '</button><button type="button" data-bxr="later">나중에</button></div>' +
    '<div class="bxs-sp"></div>' +
    // 나가지 않거나 나중에 하면 단계 질문 없이 끝
    '<button type="button" class="btn primary bxs-go" data-bxr-nav="next"' + (cur ? '' : ' disabled') + '>' + (cur === 'none' ? '마치기' : '다음') + '</button>');
}
// 직접 입력한 단계: 짐 챙기기 앞(나가기 바로 전 단계는 짐 챙기기로 두려고), 골라진 채로
function bxRtHelpAdd(){
  const i = $('#bxr-add'), v = i ? i.value.trim().slice(0, 20) : '';
  if (!v) { BXR.add = false; bxRtHelpDraw(); return; }
  const x = {k: 'c' + Date.now().toString(36), name: v, min: 10, on: true}, at = BXR.st.findIndex(y => y.name === '짐 챙기기');
  if (at >= 0) BXR.st.splice(at, 0, x); else BXR.st.push(x);
  BXR.add = false; bxRtHelpDraw();
}
document.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target && ev.target.id === 'bxr-add') { ev.preventDefault(); bxRtHelpAdd(); } }, true);
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
    const steps = BXR.st.filter(x => x.on).map(x => [x.name, x.min]);
    if (outT && steps.length) made.push(bxMakeRoutine({name: '아침 준비', days: RT_WD, mode: 'arrive', target: outT, travel: 0, buffer: 0, every: 5, times: 6, steps}));
    saveSettings({bxRtHelp: {at: nowIso(), made}});
    BXR.made = made;
  }
  // 만든 루틴은 거꾸로 짠 시각표를 그대로 보여 준다(전체 흐름 와이어프레임 5)
  const rows = BXR.made.map(id => { const rt = getDoc(id); if (!rt) return ''; const p = rtPlan(rt);
    const tot = rt.steps.reduce((a, s) => a + (+s.min || 0), 0);
    const tl = p.rows.filter(r => r.kind !== 'wait').map(r => '<li class="' + (r.leave ? 'lv' : '') + '"><span class="bxs-tm">' + bxT(mm(r.at)) + '</span>' + (r.leave ? '<span class="bxs-flag" aria-hidden="true">' + ICON.flag + '</span>' : '<i aria-hidden="true"></i>') + '<span class="bxs-sn">' + esc(r.leave ? '출발' : r.name) + '</span>' + (r.leave ? '' : '<span class="bxs-sm">' + (+r.min || 0) + '분</span>') + '</li>').join('');
    return '<div class="bxs-res col"><div class="bxs-rh"><span class="bxs-t"><b>' + esc(rt.name) + '</b><small>' + esc(rtWhenText(rt) + ' · 단계 ' + rt.steps.length + '개' + (tot ? ' · ' + tot + '분' : '') + (rt.mode === 'arrive' ? ' · ' + bxT(mm(p.start)) + ' 시작' : '')) + '</small></span>' +
      '<span class="bx-togw"><span>알람</span><button type="button" class="tog" role="switch" aria-checked="' + (rt.on !== false) + '" aria-label="' + esc(rt.name) + ' 알람" data-bxr-tog="' + esc(id) + '"><i></i></button></span></div>' +
      '<ol class="bxs-tl">' + tl + '</ol></div>'; }).join('');
  const tpls = RT_TEMPLATES.filter(t => !['work', 'meds'].includes(t.key)).slice(0, 4).map(t => '<button type="button" class="bxs-chip" data-act="rt-tpl" data-key="' + t.key + '">+ ' + esc(t.name) + '</button>').join('');
  const first = BXR.made.map(getDoc).filter(Boolean).find(rt => rt.mode === 'arrive');
  const lead = first ? (() => { const p = rtPlan(first); return bxT(mm(p.leave)) + '에 나가려면 ' + bxT(mm(p.start)) + '에 시작해요.'; })() : '';
  bxStartOverlay(
    '<div class="bxs-top"><span class="bxs-tt">루틴 도우미</span></div>' +
    '<h1 class="bxs-h">' + (BXR.made.length ? '이렇게 만들어 뒀어요' : '언제든 다시 만들 수 있어요') + '</h1><p class="bxs-p">' + (BXR.made.length ? (lead ? lead + ' ' : '') + '루틴을 누르면 단계·시간을 고쳐요.' : '루틴 탭의 ‘+ 새 루틴’에서 템플릿을 고르거나 말로 만들 수 있어요.') + '</p>' +
    (rows ? '<div class="bxs-box">' + rows + '</div>' : '') +
    '<h2 class="bxs-h2">이런 루틴도 있어요</h2><div class="bxs-chips">' + tpls + '</div><p class="bxs-p small">누르면 바로 열리고, 시각만 고쳐 저장하면 돼요.</p>' +
    '<div class="bxs-sp"></div><button type="button" class="btn primary bxs-go" data-bxr-nav="close">' + (BXR.made.length && PERM_PENDING ? '알람 켜기' : '내 루틴') + '</button>');
}

/* ---------- 알람 허락 (전체 흐름 와이어프레임 6, 대표 결정 A: 처음 알람이 생길 때) ----------
   첫 실행에서 묻지 않고, 처음 알람이 생겼을 때 그 알람('내일 07:18')을 이유로 든다. 허락된 줄은 '허락됨'.
   휴대폰 설정에서 돌아오면(resume) 다시 확인해 줄을 고친다. 절전 예외는 '권장'(대표 결정 B).
   시험판 34: 삼성 휴대폰은 꼭 할 일(대표 지적 11/3: '절전 앱·깊은 절전 앱'에 들어가면 알람이 늦거나 안 울림) */
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
  const st = PERM.st || {}, d = PERM.at ? new Date(PERM.at) : null, sam = st.maker === 'samsung';
  const when = d ? relDay(ymd(d), M.today) + ' ' + bxT(d) : '';
  const rows = [
    ['notifications', '알림', '알람과 아침 일정을 알려 줘요'],
    ['exact', '정확한 알람', when ? bxT(d) + ' 알람이 늦게 울리지 않게' : '정한 시각에 늦지 않게'],
    ['fullScreen', '잠금 화면 알람', '화면이 꺼져 있어도 알람처럼 크게. 일정 내용은 안 보여요'],
    ['battery', '절전 예외', sam ? '‘절전 앱·깊은 절전 앱’에 들어가면 알람이 늦거나 안 울려요' : '절전 때문에 알람이 늦거나 빠지지 않게', !sam]
  ];
  const row = r => '<li class="bxp-row"><span class="bxs-t"><b>' + r[1] + (r[3] ? ' <small class="bxp-tag">권장</small>' : '') + '</b><small>' + r[2] + '</small></span>' +
    (st[r[0]] ? '<span class="bxp-ok">' + ICON.check + '허용됨</span>' : '<button type="button" class="btn sm" data-bxp="' + r[0] + '">' + (r[0] === 'battery' ? '설정 열기' : '허용') + '</button>') + '</li>';
  // 파란 단추는 아래 하나(점검 11/1: 파란 단추가 셋). 아직 허락 안 한 것 중 첫째, 다 되면 '다 됐어요'
  const need = rows.find(r => !r[3] && !st[r[0]]);
  bxStartOverlay(
    '<div class="bxs-top"><button type="button" class="bxs-back-i" data-bxp-nav="later" aria-label="닫기">' + ICON.chevL + '</button></div>' +
    '<span class="bxp-ic" aria-hidden="true">' + ICON.bell + '</span>' +
    '<h1 class="bxs-h">' + (when ? esc(when) + '에<br>울리려면 허락이 필요해요' : '알람이 울리려면<br>허락이 필요해요') + '</h1>' +
    '<p class="bxs-p">휴대폰은 허락한 앱만 정한 시각에 알람을 울려요. 한 번만 하면 돼요.</p>' +
    '<ul class="bxs-box bxp-list">' + rows.map(row).join('') + '</ul>' +
    (st.battery ? '' : '<p class="bxs-p small">절전 예외: ' + esc(window.BX_NAME) + ' 앱 정보가 열리면 ‘배터리’를 눌러 ‘제한 없음’을 골라요.' + (sam ? ' ‘제한 없음’인 앱은 삼성 자동 절전에서 빠져요.' : '') + '</p>') +
    '<div class="bxs-sp"></div>' +
    '<button type="button" class="btn bxs-test" data-bxp-nav="test"' + (st.notifications ? '' : ' disabled') + '>' + ICON.bell + '알람 테스트 · 10초 뒤</button>' +
    (need ? '<button type="button" class="btn primary bxs-go" data-bxp="' + need[0] + '">' + (need[0] === 'battery' ? need[1] : need[1] + ' 허용') + '</button>' : '<button type="button" class="btn primary bxs-go" data-bxp-nav="done">다 됐어요</button>') +
    // 다 허락하지 않아도 나갈 길: 알림만 허락했으면 '이대로 둘게요', 알림도 안 했으면 '나중에'
    (need ? '<button type="button" class="bxp-later" data-bxp-nav="later">' + (st.notifications ? '이대로 둘게요' : '나중에 · 그동안은 알람이 울리지 않아요') + '</button>' : ''));
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
  // 시간표에 처음 들어가면(수업이 하나도 없을 때) 시간표 도우미
  if (S.view === 'tt' && typeof BXT !== 'undefined' && !BXT && !M.settings.bxTtHelp && bxModOn('tt') && !ttList().length) setTimeout(() => { if (!SH && !BXT && S.view === 'tt' && !document.getElementById('bx-start')) bxTtHelpOpen(); }, 250);
}
// 홈 '오늘 할 일' 맨 위 안내 카드
function bxRtNudgeHtml(){
  if (!window.BX_APP || !M.settings || M.settings.bxRtHelp || bxStartMods().routines === false || bxRtUserCount() || S.homeDay) return '';
  return '<div class="bx-nudge"><span class="bxs-ic">' + bxIconSpan('sun', '') + '</span><span class="bxs-t"><b>아침 루틴, 30초면 만들어요</b><small>나가는 시각만 고르면 준비 단계를 거꾸로 짜 드려요</small><span class="bx-nudge-go"><button type="button" class="btn sm primary" data-act="bx-rt-help">만들기</button></span></span><button type="button" class="icon-btn bx-nudge-x" data-act="bx-rt-help-x" aria-label="안내 닫기">' + ICON.close + '</button></div>';
}
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const t = ev.target.closest('[data-bxs],[data-bxs-mod],[data-bxr],[data-bxr-nav],[data-bxr-tog],[data-bxr-st],[data-bxr-add],[data-bxr-addok],[data-act="bx-rt-help"],[data-act="bx-rt-help-x"],[data-act="bx-start-again"]');
  if (!t) return;
  if (t.dataset.act === 'rt-tpl') return;
  ev.preventDefault(); ev.stopPropagation();
  const act = t.dataset.act;
  if (act === 'bx-rt-help') { bxRtHelpOpen(); return; }
  if (act === 'bx-rt-help-x') { saveSettings({bxRtHelp: {at: nowIso(), skipped: true}}); toast('루틴 탭의 ‘+ 새 루틴’에서 언제든 만들 수 있어요'); return; }
  if (act === 'bx-start-again') { closeSheet(); bxStartOpen(); return; }
  if (t.dataset.bxsMod) { BXS.sel[t.dataset.bxsMod] = !BXS.sel[t.dataset.bxsMod]; bxStartDraw(); return; }
  const s = t.dataset.bxs;
  // 건너뛰면 고른 것이 없으니 '일정·캘린더'만. 나머지는 ⋯ 메뉴 › 내가 쓸 기능에서 켠다
  if (s === 'skip') { saveSettings({bxStart: {at: nowIso(), skipped: true, mods: {report: false, routines: false, tt: false, memo: false, med: false}}, bxDock: ['month'], bxDockMig: 1, bxDockMemo: 1, bxReport: Object.assign({}, (M.settings && M.settings.bxReport) || {}, {on: false})}); bxStartClose(); return; }
  if (s === 'next') { BXS.step = 2; bxStartDraw(); return; }
  if (s === 'back') { BXS.step = 1; bxStartDraw(); return; }
  if (s === 'done') {
    const sel = BXS.sel, dock = bxStartDock();
    saveSettings({bxStart: {at: nowIso(), mods: sel}, bxDock: dock, bxDockMig: 1, bxDockMemo: 1, bxReport: Object.assign({}, (M.settings && M.settings.bxReport) || {}, {on: !!sel.report})});
    bxStartClose(); return;
  }
  // 루틴 도우미
  if (t.dataset.bxr) {
    const Q = BX_RH_Q[BXR.q], v = t.dataset.bxr;
    const ti = $('#bxr-time'); if (ti && ti.value) BXR.cust[Q.k] = ti.value;
    if (v === 'later') { BXR.a[Q.k] = 'later'; BXR.q = Q.k === 'out' ? BX_RH_Q.length : BXR.q + 1; bxRtHelpDraw(); return; }
    BXR.a[Q.k] = v; bxRtHelpDraw();
    if (v === 'custom') setTimeout(() => { const i = $('#bxr-time'); if (i) i.focus(); }, 50);
    return;
  }
  const nav = t.dataset.bxrNav;
  if (nav) {
    const Q = BX_RH_Q[BXR.q]; const ti = $('#bxr-time'); if (Q && ti && ti.value) BXR.cust[Q.k] = ti.value;
    if (nav === 'skip') { saveSettings({bxRtHelp: {at: nowIso(), skipped: true}}); bxStartClose(); BXR = null; return; }
    if (nav === 'back') { if (BXR.q > 0 && !BXR.made) { BXR.q--; bxRtHelpDraw(); } else { bxStartClose(); BXR = null; } return; }
    if (nav === 'next') { if (Q && Q.k === 'out' && (BXR.a.out === 'none')) BXR.q = BX_RH_Q.length; else BXR.q++; bxRtHelpDraw(); return; }
    if (nav === 'close') { BXR = null; bxStartClose(); if (S.view !== 'routines' && bxModOn('routines')) go('routines'); return; }
  }
  if (t.dataset.bxrTog) { const id = t.dataset.bxrTog, d = getDoc(id); if (d) { patchDoc(id, {on: d.on === false}); M = buildModel(); bxRtHelpResult(); } return; }
  if (t.dataset.bxrSt) { const x = BXR.st.find(y => y.k === t.dataset.bxrSt); if (x) x.on = !x.on; bxRtHelpDraw(); return; }
  if (t.dataset.bxrAdd) { BXR.add = true; bxRtHelpDraw(); setTimeout(() => { const i = $('#bxr-add'); if (i) i.focus(); }, 50); return; }
  if (t.dataset.bxrAddok) { bxRtHelpAdd(); return; }
}, true);
// 도우미 결과 화면에서 템플릿을 누르면 도우미를 닫고 루틴 창을 연다
document.addEventListener('click', ev => {
  const t = ev.target.closest && ev.target.closest('#bx-start [data-act="rt-tpl"]'); if (!t) return;
  const el = document.getElementById('bx-start'); if (el) el.remove(); document.documentElement.classList.remove('locked'); BXR = null;
}, true);
