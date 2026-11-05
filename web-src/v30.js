/* ---------- 시험판 30 (2026-11-02) ----------
   1) 누르면 나오는 칸은 누른 자리에서 이어진다(대표 지적 11/2, 제품 원칙 규칙 12, 수정·보완 목록 20)
      - 켜기를 누르면 그 바로 아래 오른쪽에 시각. 시각은 숫자를 치지 않고 휴대폰 시계 창으로 고르고, 24시간으로 보인다
      - '직접 입력'은 그 칩 자리에서 입력칸이 된다(규칙 9)
      - 새 일정 창의 칩을 누르면 칩은 제자리에 있고, 고르는 칸은 칩 바로 위에 열린다(아래쪽에 붙은 창이라 아래로 열면 칩이 밀려 올라감)
   2) 주간은 일정 없는 날을 한 줄로(대표 11/2 넣기로). 월간은 그대로 두고 날짜 창 아래만 '이날 일정 넣기' 한 줄(대표 결정 11/2)
   3) 일정 넣는 입구 하나로·마이크에 '말하기'(목록 19)
   화면 구조를 바꾸는 부분은 scripts/patches-v30.mjs */

// 시각 칩: 보이는 글자는 24시간(07:30), 누르면 그 위에 투명하게 놓인 시각 칸이 휴대폰 시계 창을 연다
function bxTimeChip(id, v, aria, cls){
  return '<label class="bx-tchip' + (cls ? ' ' + cls : '') + '"><span class="bx-tchip-v tnum" aria-hidden="true">' + (isHM(v) ? bxT(v) : '--:--') + '</span>' +
    '<input type="time" id="' + id + '" step="300" value="' + esc(isHM(v) ? v : '') + '" aria-label="' + esc(aria || '시각') + '"></label>';
}
document.addEventListener('input', ev => {
  const c = ev.target && ev.target.closest && ev.target.closest('.bx-tchip'); if (!c) return;
  const v = c.querySelector('.bx-tchip-v'); if (v) v.textContent = isHM(ev.target.value) ? bxT(ev.target.value) : '--:--';
}, true);
document.addEventListener('change', ev => {
  const c = ev.target && ev.target.closest && ev.target.closest('.bx-tchip'); if (!c) return;
  const v = c.querySelector('.bx-tchip-v'); if (v) v.textContent = isHM(ev.target.value) ? bxT(ev.target.value) : '--:--';
}, true);

// 누른 단추를 제자리에: 창 안에서 칩·켜기를 누른 뒤 창이 다시 그려져 그 단추가 밀려나면, 창 안 스크롤로 되돌린다
function bxKeyOf(el){
  const a = [];
  for (const at of el.attributes) if (/^(data-|role$|aria-label$)/.test(at.name) && !/^data-(bxt)$/.test(at.name)) a.push(at.name + '=' + at.value);
  return el.tagName + '|' + a.sort().join('|');
}
function bxFindKey(root, key){
  const tag = key.split('|')[0];
  return Array.from(root.querySelectorAll(tag)).find(e => bxKeyOf(e) === key) || null;
}
let bxHold = null;
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const el = ev.target.closest('#sheet-root .sheet-b [aria-expanded],#sheet-root .sheet-b [aria-pressed],#sheet-root .sheet-b [role="tab"],#sheet-root .sheet-b summary');
  if (!el) { bxHold = null; return; }
  bxHold = {key: bxKeyOf(el), top: el.getBoundingClientRect().top};
  const h = bxHold;
  setTimeout(() => requestAnimationFrame(() => {
    if (bxHold !== h) return;
    const body = document.querySelector('#sheet-root .sheet-b'); if (!body) return;
    const now = bxFindKey(body, h.key); if (!now) return;
    const d = now.getBoundingClientRect().top - h.top;
    if (Math.abs(d) > 2 && body.scrollHeight > body.clientHeight + 2) body.scrollTop += d;
  }), 0);
}, true);

// 모양 규칙은 web-src/app.css로 옮김(시험판 54 덧칠 정리)

/* 홈 '오늘 할 일'을 한 목록, 시각 순서로(빈 공간 대표 11/2 · 문제점 점검 경험 1: 루틴·일정·수업 세 칸이라 10:30 수업이 맨 아래).
   칸 제목(루틴·일정·수업)과 접기를 빼고 시각 순서대로 한 목록에 둔다. 지난 일정(확인 필요)은 맨 위 그대로.
   각 줄은 원래 모양·누르는 동작 그대로 옮기기만 한다 */
