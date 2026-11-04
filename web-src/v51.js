/* 시험판 51(대표 11/4 디자인 가이드): 시각은 모두 '오전 · 오후'(오후 3:00), 글자 크기 6단계, 브랜드 색 보라
   - 시각 입력 칸(input type=time)은 휴대폰 설정에 따라 '15:00'이나 '03:00 PM'으로 보이므로, 칸 위에 '오후 3:00'을 그리고
     칸은 투명하게 위에 둔다(누르면 휴대폰 시각 고르기 창이 그대로 열림). 값과 id는 그대로라 저장 · 계산은 바뀌지 않는다
   - 글자 크기는 build-web.mjs가 마지막에 6단계로 맞춘다(28 · 20 · 16 · 14 · 13 · 11.5, 명상 타이머 숫자만 50 · 38) */
// 시각 도우미를 시험 · 휴대폰 쪽에서도 쓰게(앱 코드는 한 함수 안에 있어 밖에서 보이지 않음)
window.BX_TIME = {bxT, bxTR, bxH, bxHR, bxHMAll};
(function(){
  if (!window.BX_APP) return;
  const fmt = v => isHM(v) ? bxT(v) : '--:--';
  const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  const sync = inp => { const v = inp.parentNode && inp.parentNode.querySelector(':scope > .bx-t12-v'); if (v) v.textContent = fmt(desc.get.call(inp)); };
  function wrap(inp){
    if (inp.dataset.bx12 || inp.closest('.bx-tchip, .bx-t12')) return;
    inp.dataset.bx12 = '1';
    const cs = getComputedStyle(inp), ta = cs.textAlign;
    const w = document.createElement('span');
    // 칸 모양(테두리 · 크기 · 글꼴)은 입력 칸의 이름표를 그대로 받아 같게 보인다
    w.className = 'bx-t12 ' + inp.className;
    w.style.justifyContent = ta === 'right' || ta === 'end' ? 'flex-end' : ta === 'center' || ta === '-webkit-center' ? 'center' : 'flex-start';
    const v = document.createElement('span');
    v.className = 'bx-t12-v tnum'; v.setAttribute('aria-hidden', 'true');
    inp.parentNode.insertBefore(w, inp);
    w.appendChild(v); w.appendChild(inp);
    // 코드에서 값을 바꿔도(소요 시간 고르기 → 끝 시각 등) 보이는 글이 따라오게
    Object.defineProperty(inp, 'value', { configurable: true, get(){ return desc.get.call(this); }, set(x){ desc.set.call(this, x); sync(this); } });
    sync(inp);
  }
  const scan = root => {
    if (!root || root.nodeType !== 1) return;
    if (root.matches && root.matches('input[type="time"]')) wrap(root);
    root.querySelectorAll && root.querySelectorAll('input[type="time"]:not([data-bx12])').forEach(wrap);
  };
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(scan))).observe(document.documentElement, { childList: true, subtree: true });
  if (document.body) scan(document.body);
  ['input', 'change'].forEach(t => document.addEventListener(t, ev => { const i = ev.target; if (i && i.dataset && i.dataset.bx12) sync(i); }, true));

  const st = document.createElement('style');
  st.id = 'bx-v51-css';
  st.textContent = [
    // 시각 칸: 글은 아래, 투명한 입력 칸은 위(누르기)
    'html.bx-app .bx-t12{position:relative;display:inline-flex;align-items:center;box-sizing:border-box;overflow:hidden;white-space:nowrap;cursor:pointer}',
    'html.bx-app .bx-t12 > .bx-t12-v{pointer-events:none;font-variant-numeric:tabular-nums}',
    'html.bx-app .bx-t12 > input[type="time"]{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;min-width:0!important;max-width:none!important;margin:0!important;padding:0!important;border:0!important;opacity:0!important;z-index:1;background:transparent!important;box-shadow:none!important;cursor:pointer}',
    'html.bx-app .bx-t12:focus-within{box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 22%,transparent)}',
    // 시간표 왼쪽 시각 줄: 12시간 숫자, 처음 시각의 오전 · 오후는 왼쪽 위 칸에, 정오에는 그 위에 '오후'
    'html.bx-app .tt-h.tt-tc{display:flex;align-items:flex-end;justify-content:flex-end;padding:0 2px 2px 0}',
    'html.bx-app .bx-tt-ap{font-size:11.5px;font-weight:500;color:var(--ink-3);line-height:1}',
    'html.bx-app .tt-line span small{position:absolute;right:0;bottom:100%;font-size:11.5px;line-height:1.1;white-space:nowrap}',
    // 줄의 시각 칸: '오후 12:30'(16px 굵게 75px)이 한 줄에 들어가게 넓힌다. 루틴 카드의 단계 · 안내 줄도 같은 만큼 오른쪽으로(아이콘 24 + 14 + 시각 76 + 14)
    'html.bx-app .row-time{width:76px}',
    'html.bx-app .row-time b,html.bx-app .row-time small{white-space:nowrap}',
    'html.bx-app .bx-tl-rt .rt-note{padding-left:128px}',
    'html.bx-app .bx-tl-rt .rt-steps{margin-left:128px}',
    // 메모 줄 왼쪽 시각: '오후 12:30'(13px 굵게 61px)이 들어가고 줄마다 글이 같은 곳에서 시작하게
    'html.bx-app .bx-mm-row > .bx-mm-t{min-width:62px;white-space:nowrap}',
    // 출발 칸: '오후 2:40'이 칸을 넓히지 않게 한 단계 작게
    'html.bx-app .bx-r49-go b{font-size:14px}',
    // 떠 있는 '취소 | 저장'은 뒤 글자가 비치지 않게 바탕을 채운다
    'html.bx-app .bx-pill49{background:var(--bg)}'
  ].join('\n');
  (document.head || document.documentElement).appendChild(st);
})();
