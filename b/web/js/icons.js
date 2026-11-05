// 아이콘 한 세트: 24칸 · 선 굵기 1.8 · 둥근 끝. 화면의 모든 아이콘은 여기서만 나온다(정렬 점검이 data-icon으로 확인)
const P = {
  gear: '<path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"/><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A7.4 7.4 0 0 0 7 6.5l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a7.4 7.4 0 0 0 2.6-1.5l2.4 1 2-3.4-2-1.6Z"/>',
  back: '<path d="M15 5 8 12l7 7"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  bell: '<path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15L6 16.5Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  bellOff: '<path d="M6 16.5V11a6 6 0 0 1 9.2-5.1M18 11v5.5l1.5 1.5H8"/><path d="M10 20.5a2 2 0 0 0 4 0M4 4l16 16"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="m10 21 2.2-6.2L15 17v4M9.5 10.5 12 8l3 2.5 2.5 1M12 8l-1.2 5.8L8 12"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  share: '<path d="M8.5 12.5 15.5 16M15.5 8l-7 3.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6.5" r="2.5"/><circle cx="18" cy="17.5" r="2.5"/>',
  chart: '<path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>'
};
export function icon(name, cls = 'ico') {
  return '<svg class="' + cls + '" data-icon="' + name + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[name] || '') + '</svg>';
}
export const ICONS = Object.keys(P);
