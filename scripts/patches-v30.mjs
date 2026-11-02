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
    replace: "(hol ? '<span class=\"hol\">' + esc(hol) + '</span>' : '') + (window.BX_APP && !its.length ? '<span class=\"bx-wk-none\">일정 없음</span>' : '') + '<span class=\"sp\"></span>' + addBtn(ds, fmtMD(ds) + '에 일정 넣기') + '</div>' +"
  },
  {
    name: "└ '+ 추가'는 앱에서 + 하나(새 일정 +와 같은 그림, 규칙 1)",
    find: "const addBtn = (date, label) => '<button type=\"button\" class=\"sec-link add\" data-act=\"new\" data-date=\"' + date + '\"' + (label ? ' aria-label=\"' + esc(label) + '\"' : '') + '>' + ICON.plus + '추가</button>';",
    replace: "const addBtn = (date, label) => '<button type=\"button\" class=\"sec-link add\" data-act=\"new\" data-date=\"' + date + '\"' + (label ? ' aria-label=\"' + esc(label) + '\"' : window.BX_APP ? ' aria-label=\"이날 일정 넣기\"' : '') + '>' + ICON.plus + (window.BX_APP ? '' : '추가') + '</button>';"
  },
  {
    name: "날짜 창의 넣기 칸은 '이날 일정 넣기' 한 줄로, 같은 새 일정 창이 그 날짜로 열린다(입구 하나로, 규칙 8)",
    find: "setSheet('<div id=\"day-list\">' + list + '</div>',\n    '<label class=\"sr\" for=\"day-in\">할 일 추가</label>",
    replace: "setSheet('<div id=\"day-list\">' + list + '</div>', window.BX_APP ? '<button type=\"button\" class=\"btn primary grow\" data-act=\"new\" data-date=\"' + ds + '\">' + ICON.plus + '이날 일정 넣기</button>' :\n    '<label class=\"sr\" for=\"day-in\">할 일 추가</label>"
  },
  {
    name: "마이크 단추에 '말하기' 글자(규칙 1: 표준 아이콘 말고는 그림만 있는 단추를 두지 않는다)",
    find: "<path d=\"M12 18v3\"/></svg></button>' : ''; }",
    replace: "<path d=\"M12 18v3\"/></svg><span>말하기</span></button>' : ''; }"
  },
  {
    name: '└ 마이크 단추 이름도 보이는 글자와 같게',
    find: "data-prompt=\"' + esc(prompt || '') + '\" aria-label=\"말로 넣기\"><svg",
    replace: "data-prompt=\"' + esc(prompt || '') + '\"><svg"
  },
  {
    name: '새 일정·일정 고치기 창은 높이가 바뀌지 않게: 칩은 제자리, 고르는 칸은 칩 바로 아래 같은 자리에서 바뀐다(규칙 12)',
    find: "openSheet({title: F.mode === 'new' ? '새 일정' : (window.BX_APP ? '일정 고치기' : '일정 수정'), draw: drawEdit, refresh: null});",
    replace: "openSheet({title: F.mode === 'new' ? '새 일정' : (window.BX_APP ? '일정 고치기' : '일정 수정'), draw: drawEdit, refresh: null});\n  if (window.BX_APP) { const sh = $('#sheet-root .sheet'); if (sh) sh.classList.add('bx-fsheet'); }"
  },
  {
    name: '└ 고르는 칸이 닫혀 있을 때 그 자리: 새 일정은 이렇게 적어 보라는 예, 고치기는 한 줄 안내',
    find: "  el.hidden = !k;\n  if (k === 'more') F.extra = true;",
    replace: "  el.hidden = !k && !window.BX_APP;\n  if (window.BX_APP) el.classList.toggle('bx-idle', !k);\n  if (k === 'more') F.extra = true;\n  if (!k && window.BX_APP) { el.innerHTML = bxFormIdle(); return; }"
  },
  {
    name: "일정 알림: 고르는 칸 규칙(규칙 11, D-10) — 정시·10분 전·1시간 전(시간 없는 일정은 당일 오전 9시·전날 오후 9시) + 직접 입력, '알림 없이'는 아래 글자 단추",
    find: "function drawFRem(){\n  drawFChips();\n  const el = $('#f-rem'); if (!el) return;",
    replace: "function drawFRem(){\n  drawFChips();\n  const el0 = $('#f-rem'); if (!el0) return;\n  if (window.BX_APP && !F.remAdv) { el0.innerHTML = bxRemQuick(); return; }\n  // 직접 입력: 칩 줄 바로 아래에 예전의 자세한 칸(여러 개·정한 시각)\n  let el = el0; if (window.BX_APP) { el0.innerHTML = bxRemQuick() + '<div class=\"bx-rem-adv\"></div>'; el = el0.querySelector('.bx-rem-adv'); }"
  }
];
