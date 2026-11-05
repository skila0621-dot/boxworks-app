// 시각 · 날짜 글. 시각 표시는 설정(오전·오후 | 24시간)을 늘 따른다
const WDN = ['일', '월', '화', '수', '목', '금', '토'];
const pad = n => String(n).padStart(2, '0');
let H24 = false;
export const setH24 = v => { H24 = !!v; };
export const isH24 = () => H24;
export function hm(ms) {
  if (ms == null || !Number.isFinite(ms)) return '--:--';
  const d = new Date(ms), h = d.getHours(), m = d.getMinutes();
  if (H24) return pad(h) + ':' + pad(m);
  return (h < 12 ? '오전 ' : '오후 ') + ((h % 12) || 12) + ':' + pad(m);
}
// 줄 앞 시각 칸: 12시간이면 위에 '오후', 아래 '1:50'
export function hmParts(ms) {
  if (ms == null || !Number.isFinite(ms)) return ['', '--:--'];
  const d = new Date(ms), h = d.getHours(), m = d.getMinutes();
  if (H24) return ['', pad(h) + ':' + pad(m)];
  return [h < 12 ? '오전' : '오후', ((h % 12) || 12) + ':' + pad(m)];
}
export const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const sod = ms => { const d = new Date(ms); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };
export const addDays = (ms, n) => { const d = new Date(ms); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n).getTime(); };
export function dayLabel(ms, now) {
  const d = new Date(ms), t0 = sod(now), t = sod(ms), diff = Math.round((t - t0) / 864e5);
  const base = (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + WDN[d.getDay()] + '요일';
  return diff === 0 ? '오늘 · ' + base : diff === 1 ? '내일 · ' + base : diff === -1 ? '어제 · ' + base : base;
}
export const dateLong = ms => { const d = new Date(ms); return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + WDN[d.getDay()] + '요일'; };
export const dateShort = ms => { const d = new Date(ms); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + WDN[d.getDay()]; };
// 남은 시간: '50분 뒤' · '1시간 20분 뒤' · '지금' · '5분 지남'
export function rel(ms, now) {
  const m = Math.round((ms - now) / 60000);
  if (Math.abs(m) < 1) return '지금';
  const a = Math.abs(m), h = Math.floor(a / 60), r = a % 60;
  const s = h ? h + '시간' + (r ? ' ' + r + '분' : '') : r + '분';
  return m > 0 ? s + ' 뒤' : s + ' 지남';
}
export const mins = n => { n = Math.round(n); const h = Math.floor(n / 60), r = n % 60; return h ? h + '시간' + (r ? ' ' + r + '분' : '') : r + '분'; };
export const clock = ms => { const s = Math.max(0, Math.round(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? h + ':' + pad(m) + ':' + pad(s % 60) : m + ':' + pad(s % 60); };