let bxPastOpen = false;
// 줄에 '지금'·'다음' 꼬리표(일정 줄은 제목 아래, 수업 줄은 장소 줄 앞)
function bxTag(el, txt){
  if (el.classList.contains('rt-card')) return;
  // 목록 줄 C: 둘째 줄이 비어 있을 때만 그 자리에 남은 시간('1시간 5분 뒤')
  if (el.classList.contains('rowc')) {
    const body = el.querySelector('.row-body'), has = el.querySelector('.rc-sub');
    if (!body || (has && has.textContent.trim())) return;
    let meta = body.querySelector(':scope > .row-meta'); if (!meta) { meta = document.createElement('span'); meta.className = 'row-meta'; body.appendChild(meta); }
    const sub = has || document.createElement('span'); sub.className = 'meta rc-sub nx'; sub.textContent = String(txt).replace(/^다음 · /, '');
    if (!has) meta.prepend(sub);
    return;
  }
  const tag = document.createElement('span'); tag.className = 'meta bx-next-tag'; tag.textContent = txt;
  const meta = el.querySelector('.row-meta, .tt-meta');
  if (meta) meta.prepend(tag); else { const t = el.querySelector('.row-title, .row-body > :first-child'); if (t) t.after(tag); }
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-act="bx-past"]'); if (!b || !window.BX_APP) return;
  ev.preventDefault(); ev.stopPropagation();
  bxPastOpen = !bxPastOpen;
  b.setAttribute('aria-expanded', String(bxPastOpen));
  const box = b.nextElementSibling; if (box && box.classList.contains('bx-past')) box.hidden = !bxPastOpen;
}, true);
// 시간 미지정 일정 상자: '오늘 할 일' 바로 아래(오늘의 메모 위). 줄은 같은 목록 줄 부품 그대로, 이 목록은 시각 칸 없이 [종류 아이콘 | 이름 | 체크].
// 안 한 것이 먼저, 한 것은 아래(가로줄 + 흐리게). 없으면 상자도 없다
function bxUntimedBox(list){
  const card = document.getElementById('tcard2'); if (!card || !list.length) return;
  const sec = document.createElement('section'); sec.className = 'tcard bx-ut'; sec.id = 'tcard-ut'; sec.setAttribute('aria-labelledby', 'h-ut');
  sec.innerHTML = '<div class="tc-body"><div class="bx-ut-h"><h2 id="h-ut">시간 미지정 일정</h2><span class="n">' + list.length + '</span></div><div class="list bx-ut-list"></div></div>';
  const box = sec.querySelector('.bx-ut-list');
  // 시험판 59(대표 11/5 20:28): 줄은 다른 상자와 같은 칸 [종류 아이콘 | 시각 칸 | 이름]. 시각 칸에는 '시간 미지정'
  list.slice().sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0) || a.i - b.i).forEach(e => {
    const tm = e.el.querySelector('.row-time'); if (tm) tm.innerHTML = '<b class="bx-utl">시간 미지정</b>';
    box.append(e.el);
  });
  card.after(sec);
}
function bxTlDoneText(ents, ut){
  if (!ents.length && ut.length) return '시간을 정한 일정이 없어요';
  return ut.some(e => !e.done) ? '시간을 정한 남은 일은 없어요' : '오늘 남은 일은 없어요';
}
function bxTimeline(){
  if (!window.BX_APP || S.view !== 'today') return;
  const body = document.querySelector('#tcard2 .tc-body'); if (!body || body.querySelector('.bx-tl')) return;
  const rtSec = body.querySelector(':scope > .rt-sec'), itSub = body.querySelector(':scope > .it-sub'), ttSub = body.querySelector(':scope > .bx-tts');
  if (!rtSec && !itSub && !ttSub) return;
  // 시험판 51: 화면 글자가 '오후 3:00'이어도 읽는다(bxHMAll)
  const hm = t => { const a = bxHMAll(t); return a.length ? a[0] : null; };
  const ents = [];
  let lateWrap = null, nowLine = null;
  const hmAll = t => bxHMAll(t);
  // 시험판 56: 루틴은 목록 줄(home.js bxRtRowHtml). 시작 · 끝(분)은 줄에 적혀 있다
  if (rtSec) rtSec.querySelectorAll(':scope > .row[data-rid]').forEach((el, i) => { const t = +el.dataset.t, te = +el.dataset.te; ents.push({el, t: isNaN(t) ? null : t, te: isNaN(te) ? t : te, k: 2, i}); });
  if (itSub) {
    const late = itSub.querySelector('#late-block'), ll = late && late.nextElementSibling && late.nextElementSibling.matches('.list') ? late.nextElementSibling : null;
    if (late) late.remove();
    itSub.querySelectorAll('.list > .row').forEach((el, i) => {
      const b = el.querySelector('.row-time b'), id = (el.querySelector('[data-id]') || {}).dataset ? el.querySelector('[data-id]').dataset.id : '';
      const it = id ? M.items.find(x => x.id === id) : null;
      let t = b && /종일/.test(b.textContent) ? -1 : hm(b && b.textContent), te = it && isHM(it.end) ? toMin(it.end) : t;
      // 여러 날 일정(시험판 39): 시간이 있으면 첫날은 그 시각 자리(그날 끝까지 '지금'), 다른 날은 맨 위 줄
      if (it && typeof bxSpan === 'function' && bxSpan(it)) { if (it.start && it.date === homeViewDate()) te = 24 * 60; else t = te = -1; }
      // 시간 미지정 일정(시험판 58, 대표 11/4 22:25 · 22:46 ② '오늘 할 일 아래 따로 상자'): 그날 하루 일정 가운데 시각이 없는 것. 여러 날 일정 · 어제까지 못 한 일은 그대로
      const ut = !!(it && !it.start && !(typeof bxSpan === 'function' && bxSpan(it)) && !(ll && ll.contains(el)));
      ents.push({el, t, te, k: 0, i, late: !!(ll && ll.contains(el)), ut, done: !!(it && it.done)});
    });
    nowLine = itSub.querySelector('.now-line');
  }
  if (ttSub) ttSub.querySelectorAll('.row').forEach((el, i) => { const ts = hmAll((el.querySelector('.row-main') || el).textContent); ents.push({el, t: ts[0] == null ? null : ts[0], te: ts[1] == null ? ts[0] : ts[1], k: 1, i}); });
  ents.sort((a, b) => (a.t == null ? -1 : a.t) - (b.t == null ? -1 : b.t) || a.k - b.k || a.i - b.i);
  const utEnts = ents.filter(e => e.ut);
  for (let q = ents.length - 1; q >= 0; q--) if (ents[q].ut) ents.splice(q, 1);
  // rt-sec: 루틴 카드의 접기·펼치기 모양과 누르기를 그대로 쓰려고
  const tl = document.createElement('div'); tl.className = 'list bx-tl rt-sec';
  const first = rtSec || itSub || ttSub; first.before(tl);
  const nowMin = M.now.getHours() * 60 + M.now.getMinutes(), today = !S.homeDay;
  // 다음 일정 표시는 여기서 다시 단다(루틴·수업도 다음이 될 수 있어서)
  tl.ownerDocument.querySelectorAll('#tcard2 .bx-next').forEach(r => r.classList.remove('bx-next'));
  tl.ownerDocument.querySelectorAll('#tcard2 .bx-next-tag').forEach(t => t.remove());
  if (!today) {
    ents.forEach(e => tl.append(e.el)); if (nowLine) nowLine.remove();
    if (!ents.length && utEnts.length) { const p = document.createElement('p'); p.className = 'bx-tl-done'; p.textContent = '시간을 정한 일정이 없어요'; tl.append(p); }
  }
  else {
    /* 오늘은 '지금'부터(대표 요청 11/2: 들어온 시각의 일정과 다음 일정을 먼저). 끝난 일과 어제까지 못 한 일은 맨 위 한 줄로 접는다.
       확인이 필요한 지난 일은 맨 위 '확인 필요' 숫자에서도 본다 */
    const past = [], allday = [], cur = [], fut = [];
    ents.forEach(e => {
      // 쉬는 루틴(오늘 쉬기 · 공휴일)은 그 시각 자리에 흐리게 두고 '지금'·'다음'은 달지 않는다(시험판 31)
      e.off = e.el.classList.contains('bx-off');
      if (e.late) past.push(e);
      else if (e.t == null || e.t < 0) allday.push(e);
      else if (e.te < nowMin) past.push(e);
      else if (e.t <= nowMin && !e.off) cur.push(e);
      else fut.push(e);
    });
    if (past.length) {
      const tog = document.createElement('button'); tog.type = 'button'; tog.className = 'bx-past-tog'; tog.dataset.act = 'bx-past';
      tog.setAttribute('aria-expanded', String(bxPastOpen));
      tog.innerHTML = '<span class="bx-pt-i" aria-hidden="true"><svg class="i" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></span><span>지난 일 ' + past.length + '개</span>';
      const box = document.createElement('div'); box.className = 'bx-past'; box.hidden = !bxPastOpen;
      // 어제까지 못 한 일이 먼저, 그다음 오늘 지난 일을 시각 순서로
      past.sort((a, b) => (b.late ? 1 : 0) - (a.late ? 1 : 0)).forEach(e => box.append(e.el));
      tl.append(tog, box);
    }
    allday.forEach(e => tl.append(e.el));
    if (nowLine) tl.append(nowLine);
    cur.forEach(e => { e.el.classList.add('bx-now'); bxTag(e.el, '지금'); tl.append(e.el); });
    let tagged = false;
    fut.forEach(e => {
      if (!tagged && !e.off) {
        tagged = true;
        e.el.classList.add(cur.length ? 'bx-next-soft' : 'bx-next');
        bxTag(e.el, '다음 · ' + untilText((e.t - nowMin) * 60000));
      }
      tl.append(e.el);
    });
    // 시간 미지정 일정은 아래 상자에 있으니, 남은 것이 그것뿐이면 '시간을 정한 남은 일은 없어요'
    if (!cur.length && !tagged) { const p = document.createElement('p'); p.className = 'bx-tl-done'; p.textContent = bxTlDoneText(ents, utEnts); tl.append(p); }
  }
  bxUntimedBox(utEnts);
  [rtSec, itSub, ttSub].forEach(x => { if (!x) return; x.querySelectorAll(':scope > :not(.sec-h):not(.list):not(.grp-h)').forEach(o => tl.after(o)); x.remove(); });
  // 칸별 접기는 쓰지 않는다(접어 둔 것이 있었으면 풀어 보인다)
  document.documentElement.classList.remove('bx-f-rt', 'bx-f-today', 'bx-f-tt');
}
// 모양 규칙은 web-src/app.css로 옮김(시험판 54 덧칠 정리)

