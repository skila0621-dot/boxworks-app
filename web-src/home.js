/* ---------- 오늘 화면 정리 (대표 요청 2026-10-31) ----------
   루틴이 늘어날수록 아래 달력이 밀려서: 칸마다 접기(오늘의 루틴·오늘의 일정·오늘 시간표·달력),
   루틴 카드는 '지금 할 일'만 보이고 단계 목록은 눌러서 펼친다. 접은 상태는 이 휴대폰에 기억한다. */
const BX_FOLD_KEY = 'bx:fold', BX_RTOPEN_KEY = 'bx:rtopen';
const BX_FOLDS = [['rt', 'h-rt'], ['today', 'h-today'], ['tt', 'h-tt-today'], ['cal', 'h-hcal']];
const ICON_FOLD = '<svg class="i" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>';
function bxLoadJson(k){ try { return JSON.parse(lsGet(k) || '{}') || {}; } catch (e) { return {}; } }
let bxFold = bxLoadJson(BX_FOLD_KEY), bxRtOpen = bxLoadJson(BX_RTOPEN_KEY);
function bxSaveJson(k, v){ try { lsSet(k, JSON.stringify(v)); } catch (e) { /* 저장 공간이 없으면 이번만 */ } }
function bxFoldApply(){ BX_FOLDS.forEach(([k]) => document.documentElement.classList.toggle('bx-f-' + k, !!bxFold[k])); }
// 화면을 다시 그릴 때마다 접기 단추를 붙인다(render 끝에서 부름)
function bxFoldDecorate(){
  bxFoldApply();
  if (S.view !== 'today') return;
  BX_FOLDS.forEach(([k, hid]) => {
    const h = document.getElementById(hid); if (!h) return;
    const sh = h.closest('.sec-h'); if (!sh || sh.querySelector('.bx-fold-btn')) return;
    sh.classList.add('bx-foldable');
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'bx-fold-btn'; b.dataset.fold = k;
    b.setAttribute('aria-expanded', String(!bxFold[k]));
    b.setAttribute('aria-label', h.textContent + (bxFold[k] ? ' 펼치기' : ' 접기'));
    b.innerHTML = ICON_FOLD;
    const sub = h.nextElementSibling && h.nextElementSibling.classList.contains('sec-sub') ? h.nextElementSibling : h;
    sub.after(b);
  });
  $$('.rt-sec .rt-card[data-rid]').forEach(c => {
    const rid = c.dataset.rid, st = c.querySelector('.rt-steps'), hd = c.querySelector('.rt-h');
    if (!st || !hd || hd.querySelector('.bx-rt-tog')) return;
    const open = !!bxRtOpen[rid];
    c.classList.toggle('bx-open', open);
    const n = st.querySelectorAll('li:not(.arr)').length;
    if (n <= 1) { c.classList.add('bx-open', 'bx-one'); return; }
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'bx-rt-tog'; b.dataset.rtog = rid;
    b.setAttribute('aria-expanded', String(open));
    b.innerHTML = '단계 ' + n + ICON_FOLD;
    hd.appendChild(b);
  });
}
function bxToggleFold(k){
  bxFold[k] = !bxFold[k]; bxSaveJson(BX_FOLD_KEY, bxFold); bxFoldApply();
  const b = document.querySelector('.bx-fold-btn[data-fold="' + k + '"]');
  if (b) { b.setAttribute('aria-expanded', String(!bxFold[k])); const h = document.getElementById((BX_FOLDS.find(x => x[0] === k) || [])[1]); if (h) b.setAttribute('aria-label', h.textContent + (bxFold[k] ? ' 펼치기' : ' 접기')); }
}
document.addEventListener('click', ev => {
  if (!window.BX_APP) return;
  const t = ev.target;
  const fb = t.closest('.bx-fold-btn') || (t.closest('.sec-h.bx-foldable h2') && t.closest('.sec-h').querySelector('.bx-fold-btn'));
  if (fb) { ev.preventDefault(); ev.stopPropagation(); bxToggleFold(fb.dataset.fold); return; }
  const rb = t.closest('.bx-rt-tog') || (t.closest('.rt-sec .rt-h b, .rt-sec .rt-h .rt-meta') && t.closest('.rt-card') && t.closest('.rt-card').querySelector('.bx-rt-tog'));
  if (rb) {
    ev.preventDefault(); ev.stopPropagation();
    const rid = rb.dataset.rtog, c = rb.closest('.rt-card'), open = !c.classList.contains('bx-open');
    c.classList.toggle('bx-open', open); rb.setAttribute('aria-expanded', String(open));
    if (open) bxRtOpen[rid] = true; else delete bxRtOpen[rid];
    bxSaveJson(BX_RTOPEN_KEY, bxRtOpen);
  }
}, true);
