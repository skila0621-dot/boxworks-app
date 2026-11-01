// web-src/boxworks.html(웹 박스웍스 원본)을 앱용 www/index.html로 바꿉니다.
// 원본은 고치지 않고, 앱에 필요한 부분만 여기서 바꿉니다. 바꿀 곳을 못 찾으면 멈춥니다.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import step4 from './patches-step4.mjs';
import calendar from './patches-calendar.mjs';
import nav from './patches-nav.mjs';
import icons from './patches-icons.mjs';
import fix10 from './patches-fix10.mjs';
import home from './patches-home.mjs';
import tidy from './patches-tidy.mjs';
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
    replace: "\nwindow.BX_back = function(){\n  if (SH) { const b = SH.back; closeSheet(); if (b) b(); return true; }\n  if (S.view === 'guide' && S.gsec) { guideOpen(null); return true; }\n  if (document.getElementById('bx-start')) { if (typeof BXR !== 'undefined' && BXR && !BXR.made && BXR.q > 0) { BXR.q--; bxRtHelpDraw(); } else if (typeof BXS !== 'undefined' && BXS && BXS.step === 2) { BXS.step = 1; bxStartDraw(); } else if (typeof BXR !== 'undefined' && BXR) { bxStartClose(); BXR = null; } else if (typeof PERM !== 'undefined' && PERM) { bxPermClose(); } else if (typeof BXT !== 'undefined' && BXT) { if (BXT.q) { BXT.q = 0; bxTtHelpDraw(); } else bxTtHelpClose(); } return true; }\n  if (S.view === 'tt' && TTSEL) { ttUnselect(); return true; }\n  if (S.view === 'week') { bxCalGo('month'); return true; }\n  if (S.view === 'med') { go('routines', {}); return true; }\n  if (S.view !== 'today') { go('today', {}); return true; }\n  if (S.homeDay) { homeDayGo(0); return true; }\n  return false;\n};\n" + `window.BX_toast = function(msg){ toast(msg); };
// 앞으로 며칠 동안 울릴 알람 목록. 박스웍스의 알림 규칙(remindAt, 루틴 시간표)을 그대로 쓴다.
window.BX_alarmPlan = function(days){
  if (!M || !S.firstServer) return null;
  days = days || 7;
  const now = Date.now(), until = now + days * 864e5, out = [];
  // 울리는 방식(종류별 기본값, web-src/flow.js): lv = alarm | notice | quiet. 끈 기능(루틴·시간표)은 알람도 쉰다
  const lvR = bxLevel('routine'), lvI = bxLevel('item'), lvT = bxLevel('tt'), rtOn = bxModOn('routines'), ttOnF = bxModOn('tt');
  M.items.forEach(it => {
    if (it.done || it.deletedAt) return;
    const tvs = tvAlarms(it);
    tvs.forEach(a => {
      if (a.at <= now || a.at > until) return;
      // pt·ps·pg: 잠금 화면에 대신 보일 제목·내용·묶음 이름(대표 결정 10/31: 일정 제목·장소는 잠금을 풀면)
      const isLeave = a.title === '출발할 시간';
      out.push({id: 'iv_' + it.id + '_' + a.id + '_' + a.at, at: a.at, kind: a.routine ? 'routine' : 'item', group: a.group, title: a.title, sub: a.sub,
        body: a.sub, from: a.routine ? a.from : 0, to: a.routine ? a.to : 0, next: a.next,
        pt: isLeave ? '출발할 시간' : a.routine ? a.title : '곧 출발', ps: isLeave ? '일정 내용은 잠금을 풀면 보여요' : a.sub, pg: a.routine ? String(a.group).split(' · ')[0] : '일정', lv: lvR});
    });
    tvRemTimes(it, tvs).forEach(r => {
      const t = r.getTime(); if (t <= now || t > until) return;
      const when = relDay(it.date, ymd(new Date(t))) + ' ' + timeText(it);
      out.push({id: 'i_' + it.id + '_' + t, at: t, kind: 'item', group: '일정', title: it.title || '(제목 없음)',
        sub: when + (it.location ? ' · ' + it.location : ''), body: when + (it.location ? ' · ' + it.location : ''),
        pt: '일정 알림', ps: bxLeadText(it.start ? at(it.date, it.start).getTime() - t : null, relDay(it.date, ymd(new Date(t)))) + ' · 잠금을 풀면 보여요', pg: '일정', lv: lvI});
    });
  });
  const reps = [];
  M.routines.forEach(rt => {
    if (!rtOn) return;
    const p = rtPlan(rt); if (p.bad) return;
    const rows = p.rows.filter(r => r.kind !== 'wait');
    // 다시 알림: 확인을 누르지 않으면 every분마다 times번 더(루틴 창에서 정함). 다음 단계가 울리기 전까지만
    const bowl = rt.sound === 'bowl';
    const rep = bowl ? 0 : Math.max(0, Math.min(12, Math.round(+rt.times || 0))), every = Math.max(1, Math.min(60, Math.round(+rt.every || 5)));
    for (let k = 0; k <= days; k++) {
      const day = addDays(sod(new Date(now)), k), ds = ymd(day);
      if (!rtActiveOn(rt, ds)) continue;
      const lg = M.rlogs.get(rt.id + '|' + ds) || {}; if (lg.skip) continue;
      const doneMap = lg.done || {};
      // 알림창 '진행 중'과 '지금 단계' 위젯이 쓰는 그날 단계표(첫 알람에만 싣는다)
      const leaveAt = p.leave != null ? addMin(day, p.leave).getTime() : 0;
      const steps = rows.map(r => ({at: addMin(day, r.at).getTime(), n: r.leave ? '출발' : r.name, s: 'r_' + rt.id + '_' + ds + '_' + r.id, min: r.min || 0, d: !!doneMap[r.id]}));
      rows.forEach((r, i) => {
        if (doneMap[r.id]) return;
        const base = 'r_' + rt.id + '_' + ds + '_' + r.id, nx = rows[i + 1];
        const limit = nx ? addMin(day, nx.at).getTime() : addMin(day, r.at + rep * every + 1).getTime();
        for (let j = 0; j <= rep; j++) {
          const atM = r.at + j * every, t = addMin(day, atM).getTime();
          if (j > 0 && t >= limit) break;
          if (t <= now || t > until) continue;
          const left = p.leave != null && !r.leave ? Math.round(p.leave - atM) : null;
          const sub = [r.leave ? (j ? '출발 시각이 ' + (j * every) + '분 지났어요' : '지금 나갈 시간') : left != null ? '출발까지 ' + left + '분' : '', j ? '다시 알림 ' + j + '/' + rep : ''].filter(Boolean).join(' · ');
          const a = {id: base + (j ? '_r' + j : ''), at: t, kind: 'routine', group: rt.name || '루틴', icon: r.leave ? 'car' : bxIconFor(r.name) || bxRtIconKey(rt),
            title: r.leave ? '출발할 시간' : r.name, sub, body: (rt.name || '루틴') + (sub ? ' · ' + sub : ''),
            from: addMin(day, p.start).getTime(), to: p.leave != null ? addMin(day, p.leave).getTime() : 0,
            next: nx ? hmOf(nx.at) + ' ' + (nx.leave ? '출발' : nx.name) : ''};
          // series: 이 단계의 알람 묶음. 휴대폰에서 '확인'을 누르면 남은 다시 알림을 지우고, 앱에 '했어요'로 옮긴다
          a.series = base;
          a.pt = a.title; a.ps = sub; a.pg = rt.name || '루틴'; a.lv = lvR;
          if (!j && !bowl) { a.rid = rt.id; a.ds = ds; a.leave = leaveAt; a.steps = steps; }
          if (bowl) { a.sound = 'bowl'; a.bowl = rt.bowl || bxBowlType(); }
          (j ? reps : out).push(a);
        }
      });
      // 루틴이 끝난 10분 뒤: 확인하지 않은 단계가 있으면 휴대폰이 한 번 더 알린다(대표 요청). 다 확인했으면 울리지 않는다
      const born = bxRtBornM(rt, ds), todo = rows.filter(r => !doneMap[r.id] && r.at >= born);
      const endM = p.leave != null ? p.leave : rows.length ? rows[rows.length - 1].at + rows[rows.length - 1].min : null;
      // 싱잉볼 루틴(명상 등): 마지막 단계가 끝날 때 끝 종 세 번. 확인 안 한 단계 알림은 하지 않는다
      if (bowl && endM != null && rows.length && rows[rows.length - 1].min > 0) {
        const te = addMin(day, endM).getTime();
        if (te > now && te <= until && !doneMap[rows[rows.length - 1].id]) out.push({id: 'r_' + rt.id + '_' + ds + '_end', at: te, kind: 'item', sound: 'bowl3', bowl: rt.bowl || bxBowlType(), group: rt.name || '루틴', title: (rt.name || '루틴') + ' 끝', sub: '잘했어요', body: ''});
      }
      if (todo.length && endM != null && !bowl) {
        const tc = addMin(day, endM + 10).getTime();
        if (tc > now && tc <= until) out.push({id: 'rc_' + rt.id + '_' + ds, at: tc, kind: 'rcheck', group: rt.name || '루틴', title: (rt.name || '루틴') + ' · 확인하지 않은 단계가 있어요', sub: '', body: '',
          check: todo.map(r => ({s: 'r_' + rt.id + '_' + ds + '_' + r.id, n: r.leave ? '출발' : r.name})), from: addMin(day, p.start).getTime(), to: addMin(day, endM).getTime()});
      }
    }
  });
  ttList().forEach(e => {
    if (!ttOnF || e.on === false || e.remind === '' || e.remind == null || !isHM(e.start)) return;
    const before = +e.remind || 0;
    for (let k = 0; k <= days; k++) {
      const day = addDays(sod(new Date(now)), k), ds = ymd(day);
      if (!ttOn(e, ds)) continue;
      const t = addMin(day, toMin(e.start) - before).getTime(); if (t <= now || t > until) continue;
      const lead = before ? before + '분 뒤 시작' : '지금 시작';
      out.push({id: 'tt_' + e.id + '_' + ds, at: t, kind: 'item', group: '시간표', icon: bxIconFor(e.name) || 'school', title: e.name,
        sub: (e.place ? e.place + ' · ' : '') + lead, body: e.start + (e.end ? '–' + e.end : '') + (e.place ? ' · ' + e.place : '') + ' · ' + lead,
        pt: '시간표 알림', ps: lead + ' · 잠금을 풀면 보여요', pg: '시간표', lv: lvT});
    }
  });
  // 휴대폰에 거는 알람은 최대 200개: 앞으로 7일의 기본 알람을 먼저, 남는 자리에 가까운 다시 알림부터
  out.sort((a, b) => a.at - b.at);
  const base = out.slice(0, 200);
  // 아침 보고: 아침 루틴 첫 알람에 붙이거나, 없으면 정한 시각에 따로(web-src/brief.js)
  return bxAddReports(base.concat(reps.sort((a, b) => a.at - b.at).slice(0, Math.max(0, 200 - base.length))), days).sort((a, b) => a.at - b.at);
};
function hmOf(m){ m = Math.round(m); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
// 잠금 화면용 짧은 글: 시작까지 남은 시간만(일정 제목 없이)
function bxLeadText(ms, rel){
  if (ms == null) return (rel && rel !== '오늘' ? rel + ' ' : '오늘 ') + '일정이 있어요';
  const m = Math.round(ms / 60000);
  if (m <= 0) return '지금 시작';
  if (m < 60) return m + '분 뒤 시작';
  if (m < 1440) return Math.floor(m / 60) + '시간' + (m % 60 ? ' ' + (m % 60) + '분' : '') + ' 뒤 시작';
  return (rel || '') + ' 일정';
}
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
    name: '일정 줄의 종 모양 옆에 다음 알람 시각 표시(4안-1)',
    find: "if (it.remind && !it.done && !late) meta.push('<span class=\"meta\" aria-label=\"알림 있음\">' + ICON.bell + '</span>');",
    replace: "if ((it.remind || (window.BX_APP && (it.travel || it.prep))) && !it.done && !late) { const nr = window.BX_APP ? bxNextAlarm(it) : remindAt(it).find(d => d > M.now); const nt = nr ? (ymd(nr) === it.date ? '' : relDay(ymd(nr), M.today) + ' ') + String(nr.getHours()).padStart(2, '0') + ':' + String(nr.getMinutes()).padStart(2, '0') : ''; meta.push('<span class=\"meta bx-rem\" aria-label=\"' + (nt ? '알림 ' + nt : '알림 있음') + '\">' + ICON.bell + nt + '</span>'); }"
  },
  {
    name: '월간 달력에서 날짜를 누르면 오늘 탭처럼 그날 창이 열리게(대표 요청)',
    find: '\'" data-act="pick-day" data-date="\' + ds',
    replace: '\'" data-act="\' + (window.BX_APP ? \'day-open\' : \'pick-day\') + \'" data-date="\' + ds'
  },
  {
    name: '└ 창과 겹치는 달력 아래 그날 목록은 앱에서 빼기',
    find: "'<section id=\"agenda\" aria-labelledby=\"h-agenda\">",
    replace: "(window.BX_APP ? '' : '<section id=\"agenda\" aria-labelledby=\"h-agenda\">"
  },
  {
    name: '└ 위 목록의 끝',
    find: "'<div class=\"list\"></div><p class=\"empty\">이 날은 일정이 없어요.</p>') + '</section></div>';",
    replace: "'<div class=\"list\"></div><p class=\"empty\">이 날은 일정이 없어요.</p>') + '</section>') + '</div>';"
  },
  {
    name: '말로 넣기: 새 일정 제목 칸 옆에 마이크',
    find: "'<div class=\"fld\"><label class=\"sr\" for=\"f-title\">제목</label><input id=\"f-title\"",
    replace: "'<div class=\"fld\"><label class=\"sr\" for=\"f-title\">제목</label><div class=\"bx-inrow\"><input id=\"f-title\""
  },
  {
    name: '└ 제목 칸 끝',
    find: "'\" value=\"' + esc(F.title) + '\"><div id=\"f-hint\"></div></div>' +",
    replace: "'\" value=\"' + esc(F.title) + '\">' + bxMic('f-title', '예) 내일 오후 3시 치과') + '</div><div id=\"f-hint\"></div></div>' +"
  },
  {
    name: '└ 날짜 창의 할 일 추가 칸에도 마이크',
    find: "'<button type=\"button\" class=\"btn sm\" data-act=\"new\" data-date=\"' + ds + '\">자세히</button>",
    replace: "bxMic('day-in', '할 일을 말해 보세요') + '<button type=\"button\" class=\"btn sm\" data-act=\"new\" data-date=\"' + ds + '\">자세히</button>"
  },
  {
    name: '└ 루틴 "말로 만들기"에도 마이크',
    find: "'<div class=\"rt-make-a\"><span class=\"p small\">키보드 마이크로 말해도 돼요</span>",
    replace: "'<div class=\"rt-make-a\">' + (window.BX_HAS_MIC ? bxMic('rt-text', '예) 평일 9시까지 출근, 회사까지 45분') : '<span class=\"p small\">키보드 마이크로 말해도 돼요</span>') + '"
  },
  {
    name: '└ 마이크 버튼 만드는 함수와 규칙 해석 시험용 연결',
    find: '\nwindow.BX_toast = function(msg){ toast(msg); };',
    replace: "\nfunction bxMic(id, prompt){ return window.BX_HAS_MIC ? '<button type=\"button\" class=\"bx-mic\" data-act=\"bx-mic\" data-for=\"' + id + '\" data-prompt=\"' + esc(prompt || '') + '\" aria-label=\"말로 넣기\"><svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"9\" y=\"3\" width=\"6\" height=\"12\" rx=\"3\"/><path d=\"M5 11a7 7 0 0 0 14 0\"/><path d=\"M12 18v3\"/></svg></button>' : ''; }\nwindow.BX_parse = function(text){ return parseQuick(text, new Date()); };\nwindow.BX_parseAt = function(text, now){ return parseQuick(text, now); };\nwindow.BX_toast = function(msg){ toast(msg); };"
  },
  {
    name: '사용 설명서에서 앱에 없는 장(Claude 연동·AI 정리·아침 보고·링크 공유·바로가기 설치) 빼기',
    find: "  ['도움말', [['g-faq', '자주 묻는 질문']]]\n];",
    replace: "  ['도움말', [['g-faq', '자주 묻는 질문']]]\n];\nif (window.BX_APP) { const off = ['g-start', 'g-report', 'g-ai', 'g-share', 'g-devices', 'g-widget']; for (let i = GUIDE.length - 1; i >= 0; i--) { GUIDE[i][1] = GUIDE[i][1].filter(x => !off.includes(x[0])); if (!GUIDE[i][1].length) GUIDE.splice(i, 1); } }"
  },
  {
    name: '시간표(D-06) 코드 넣기: web-src/timetable.js',
    find: '\nwindow.BX_back = function(){',
    replace: '\n' + readFileSync(join(root, 'web-src', 'timetable.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'travel.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'calendar.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'home.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'brief.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'icons.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'rticons.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'meditation.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'start.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'flow.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'tidy.js'), 'utf8') + '\nwindow.BX_back = function(){'
  },
  {
    name: '└ 시간표 탭(아래 메뉴): 화면 그리기',
    find: "S.view === 'week' ? weekHtml() :",
    replace: "S.view === 'week' ? weekHtml() : (window.BX_APP && S.view === 'tt') ? ttHtml() :"
  },
  {
    name: '캘린더 탭: 주간 위쪽에 \'월간 | 주간\' 전환(대표 요청)',
    find: "return '<div class=\"page-head\"><div class=\"ph-t\"><h1>' + label + '</h1><p class=\"tnum\">",
    replace: "return (window.BX_APP ? bxCalBar('week') : '') + '<div class=\"page-head\"><div class=\"ph-t\"><h1>' + label + '</h1><p class=\"tnum\">"
  },
  {
    name: '└ 월간 위쪽에도 같은 전환',
    find: "  return '<div class=\"page-head\"><div class=\"ph-t\"><h1>' + (y !== M.now.getFullYear() ? y + '년 ' : '') + (m + 1) + '월</h1>",
    replace: "  return (window.BX_APP ? bxCalBar('month') : '') + '<div class=\"page-head\"><div class=\"ph-t\"><h1>' + (y !== M.now.getFullYear() ? y + '년 ' : '') + (m + 1) + '월</h1>"
  },
  {
    name: '└ 주간을 보고 있어도 아래 메뉴의 \'캘린더\'에 불이 들어오게',
    find: "if (b.dataset.view === S.view) b.setAttribute('aria-current', 'page');",
    replace: "if (b.dataset.view === S.view || (window.BX_APP && b.dataset.view === 'month' && S.view === 'week')) b.setAttribute('aria-current', 'page');"
  },
  {
    name: '└ 홈 개편(대표 요청 2026-10-31): 앱에서는 홈에 달력을 두지 않는다(캘린더 탭에 있음). 오늘 시간표는 \'오늘 할 일\' 상자 안으로',
    find: "'<div class=\"home-col\">' + todaySec + '</div><div class=\"home-col\">' + homeCalHtml() + '</div></div>'",
    replace: "'<div class=\"home-col\">' + todaySec + '</div>' + (window.BX_APP ? '' : '<div class=\"home-col\">' + homeCalHtml() + '</div>') + '</div>'"
  },
  {
    name: '말로 넣기 규칙 보강: "다음 달 5일"·"내일모레", 제목 끝의 "가야 돼"·겹친 말 정리',
    find: 'function parseQuick(text, now){\n  const today = sod(now);',
    replace: `function parseQuick(text, now){
  let s = String(text == null ? '' : text);
  const pr = window.BX_APP ? tvPrepExtract(s) : null; if (pr) s = pr.text;
  const rm = window.BX_APP ? tvRemExtract(s) : null; if (rm) s = rm.text;
  const tv = window.BX_APP ? tvExtract(s) : null; if (tv) s = tv.text;
  const r = bxQuickFix(parseQuick0(bxQuickPre(s, now), now), !!(pr || tv || rm));
  if (tv) r.travel = tv.min;
  if (rm) r.remind = String(rm.min);
  if (pr) { r.prep = pr.id; r.prepName = pr.name; }
  return r;
}
function bxQuickPre(text, now){
  let s = String(text == null ? '' : text);
  s = s.replace(/내일\\s*모레/g, '모레');
  s = s.replace(/(?:다음|담)\\s*달\\s*(\\d{1,2})\\s*일/g, (m, d) => { const x = new Date(now.getFullYear(), now.getMonth() + 1, 1); return (x.getMonth() + 1) + '월 ' + d + '일'; });
  s = s.replace(/이번\\s*달\\s*(\\d{1,2})\\s*일/g, (m, d) => (now.getMonth() + 1) + '월 ' + d + '일');
  return s;
}
function bxQuickFix(r, force){
  if (!r || !r.title || !(force || r.date || r.start)) return r;
  let t = ' ' + r.title + ' ';
  t = t.replace(/[.,!?~]+(?=\\s)/g, ' ');
  t = t.replace(/\\s(?:그리고|근데|참고로|그래서)\\s/g, ' ');
  t = t.replace(/\\s(?:가야|해야|와야|봐야|가봐야|들러야)\\s?(?:돼|해|함|됨|된다|한다|지)\\s/g, ' ');
  t = t.replace(/\\s(?:있어|있음|있다|예정)\\s/g, ' ');
  if (r.date) t = t.replace(/\\s[월화수목금토일]요일\\s/g, ' ');
  t = t.replace(/^\\s*(점심|저녁|아침)\\s+(?=\\1)/, ' ');
  t = t.replace(/\\s+/g, ' ').trim();
  return t ? Object.assign({}, r, {title: t}) : r;
}
function parseQuick0(text, now){
  const today = sod(now);`
  },
  {
    name: '말한·적은 날짜가 미리 정해진 날짜보다 우선(손으로 고른 날짜만 고정)',
    find: 'touchedDate: !!preset.date, touchedTime: false',
    replace: 'touchedDate: false, baseDate: date, travel: 0, tvSrc: \'\', tvKey: \'\', prep: null, prepNew: null, touchedTravel: false, touchedPrep: false, touchedTime: false'
  },
  {
    name: '└ 문장에서 날짜를 지우면 처음 날짜로 돌아감',
    find: 'if (!F.touchedDate) F.date = p.date || (prev && prev.date ? M.today : F.date);',
    replace: 'if (!F.touchedDate) F.date = p.date || F.baseDate || (prev && prev.date ? M.today : F.date);'
  },
  {
    name: '└ 사용 설명서 목차에서 "PC 바탕화면 위젯으로 쓰기" 빼기',
    find: ", ['g-widget', 'PC 바탕화면 위젯으로 쓰기']]]",
    replace: "].concat(window.BX_APP ? [] : [['g-widget', 'PC 바탕화면 위젯으로 쓰기']])]"
  }
];
patches.push(...step4, ...calendar, ...nav, ...fix10, ...icons, ...home, ...tidy);

for (const p of patches) {
  const count = html.split(p.find).length - 1;
  if (count !== 1) {
    console.error(`바꿀 곳을 찾지 못했습니다 (${count}곳): ${p.name}`);
    process.exit(1);
  }
  html = html.replace(p.find, () => p.replace);
  console.log(`적용: ${p.name}`);
}

// 바꾼 뒤 자바스크립트 문법이 깨지지 않았는지 확인(깨진 채로 www를 만들지 않음)
{
  const vm = await import('node:vm');
  const re = /<script>([\s\S]*?)<\/script>/g; let m, n = 0;
  while ((m = re.exec(html))) {
    n++;
    try { new vm.Script(m[1], { filename: 'index.html#script' + n }); }
    catch (e) { console.error('문법 오류: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')); process.exit(1); }
  }
}
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'index.html'), html);
copyFileSync(join(root, 'web-src', 'app-shim.js'), join(out, 'app-shim.js'));
// 명상 종소리(싱잉볼)는 앱 안에서도 휴대폰 쪽 플레이어(BxAlarm.bowl, res/raw)로 튼다. 같은 파일을 두 번 넣지 않으려고 www에는 복사하지 않는다
console.log(`www/index.html (${(html.length / 1024).toFixed(0)}KB) 만듦`);
