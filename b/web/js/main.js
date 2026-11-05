// 시작: 상태 읽기 → 돌아온 날(이틀 넘게 만이면 한 장) → 공유로 들어온 글 → 그리기. 알람 · 알림에서 바뀌면 다시 그린다
import { app, B, refresh, render, reload } from './app.js';
import { sheetOpen } from './ui.js';
import { sod } from './fmt.js';

async function boot() {
  try {
    await refresh();
    const o = await B.opened();
    // 달력 날짜로 센다: 월요일에 열고 목요일에 열면 3일 만(대표 결정 C '이틀 넘게 만에 열면')
    if (o && o.prev) app.backDays = Math.round((sod(app.now) - sod(o.prev)) / 864e5);
    await render();
    const sh = await B.shared();
    if (sh && sh.text) (await import('./add.js')).openAdd(sh.text);
  } catch (e) {
    document.getElementById('app').innerHTML = '<main class="page"><p>화면을 여는 중에 문제가 생겼어요. 앱을 닫았다가 다시 열어 주세요.</p></main>';
    console.error(e);
  }
  window.addEventListener('hashchange', () => render());
  B.addListener('changed', () => { if (!sheetOpen()) reload(); });
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible') return;
    await reload();
    const sh = await B.shared(); if (sh && sh.text) (await import('./add.js')).openAdd(sh.text);
  });
  // 남은 시간 글을 새로 고친다(창이 열려 있으면 건드리지 않음)
  if (!window.__B_SCENARIO) setInterval(() => { if (!sheetOpen() && document.visibilityState === 'visible') reload(); }, 20000);
}
boot();
