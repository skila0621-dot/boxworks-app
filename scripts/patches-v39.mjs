// 시험판 39(대표 결정 11/3 21:4x~21:51, 정할 것 13 · 14번, 결정 기록 D-15): 여러 날 일정 · 분류를 캘린더로.
// 화면 쪽 코드는 web-src/v39.js. 여기서는 원본(boxworks.html)의 일정 모델 · 목록 줄 · 월간 · 새 일정 창 · 말로 넣기에 고리를 단다
export default [
  {
    name: '여러 날 일정은 첫날부터 끝나는 날까지 날마다 목록에 넣기(최대 93일)',
    find: "items.forEach(it => { if (!byDate.has(it.date)) byDate.set(it.date, []); byDate.get(it.date).push(it); });",
    replace: "items.forEach(it => { const n = window.BX_APP && it.endDate && it.endDate > it.date && isDate(it.endDate) ? Math.min(92, diffDays(it.endDate, it.date)) : 0; for (let k = 0; k <= n; k++) { const ds = k ? ymd(addDays(parseYmd(it.date), k)) : it.date; if (!byDate.has(ds)) byDate.set(ds, []); byDate.get(ds).push(it); } });"
  },
  {
    name: '└ 같은 날 안에서는 여러 날 일정을 맨 위에',
    find: 'byDate.forEach(a => a.sort(byTime));',
    replace: 'byDate.forEach(a => a.sort(window.BX_APP ? bxByDay : byTime));'
  },
  {
    name: '└ 여러 날 일정의 끝 = 끝나는 날(끝 시각이 있으면 그 시각, 없으면 그날 밤)',
    find: 'function dueAt(it){ return it.end ? at(it.date, it.end) : it.start ? at(it.date, it.start) : addDays(parseYmd(it.date), 1); }',
    replace: 'function dueAt(it){ const d = window.BX_APP && it.endDate && it.endDate > it.date ? it.endDate : it.date; return it.end ? at(d, it.end) : it.start && d === it.date ? at(d, it.start) : addDays(parseYmd(d), 1); }'
  },
  {
    name: "└ 여러 날 일정은 기간이라 끝나도 '확인 필요'로 묻지 않음",
    find: 'const isLate = it => !it.done && !it.pc && dueAt(it) <= M.now',
    replace: 'const isLate = it => !it.done && !it.pc && !(window.BX_APP && it.endDate && it.endDate > it.date) && dueAt(it) <= M.now'
  },
  {
    name: "└ '곧 시작 · 진행 중' 꼬리표는 하루 일정만",
    find: 'if (it.done || !it.start || it.date !== M.today || isLate(it)) return null;',
    replace: 'if (it.done || !it.start || it.date !== M.today || isLate(it) || (window.BX_APP && it.endDate && it.endDate > it.date)) return null;'
  },
  {
    name: "└ 알림 글의 시각: '10:00 시작 · ~11/8 (일) 15:00'",
    find: "const timeText = it => it.start ? it.start + (it.end ? '–' + it.end : '') : '종일';",
    replace: "const timeText = it => window.BX_APP && it.endDate && it.endDate > it.date ? bxSpanTime(it) : it.start ? it.start + (it.end ? '–' + it.end : '') : '종일';"
  },
  {
    name: "목록 줄: 여러 날 일정은 '2/3일째 · ~11/8 (일)', 찾기에서는 '11월 6일 ~ 8일'",
    find: "  if (o.showDate) meta.push('<span class=\"meta\">' + esc(relDay(it.date, M.today)) + '</span>');",
    replace: "  if (o.showDate) meta.push('<span class=\"meta\">' + esc(window.BX_APP && bxSpan(it) ? bxRangeShort(it) : relDay(it.date, M.today)) + '</span>');\n  else if (window.BX_APP && bxSpan(it)) meta.push('<span class=\"meta bx-span-d\">' + esc(bxSpanLabel(it, o.day)) + '</span>');"
  },
  {
    name: '└ 줄의 캘린더 점은 일정 색(고른 색, 없으면 캘린더 색)',
    find: "  if (cat) meta.push('<span class=\"meta\"><i class=\"dot\" style=\"--c:' + catColor(cat.id) + '\"></i>' + esc(cat.name) + '</span>');\n  else if (window.BX_APP && it.pc)",
    replace: "  if (cat) meta.push('<span class=\"meta\"><i class=\"dot\" style=\"--c:' + (window.BX_APP ? bxItemColor(it) : catColor(cat.id)) + '\"></i>' + esc(cat.name) + '</span>');\n  else if (window.BX_APP && it.pc)"
  },
  {
    name: '└ 시각 칸: 첫날 시작 · 가운데 날 종일 · 마지막 날 끝',
    find: "  const time = it.start ? '<b>' + it.start + '</b>' + (it.end ? '<small>' + it.end + '</small>' : '') : '<b class=\"allday\">종일</b>';",
    replace: "  const time = window.BX_APP && bxSpan(it) ? bxSpanTimeCol(it, o.day) : it.start ? '<b>' + it.start + '</b>' + (it.end ? '<small>' + it.end + '</small>' : '') : '<b class=\"allday\">종일</b>';"
  },
  {
    name: '└ 여러 날 줄은 캘린더 색으로 옅게',
    find: "(ts ? ' ' + ts.k : '') + '\">' +",
    replace: "(ts ? ' ' + ts.k : '') + (window.BX_APP && bxSpan(it) ? ' bx-span\" style=\"--c:' + bxItemColor(it) : '') + '\">' +"
  },
  {
    name: "홈: '홈에 보이기'를 끈 캘린더는 그날 목록에서 빼기(놓친 일정은 그대로)",
    find: 'const dayIts = dayItems(vd);',
    replace: 'const dayIts = window.BX_APP ? bxHomeItems(dayItems(vd)) : dayItems(vd);'
  },
  {
    name: '└ 위 숫자(남은 · 완료)에는 여러 날 일정을 세지 않음(기간이라서)',
    find: 'const doneN = dayIts.filter(i => i.done).length;',
    replace: 'const doneN = dayIts.filter(i => i.done && !(window.BX_APP && bxSpan(i))).length;'
  },
  {
    name: '└ (남은)',
    find: 'const remainN = dayIts.filter(i => !i.done && !isLate(i)).length;',
    replace: 'const remainN = dayIts.filter(i => !i.done && !isLate(i) && !(window.BX_APP && bxSpan(i))).length;'
  },
  {
    name: "└ '다음 일정'은 오늘 시작하는 것만",
    find: 'const next = isT ? dayIts.filter(i => !i.done && i.start && at(today, i.start) > now)[0] : null;',
    replace: 'const next = isT ? dayIts.filter(i => !i.done && i.start && at(today, i.start) > now && !(window.BX_APP && bxSpan(i) && i.date !== today))[0] : null;'
  },
  {
    name: "└ 지난 일정(확인 필요)에 이어지는 여러 날 일정을 넣지 않음",
    find: 'const pastLate = isT ? M.items.filter(i => !i.done && !i.pc && i.date < today)',
    replace: 'const pastLate = isT ? M.items.filter(i => !i.done && !i.pc && i.date < today && !(window.BX_APP && bxSpan(i)))'
  },
  {
    name: '└ 홈 상자에 넘기는 개수(n: 하루 일정, ns: 여러 날)',
    find: '{isT, vd, title, n: dayIts.length, remainN',
    replace: '{isT, vd, title, n: window.BX_APP ? dayIts.filter(i => !bxSpan(i)).length : dayIts.length, ns: window.BX_APP ? dayIts.filter(bxSpan).length : 0, remainN'
  },
  {
    name: '└ 홈 목록 줄에 그날을 알려 줌(몇째 날)',
    find: 'rows += rowHtml(i);',
    replace: 'rows += rowHtml(i, {day: vd});'
  },
  {
    name: '└ 숫자를 누르면 나오는 목록도 홈과 같이',
    find: 'const vd = homeViewDate(), isT = vd === M.today, its = dayItems(vd);',
    replace: 'const vd = homeViewDate(), isT = vd === M.today, its = window.BX_APP ? bxHomeItems(dayItems(vd)).filter(i => !bxSpan(i)) : dayItems(vd);'
  },
  {
    name: '└ (목록 줄)',
    find: "rowHtml(i, {showDate: kind === 'late' && i.date !== vd})",
    replace: "rowHtml(i, {showDate: kind === 'late' && i.date !== vd, day: vd})"
  },
  {
    name: '날짜 창: 캘린더 화면에서 칩을 골라 두었으면 그 캘린더만(맨 위에 한 줄), 줄마다 몇째 날',
    find: "function drawDay(ds, full){\n  const its = dayItems(ds), hol = HOLIDAYS[ds];\n  const list = (hol ? '<p class=\"day-hol\">' + esc(hol) + '</p>' : '') + (its.length ? '<div class=\"list\">' + its.map(i => rowHtml(i)).join('')",
    replace: "function drawDay(ds, full){\n  const its = window.BX_APP ? bxCalFilter(dayItems(ds)) : dayItems(ds), hol = HOLIDAYS[ds];\n  const list = (window.BX_APP ? bxCalFilterNote() : '') + (hol ? '<p class=\"day-hol\">' + esc(hol) + '</p>' : '') + (its.length ? '<div class=\"list\">' + its.map(i => rowHtml(i, {day: ds})).join('')"
  },
  {
    name: '주간: 고른 캘린더만, 줄마다 몇째 날',
    find: 'const d = addDays(start, k), ds = ymd(d), its = dayItems(ds);',
    replace: 'const d = addDays(start, k), ds = ymd(d), its = window.BX_APP ? bxCalFilter(dayItems(ds)) : dayItems(ds);'
  },
  {
    name: '└ 주간 위 개수: 여러 날 일정은 그 주에 한 번만',
    find: 'total += its.length; done += its.filter(i => i.done).length; late += its.filter(isLate).length;',
    replace: "{ const its1 = window.BX_APP ? its.filter(i => !bxSpan(i) || i.date === ds || k === 0) : its; total += its1.length; done += its1.filter(i => i.done).length; late += its1.filter(isLate).length; }"
  },
  {
    name: '└ (주간 목록 줄)',
    find: "(its.length ? '<div class=\"list\">' + its.map(i => rowHtml(i)).join('') + '</div>' : '<p class=\"empty\">일정 없음</p>') + '</section>';",
    replace: "(its.length ? '<div class=\"list\">' + its.map(i => rowHtml(i, {day: ds})).join('') + '</div>' : '<p class=\"empty\">일정 없음</p>') + '</section>';"
  },
  {
    name: '월간 칸: 여러 날은 날짜를 잇는 막대, 하루 일정은 남은 줄(web-src/v39.js bxMonthCellsHtml)',
    find: "  const cells = monthCells(y, m).map(d => {\n    const ds = ymd(d), its = dayItems(ds), hol = HOLIDAYS[ds];\n    const s = its.slice().sort(bySummary);\n    const cmax",
    replace: "  const cells = window.BX_APP ? bxMonthCellsHtml(y, m) : monthCells(y, m).map(d => {\n    const ds = ymd(d), its = dayItems(ds), hol = HOLIDAYS[ds];\n    const s = its.slice().sort(bySummary);\n    const cmax"
  },
  {
    name: '└ 월간 위 개수 줄도 고른 캘린더만',
    find: 'const inMonth = M.items.filter(i => {',
    replace: 'const inMonth = M.items.filter(i => window.BX_APP ? bxMonthPick(i) : true).filter(i => {'
  },
  {
    name: "새 일정 창: 날짜 칩에 '11월 6일 ~ 8일'",
    find: "tab('date', ICON.cal, relDay(F.date, ymd(new Date())), true)",
    replace: "tab('date', ICON.cal, window.BX_APP && bxFMulti() ? bxFRangeLabel() : relDay(F.date, ymd(new Date())), true)"
  },
  {
    name: "└ 시각 칩: 여러 날이면 '10:00 시작 · 15:00 끝'",
    find: "tab('time', ICON.clock, F.timed && isHM(F.start) ? F.start + (isHM(F.end) ? '–' + F.end : '') : '종일', F.timed)",
    replace: "tab('time', ICON.clock, F.timed && isHM(F.start) ? (window.BX_APP && bxFMulti() ? F.start + ' 시작' + (isHM(F.end) ? ' · ' + F.end + ' 끝' : '') : F.start + (isHM(F.end) ? '–' + F.end : '')) : '종일', F.timed)"
  },
  {
    name: "└ '분류' 칩은 '캘린더' 칩(점은 이 일정 색)",
    find: "tab('cat', cat ? '<i class=\"dot\" style=\"--c:' + catColor(cat.id) + '\"></i>' : ICON.tag, cat ? cat.name : '분류', !!cat)",
    replace: "tab('cat', window.BX_APP ? (cat || F.color ? '<i class=\"dot\" style=\"--c:' + bxFColor() + '\"></i>' : ICON.tag) : cat ? '<i class=\"dot\" style=\"--c:' + catColor(cat.id) + '\"></i>' : ICON.tag, cat ? cat.name : window.BX_APP ? '캘린더' : '분류', !!cat || !!(window.BX_APP && F.color))"
  },
  {
    name: '└ 여러 날에서 시간을 켜면 끝 시각은 비워 둠(마지막 날 끝을 따로 고름)',
    find: 'if (F.timed && !F.end && F.start) F.end',
    replace: 'if (F.timed && !F.end && F.start && !(window.BX_APP && bxFMulti())) F.end'
  },
  {
    name: '└ 여러 날에서 시작 시각을 바꿔도 마지막 날 끝 시각은 그대로',
    find: 'if (F.end && isHM(old)) {',
    replace: 'if (F.end && isHM(old) && !(window.BX_APP && bxFMulti())) {'
  },
  {
    name: '└ 저장: 여러 날이면 끝 시각이 시작보다 일러도 됨(다른 날)',
    find: 'if (start && end && end <= start) { end = null;',
    replace: 'if (start && end && end <= start && !(window.BX_APP && bxFMulti())) { end = null;'
  },
  {
    name: '└ 저장: 끝나는 날 · 이 일정 색',
    find: "const fields = {title, date: F.date, start, end, categoryId: F.categoryId || null, remind, location: (F.location || '').trim(), note: F.note || ''};",
    replace: "const fields = {title, date: F.date, start, end, categoryId: F.categoryId || null, remind, location: (F.location || '').trim(), note: F.note || ''};\n  if (window.BX_APP) bxFFields(fields);"
  },
  {
    name: '└ 끝나는 날을 바꿔도 옮긴 것으로(확인 표시 다시)',
    find: 'const moved = cur.date !== fields.date || cur.start !== fields.start || cur.end !== fields.end;',
    replace: 'const moved = cur.date !== fields.date || cur.start !== fields.start || cur.end !== fields.end || (cur.endDate || null) !== (fields.endDate || null);'
  },
  {
    name: "└ 저장 알림 글: '11월 6일 ~ 8일'",
    find: "const when = relDay(F.date, ymd(new Date())) + (start ? ' ' + start : '')",
    replace: "const when = (window.BX_APP && fields.endDate ? bxRangeShort(fields) : relDay(F.date, ymd(new Date()))) + (start ? ' ' + start : '')"
  },
  {
    name: "말로 넣기: '6일부터 8일까지' · '11월 6~8일' · '내일부터 3일간' → 여러 날",
    find: 'const r = bxQuickFix(parseQuick0(bxQuickPre(s, now), now), !!(pr || tv || rm));',
    replace: 'const rg = window.BX_APP ? bxRangeExtract(s, now) : null; if (rg) s = rg.text;\n  const r = bxQuickFix(parseQuick0(bxQuickPre(s, now), now), !!(pr || tv || rm || rg));\n  if (rg) { r.date = rg.start; r.endDate = rg.end; }'
  },
  {
    name: '찾기: 아직 이어지는 여러 날 일정은 다가오는 쪽에',
    find: 'const up = hit.filter(i => i.date >= M.today)',
    replace: 'const up = hit.filter(i => (window.BX_APP && bxSpan(i) ? i.endDate : i.date) >= M.today)'
  },
  {
    name: '└ (지난 쪽)',
    find: 'const past = hit.filter(i => i.date < M.today)',
    replace: 'const past = hit.filter(i => (window.BX_APP && bxSpan(i) ? i.endDate : i.date) < M.today)'
  },
  {
    name: "낱말: 새 일정 창 칩 줄 이름(화면 읽기)의 '분류' → '캘린더'",
    find: 'role="tablist" aria-label="날짜·시간·알림·분류·장소"',
    replace: 'role="tablist" aria-label="날짜·시간·알림·캘린더·장소"'
  },
  {
    name: "└ 초기화 확인 글의 '분류 N개' → '캘린더 N개'",
    find: "'일정 ' + n + '개, 분류 ' + M.cats.length + '개, 루틴 '",
    replace: "'일정 ' + n + '개, ' + (window.BX_APP ? '캘린더 ' : '분류 ') + M.cats.length + '개, 루틴 '"
  },
  {
    name: "표(CSV) 파일: '분류' 칸은 '캘린더', 끝에 '끝나는 날' 칸",
    find: "const rows = [['날짜', '시작', '끝', '제목', '분류', '상태', '장소', '메모', '미룬 횟수']];",
    replace: "const rows = [['날짜', '시작', '끝', '제목', window.BX_APP ? '캘린더' : '분류', '상태', '장소', '메모', '미룬 횟수'].concat(window.BX_APP ? ['끝나는 날'] : [])];"
  },
  {
    name: '└ (끝나는 날 값)',
    find: "i.location || '', i.note || '', i.slips || 0]));",
    replace: "i.location || '', i.note || '', i.slips || 0].concat(window.BX_APP ? [i.endDate || ''] : [])));"
  }
];
