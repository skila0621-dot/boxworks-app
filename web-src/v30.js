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
    // 캘린더 머리의 월간|주간 칩은 가운데(대표 의견 11/2: 아래 ‹ 11월 › 과 같은 세로줄). '이번 달로'는 오른쪽, 휴대폰 캘린더 표시는 그 아래 줄
    '.bx-app .bx-ch-top{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center}',
    '.bx-app .bx-ch-top .tt-mode{display:contents}',
    '.bx-app .bx-ch-top .seg{grid-column:2;grid-row:1}',
    '.bx-app .bx-ch-top .bx-cal-lg{grid-column:1 / -1;grid-row:2;justify-self:center;margin-top:6px}',
    '.bx-app .bx-ch-top .bx-ch-today{grid-column:3;grid-row:1;justify-self:end}',
    // 다 했어요 표시는 네모 칸(대표 지적 11/2: 수업 점·지금 줄·동그라미가 다 동그라미라 누르는 곳인지 모름). 루틴 단계 표시도 같게
    '.bx-app .chk{border-radius:7px}',
    '.bx-app .rt-chk{border-radius:7px;border-width:2px}',
    // 마이크에 '말하기' 글자
    '.bx-app .bx-mic{width:auto;min-width:44px;padding:0 14px 0 11px;gap:5px;font:inherit;font-size:14px;font-weight:800;white-space:nowrap}',
    '.bx-app .bx-mic svg{flex:none}'
  ].join('');
  (document.head || document.documentElement).appendChild(st);
})();

/* 홈 '오늘 할 일'을 한 목록, 시각 순서로(빈 공간 대표 11/2 · 문제점 점검 경험 1: 루틴·일정·수업 세 칸이라 10:30 수업이 맨 아래).
   칸 제목(루틴·일정·수업)과 접기를 빼고 시각 순서대로 한 목록에 둔다. 지난 일정(확인 필요)은 맨 위 그대로.
   각 줄은 원래 모양·누르는 동작 그대로 옮기기만 한다 */