/* 새 일정·일정 고치기 창: 작게 시작한다(대표 결정 11/2 밤: A2는 지금 모습이 좋음, 여백은 조금 줄이기).
   칩을 눌러 칸이 열리면 창이 커지는데, 한 번에 튀지 않고 부드럽게 커져 눈이 누른 칩을 따라가게 한다 */
// 모양 규칙은 web-src/app.css로 옮김(시험판 54 덧칠 정리)
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const chip = ev.target.closest('#sheet-root .bx-esheet .fchip, #sheet-root .bx-esheet [data-bx-remsw], #sheet-root .bx-esheet [data-bx-rem]'); if (!chip) return;
  const sh = chip.closest('.sheet'), h0 = sh.getBoundingClientRect().height;
  requestAnimationFrame(() => {
    const h1 = sh.scrollHeight > 0 ? Math.min(sh.getBoundingClientRect().height, window.innerHeight * 0.92) : 0;
    if (!h1 || Math.abs(h1 - h0) < 2) return;
    sh.style.height = h0 + 'px'; void sh.offsetHeight;
    sh.classList.add('bx-grow'); sh.style.height = h1 + 'px';
    const done = () => { sh.classList.remove('bx-grow'); sh.style.height = ''; };
    sh.addEventListener('transitionend', done, {once: true}); setTimeout(done, 400);
  });
}, true);

