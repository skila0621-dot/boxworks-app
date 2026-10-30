// web-src/boxworks.html(웹 박스웍스 원본)을 앱용 www/index.html로 바꿉니다.
// 원본은 고치지 않고, 앱에 필요한 부분만 여기서 바꿉니다. 바꿀 곳을 못 찾으면 멈춥니다.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'web-src', 'boxworks.html');
const out = join(root, 'www');

let html = readFileSync(src, 'utf8');

const patches = [
  {
    name: '앱 연결부를 가장 먼저 불러오기',
    find: '<head>',
    replace: '<head><script src="app-shim.js"></script>'
  },
  {
    name: '앱에서는 "이 브라우저에만 임시 저장" 안내를 띄우지 않기',
    find: 'showBanner(db && !uid ?',
    replace: 'if (!window.BX_APP) showBanner(db && !uid ?'
  },
  {
    name: '설정의 저장 위치를 "이 휴대폰"으로',
    find: "(S.mode === 'db' ? '내 Claude 계정' : '이 브라우저')",
    replace: "(S.mode === 'db' ? '내 Claude 계정' : (window.BX_APP ? '이 휴대폰' : '이 브라우저'))"
  },
  {
    name: '저장 위치 설명을 앱에 맞게',
    find: "'저장소에 연결되지 않아 이 브라우저에만 임시로 저장돼요.') + '</p>' +",
    replace: "(window.BX_APP ? '일정은 이 휴대폰 안에만 저장돼요. 휴대폰을 바꿀 때는 구글 백업이나 백업 파일로 옮겨요.' : '저장소에 연결되지 않아 이 브라우저에만 임시로 저장돼요.')) + '</p>' +"
  },
  {
    name: '앱은 처음부터 "일정 관리만" 방식 (Claude 연동 없음, D-04)',
    find: "function usageMode(){ return M.settings.usage || 'ai'; }",
    replace: "function usageMode(){ return window.BX_APP ? 'basic' : (M.settings.usage || 'ai'); }"
  },
  {
    name: '앱에서는 처음 실행 때 "어떻게 쓰실 건가요?" 창을 띄우지 않기 (D-01)',
    find: 'if (S.firstServer && !SH && !S.obShown',
    replace: 'if (!window.BX_APP && S.firstServer && !SH && !S.obShown'
  },
  {
    name: '설정의 "연동"(AI 서비스·Claude 연동·알림 받을 곳) 묶음을 앱에서 숨기기 (D-01)',
    find: "'<section class=\"set-sec\" id=\"s-link\" aria-labelledby=\"s-link-h\"><h2 id=\"s-link-h\">연동</h2>' +",
    replace: "(window.BX_APP ? '' : '<section class=\"set-sec\" id=\"s-link\" aria-labelledby=\"s-link-h\"><h2 id=\"s-link-h\">연동</h2>' +"
  },
  {
    name: '└ 위 묶음의 끝',
    find: "      '</section>' +\n    '<section class=\"set-sec\" aria-labelledby=\"s-view\">",
    replace: "      '</section>') +\n    '<section class=\"set-sec\" aria-labelledby=\"s-view\">"
  },
  {
    name: '환영 안내에서 "휴대폰·PC에 설치하기"와 Claude 아침 보고 빼기',
    find: "    '<li><b>휴대폰·PC에 설치하기</b>",
    replace: "    (window.BX_APP ? '' : '<li><b>휴대폰·PC에 설치하기</b>"
  },
  {
    name: '└ 위 항목의 끝',
    find: "data-act=\"report-setup\">만들기</button></li></ol></section>' : '';",
    replace: "data-act=\"report-setup\">만들기</button></li>') + '</ol></section>' : '';"
  },
  {
    name: '위젯 모드(PC 바탕화면용)를 앱에서 끄기: 켜는 동작 막기',
    find: 'function setWidget(on){\n  S.widget = on;',
    replace: 'function setWidget(on){\n  if (window.BX_APP) on = false;\n  S.widget = on;'
  },
  {
    name: '└ 예전에 켜 둔 위젯 모드로 열리지 않게',
    find: "if (lsGet('bx:widget') === '1')",
    replace: "if (!window.BX_APP && lsGet('bx:widget') === '1')"
  },
  {
    name: '휴대폰 뒤로 버튼: 열린 창 닫기 → 앞 창으로 → 오늘 화면으로, 오늘이면 앱을 뒤로 보냄',
    find: '\nboot();\n})();',
    replace: "\nwindow.BX_back = function(){\n  if (SH) { const b = SH.back; closeSheet(); if (b) b(); return true; }\n  if (S.view === 'guide' && S.gsec) { guideOpen(null); return true; }\n  if (S.view !== 'today') { go('today', {}); return true; }\n  if (S.homeDay) { homeDayGo(0); return true; }\n  return false;\n};\n" + `window.BX_toast = function(msg){ toast(msg); };
// 앞으로 며칠 동안 울릴 알람 목록. 박스웍스의 알림 규칙(remindAt, 루틴 시간표)을 그대로 쓴다.
window.BX_alarmPlan = function(days){
  if (!M || !S.firstServer) return null;
  days = days || 7;
  const now = Date.now(), until = now + days * 864e5, out = [];
  M.items.forEach(it => {
    if (it.done || it.deletedAt) return;
    remindAt(it).forEach(r => {
      const t = r.getTime(); if (t <= now || t > until) return;
      const when = relDay(it.date, ymd(new Date(t))) + ' ' + timeText(it);
      out.push({id: 'i_' + it.id + '_' + t, at: t, kind: 'item', group: '일정', title: it.title || '(제목 없음)',
        sub: when + (it.location ? ' · ' + it.location : ''), body: when + (it.location ? ' · ' + it.location : '')});
    });
  });
  M.routines.forEach(rt => {
    const p = rtPlan(rt); if (p.bad) return;
    const rows = p.rows.filter(r => r.kind !== 'wait');
    for (let k = 0; k <= days; k++) {
      const day = addDays(sod(new Date(now)), k), ds = ymd(day);
      if (!rtActiveOn(rt, ds)) continue;
      rows.forEach((r, i) => {
        const t = addMin(day, r.at).getTime(); if (t <= now || t > until) return;
        const nx = rows[i + 1], left = p.leave != null && !r.leave ? Math.round(p.leave - r.at) : null;
        const sub = r.leave ? '지금 나갈 시간' : left != null ? '출발까지 ' + left + '분' : '';
        out.push({id: 'r_' + rt.id + '_' + ds + '_' + r.id, at: t, kind: 'routine', group: rt.name || '루틴',
          title: r.leave ? '출발할 시간' : r.name, sub, body: (rt.name || '루틴') + (sub ? ' · ' + sub : ''),
          from: addMin(day, p.start).getTime(), to: p.leave != null ? addMin(day, p.leave).getTime() : 0,
          next: nx ? hmOf(nx.at) + ' ' + (nx.leave ? '출발' : nx.name) : ''});
      });
    }
  });
  return out.sort((a, b) => a.at - b.at).slice(0, 64);
};
function hmOf(m){ m = Math.round(m); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
boot();
})();`
  },
  {
    name: '화면을 다시 그릴 때마다 앱에 알람 목록을 넘기기(앱 쪽에서 바뀐 때만 다시 예약)',
    find: '  checkAlarms();\n',
    replace: '  checkAlarms();\n  if (window.BX_afterRender) window.BX_afterRender();\n'
  },
  {
    name: '앱에서는 화면 안 삐 소리를 내지 않기(휴대폰 알람이 울림)',
    find: 'function beep(){\n  if (!interacted) return;',
    replace: 'function beep(){\n  if (!interacted || window.BX_APP) return;'
  },
  {
    name: '설정 > 알림에 "휴대폰 알람 시험" 줄 넣기',
    find: "'<section class=\"set-sec\" aria-labelledby=\"s-alarm\"><h2 id=\"s-alarm\">알림</h2>' +",
    replace: "'<section class=\"set-sec\" aria-labelledby=\"s-alarm\"><h2 id=\"s-alarm\">알림</h2>' + (window.BX_APP ? '<div class=\"set-menu\"><button type=\"button\" class=\"menu-row\" data-act=\"bx-alarm-test\"><span class=\"mi\">' + ICON.bell + '</span><span class=\"ml\">휴대폰 알람 시험</span><span class=\"mv\">10초 뒤 울려요' + ICON.chevR + '</span></button></div>' : '') +"
  },
  {
    name: '월간 달력 칸의 일정 칩에 분류 색과 시각 표시 자리를 달아 휴대폰에서도 제목이 보이게(스타일은 app-shim.js)',
    find: "'<span class=\"c-chip' + (i.done ? ' done' : '') + (lt ? ' late' : '') + '\" data-item=\"' + esc(i.id) + '\" title=\"두 번 누르면 수정\"><i class=\"dot\" style=\"--c:' + (lt ? 'var(--warn)' : i.done ? 'var(--done)' : catColor(i.categoryId)) + '\"></i><span>' + (i.start ? i.start + ' ' : '')",
    replace: "'<span class=\"c-chip' + (i.done ? ' done' : '') + (lt ? ' late' : '') + '\" style=\"--c:' + (lt ? 'var(--warn)' : i.done ? 'var(--done)' : catColor(i.categoryId)) + '\" data-item=\"' + esc(i.id) + '\" title=\"두 번 누르면 수정\"><i class=\"dot\" style=\"--c:' + (lt ? 'var(--warn)' : i.done ? 'var(--done)' : catColor(i.categoryId)) + '\"></i><span>' + (i.start ? '<b class=\"c-t\">' + i.start + ' </b>' : '')"
  },
  {
    name: '└ 휴대폰 폭에서는 칸마다 일정 2개 + "+N"',
    find: "const chips = s.slice(0, 3).map(i =>",
    replace: "const cmax = window.BX_APP && window.innerWidth < 720 ? 2 : 3;\n    const chips = s.slice(0, cmax).map(i =>"
  },
  {
    name: '└ "+N개" 개수도 위 기준으로',
    find: "(its.length > 3 ? '<span class=\"c-more\">+' + (its.length - 3) + '개</span>' : '')",
    replace: "(its.length > cmax ? '<span class=\"c-more\">+' + (its.length - cmax) + '</span>' : '')"
  },
  {
    name: '└ 사용 설명서 목차에서 "PC 바탕화면 위젯으로 쓰기" 빼기',
    find: ", ['g-widget', 'PC 바탕화면 위젯으로 쓰기']]]",
    replace: "].concat(window.BX_APP ? [] : [['g-widget', 'PC 바탕화면 위젯으로 쓰기']])]"
  }
];

for (const p of patches) {
  const count = html.split(p.find).length - 1;
  if (count !== 1) {
    console.error(`바꿀 곳을 찾지 못했습니다 (${count}곳): ${p.name}`);
    process.exit(1);
  }
  html = html.replace(p.find, p.replace);
  console.log(`적용: ${p.name}`);
}

mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'index.html'), html);
copyFileSync(join(root, 'web-src', 'app-shim.js'), join(out, 'app-shim.js'));
console.log(`www/index.html (${(html.length / 1024).toFixed(0)}KB) 만듦`);
