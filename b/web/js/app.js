// 앱 상태와 공통 동작. 저장은 모두 휴대폰 쪽(B)에 있고, 화면은 읽어 그린다
import { makeFake } from './fake.js';
import { setH24, hm, sod, addDays } from './fmt.js';
import { normTitle, normPlace, snoozeLeft, lateIfStartNow, lateIfLeaveNow, MIN } from './planner.js';
import { toast, route } from './ui.js';

const native = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && window.Capacitor.Plugins && window.Capacitor.Plugins.B;
export const B = native || makeFake(window.__B_SCENARIO || {});
export const IS_NATIVE = !!native;
export const app = { st: null, entries: [], now: Date.now(), backDays: 0, backSeen: false, onb: 0 };

export async function refresh() {
  const st = await B.state();
  app.st = st; setH24(st.settings.h24);
  const now = st.now || Date.now(); app.now = now;
  const from = sod(now), to = addDays(now, 2);
  const p = await B.plan({ from, to });
  app.now = p.now || now; app.entries = p.entries || [];
  return app;
}
export const entry = key => app.entries.find(e => e.key === key) || null;

export async function render() {
  const root = document.getElementById('app');
  const r = route();
  if (app.st && app.st.firstRun && app.onb < 3) { (await import('./onboard.js')).renderOnboard(root); return; }
  if (r.page === 'detail') (await import('./detail.js')).renderDetail(root, r.key);
  else if (r.page === 'settings') (await import('./settings.js')).renderSettings(root);
  else if (r.page === 'record') (await import('./settings.js')).renderRecord(root);
  else (await import('./today.js')).renderToday(root);
}
export async function reload() { await refresh(); await render(); }

// 약속별로 정한 값(나가는 약속 · 준비 · 이동 · 알람 끔). 되돌리기를 알림 글에 단다
export async function setOverride(key, patch, msg) {
  const before = JSON.parse(JSON.stringify(app.st.overrides || {}));
  const ov = Object.assign({}, app.st.overrides);
  const cur = Object.assign({}, ov[key], patch);
  Object.keys(cur).forEach(k => { if (cur[k] === undefined) delete cur[k]; });
  ov[key] = cur;
  const extra = {};
  const e = entry(key);
  // 나가는 약속 여부는 같은 제목에도 기억한다(쓸수록 덜 묻기). 이동 시간은 같은 장소에 기억한다
  if (e && typeof patch.out === 'boolean' && normTitle(e.title)) extra.kw = Object.assign({}, app.st.kw, { [normTitle(e.title)]: patch.out });
  if (e && typeof patch.travel === 'number' && normPlace(e.place)) extra.places = Object.assign({}, app.st.places, { [normPlace(e.place)]: patch.travel });
  const beforeKw = app.st.kw, beforePlaces = app.st.places;
  await B.save(Object.assign({ overrides: ov }, extra));
  await reload();
  if (msg) toast(msg, ['되돌리기', async () => { await B.save({ overrides: before, kw: beforeKw, places: beforePlaces }); await reload(); }]);
}
export async function saveSettings(patch, msg) {
  const s = Object.assign({}, app.st.settings, patch);
  await B.save({ settings: s }); await reload(); if (msg) toast(msg);
}

// 단계 동작(앱 안에서 누를 때). 휴대폰 쪽이 알람 · 알림을 함께 정리한다
export async function doStart(e) {
  await B.act({ key: e.key, act: 'start' }); await reload();
  const ne = entry(e.key);
  toast('시작했어요 · ' + hm(ne ? ne.leaveAt : e.leaveAt) + '에 출발', ['되돌리기', async () => { await B.act({ key: e.key, act: 'undo', kind: 'start' }); await reload(); }]);
}
export async function doLeft(e) {
  const took = e.startedAt ? Math.round((app.now - e.startedAt) / MIN) : null;
  await B.act({ key: e.key, act: 'left' }); await reload();
  toast(took && took >= 3 ? '잘 다녀오세요 · 이번 준비는 ' + took + '분 걸렸어요' : '잘 다녀오세요', ['되돌리기', async () => { await B.act({ key: e.key, act: 'undo', kind: 'left' }); await reload(); }]);
}
export async function doSnooze(e, kind) {
  const n = snoozeLeft(e); if (!n) return;
  await B.act({ key: e.key, act: 'snooze', kind, n }); await reload();
  toast(n + '분 뒤에 다시 알릴게요 · 남은 여유 ' + Math.max(0, e.buffer - e.snoozed - n) + '분');
}
// 늦는다고 알리기: 보낼 말을 채워 공유 창만 연다(받는 사람 · 보내기는 사용자가)
export function lateText(e, now) {
  const started = e.state === 'prep';
  const late = started ? lateIfLeaveNow(e, now) : lateIfStartNow(e, now);
  const arrive = now + ((started ? 0 : e.prep) + e.travel) * MIN;
  const a = hm(Math.max(arrive, e.start + late * MIN));
  return { late, text: late > 0 ? '미안해요, ' + late + '분쯤 늦을 것 같아요. ' + a + '쯤 도착해요.' : '지금 출발해요. ' + hm(arrive) + '쯤 도착해요.' };
}
export async function doLate(e) {
  const { late, text } = lateText(e, app.now);
  await B.share({ text });
  await B.act({ key: e.key, act: 'late', n: late });
}