/* 일정 알림(대표 결정 11/2 밤: '알림 없음'을 고르면 아래 선택지가 없는 게 맞다, 켜기·끄기가 보여야 한다).
   칩: 꺼져 있으면 사선 그은 종 + '알림 없음', 켜져 있으면 종 + 고른 값. 칸 맨 위에 알림 스위치, 켰을 때만 그 아래에
   셋(시간을 정한 일정: 정시 · 10분 전 · 1시간 전 / 시간 없는 일정: 당일 오전 9시 · 전날 오후 9시) + 직접 입력(여러 개·정한 시각) */
const BX_BELL_OFF = '<svg class="i" viewBox="0 0 24 24"><path d="M10.3 20a1.9 1.9 0 0 0 3.4 0"/><path d="M6 8.5a6 6 0 0 1 9.6-4.8M18 8.5c0 5 1.6 6.9 2.5 7.5H7"/><path d="M4 16c.9-.6 2-2.4 2-6.5"/><path d="M3 3l18 18"/></svg>';
const BX_REM_Q = {t: [['0', '정시'], ['10', '10분 전'], ['60', '1시간 전']], d: [['d0@09:00', '당일 오전 9시'], ['d1@21:00', '전날 오후 9시']]};
/* 켜고 끄는 칸은 앱 어디서나 같은 스위치 하나(대표 의견 11/2 밤 'ON / OFF가 더 직관적'을 설정·명상에도).
   attr에는 누르면 될 값('1' 켜기 / '0' 끄기)이 들어가서, 예전 '끄기 | 켜기' 단추의 처리기를 그대로 쓴다 */
