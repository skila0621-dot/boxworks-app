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

  // 모양 규칙은 web-src/app.css로 옮김(시험판 54 덧칠 정리)
})();
