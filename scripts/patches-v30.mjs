// 시험판 30: 주간 빈 날 한 줄, 일정 넣는 입구 하나로·마이크에 글자(수정·보완 목록 18·19),
// 누르면 나오는 칸은 누른 자리에서(제품 원칙 규칙 12, 목록 20). 화면 모양은 web-src/v30.js
export default [
  {
    name: '주간: 일정 없는 날은 한 줄로(빈 공간, 대표 11/2)',
    find: "secs += '<section class=\"day-g ' + dayClass(ds) + '\" id=\"d-' + ds + '\"",
    replace: "secs += '<section class=\"day-g ' + dayClass(ds) + (window.BX_APP && !its.length ? ' bx-wk-empty' : '') + '\" id=\"d-' + ds + '\""
  },
  {
    name: "└ 빈 날 머리 줄에 '일정 없음'을 붙이고, 넣기 단추는 + 하나",
    find: "(hol ? '<span class=\"hol\">' + esc(hol) + '</span>' : '') + '<span class=\"sp\"></span>' + addBtn(ds, fmtMD(ds) + '에 일정 추가') + '</div>' +",
    replace: "(hol ? '<span class=\"hol\">' + esc(hol) + '</span>' : '') + (window.BX_APP && !its.length ? '<span class=\"bx-wk-none\">일정 없음</span>' : '') + '<span class=\"sp\"></span>' + addBtn(ds, fmtMD(ds) + ' 일정 추가') + '</div>' +"
  },
  {
    name: "└ '+ 추가'는 앱에서 + 하나(새 일정 +와 같은 그림, 규칙 1)",
    find: "const addBtn = (date, label) => '<button type=\"button\" class=\"sec-link add\" data-act=\"new\" data-date=\"' + date + '\"' + (label ? ' aria-label=\"' + esc(label) + '\"' : '') + '>' + ICON.plus + '추가</button>';",
    replace: "const addBtn = (date, label) => '<button type=\"button\" class=\"sec-link add\" data-act=\"new\" data-date=\"' + date + '\"' + (label ? ' aria-label=\"' + esc(label) + '\"' : window.BX_APP ? ' aria-label=\"일정 추가\"' : '') + '>' + ICON.plus + (window.BX_APP ? '' : '추가') + '</button>';"
  },
  {
    name: "날짜 창의 넣기 칸은 '이날 일정 넣기' 한 줄로, 같은 새 일정 창이 그 날짜로 열린다(입구 하나로, 규칙 8)",
    find: "setSheet('<div id=\"day-list\">' + list + '</div>',\n    '<label class=\"sr\" for=\"day-in\">할 일 추가</label>",
    replace: "setSheet('<div id=\"day-list\">' + list + '</div>', window.BX_APP ? '<button type=\"button\" class=\"btn primary grow\" data-act=\"new\" data-date=\"' + ds + '\">' + ICON.plus + '일정 추가</button>' :\n    '<label class=\"sr\" for=\"day-in\">할 일 추가</label>"
  },
  {
    // 시험판 30에서 '말하기' 글자를 붙였다(규칙 1: 표준 아이콘 말고는 그림만 있는 단추를 두지 않는다).
    // 시험판 60(대표 11/5 22:03 선택실 5 메모 "말하기 버튼 굳이 한글 써놓기 보단 마이크 아이콘으로만 만들어놓아도 사람들이 마이크 입력 방법인걸 인지 할것이다.
    // 가로 사이즈를 줄이고 색이있는 배경에 마이크 아이콘만"): 마이크는 표준 아이콘으로 보고 글자를 뺀다. 이름(말하기)은 화면 읽기용으로 남김
    name: '└ 마이크 단추: 예문을 받고, 아이콘만(이름은 화면 읽기용 말하기)',
    find: "data-prompt=\"' + esc(prompt || '') + '\" aria-label=\"말하기\"><svg",
    replace: "data-prompt=\"' + esc(prompt || '') + '\"' + (ex ? ' data-ex=\"' + esc(ex) + '\"' : '') + ' aria-label=\"말하기\"><svg"
  },
  {
    name: '새 일정·일정 고치기 창에 이름표(여백 줄이기·칸이 열릴 때 부드럽게 커지기, web-src/v30.js). 창은 작게 시작(대표 결정 11/2 밤)',
    find: "openSheet({title: F.mode === 'new' ? '새 일정' : '일정 수정', draw: drawEdit, refresh: null});",
    replace: "openSheet({title: F.mode === 'new' ? '새 일정' : '일정 수정', draw: drawEdit, refresh: null});\n  if (window.BX_APP) { const sh = $('#sheet-root .sheet'); if (sh) sh.classList.add('bx-esheet'); }"
  },
  {
    name: "일정 알림: 고르는 칸 규칙(규칙 11, D-10) — 정시·10분 전·1시간 전(시간 없는 일정은 당일 오전 9시·전날 오후 9시) + 직접 입력, '알림 없이'는 아래 글자 단추",
    find: "function drawFRem(){\n  drawFChips();\n  const el = $('#f-rem'); if (!el) return;",
    replace: "function drawFRem(){\n  drawFChips();\n  const el0 = $('#f-rem'); if (!el0) return;\n  if (window.BX_APP && !F.remAdv) { el0.innerHTML = bxRemQuick() + bxRemLoud(); return; }\n  // 직접 입력: 칩 줄 바로 아래에 예전의 자세한 칸(여러 개·정한 시각). 크게 울리기(시험판 65)는 늘 맨 아래\n  let el = el0; if (window.BX_APP) { el0.innerHTML = bxRemQuick() + '<div class=\"bx-rem-adv\"></div>' + bxRemLoud(); el = el0.querySelector('.bx-rem-adv'); }"
  },
  {
    name: '└ 마이크 단추가 예문을 받는다(말하기를 누르면 듣는 동안 예문 두 개, 대표 11/2 밤)',
    find: "function bxMic(id, prompt){",
    replace: "function bxMic(id, prompt, ex){"
  },
  {
    name: '└ 새 일정 제목 칸 마이크에 예문 두 개',
    find: "bxMic('f-title', '예) 내일 오후 3시 치과')",
    replace: "bxMic('f-title', '예) 내일 오후 3시 치과', '내일 오후 3시 치과|금요일 저녁 7시 친구 약속')"
  },
  {
    // 시험판 37(대표 지적 11/3 18:12 "'알림 없음'을 바로 체크한 것처럼 보인다. 누르면 켜고 끄기 · 시간이 나오게, 기본값을 보여 주자"):
    // 칩은 다른 칩(분류 · 장소·메모)처럼 정하지 않았으면 이름만('알림'), 정했으면 값('10분 전'). 누르면 켜고 끄기 + 기본값(v30.js bxRemQuick)
    name: "일정 알림 칩: 정하지 않았으면 '알림', 정했으면 고른 값(대표 11/3)",
    find: "tab('rem', ICON.bell, !rems.length ? '알림 없음' :",
    replace: "tab('rem', ICON.bell, !rems.length ? (window.BX_APP ? '알림' : '알림 없음') :"
  }
];
