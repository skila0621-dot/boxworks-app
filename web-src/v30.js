/* ---------- 시험판 30 (2026-11-02) ----------
   1) 누르면 나오는 칸은 누른 자리에서 이어진다(대표 지적 11/2, 제품 원칙 규칙 12, 수정·보완 목록 20)
      - 켜기를 누르면 그 바로 아래 오른쪽에 시각. 시각은 숫자를 치지 않고 휴대폰 시계 창으로 고르고, 24시간으로 보인다
      - '직접 입력'은 그 칩 자리에서 입력칸이 된다(규칙 9)
      - 새 일정 창의 칩을 누르면 칩은 제자리에 있고, 고르는 칸은 칩 바로 위에 열린다(아래쪽에 붙은 창이라 아래로 열면 칩이 밀려 올라감)
   2) 빈 공간 줄이기(수정·보완 목록 18): 주간은 일정 없는 날을 한 줄로, 월간은 칸을 줄이고 아래에 고른 날 목록
   3) 일정 넣는 입구 하나로·마이크에 '말하기'(목록 19)
   화면 구조를 바꾸는 부분은 scripts/patches-v30.mjs */

// 시각 칩: 보이는 글자는 24시간(07:30), 누르면 그 위에 투명하게 놓인 시각 칸이 휴대폰 시계 창을 연다
function bxTimeChip(id, v, aria, cls){
  return '<label class="bx-tchip' + (cls ? ' ' + cls : '') + '"><span class="bx-tchip-v tnum" aria-hidden="true">' + (isHM(v) ? v : '--:--') + '</span>' +
    '<input type="time" id="' + id + '" step="300" value="' + esc(isHM(v) ? v : '') + '" aria-label="' + esc(aria || '시각') + '"></label>';
}
document.addEventListener('input', ev => {
  const c = ev.target && ev.target.closest && ev.target.closest('.bx-tchip'); if (!c) return;
  const v = c.querySelector('.bx-tchip-v'); if (v) v.textContent = isHM(ev.target.value) ? ev.target.value : '--:--';
}, true);
document.addEventListener('change', ev => {
  const c = ev.target && ev.target.closest && ev.target.closest('.bx-tchip'); if (!c) return;
  const v = c.querySelector('.bx-tchip-v'); if (v) v.textContent = isHM(ev.target.value) ? ev.target.value : '--:--';
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

(function bxV30Style(){
  if (!window.BX_APP) return;
  const st = document.createElement('style');
  st.textContent = [
    // 시각 칩(규칙 12): 칸처럼 보이지 않고 누르는 값처럼
    '.bx-tchip{position:relative;display:inline-flex;align-items:center;justify-content:center;flex:none;min-width:96px;height:44px;padding:0 16px;border-radius:12px;background:var(--sunk);border:1.5px solid var(--line);color:var(--ink);font-size:18px;font-weight:800;cursor:pointer}',
    '.bx-tchip:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 22%,transparent)}',
    '.bx-tchip input{position:absolute;inset:0;width:100%;height:100%;margin:0;padding:0;border:0;opacity:0;cursor:pointer;font-size:16px;-webkit-appearance:none;appearance:none;background:transparent}',
    // 설정: 켜기를 누른 줄 바로 아래, 오른쪽 같은 줄에 나오는 칸. 왼쪽에는 설명 한 줄
    '.bx-app .bx-setsub{display:flex;align-items:center;justify-content:flex-end;gap:12px;margin:-2px 0 12px}',
    '.bx-app .bx-setsub > .p.small{flex:1;min-width:0;margin:0;color:var(--ink-3);line-height:1.45;word-break:keep-all}',
    '.bx-app .bx-setsub-c{display:inline-flex;align-items:center;gap:8px;flex:none}',
    // '직접 입력'이 그 자리에서 입력칸이 된다(규칙 9·12)
    '.bx-app .bx-cpick{display:inline-flex;align-items:center;justify-content:center;gap:4px;height:40px;padding:0 12px;border-radius:999px;background:var(--accent);color:var(--accent-ink);font-size:14.5px;font-weight:700}',
    '.bx-app .bx-cpick input{width:3.2em;height:30px;border:0;border-radius:8px;background:color-mix(in srgb,var(--accent-ink) 22%,transparent);color:inherit;font:inherit;font-size:16px;font-weight:800;text-align:center;padding:0;-moz-appearance:textfield}',
    '.bx-app .bx-cpick input::-webkit-outer-spin-button,.bx-app .bx-cpick input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}',
    '.bx-app .tt-pills .bx-cpick{flex:1.3;min-width:0;height:42px;border-radius:12px;padding:0 6px;font-size:13px}',
    '.bx-app .tt-pills .bx-cpick input{width:2.6em}',
    // '없음'은 칩 대신 아래 글자 단추(규칙 11)
    '.bx-app .bx-none{display:inline-flex;align-items:center;gap:6px;margin-top:8px;padding:6px 2px;border:0;background:none;color:var(--ink-3);font:inherit;font-size:13.5px;font-weight:700}',
    '.bx-app .bx-none[aria-pressed="true"]{color:var(--accent)}',
    '.bx-app .bx-none .i{width:16px;height:16px}',
    // 새 일정 창: 고르는 칸은 칩 위에(칩은 제자리)
    '.bx-app #f-panel{margin:0 0 -6px}',
    // 주간: 일정 없는 날은 한 줄
    '.bx-app .day-g.bx-wk-empty{padding-top:0;padding-bottom:0}',
    '.bx-app .day-g.bx-wk-empty .empty{display:none}',
    '.bx-app .day-g.bx-wk-empty .sec-h{min-height:44px;margin:0;border-bottom:1px solid var(--line)}',
    '.bx-app .day-g.bx-wk-empty .day-d{font-size:17px}',
    '.bx-app .bx-wk-none{margin-left:10px;color:var(--ink-3);font-size:13.5px;font-weight:600}',
    '.bx-app .screen.week{row-gap:12px}',
    '.bx-app .day-g.bx-wk-empty + .day-g.bx-wk-empty{margin-top:-12px}',
    '.bx-app .sec-link.add{width:40px;height:40px;padding:0;justify-content:center;border-radius:12px}',
    '.bx-app .sec-link.add .i{width:20px;height:20px}',
    // 월간: 칸을 줄이고, 아래에 고른 날 목록
    '@media (max-width:719px){.bx-app .cell{min-height:58px;padding:3px 1px 4px}}',
    '.bx-app .month-wrap{gap:14px}',
    '.bx-app #agenda > .sec-h{min-height:44px;margin-bottom:2px}',
    '.bx-app #agenda > .sec-h h2{font-size:17px}',
    '.bx-app #agenda .empty{margin:6px 0 0;color:var(--ink-3)}',
    // 마이크에 '말하기' 글자
    '.bx-app .bx-mic{width:auto;min-width:44px;padding:0 14px 0 11px;gap:5px;font:inherit;font-size:14px;font-weight:800;white-space:nowrap}',
    '.bx-app .bx-mic svg{flex:none}'
  ].join('');
  (document.head || document.documentElement).appendChild(st);
})();

/* 홈 '오늘 할 일'을 한 목록, 시각 순서로(빈 공간 대표 11/2 · 문제점 점검 경험 1: 루틴·일정·수업 세 칸이라 10:30 수업이 맨 아래).
   칸 제목(루틴·일정·수업)과 접기를 빼고 시각 순서대로 한 목록에 둔다. 지난 일정(확인 필요)은 맨 위 그대로.
   각 줄은 원래 모양·누르는 동작 그대로 옮기기만 한다 */
function bxTimeline(){
  if (!window.BX_APP || S.view !== 'today') return;
  const body = document.querySelector('#tcard2 .tc-body'); if (!body || body.querySelector('.bx-tl')) return;
  const rtSec = body.querySelector(':scope > .rt-sec'), itSub = body.querySelector(':scope > .it-sub'), ttSub = body.querySelector(':scope > .bx-tts');
  if (!rtSec && !itSub && !ttSub) return;
  const hm = t => { const m = /(\d{1,2}):(\d{2})/.exec(t || ''); return m ? +m[1] * 60 + +m[2] : null; };
  const ents = [];
  let lateWrap = null, nowLine = null;
  if (rtSec) rtSec.querySelectorAll(':scope > .rt-card[data-rid]').forEach((el, i) => {
    const meta = el.querySelector('.rt-h .rt-meta'), m = /(\d{1,2}:\d{2})\s*[–~-]\s*(\d{1,2}:\d{2})/.exec(meta ? meta.textContent : '');
    if (m && !el.querySelector('.bx-tl-t')) {
      const s = document.createElement('span'); s.className = 'row-time bx-tl-t'; s.innerHTML = '<span class="bx-tl-s">' + m[1] + '</span><small>' + m[2] + '</small>';
      const ic = el.querySelector('.rt-h .bx-ic'); if (ic) ic.after(s); else el.querySelector('.rt-h').prepend(s);
      el.classList.add('bx-tl-rt');
    }
    ents.push({el, t: hm(meta && meta.textContent), k: 2, i});
  });
  if (itSub) {
    const late = itSub.querySelector('#late-block'), ll = late && late.nextElementSibling && late.nextElementSibling.matches('.list') ? late.nextElementSibling : null;
    if (late) { lateWrap = document.createElement('div'); lateWrap.className = 'bx-tl-late'; lateWrap.append(late); if (ll) lateWrap.append(ll); }
    itSub.querySelectorAll('.list > .row').forEach((el, i) => { const b = el.querySelector('.row-time b'); ents.push({el, t: b && /종일/.test(b.textContent) ? -1 : hm(b && b.textContent), k: 0, i}); });
    nowLine = itSub.querySelector('.now-line');
  }
  if (ttSub) ttSub.querySelectorAll('.row').forEach((el, i) => ents.push({el, t: hm((el.querySelector('.row-main') || el).textContent), k: 1, i}));
  ents.sort((a, b) => (a.t == null ? -1 : a.t) - (b.t == null ? -1 : b.t) || a.k - b.k || a.i - b.i);
  // rt-sec: 루틴 카드의 접기·펼치기 모양과 누르기를 그대로 쓰려고
  const tl = document.createElement('div'); tl.className = 'list bx-tl rt-sec';
  const first = rtSec || itSub || ttSub; first.before(tl); if (lateWrap) tl.before(lateWrap);
  const nowMin = M.now.getHours() * 60 + M.now.getMinutes();
  let placed = !nowLine;
  ents.forEach(e => { if (!placed && e.t != null && e.t >= nowMin) { tl.append(nowLine); placed = true; } tl.append(e.el); });
  if (!placed) tl.append(nowLine);
  [rtSec, itSub, ttSub].forEach(x => { if (!x) return; x.querySelectorAll(':scope > :not(.sec-h):not(.list):not(.grp-h)').forEach(o => tl.after(o)); x.remove(); });
  // 칸별 접기는 쓰지 않는다(접어 둔 것이 있었으면 풀어 보인다)
  document.documentElement.classList.remove('bx-f-rt', 'bx-f-today', 'bx-f-tt');
}
(function bxTimelineStyle(){
  if (!window.BX_APP) return;
  const st = document.createElement('style');
  st.textContent = [
    '.bx-app .bx-tl{margin-top:4px;border-top:0}',
    '.bx-app .bx-todo .bx-tl > .row,.bx-app .bx-todo .bx-tl > .rt-card{border-bottom:1px solid var(--line)}',
    '.bx-app .bx-todo .bx-tl > :last-child{border-bottom:0}',
    '.bx-app .bx-todo .bx-tl > .rt-card{margin:0!important;padding:10px 0 8px!important}',
    '.bx-app .bx-tl-rt .rt-h .rt-meta{display:none}',
    '.bx-app .bx-tl .bx-tl-rt .rt-h{flex-wrap:nowrap;column-gap:14px}',
    '.bx-app .bx-tl-rt .rt-h .bx-ic{flex:none}',
    '.bx-app .bx-tl-rt .rt-h b{flex:1 1 0;min-width:0;font-size:15.5px}',
    '.bx-app .bx-tl-rt .bx-tl-t .bx-tl-s{font-size:15px;font-weight:500;color:var(--ink)}',
    '.bx-app .bx-tl-rt .bx-tl-t small{font-size:12.5px;color:var(--ink-3)}',
    '.bx-app .bx-tl-rt .rt-note{padding-left:98px;margin-top:2px}',
    '.bx-app .bx-tl-rt .rt-steps{margin-left:98px}',
    '.bx-app .bx-tl-late{margin-top:4px}',
    '.bx-app .bx-tl-late .list{border-top:0}',
    '.bx-app .bx-tl .now-line{margin:0;border-bottom:0}'
  ].join('');
  (document.head || document.documentElement).appendChild(st);
})();

/* 새 일정·일정 고치기 창(규칙 12): 창 높이를 처음부터 정해 두어, 칩을 눌러도 칩이 밀려 올라가지 않는다.
   고르는 칸은 칩 바로 아래 같은 자리에서 바뀌고, 닫혀 있을 때 그 자리는 예문(새 일정) 또는 한 줄 안내(고치기) */
const BX_FORM_EX = ['내일 오후 3시 치과', '금요일 저녁 7시 친구 약속', '다음 주 월요일 보고서 마감'];
function bxFormIdle(){
  if (F && F.mode === 'new') return '<p class="bx-fi-h">이렇게 적거나 말해 보세요</p><div class="bx-fi-ex">' + BX_FORM_EX.map(x => '<button type="button" class="bx-fi-b" data-bx-fex="' + esc(x) + '">“' + esc(x) + '”</button>').join('') + '</div>' +
    '<p class="bx-fi-n">날짜와 시각을 같이 적으면 위 칸이 알아서 채워져요</p>';
  return '<p class="bx-fi-n">바꿀 칸을 누르면 여기에서 고쳐요</p>';
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-bx-fex]'); if (!b || !window.BX_APP) return;
  ev.preventDefault(); ev.stopPropagation();
  const t = document.getElementById('f-title'); if (!t) return;
  t.value = b.dataset.bxFex; t.dispatchEvent(new Event('input', {bubbles: true})); t.focus();
}, true);
(function bxFormStyle(){
  if (!window.BX_APP) return;
  const st = document.createElement('style');
  st.textContent = [
    '.bx-app .sheet.bx-fsheet{height:min(640px,88vh);height:min(640px,88dvh)}',
    '.bx-app .bx-fsheet .sheet-b{flex:1 1 auto;gap:14px;overflow:hidden}',
    '.bx-app .bx-fsheet #f-hint{min-height:24px}',
    '.bx-app .bx-fsheet #f-panel{flex:1 1 auto;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;margin-top:0}',
    '.bx-app .bx-fsheet #f-panel.bx-idle{background:transparent;border:1.5px dashed var(--line);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center}',
    '.bx-app .bx-fi-h{margin:0;font-size:13.5px;font-weight:700;color:var(--ink-2)}',
    '.bx-app .bx-fi-ex{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}',
    '.bx-app .bx-fi-b{height:38px;padding:0 14px;border-radius:999px;border:1px solid var(--line-2);background:var(--bg);color:var(--ink);font:inherit;font-size:14px;font-weight:600}',
    '.bx-app .bx-fi-n{margin:0;font-size:12.5px;color:var(--ink-3);line-height:1.5;word-break:keep-all}'
  ].join('');
  (document.head || document.documentElement).appendChild(st);
})();

