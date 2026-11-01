// 정리판(대표 결정 2026-11-01): 웹 시절 화면 위에 얹어 온 것 치우기. 앱 쪽 코드는 web-src/tidy.js
export default [
  {
    name: '정리판 · 설정: 앱에서는 web-src/tidy.js의 bxSettingsHtml(메인 색·분류 색·공휴일·설명서·웹 연동 칸 없음)',
    find: "function settingsHtml(){\n  const st = M.settings;",
    replace: "function settingsHtml(){\n  if (window.BX_APP) return bxSettingsHtml();\n  const st = M.settings;"
  },
  {
    name: '└ 분류 관리 창의 \'분류 색 표시\'도 앱에서는 뺌(늘 켬)',
    find: "  setSheet('<div class=\"set-row\"><span>목록과 달력에 분류 색 표시</span>",
    replace: "  setSheet((window.BX_APP ? '' : '<div class=\"set-row\"><span>목록과 달력에 분류 색 표시</span>"
  },
  {
    name: '└ (분류 색 줄 끝)',
    find: "aria-pressed=\"' + (M.settings.catColors !== false) + '\">켜기</button></div></div>' + M.cats.map(",
    replace: "aria-pressed=\"' + (M.settings.catColors !== false) + '\">켜기</button></div></div>') + M.cats.map("
  },
  {
    name: '정리판 · 루틴 고치기 창: 아래 단계 칸과 같은 단계 목록(미리보기)은 앱에서 빼고 "07:30에 시작해 08:07에 끝나요" 한 줄만',
    find: "    '<ol class=\"rt-steps prev\">' + p.rows.map(",
    replace: "    (window.BX_APP ? '' : '<ol class=\"rt-steps prev\">' + p.rows.map("
  },
  {
    name: '└ (미리보기 목록 끝)',
    find: "'<li class=\"arr\"><span class=\"rt-t tnum\">' + R.target + '</span><span class=\"rt-n\">도착 목표</span><span class=\"rt-s\"></span></li>' : '') + '</ol>';",
    replace: "'<li class=\"arr\"><span class=\"rt-t tnum\">' + R.target + '</span><span class=\"rt-n\">도착 목표</span><span class=\"rt-s\"></span></li>' : '') + '</ol>');"
  },
  {
    name: '└ 소제목 \'시간표\'(시간표 기능과 같은 말)는 앱에서 뺌',
    find: "'<div class=\"fgrid\"><span class=\"fg-l\">시간표</span><div id=\"r-prev\" class=\"rt-prev\">'",
    replace: "'<div class=\"fgrid\">' + (window.BX_APP ? '' : '<span class=\"fg-l\">시간표</span>') + '<div id=\"r-prev\" class=\"rt-prev\">'"
  },
  {
    name: '정리판 · 일정 고치기 창: \'완료\'는 빼고(다 했어요는 동그라미·꾹 메뉴), 휴지통 그림 대신 \'지우기\' 글자',
    find: ": '<button type=\"button\" class=\"btn sq danger\" data-act=\"delete\" aria-label=\"삭제\">' + ICON.trash + '</button><button type=\"button\" class=\"btn grow\" data-act=\"edit-done\">' + (F.done ? '완료 취소' : ICON.check + '완료') + '</button><button type=\"button\" class=\"btn primary grow\" data-act=\"save\">저장</button>');",
    replace: ": window.BX_APP ? '<button type=\"button\" class=\"btn bx-del-btn\" data-act=\"delete\">' + ICON.trash + '지우기</button><button type=\"button\" class=\"btn primary grow\" data-act=\"save\">저장</button>'\n      : '<button type=\"button\" class=\"btn sq danger\" data-act=\"delete\" aria-label=\"삭제\">' + ICON.trash + '</button><button type=\"button\" class=\"btn grow\" data-act=\"edit-done\">' + (F.done ? '완료 취소' : ICON.check + '완료') + '</button><button type=\"button\" class=\"btn primary grow\" data-act=\"save\">저장</button>');"
  },
  {
    name: '└ 창 이름 \'일정 수정\' → 앱에서는 \'일정 고치기\'(꾹 메뉴의 \'고치기\'와 같은 말)',
    find: "openSheet({title: F.mode === 'new' ? '새 일정' : '일정 수정', draw: drawEdit, refresh: null});",
    replace: "openSheet({title: F.mode === 'new' ? '새 일정' : (window.BX_APP ? '일정 고치기' : '일정 수정'), draw: drawEdit, refresh: null});"
  },
  {
    name: '└ 새 일정 예시를 생활 예시로(업무 앱 흔적 \'거래처 미팅\')',
    find: "placeholder=\"' + (F.mode === 'new' ? '예) 내일 오후 3시 거래처 미팅' : '일정 제목') + '",
    replace: "placeholder=\"' + (F.mode === 'new' ? (window.BX_APP ? '예) 내일 오후 3시 치과' : '예) 내일 오후 3시 거래처 미팅') : '일정 제목') + '"
  },
  {
    name: '정리판 · 남은 일정 목록: \'예약\' → \'남은\'(홈 숫자 칸과 같은 말)',
    find: "name = {remain: '예약된 일정', done: '완료한 일정', late: '확인이 필요한 일정'}[kind];",
    replace: "name = {remain: window.BX_APP ? '남은 일정' : '예약된 일정', done: '완료한 일정', late: '확인이 필요한 일정'}[kind];"
  },
  {
    name: '└ (빈 목록 글)',
    find: "day + ' 남은 예약 일정이 없어요.'",
    replace: "day + (window.BX_APP ? ' 남은 일정이 없어요.' : ' 남은 예약 일정이 없어요.')"
  },
  {
    name: '└ (탭 이름)',
    find: "[['remain', '예약'], ['done', '완료'], ['late', '확인 필요']]",
    replace: "[['remain', window.BX_APP ? '남은' : '예약'], ['done', '완료'], ['late', '확인 필요']]"
  },
  {
    name: '정리판 · 지운 뒤 알림 \'삭제했어요\' → \'지웠어요\'(꾹 메뉴·고치기 창의 \'지우기\'와 같은 말)',
    find: "toast('삭제했어요. 휴지통에 30일 동안 남아요.', [['되돌리기', doUndo]]);",
    replace: "toast(window.BX_APP ? '지웠어요. 휴지통에 30일 동안 남아요.' : '삭제했어요. 휴지통에 30일 동안 남아요.', [['되돌리기', doUndo]]);"
  },
  {
    name: '정리판 · 찾기 결과 없음: 조사(‘아침’과 / ‘치과’와)',
    find: "'<p class=\"p small\">‘' + esc(q) + '’와 맞는 일정이 없어요.<",
    replace: "'<p class=\"p small\">‘' + esc(q) + '’' + bxJosaWa(q) + ' 맞는 일정이 없어요.<"
  },
  {
    name: '정리판 · 휴지통: 복원 → 되살리기, 영구 삭제 → 완전히 지우기',
    find: "data-restore=\"' + esc(x.id) + '\">복원</button><button type=\"button\" class=\"btn sm danger\" data-purge=\"' + esc(x.id) + '\">영구 삭제</button></div>').join('') : '<p class=\"p small\">비어 있어요. 삭제한 일정은 30일 동안 여기에 남아요.</p>'),",
    replace: "data-restore=\"' + esc(x.id) + '\">' + (window.BX_APP ? '되살리기' : '복원') + '</button><button type=\"button\" class=\"btn sm danger\" data-purge=\"' + esc(x.id) + '\">' + (window.BX_APP ? '완전히 지우기' : '영구 삭제') + '</button></div>').join('') : '<p class=\"p small\">' + (window.BX_APP ? '비어 있어요. 지운 일정은 30일 동안 여기에 남아요.' : '비어 있어요. 삭제한 일정은 30일 동안 여기에 남아요.') + '</p>'),"
  },
  {
    name: '정리판 · 백업: 단추 이름을 하는 일로, 파일 고르기는 한국어 단추(브라우저 기본 칸 \'Choose File\' 대신)',
    find: "ICON.save + '백업 파일 (JSON)</button><button type=\"button\" class=\"btn\" data-act=\"export-csv\">표 파일 (CSV)</button></div>' +\n      '<div class=\"fld\"><label class=\"fld-l\" for=\"import-file\">백업 불러오기</label><input type=\"file\" id=\"import-file\" accept=\".json,application/json\" class=\"inp full\" style=\"padding-top:10px\"></div><div id=\"export-fallback\"></div>', '');",
    replace: "ICON.save + (window.BX_APP ? '백업 파일 만들기' : '백업 파일 (JSON)') + '</button><button type=\"button\" class=\"btn\" data-act=\"export-csv\">' + (window.BX_APP ? '표 파일로 내보내기' : '표 파일 (CSV)') + '</button></div>' +\n      (window.BX_APP ? '<div class=\"fld\"><span class=\"fld-l\">백업 불러오기</span><label class=\"btn bx-file-btn\" for=\"import-file\">' + BX_UP_ICON + '백업 파일 고르기</label><input type=\"file\" id=\"import-file\" accept=\".json,application/json\" class=\"sr\"></div>' : '<div class=\"fld\"><label class=\"fld-l\" for=\"import-file\">백업 불러오기</label><input type=\"file\" id=\"import-file\" accept=\".json,application/json\" class=\"inp full\" style=\"padding-top:10px\"></div>') + '<div id=\"export-fallback\"></div>', '');"
  },
  {
    name: '정리판 · 다른 날에 일정을 넣으면 알림에 \'보기\'(홈에 방금 넣은 일정이 안 보이던 문제)',
    find: "    toast('일정을 추가했어요 · ' + when, [['되돌리기', doUndo]]);",
    replace: "    toast('일정을 추가했어요 · ' + when, (window.BX_APP && S.view === 'today' && fields.date !== homeViewDate()) ? [['보기', () => bxShowDay(fields.date)], ['되돌리기', doUndo]] : [['되돌리기', doUndo]]);"
  },
  {
    name: '정리판 · 새로 설치한 휴대폰의 기본 분류 \'업무\' → \'일·공부\'(업무 앱 흔적, 이미 만든 분류는 그대로)',
    find: "  {id:'c_work', name:'업무', color:'#2a78d6', order:1},",
    replace: "  {id:'c_work', name: window.BX_APP ? '일·공부' : '업무', color:'#2a78d6', order:1},"
  },
  {
    name: '정리판 · 처음 그릴 때 뺀 설정 값 되돌리기(메인 색 파랑, 분류 색 켬)',
    find: "  if (M.settings.accent && M.settings.accent !== lsGet('bx:accent')) applyAccent(M.settings.accent);",
    replace: "  if (window.BX_APP) bxTidyBoot();\n  if (M.settings.accent && M.settings.accent !== lsGet('bx:accent')) applyAccent(M.settings.accent);"
  }
];
