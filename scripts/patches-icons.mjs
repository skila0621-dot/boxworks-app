// 루틴 아이콘(대표 요청 2026-10-31). 코드는 web-src/icons.js(생성)·web-src/rticons.js
export default [
  {
    // 시험판 57(대표 11/5 14:10 선택실 3 메모 '확인 필요 아이콘(동그라미 안에 느낌표)'): 앱 아이콘 세트(ICON)에 더해 한 세트로 쓴다
    name: '앱 아이콘 세트에 확인 필요(동그라미 안 느낌표)',
    find: "const ICON = {\n  gear: '",
    replace: "const ICON = {\n  alertc: '<svg class=\"i\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M12 7.6v5.2M12 16.4h.01\"/></svg>',\n  gear: '"
  },
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
  },
  {
    name: '루틴 템플릿에 \'명상 10분\' 넣기(대표 요청)',
    find: "  {key: 'sleep', name: '취침 루틴', days: RT_ALL, mode: 'start', target: '23:00', steps: [['씻기', 15], ['휴대폰 내려놓기', 0], ['잠자리 들기', 0]]}\n];",
    replace: "  {key: 'sleep', name: '취침 루틴', days: RT_ALL, mode: 'start', target: '23:00', steps: [['씻기', 15], ['휴대폰 내려놓기', 0], ['잠자리 들기', 0]]},\n  {key: 'meditate', name: '명상 10분', days: RT_ALL, mode: 'start', target: '07:30', steps: [['휴대폰 방해 금지 켜기', 0], ['편하게 앉기', 1], ['호흡 명상', 10]]}\n];"
  },
  {"name": "명상(D-07): 화면 그리기", "find": "S.view === 'routines' ? routinesHtml() :", "replace": "(window.BX_APP && S.view === 'med') ? medHtml() : S.view === 'routines' ? routinesHtml() :"},
  {"name": "└ 루틴 탭 위쪽에 명상 카드", "find": "  return '<div class=\"page-head\"><div class=\"ph-t\"><h1>루틴</h1></div></div>' + make + cards;", "replace": "  return '<div class=\"page-head\"><div class=\"ph-t\"><h1>루틴</h1></div></div>' + (window.BX_APP ? medCardHtml() : '') + make + cards;"},
  {"name": "└ 더보기에 명상", "find": "      menuRow('routines', ICON.loop, '루틴', M.routines.length ? M.routines.length + '개' : '기상·출근·잠자리') +", "replace": "      menuRow('routines', ICON.loop, '루틴', M.routines.length ? M.routines.length + '개' : '기상·출근·잠자리') + (window.BX_APP ? '<button type=\"button\" class=\"menu-row\" data-act=\"bx-med-open\"><span class=\"mi\">' + BX_ICONS.lotus + '</span><span class=\"ml\">명상</span><span class=\"mv\">싱잉볼' + ICON.chevR + '</span></button>' : '') +"},
  {"name": "└ 루틴 알람 소리(기본 알람 | 싱잉볼)를 루틴에 저장", "find": ", icon: typeof o.icon === 'string' && o.icon ? o.icon.slice(0, 20) : null};", "replace": ", icon: typeof o.icon === 'string' && o.icon ? o.icon.slice(0, 20) : null, sound: o.sound === 'bowl' ? 'bowl' : null};"},
  {"name": "└ 명상 10분 템플릿은 싱잉볼·다시 알림 없음", "find": "{key: 'meditate', name: '명상 10분', days: RT_ALL, mode: 'start', target: '07:30', steps:", "replace": "{key: 'meditate', name: '명상 10분', days: RT_ALL, mode: 'start', target: '07:30', sound: 'bowl', times: 0, steps:"}
];