/* 일정 알림 고르는 칸(규칙 11, D-10 · 문제점 점검 경험 9): 셋 + 직접 입력, '알림 없이'는 아래 글자 단추.
   하나만 고르는 칸이라 칩을 누르면 그 알림 하나로 바뀐다. 여러 개·정한 시각은 '직접 입력'에서(예전 칸 그대로) */
const BX_REM_Q = {t: [['0', '정시'], ['10', '10분 전'], ['60', '1시간 전']], d: [['d0@09:00', '당일 오전 9시'], ['d1@21:00', '전날 오후 9시']]};
function bxRemQuick(){
  const cur = remList(fRem()), opts = F.timed ? BX_REM_Q.t : BX_REM_Q.d;
  const one = cur.length === 1 ? cur[0] : null, std = !!one && opts.some(o => o[0] === one), none = !cur.length, cust = F.remAdv || (!none && !std);
  return '<div class="picks bx-rem-q" role="group" aria-label="알림">' + opts.map(o => '<button type="button" class="pick" data-bx-rem="' + o[0] + '" aria-pressed="' + (!cust && one === o[0]) + '">' + o[1] + '</button>').join('') +
    '<button type="button" class="pick" data-bx-rem="adv" aria-pressed="' + cust + '">' + (cust && !none ? esc(cur.length > 1 ? '알림 ' + cur.length + '개' : remLabel(cur[0])) : '직접 입력') + '</button></div>' +
    '<button type="button" class="bx-none" data-bx-rem="" aria-pressed="' + (none && !F.remAdv) + '">' + (none && !F.remAdv ? ICON.check : '') + '알림 없이</button>';
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-bx-rem]'); if (!b || !window.BX_APP || !F) return;
  ev.preventDefault(); ev.stopPropagation();
  const v = b.dataset.bxRem;
  if (v === 'adv') F.remAdv = true; else { F.remAdv = false; setFRem(v); }
  drawFRem();
}, true);
(function bxRemStyle(){
  if (!window.BX_APP) return;
  const st = document.createElement('style');
  st.textContent = [
    '.bx-app .bx-rem-adv{margin-top:14px;padding-top:12px;border-top:1px solid var(--line)}',
    // 시간을 정하지 않은 일정의 '출발·준비': 안내 한 줄과 단추를 가운데에(어느 칩에서 눌러도 눈이 가운데로, 대표 11/2)
    '.bx-app #f-go:has(> [data-fpanel="time"]){display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;min-height:100%;text-align:center}',
    '.bx-app #f-go:has(> [data-fpanel="time"]) > .p{margin:0;word-break:keep-all}'
  ].join('');
  (document.head || document.documentElement).appendChild(st);
})();
