// 시험판 51(대표 11/4 디자인 가이드 '모두 오전 · 오후 (오후 3:00)'): 원본(boxworks.html)과 앞 패치에서 온 화면 · 알림 글의 시각을
// 'HH:MM' 대신 bxT('오후 3:00') · bxTR('오후 3:00–4:00')로. 저장하는 값과 계산은 그대로 'HH:MM'.
// 다른 패치가 모두 바꾼 뒤의 글자를 찾으므로 목록 맨 끝에 붙인다(build-web.mjs).
export default [
  {
    name: '시각 표기(51): 일정 시각 글(알림 · 지난 일정 카드)',
    find: "const timeText = it => window.BX_APP && it.endDate && it.endDate > it.date ? bxSpanTime(it) : it.start ? it.start + (it.end ? '–' + it.end : '') : '종일';",
    replace: "const timeText = it => window.BX_APP && it.endDate && it.endDate > it.date ? bxSpanTime(it) : it.start ? bxTR(it.start, it.end) : '종일';"
  },
  {
    name: '└ 일정 줄의 시작 · 끝',
    find: "it.start ? '<b>' + it.start + '</b>' + (it.end ? '<small>' + it.end + '</small>' : '') : '<b class=\"allday\">종일</b>';",
    replace: "it.start ? '<b>' + bxT(it.start) + '</b>' + (it.end ? '<small>' + bxT(it.end) + '</small>' : '') : '<b class=\"allday\">종일</b>';"
  },
  {
    name: '└ 다른 일정 줄(검색 · 묶음)의 시작 · 끝',
    find: "(o.start ? '<b>' + o.start + '</b>' + (o.end ? '<small>' + o.end + '</small>' : '')",
    replace: "(o.start ? '<b>' + bxT(o.start) + '</b>' + (o.end ? '<small>' + bxT(o.end) + '</small>' : '')"
  },
  {
    name: "└ '지금' 줄",
    find: "지금 ' + hm(now) + '</span></div>'; }",
    replace: "지금 ' + bxT(now) + '</span></div>'; }"
  },
  {
    name: '└ 주간 · 다가오는 일정 · 달력 칩의 시각',
    find: "class=\"wt\">' + i.start",
    replace: "class=\"wt\">' + bxT(i.start)"
  },
  {
    name: '└ 다가오는 일정 목록의 시각',
    find: "class=\"tm\">' + i.start",
    replace: "class=\"tm\">' + bxT(i.start)"
  },
  {
    name: '└ 루틴 카드 머리(시작–끝, 도착)',
    find: "const meta = mm(p.start) + '–' + mm(p.end) + (rt.mode === 'arrive' ? (rt.travel || rt.buffer ? ' · ' + rt.target + ' 도착' : ' 출발') : '');",
    replace: "const meta = bxTR(mm(p.start), mm(p.end)) + (rt.mode === 'arrive' ? (rt.travel || rt.buffer ? ' · ' + bxT(rt.target) + ' 도착' : ' 출발') : '');"
  },
  {
    name: '└ 루틴 진행: 지금 단계 · 다음 단계',
    find: "rt-left tnum\">' + mm(c.at)",
    replace: "rt-left tnum\">' + bxT(mm(c.at))"
  },
  {
    name: '└ 루틴 진행: 다음 단계 시각',
    find: "<b class=\"tnum\">' + mm(s.next.at)",
    replace: "<b class=\"tnum\">' + bxT(mm(s.next.at))"
  },
  {
    name: '└ 루틴 단계 목록 · 미리 보기의 시각',
    find: "rt-t tnum\">' + mm(r.at)",
    replace: "rt-t tnum\">' + bxT(mm(r.at))",
    all: true
  },
  {
    name: '└ 루틴 단계 목록의 도착 시각',
    find: "rt-t tnum\">' + rt.target",
    replace: "rt-t tnum\">' + bxT(rt.target)"
  },
  {
    name: '└ 루틴 미리 보기의 도착 목표',
    find: "rt-t tnum\">' + R.target",
    replace: "rt-t tnum\">' + bxT(R.target)"
  },
  {
    name: '└ 루틴 단계 완료 알림 글',
    find: "' 다음: ' + mm(s.next.at)",
    replace: "' 다음: ' + bxT(mm(s.next.at))"
  },
  {
    name: '└ 루틴 알람 창(시작)',
    find: "line = mm(r.at) + ' · '",
    replace: "line = bxT(mm(r.at)) + ' · '"
  },
  {
    name: '└ 루틴 알람 창(끝)',
    find: "'끝낼 시간 ' + mm(r.endM)",
    replace: "'끝낼 시간 ' + bxT(mm(r.endM))"
  },
  {
    name: '└ 루틴 알람 창(출발 10분 전)',
    find: "line = mm(r.at) + ' 출발",
    replace: "line = bxT(mm(r.at)) + ' 출발"
  },
  {
    name: '└ 루틴 목록 요약(시작 → 끝 · 출발 · 도착)',
    find: "rtWhenText(rt) + ' · ' + mm(p.start) + ' 시작 → ' + (rt.mode === 'arrive' ? mm(p.leave) + ' 출발' + (rt.travel || rt.buffer ? ' · ' + rt.target + ' 도착' : '') : mm(p.end) + ' 끝');",
    replace: "rtWhenText(rt) + ' · ' + bxT(mm(p.start)) + ' 시작 → ' + (rt.mode === 'arrive' ? bxT(mm(p.leave)) + ' 출발' + (rt.travel || rt.buffer ? ' · ' + bxT(rt.target) + ' 도착' : '') : bxT(mm(p.end)) + ' 끝');"
  },
  {
    name: '└ 루틴 편집 미리 보기(도착 모드)',
    find: "sum = '<b class=\"tnum\">' + mm(p.start) + '</b>에 시작하면 <b class=\"tnum\">' + mm(p.leave) + '</b>에 출발해요' + (R.travel || R.buffer ? '. 이동 ' + R.travel + '분 뒤 <b class=\"tnum\">' + mm(p.leave + R.travel) + '</b>에 도착하고, ' + R.target + '까지 '",
    replace: "sum = '<b class=\"tnum\">' + bxT(mm(p.start)) + '</b>에 시작하면 <b class=\"tnum\">' + bxT(mm(p.leave)) + '</b>에 출발해요' + (R.travel || R.buffer ? '. 이동 ' + R.travel + '분 뒤 <b class=\"tnum\">' + bxT(mm(p.leave + R.travel)) + '</b>에 도착하고, ' + bxT(R.target) + '까지 '"
  },
  {
    name: '└ 루틴 편집 미리 보기(시작 모드)',
    find: "sum = '<b class=\"tnum\">' + mm(p.start) + '</b>에 시작해 <b class=\"tnum\">' + mm(p.end) + '</b>에 끝나요.';",
    replace: "sum = '<b class=\"tnum\">' + bxT(mm(p.start)) + '</b>에 시작해 <b class=\"tnum\">' + bxT(mm(p.end)) + '</b>에 끝나요.';"
  },
  {
    name: '└ 루틴 저장 알림 글',
    find: "toast(doc.once ? '오늘 할 일 순서를 저장했어요. ' + mm(p.start) + '부터 차례로 알려 드릴게요.' : doc.name + (window.BX_APP ? bxJosaUl(doc.name) : '을') + ' 저장했어요. ' + (window.BX_APP ? rtWhenText(doc) : daysText(doc.days)) + ' ' + mm(p.start) + '에 시작해요.');",
    replace: "toast(doc.once ? '오늘 할 일 순서를 저장했어요. ' + bxT(mm(p.start)) + '부터 차례로 알려 드릴게요.' : doc.name + (window.BX_APP ? bxJosaUl(doc.name) : '을') + ' 저장했어요. ' + (window.BX_APP ? rtWhenText(doc) : daysText(doc.days)) + ' ' + bxT(mm(p.start)) + '에 시작해요.');"
  },
  {
    name: '└ 일정 창 시간 칸 글',
    find: "F.timed && isHM(F.start) ? (window.BX_APP && bxFMulti() ? F.start + ' 시작' + (isHM(F.end) ? ' · ' + F.end + ' 끝' : '') : F.start + (isHM(F.end) ? '–' + F.end : '')) : '종일'",
    replace: "F.timed && isHM(F.start) ? (window.BX_APP && bxFMulti() ? bxT(F.start) + ' 시작' + (isHM(F.end) ? ' · ' + bxT(F.end) + ' 끝' : '') : bxTR(F.start, isHM(F.end) ? F.end : '')) : '종일'"
  },
  {
    name: '└ 새 일정 해석 결과(제목 아래)',
    find: "(p.start ? ' ' + p.start + (p.end ? '–' + p.end : '') : F.timed && isHM(F.start) ? ' ' + F.start : '')",
    replace: "(p.start ? ' ' + bxTR(p.start, p.end) : F.timed && isHM(F.start) ? ' ' + bxT(F.start) : '')"
  },
  {
    name: '└ 지난 일정: 늦추기 · 옮기기 고르는 칸',
    find: "sub: ok ? fromMin(s)",
    replace: "sub: ok ? bxT(fromMin(s))"
  },
  {
    name: '└ 지난 일정: 옮길 날의 시각',
    find: "tm = it.start ? ' ' + it.start",
    replace: "tm = it.start ? ' ' + bxT(it.start)"
  },
  {
    name: '└ 지난 일정: 늦춘 시각',
    find: "return fromMin(s.start) + '로 지연'",
    replace: "return bxT(fromMin(s.start)) + '로 지연'"
  },
  {
    name: '└ 지난 일정: 늦췄다는 알림 글',
    find: "'오늘 ' + patch.start + '로 지연",
    replace: "'오늘 ' + bxT(patch.start) + '로 지연"
  }
];