let bxPastOpen = false;
// 줄에 '지금'·'다음' 꼬리표(일정 줄은 제목 아래, 수업 줄은 장소 줄 앞)
function bxTag(el, txt){
  if (el.classList.contains('rt-card')) return;
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
function bxTimeline(){
  if (!window.BX_APP || S.view !== 'today') return;
  const body = document.querySelector('#tcard2 .tc-body'); if (!body || body.querySelector('.bx-tl')) return;
  const rtSec = body.querySelector(':scope > .rt-sec'), itSub = body.querySelector(':scope > .it-sub'), ttSub = body.querySelector(':scope > .bx-tts');
  if (!rtSec && !itSub && !ttSub) return;
  const hm = t => { const m = /(\d{1,2}):(\d{2})/.exec(t || ''); return m ? +m[1] * 60 + +m[2] : null; };
  const ents = [];
  let lateWrap = null, nowLine = null;
  const hmAll = t => { const out = []; String(t || '').replace(/(\d{1,2}):(\d{2})/g, (m0, h, mm) => { out.push(+h * 60 + +mm); return m0; }); return out; };
  if (rtSec) rtSec.querySelectorAll(':scope > .rt-card[data-rid]').forEach((el, i) => {
    const meta = el.querySelector('.rt-h .rt-meta'), m = /(\d{1,2}:\d{2})\s*[–~-]\s*(\d{1,2}:\d{2})/.exec(meta ? meta.textContent : '');
    if (m && !el.querySelector('.bx-tl-t')) {
      const s = document.createElement('span'); s.className = 'row-time bx-tl-t'; s.innerHTML = '<span class="bx-tl-s">' + m[1] + '</span><small>' + m[2] + '</small>';
      const ic = el.querySelector('.rt-h .bx-ic'); if (ic) ic.after(s); else el.querySelector('.rt-h').prepend(s);
      el.classList.add('bx-tl-rt');
    }
    const ts = hmAll(meta && meta.textContent);
    ents.push({el, t: ts[0] == null ? null : ts[0], te: ts[1] == null ? ts[0] : ts[1], k: 2, i});
  });
  if (itSub) {
    const late = itSub.querySelector('#late-block'), ll = late && late.nextElementSibling && late.nextElementSibling.matches('.list') ? late.nextElementSibling : null;
    if (late) late.remove();
    itSub.querySelectorAll('.list > .row').forEach((el, i) => {
      const b = el.querySelector('.row-time b'), id = (el.querySelector('[data-id]') || {}).dataset ? el.querySelector('[data-id]').dataset.id : '';
      const it = id ? M.items.find(x => x.id === id) : null, t = b && /종일/.test(b.textContent) ? -1 : hm(b && b.textContent);
      ents.push({el, t, te: it && isHM(it.end) ? toMin(it.end) : t, k: 0, i, late: !!(ll && ll.contains(el))});
    });
    nowLine = itSub.querySelector('.now-line');
  }
  if (ttSub) ttSub.querySelectorAll('.row').forEach((el, i) => { const ts = hmAll((el.querySelector('.row-main') || el).textContent); ents.push({el, t: ts[0] == null ? null : ts[0], te: ts[1] == null ? ts[0] : ts[1], k: 1, i}); });
  ents.sort((a, b) => (a.t == null ? -1 : a.t) - (b.t == null ? -1 : b.t) || a.k - b.k || a.i - b.i);
  // rt-sec: 루틴 카드의 접기·펼치기 모양과 누르기를 그대로 쓰려고
  const tl = document.createElement('div'); tl.className = 'list bx-tl rt-sec';
  const first = rtSec || itSub || ttSub; first.before(tl);
  const nowMin = M.now.getHours() * 60 + M.now.getMinutes(), today = !S.homeDay;
  // 다음 일정 표시는 여기서 다시 단다(루틴·수업도 다음이 될 수 있어서)
  tl.ownerDocument.querySelectorAll('#tcard2 .bx-next').forEach(r => r.classList.remove('bx-next'));
  tl.ownerDocument.querySelectorAll('#tcard2 .bx-next-tag').forEach(t => t.remove());
  if (!today) { ents.forEach(e => tl.append(e.el)); if (nowLine) nowLine.remove(); }
  else {
    /* 오늘은 '지금'부터(대표 요청 11/2: 들어온 시각의 일정과 다음 일정을 먼저). 끝난 일과 어제까지 못 한 일은 맨 위 한 줄로 접는다.
       확인이 필요한 지난 일은 맨 위 '확인 필요' 숫자에서도 본다 */
    const past = [], allday = [], cur = [], fut = [];
    ents.forEach(e => {
      if (e.late) past.push(e);
      else if (e.t == null || e.t < 0) allday.push(e);
      else if (e.te < nowMin) past.push(e);
      else if (e.t <= nowMin) cur.push(e);
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
    fut.forEach((e, n) => {
      if (n === 0) {
        e.el.classList.add(cur.length ? 'bx-next-soft' : 'bx-next');
        if (!e.el.classList.contains('rt-card')) bxTag(e.el, '다음 · ' + untilText((e.t - nowMin) * 60000));
      }
      tl.append(e.el);
    });
    if (!cur.length && !fut.length) { const p = document.createElement('p'); p.className = 'bx-tl-done'; p.textContent = '오늘 남은 일은 없어요'; tl.append(p); }
  }
  [rtSec, itSub, ttSub].forEach(x => { if (!x) return; x.querySelectorAll(':scope > :not(.sec-h):not(.list):not(.grp-h)').forEach(o => tl.after(o)); x.remove(); });
  // 단계가 하나인 루틴: '오늘 쉬기'를 카드 아래 따로 두지 않고, 다른 루틴의 '단계 보기'와 같은 오른쪽 자리에(정렬, 대표 지적 11/2)
  tl.querySelectorAll('.rt-card.bx-one').forEach(c => {
    const sk = c.querySelector('.bx-rt-foot [data-act="rt-skip"]'), hd = c.querySelector('.rt-h');
    if (sk && hd) { hd.appendChild(sk); const f = c.querySelector('.bx-rt-foot'); if (f) f.remove(); }
  });
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
    // 지난 일 한 줄(접힘): 표시 칸에 꺾쇠, 글자는 시각 칸에서 시작
    '.bx-app .bx-past-tog{display:flex;align-items:center;gap:14px;width:100%;min-height:44px;padding:0;border:0;border-bottom:1px solid var(--line);background:none;color:var(--ink-3);font:inherit;font-size:14px;font-weight:600;text-align:left}',
    '.bx-app .bx-pt-i{width:24px;display:inline-flex;justify-content:center;flex:none}.bx-app .bx-pt-i .i{width:18px;height:18px;transition:transform .15s}',
    '.bx-app .bx-past-tog[aria-expanded="true"] .bx-pt-i .i{transform:rotate(180deg)}',
    '.bx-app .bx-past > .row,.bx-app .bx-past > .rt-card{opacity:.62;border-bottom:1px solid var(--line)}',
    '.bx-app .bx-past[hidden]{display:none}',
    // 지금 하는 일: 배경, 다음 일: 지금 하는 일이 있으면 꼬리표만
    '.bx-app .bx-todo .row.bx-now{background:var(--accent-soft)}',
    '.bx-app .bx-todo .rt-card.bx-now,.bx-app .bx-todo .rt-card.bx-next{background:var(--accent-soft);border-radius:14px;margin:0 -10px!important;padding:10px 10px 8px!important;border-bottom-color:transparent}',
    '.bx-app .bx-todo .row.bx-next-soft{background:none}',
    '.bx-app .bx-next-tag{color:var(--accent);font-weight:700}',
    '.bx-app .bx-tl-done{margin:10px 0 4px;color:var(--ink-3);font-size:14px;padding-left:58px}',
    '.bx-app .bx-tl .now-line{margin:0;border-bottom:0}',
    // 줄마다 같은 칸(대표 지적 11/2: 아이콘 크기·새로 붙은 항목 때문에 정렬이 흐트러짐): 표시 24px(가운데 32px) · 시각 58px · 제목 118px
    '.bx-app .bx-tl .bx-tl-rt .rt-h{column-gap:14px}',
    '.bx-app .bx-tl .bx-tl-rt .rt-h .bx-ic.rt{width:24px;height:24px;border-radius:8px}',
    '.bx-app .bx-tl .bx-tl-rt .rt-h .bx-ic.rt .i{width:15px;height:15px}',
    '.bx-app .bx-tl .tt-row .tt-dot{margin:0 6px}',
    '.bx-app .bx-tl .rt-h [data-act="rt-skip"]{flex:none;white-space:nowrap;min-height:36px;padding:0 4px}'
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
