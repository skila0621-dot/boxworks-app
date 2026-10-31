// 휴대폰 캘린더 읽기(D-05, 1차 #9). 코드는 web-src/calendar.js, 휴대폰 쪽은 BxCalendarPlugin.java
export default [
  {
    name: '휴대폰 캘린더 일정을 일정 목록에 함께 넣기(읽기만)',
    find: `  cats.sort((a, b) => (a.order || 0) - (b.order || 0));\n  const byDate = new Map();`,
    replace: `  if (window.BX_APP) pcItems(settings).forEach(x => items.push(x));\n  cats.sort((a, b) => (a.order || 0) - (b.order || 0));\n  const byDate = new Map();`
  },
  {
    name: '└ 휴대폰 캘린더 일정은 "시간이 지났어요"로 묻지 않음',
    find: `const isLate = it => !it.done && dueAt(it) <= M.now;`,
    replace: `const isLate = it => !it.done && !it.pc && dueAt(it) <= M.now;`
  },
  {
    name: '└ 지난 휴대폰 캘린더 일정은 오늘의 "이어서 할 일"에 넣지 않음',
    find: `M.items.filter(i => !i.done && i.date < today)`,
    replace: `M.items.filter(i => !i.done && !i.pc && i.date < today)`
  },
  {
    name: '└ 휴대폰 캘린더 일정 색은 그 캘린더 색',
    find: `const catColorRaw = id => { const c = M.catMap.get(id); if (!c) return 'var(--ink-3)';`,
    replace: `const catColorRaw = id => { const c = M.catMap.get(id); if (!c) return window.BX_APP && /^pcc_/.test(id || '') ? (PC.colors.get(id) || 'var(--ink-3)') : 'var(--ink-3)';`
  },
  {
    name: '└ 일정 줄에 어느 캘린더 일정인지 표시',
    find: `  if (cat) meta.push('<span class="meta"><i class="dot" style="--c:' + catColor(cat.id) + '"></i>' + esc(cat.name) + '</span>');`,
    replace: `  if (cat) meta.push('<span class="meta"><i class="dot" style="--c:' + catColor(cat.id) + '"></i>' + esc(cat.name) + '</span>');\n  else if (window.BX_APP && it.pc) meta.push(pcMeta(it));`
  },
  {
    name: '└ 설정에 "휴대폰 캘린더" 칸',
    find: `'<section class="set-sec" aria-labelledby="s-alarm"><h2 id="s-alarm">알림</h2>' + (window.BX_APP ?`,
    replace: `(window.BX_APP ? pcSetHtml() : '') + '<section class="set-sec" aria-labelledby="s-alarm"><h2 id="s-alarm">알림</h2>' + (window.BX_APP ?`
  },
  {
    name: '└ 표 파일(CSV)·일정 수 세기에는 휴대폰 캘린더 일정을 넣지 않음',
    find: `M.items.slice().sort((a, b) => a.date.localeCompare(b.date) || byTime(a, b)).forEach(i => rows.push(`,
    replace: `M.items.filter(i => !i.pc).slice().sort((a, b) => a.date.localeCompare(b.date) || byTime(a, b)).forEach(i => rows.push(`
  },
  {
    name: '└ (일정 수)',
    find: `nItems = M.items.length + M.trash.length;`,
    replace: `nItems = M.items.filter(i => !i.pc).length + M.trash.length;`
  },
  {
    name: '└ 백업 불러오기·전체 초기화에 휴대폰 캘린더 일정 메모(pcx) 포함',
    find: `'tt', 'travelmem'].includes(x.type)`,
    replace: `'tt', 'travelmem', 'pcx'].includes(x.type)`
  },
  {
    name: '└ (전체 초기화)',
    find: `d.type === 'tt' || d.type === 'travelmem' || id === 'settings'`,
    replace: `d.type === 'tt' || d.type === 'travelmem' || d.type === 'pcx' || id === 'settings'`
  }
];