function bxSwitch(attr, on, aria){
  return '<button type="button" class="tog" role="switch" aria-checked="' + !!on + '" aria-label="' + esc(aria) + '" ' + attr + '="' + (on ? '0' : '1') + '"><i></i></button>';
}
// 설정의 기본값(설정 › 알림 › 일정 알림). 켜면 이 값이 들어간다
function bxRemDef(timed){
  return timed ? (remList(remNorm(M.settings.defaultRemind, true, F && F.start))[0] || '10') : (remList(remNorm(M.settings.defaultRemindDay, false))[0] || 'd0@09:00');
}
function bxRemQuick(){
  const cur = remList(fRem()), opts = F.timed ? BX_REM_Q.t : BX_REM_Q.d, on = cur.length > 0 || !!F.remAdv;
  const one = cur.length === 1 ? cur[0] : null, std = !!one && opts.some(o => o[0] === one), cust = F.remAdv || (on && !std);
  // 시험판 37(대표 지적 11/3 18:12): 꺼져 있어도 켜면 무엇이 들어가는지(기본값) 보여 준다. 시간 없는 일정은 시간을 정하면 들어갈 값도
  const defNote = on ? '' : '<p class="p small bx-rem-def">켜면 <b>' + esc(remLabel(bxRemDef(F.timed))) + '</b>' +
    (F.timed ? '' : ' · 시간을 정하면 <b>' + esc(remLabel(bxRemDef(true))) + '</b>') + ' · 기본값은 설정 › 알림에서</p>';
  return '<div class="bx-swrow"><span>알림</span><button type="button" class="tog" role="switch" aria-checked="' + on + '" aria-label="알림" data-bx-remsw="1"><i></i></button></div>' + defNote +
    (on ? '<div class="picks bx-rem-q" role="group" aria-label="알림">' + opts.map(o => '<button type="button" class="pick" data-bx-rem="' + o[0] + '" aria-pressed="' + (!cust && one === o[0]) + '">' + o[1] + '</button>').join('') +
      '<button type="button" class="pick" data-bx-rem="adv" aria-pressed="' + cust + '">' + (cust && cur.length ? esc(cur.length > 1 ? '알림 ' + cur.length + '개' : remLabel(cur[0])) : '직접 입력') + '</button></div>' : '');
}
document.addEventListener('click', ev => {
  const sw = ev.target.closest && ev.target.closest('[data-bx-remsw]');
  const b = !sw && ev.target.closest && ev.target.closest('[data-bx-rem]');
  if ((!sw && !b) || !window.BX_APP || !F) return;
  ev.preventDefault(); ev.stopPropagation();
  if (sw) {
    const on = remList(fRem()).length > 0 || F.remAdv;
    if (on) { F.remLast = fRem(); F.remAdv = false; setFRem(''); }
    else {
      // 켜면 지난번 값, 처음엔 설정의 기본값(시간 있는 일정 10분 전, 시간 없는 일정 당일 오전 9시)
      const def = F.timed ? (remList(remNorm(M.settings.defaultRemind, true, F.start))[0] || '10') : (remList(remNorm(M.settings.defaultRemindDay, false))[0] || 'd0@09:00');
      setFRem(F.remLast && remList(F.remLast).length ? F.remLast : def);
    }
  } else {
    const v = b.dataset.bxRem;
    if (v === 'adv') F.remAdv = true; else { F.remAdv = false; setFRem(v); }
  }
  drawFRem();
}, true);
// 모양 규칙은 web-src/app.css로 옮김(시험판 54 덧칠 정리)
