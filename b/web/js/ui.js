// 작은 화면 도구: 글 지키기, 알림 글, 아래 창, 페이지 이동(주소 # — 휴대폰 뒤로 가기가 그대로 된다)
import { icon } from './icons.js';
export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);

let tTimer = 0;
export function toast(msg, act) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  t.innerHTML = '<span>' + esc(msg) + '</span>' + (act ? '<button type="button">' + esc(act[0]) + '</button>' : '');
  t.hidden = false;
  if (act) t.querySelector('button').onclick = () => { t.hidden = true; act[1](); };
  clearTimeout(tTimer); tTimer = setTimeout(() => { t.hidden = true; }, act ? 6000 : 2800);
}
export const hideToast = () => { const t = $('#toast'); if (t) t.hidden = true; };

// 아래에서 올라오는 창. 닫기: 바깥 누르기 · 닫기 단추 · 뒤로 가기(#sheet)
let sheetClose = null;
export function openSheet(title, bodyHtml, onMount) {
  closeSheet(true);
  const s = document.createElement('div'); s.className = 'scrim'; s.id = 'scrim';
  s.innerHTML = '<div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="top"><h1>' + esc(title) + '</h1><button class="ib" type="button" data-close aria-label="닫기">' + icon('close') + '</button></div>' + bodyHtml + '</div>';
  document.body.append(s);
  s.addEventListener('click', e => { if (e.target === s || e.target.closest('[data-close]')) history.back(); });
  if (!location.hash.endsWith('/sheet')) history.pushState(null, '', location.hash.replace(/\/sheet$/, '') + '/sheet');
  sheetClose = () => { s.remove(); sheetClose = null; };
  if (onMount) onMount(s.querySelector('.sheet'));
  return s.querySelector('.sheet');
}
export function closeSheet(silent) { if (sheetClose) { sheetClose(); if (!silent && location.hash.endsWith('/sheet')) history.back(); } }
export const sheetOpen = () => !!sheetClose;

export const go = hash => { if (location.hash !== hash) location.hash = hash; };
export function route() {
  const h = (location.hash || '#/').replace(/\/sheet$/, '');
  if (!location.hash.endsWith('/sheet') && sheetClose) sheetClose();
  const m = h.match(/^#\/e\/(.+)$/);
  if (m) return { page: 'detail', key: decodeURIComponent(m[1]) };
  if (h === '#/settings') return { page: 'settings' };
  if (h === '#/record') return { page: 'record' };
  return { page: 'today' };
}
export function stepper(id, value, label) {
  return '<span class="step" data-step="' + esc(id) + '"><button class="ib" type="button" data-d="-5" aria-label="' + esc(label) + ' 5분 줄이기">' + icon('minus') + '</button><b class="num">' + esc(value) + '분</b><button class="ib" type="button" data-d="5" aria-label="' + esc(label) + ' 5분 늘리기">' + icon('plus') + '</button></span>';
}
