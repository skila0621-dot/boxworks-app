// 4단계: 출발 시각 계산, 이동 시간 기억, 일정에 준비 루틴 붙이기 (코드는 web-src/travel.js)
// 그리고 백업 불러오기에 루틴·시간표가 빠지던 문제 수정
export default [
  {
    name: '일정 수정 창에 이동 시간·붙인 루틴 불러오기',
    find: `extra: !!(it.location || it.note), done: !!it.done};`,
    replace: `extra: !!(it.location || it.note), done: !!it.done, travel: it.travel || 0, tvSrc: '', tvKey: '', prep: it.prep || null, prepNew: null, prepMin: Object.assign({}, it.prepMin || {}), prepRing: Object.assign({}, it.prepRing || {}), prepSave: false, touchedTravel: true, touchedPrep: true};`
  },
  {
    name: '└ 말에서 이동 시간·루틴만 찾아도 해석 결과로 씀',
    find: `  const found = p.date || p.start;\n`,
    replace: `  const found = p.date || p.start || (window.BX_APP && (p.travel || p.prepName || p.remind != null));\n`
  },
  {
    name: '└ 해석한 이동 시간·루틴·기억한 이동 시간을 창에 반영',
    find: `  drawFHint(); drawFDate(); drawFTime(); drawFRem();\n}\nfunction saveEdit(){`,
    replace: `  if (window.BX_APP) tvOnParse(p);\n  drawFHint(); drawFDate(); drawFTime(); drawFRem();\n}\nfunction saveEdit(){`
  },
  {
    name: '└ 제목 아래 칸 줄에 \'출발\' 칸 넣기',
    find: `    tab('more', ICON.pin, (F.location || F.note) ? '장소·메모 있음' : '장소·메모', !!(F.location || F.note));`,
    replace: `    tab('more', ICON.pin, (F.location || F.note) ? '장소·메모 있음' : '장소·메모', !!(F.location || F.note)) + (window.BX_APP ? tvTab(tab) : '');`
  },
  {
    name: '└ \'출발\' 칸을 누르면 이동 시간·준비 루틴 고르기',
    find: `  el.innerHTML = k ? '<div id="' + ({date: 'f-date', time: 'f-time', rem: 'f-rem', cat: 'f-cat', more: 'f-extra'})[k] + '"></div>' : '';\n  ({date: drawFDate, time: drawFTime, rem: drawFRem, cat: drawFCat, more: drawFExtra})[k] && ({date: drawFDate, time: drawFTime, rem: drawFRem, cat: drawFCat, more: drawFExtra})[k]();`,
    replace: `  el.innerHTML = k ? '<div id="' + ({date: 'f-date', time: 'f-time', rem: 'f-rem', cat: 'f-cat', more: 'f-extra', go: 'f-go'})[k] + '"></div>' : '';\n  const dr = ({date: drawFDate, time: drawFTime, rem: drawFRem, cat: drawFCat, more: drawFExtra, go: tvDrawPanel})[k]; if (dr) dr();`
  },
  {
    name: '└ 제목 아래 해석 결과에 출발 시각 함께 보여 주기',
    find: `  if (F.mode === 'new' && p && (p.date || p.start)) {\n    el.innerHTML = '<div class="hint">' + ICON.check + '<span><b>' + esc(p.date ? fmtMD(p.date) : relDay(F.date, ymd(new Date()))) + (p.start ? ' ' + p.start + (p.end ? '–' + p.end : '') : '') + '</b> · ‘' + esc(p.title || F.title) + '’</span></div>';`,
    replace: `  if (F.mode === 'new' && ((p && (p.date || p.start || p.travel || p.prepName || p.remind != null)) || (window.BX_APP && F.tvSrc === 'mem' && F.travel))) {\n    p = p || {title: F.title};\n    el.innerHTML = '<div class="hint">' + ICON.check + '<span><b>' + esc(p.date ? fmtMD(p.date) : relDay(F.date, ymd(new Date()))) + (p.start ? ' ' + p.start + (p.end ? '–' + p.end : '') : F.timed && isHM(F.start) ? ' ' + F.start : '') + '</b> · ‘' + esc(p.title || F.title) + '’' + (window.BX_APP ? tvHint() : '') + '</span></div>';`
  },
  {
    name: '└ (위에서 p를 바꿀 수 있게)',
    find: `  const p = F.parsed;\n  if (F.mode === 'new' && ((p`,
    replace: `  let p = F.parsed;\n  if (F.mode === 'new' && ((p`
  },
  {
    name: '└ 저장할 때 이동 시간·루틴 넣고, 이동 시간 기억',
    find: `  const fields = {title, date: F.date, start, end, categoryId: F.categoryId || null, remind, location: (F.location || '').trim(), note: F.note || ''};\n  const when = relDay(F.date, ymd(new Date())) + (start ? ' ' + start : '');`,
    replace: `  const fields = {title, date: F.date, start, end, categoryId: F.categoryId || null, remind, location: (F.location || '').trim(), note: F.note || ''};\n  if (window.BX_APP) tvFields(fields, start);\n  const when = relDay(F.date, ymd(new Date())) + (start ? ' ' + start : '') + (window.BX_APP ? tvWhenTail(fields) : '');`
  },
  {
    name: '└ 일정 줄에 출발 시각(4안-1)',
    find: `  if (it.location) meta.push('<span class="meta">' + ICON.pin + esc(it.location) + '</span>');\n  if (it.slips)`,
    replace: `  if (it.location) meta.push('<span class="meta">' + ICON.pin + esc(it.location) + '</span>');\n  if (window.BX_APP && !it.done) { const g = tvRowMeta(it); if (g) meta.push(g); }\n  if (it.slips)`
  },
  {
    name: '└ 루틴 목록: 일정에만 붙여 쓰는 루틴은 그렇게 표시',
    find: `    const sum = rtWhenText(rt) + ' · ' + mm(p.start) + ' 시작 → '`,
    replace: `    const sum = window.BX_APP && !rt.on && !rt.once && tvPrepUses(rt.id) ? tvRtSum(rt) : rtWhenText(rt) + ' · ' + mm(p.start) + ' 시작 → '`
  },
  {
    name: '백업 불러오기에 루틴·루틴 기록·시간표·이동 시간 기억도 포함(전에는 빠졌음)',
    find: `['item', 'task', 'event', 'category', 'settings'].includes(x.type)`,
    replace: `['item', 'task', 'event', 'category', 'settings', 'routine', 'rlog', 'tt', 'travelmem'].includes(x.type)`
  },
  {
    name: '└ 전체 초기화에 시간표·이동 시간 기억도 포함',
    find: `else if (kind === 'all' && (d.type === 'category' || d.type === 'routine' || d.type === 'rlog' || id === 'settings')) ids.push(id); });\n  ids.forEach(id => removeDoc(id));`,
    replace: `else if (kind === 'all' && (d.type === 'category' || d.type === 'routine' || d.type === 'rlog' || d.type === 'tt' || d.type === 'travelmem' || id === 'settings')) ids.push(id); });\n  ids.forEach(id => removeDoc(id));`
  }
];
