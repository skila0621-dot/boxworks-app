// 루틴 아이콘(대표 요청 2026-10-31). 코드는 web-src/icons.js(생성)·web-src/rticons.js
export default [
  {
    name: '루틴 아이콘: 직접 고른 아이콘을 루틴에 저장',
    find: `reason: o.reason ? String(o.reason).slice(0, 200) : null};`,
    replace: `reason: o.reason ? String(o.reason).slice(0, 200) : null, icon: typeof o.icon === 'string' && o.icon ? o.icon.slice(0, 20) : null};`
  },
  {
    name: '└ 오늘 화면 루틴 카드 이름 앞에 아이콘',
    find: `'<div class="rt-h"><b>' + esc(rt.name) + '</b>`,
    replace: `'<div class="rt-h">' + (window.BX_APP ? bxRtIconHtml(rt) : '') + '<b>' + esc(rt.name) + '</b>`
  },
  {
    name: '└ 루틴 단계 이름 앞에 아이콘(맞는 것이 있을 때만)',
    find: `'</span><span class="rt-n">' + esc(r.name) + (r.min ? '<small>' + r.min + '분</small>' : '')`,
    replace: `'</span><span class="rt-n">' + (window.BX_APP ? bxStepIconHtml(r.name) : '') + esc(r.name) + (r.min ? '<small>' + r.min + '분</small>' : '')`
  },
  {
    name: '└ 루틴 탭 목록 이름 앞에 아이콘',
    find: `data-act="rt-edit" data-rid="' + esc(rt.id) + '"><b>' + esc(rt.name) + '</b>`,
    replace: `data-act="rt-edit" data-rid="' + esc(rt.id) + '">' + (window.BX_APP ? bxRtIconHtml(rt) : '') + '<b>' + esc(rt.name) + '</b>`
  },
  {
    name: '└ 루틴 창에 아이콘 고르기',
    find: `'<div class="fgrid"><label class="fg-l" for="r-name">이름</label><input id="r-name" class="inp full" value="' + esc(R.name) + '" maxlength="30"></div>' +`,
    replace: `'<div class="fgrid"><label class="fg-l" for="r-name">이름</label><input id="r-name" class="inp full" value="' + esc(R.name) + '" maxlength="30"></div>' + (window.BX_APP ? bxIconPickHtml() : '') +`
  },
  {
    name: '└ 이름을 바꾸면 자동 아이콘도 바로 바뀜',
    find: `    else if (t.id === 'r-name' && R) R.name = t.value;`,
    replace: `    else if (t.id === 'r-name' && R) { R.name = t.value; if (window.BX_APP) bxIconPickRefresh(); }`
  }
];
