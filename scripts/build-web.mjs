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
import safe from './patches-safe.mjs';
import v30 from './patches-v30.mjs';
import v31 from './patches-v31.mjs';
import v32 from './patches-v32.mjs';
import v36 from './patches-v36.mjs';
import words from './patches-words.mjs';
import v37 from './patches-v37.mjs';
import v38 from './patches-v38.mjs';
import v39 from './patches-v39.mjs';
import v40 from './patches-v40.mjs';
import v41 from './patches-v41.mjs';
import v42 from './patches-v42.mjs';
import v43 from './patches-v43.mjs';
import v51 from './patches-v51.mjs';
import v52 from './patches-v52.mjs';
import uiOwned from './ui-owned.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'web-src', 'boxworks.html');
const out = join(root, 'www');

let html = readFileSync(src, 'utf8');

// 앱 이름은 한 곳에서만 정한다(대표 결정 11/3 23:40 '일단 스케줄러, 나중에 바꿀 때 두 이름을 찾다가 틀리지 않게').
// 안드로이드 res/values/strings.xml 의 app_name 을 읽어 화면 글자(window.BX_NAME)와 <title>, 처음 여는 화면에 넣는다
const APP_NAME = (/<string name="app_name">([^<]+)<\/string>/.exec(readFileSync(join(root, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml'), 'utf8')) || [])[1];
if (!APP_NAME) { console.error('strings.xml 에서 app_name 을 찾지 못했습니다'); process.exit(1); }

const patches = [
  {
    name: '앱 연결부를 가장 먼저 불러오기',
    find: '<head>',
    // 글자 인코딩을 정하는 meta보다 앞이라 이름은 \uXXXX로 적는다(어느 경우에도 깨지지 않게)
    replace: '<head><script>window.BX_NAME = ' + JSON.stringify(APP_NAME).replace(/[\u0080-\uffff]/g, ch => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0')) + ';</script><script src="app-shim.js"></script>'
  },
  {
    name: '앱 이름(strings.xml app_name): 문서 제목',
    find: '<title>박스웍스 스케줄러</title>',
    replace: '<title>' + APP_NAME + '</title>'
  },
  {
    name: '└ 알람 수가 붙는 문서 제목',
    find: "document.title = (alarms.length ? '(' + alarms.length + ') ' : '') + '박스웍스 스케줄러';",
    replace: "document.title = (alarms.length ? '(' + alarms.length + ') ' : '') + (window.BX_APP ? window.BX_NAME : '박스웍스 스케줄러');"
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
  const now = Date.now(), until = now + days * 864e5, out = [], nags = [];
  // 시험판 37(대표 지적 11/3 '유튜브를 보다 알림이 진동 한 번 뒤 사라져 놓친다', 대표 결정 '진동 3번 + 놓치면 다시'):
  // '알림'으로 울리는 일정 · 시간표는 알림창에 그대로 있으면 3분 · 10분 뒤 한 번씩 더(휴대폰 쪽 AlarmNotify.renotice).
  // 목록에 함께 넣어 두어, 일정을 완료 · 삭제 · 수정하면 다시 알림도 같이 빠진다
  const nagOf = a => [3, 10].forEach((m, j) => { const t2 = a.at + m * 60000; if (t2 <= until) nags.push(Object.assign({}, a, {id: a.id + '_n' + (j + 1), at: t2, kind: 'nag', of: a.id, nag: j + 1})); });
  // 울리는 방식(종류별 기본값, web-src/flow.js): lv = alarm | notice | quiet. 끈 기능(루틴·시간표)은 알람도 쉰다
  const lvR = bxLevel('routine'), lvI = bxLevel('item'), lvT = bxLevel('tt'), rtOn = bxModOn('routines'), ttOnF = bxModOn('tt');
  // 시험판 52(대표 11/4 16:58, D-25): 루틴 단계마다 세기. 꼭 울림 = 끌 때까지(lvR, 다시 알림) · 짧게 한 번 = 짧은 소리 한 번(누를 것 없음,
  // 울리는 방식이 '조용히'면 소리 없이) · 소리 없이(기다리기) = 울리지 않고 알림창 '진행 중' · 위젯 글만 바뀐다
  const lvS = lvR === 'quiet' ? 'silent' : 'short';
  // 출발 10분 전 알림(짧게 한 번)이 루틴을 하는 동안이면 울리지 않는다: 루틴 알림창에 '출발까지 N분'이 이미 보인다(출근 준비 단계와 겹치면 하나로).
  // 일정의 출발이 루틴의 출발과 같은 때(앞뒤 2분)면 루틴 출발 알람 하나만(확인을 두 번 받지 않게)
  const rtWins = [], rtLeaves = [];
  if (rtOn) M.routines.forEach(rt => {
    if (rt.sound === 'bowl') return;
    const p = rtPlan(rt); if (p.bad || !(p.end > p.start)) return;
    for (let k = 0; k <= days; k++) {
      const day = addDays(sod(new Date(now)), k), ds = ymd(day);
      if (!rtActiveOn(rt, ds) || (M.rlogs.get(rt.id + '|' + ds) || {}).skip) continue;
      rtWins.push([addMin(day, p.start).getTime(), addMin(day, p.end).getTime()]);
      if (p.leave != null) rtLeaves.push(addMin(day, p.leave).getTime());
    }
  });
  const inRt = t => rtWins.some(w => t >= w[0] && t <= w[1]);
  const rtLeaveNear = t => rtLeaves.some(x => Math.abs(x - t) <= 2 * 60000);
  M.items.forEach(it => {
    if (it.done || it.deletedAt) return;
    const tvs = tvAlarms(it);
    // 시험판 65(결정 사안 s07 · 정할 것 2번): 크게 울리는 일정(사용자가 알림 페이지에서 켬, 알림이 있을 때만)은
    // 사전 알림도 알람처럼(잠금 화면 알람 · 끌 때까지), 잠금 화면에 제목이 보인다(장소는 그대로 잠금을 풀면). 설정 '표시 안 함'이면 그대로 가림(휴대폰 쪽)
    const loud = !!it.loud && remList(it.remind).length > 0, nm = it.title || '(제목 없음)';
    tvs.forEach(a => {
      if (a.at <= now || a.at > until) return;
      if (a.pre && inRt(a.at)) return;
      // pt·ps·pg: 잠금 화면에 대신 보일 제목·내용·묶음 이름(대표 결정 10/31: 일정 제목·장소는 잠금을 풀면)
      const isLeave = a.title === '출발할 시간';
      if (isLeave && rtLeaveNear(a.at)) return;
      out.push({id: 'iv_' + it.id + '_' + a.id + '_' + a.at, at: a.at, kind: a.routine ? 'routine' : 'item', group: a.group, title: a.title, sub: a.sub,
        body: a.sub, from: a.routine ? a.from : 0, to: a.routine ? a.to : 0, next: a.next,
        pt: isLeave ? (loud ? '출발할 시간 · ' + nm : '출발할 시간') : a.routine ? a.title : (loud ? nm : '곧 출발'),
        ps: isLeave ? (loud ? bxT(it.start) + ' 도착' : '일정 내용은 잠금을 풀면 보여요') : a.sub,
        pg: a.routine ? (loud ? String(a.group) : String(a.group).split(' · ')[0]) : '일정',
        lv: a.ring === 'short' ? lvS : lvR, ring: a.ring === 'short' ? 'short' : 'must', ok: a.ok || undefined, say: a.say, first: a.first || undefined});
    });
    tvRemTimes(it, tvs).forEach(r => {
      const t = r.getTime(); if (t <= now || t > until) return;
      const when = relDay(it.date, ymd(new Date(t))) + ' ' + timeText(it);
      const lead = bxLeadText(it.start ? at(it.date, it.start).getTime() - t : null, relDay(it.date, ymd(new Date(t))));
      const ai = {id: 'i_' + it.id + '_' + t, at: t, kind: 'item', group: '일정', title: nm,
        sub: when + (it.location ? ' · ' + it.location : ''), body: when + (it.location ? ' · ' + it.location : ''),
        pt: loud ? nm : '일정 알림', ps: loud ? lead : lead + ' · 잠금을 풀면 보여요', pg: '일정', lv: loud ? 'alarm' : lvI};
      if (loud) ai.loud = true;
      out.push(ai); if (ai.lv === 'notice') nagOf(ai);
    });
  });
  const reps = [];
  M.routines.forEach(rt => {
    if (!rtOn) return;
    const p = rtPlan(rt); if (p.bad) return;
    const rows = p.rows.filter(r => r.kind !== 'wait');
    // 다시 알림: 꼭 울림 단계에서 확인을 누르지 않으면 every분마다 times번 더(루틴 창에서 정함). 다음 꼭 울림 단계가 울리기 전까지만
    const bowl = rt.sound === 'bowl';
    // 단계표의 세기: m 꼭 울림 · s 짧게 한 번 · w 소리 없이(위젯 '확인' 단추는 꼭 울림 단계에만)
    const RC = r => r.kind === 'wait' ? 'w' : r.ring === 'must' ? 'm' : 's';
    const rep = bowl ? 0 : Math.max(0, Math.min(12, Math.round(+rt.times || 0))), every = Math.max(1, Math.min(60, Math.round(+rt.every || 5)));
    for (let k = 0; k <= days; k++) {
      const day = addDays(sod(new Date(now)), k), ds = ymd(day);
      if (!rtActiveOn(rt, ds)) continue;
      const lg = M.rlogs.get(rt.id + '|' + ds) || {}; if (lg.skip) continue;
      const doneMap = lg.done || {};
      // 알림창 '진행 중'과 '지금 단계' 위젯이 쓰는 그날 단계표(첫 알람에만 싣는다)
      const leaveAt = p.leave != null ? addMin(day, p.leave).getTime() : 0;
      // 시험판 52: 기다리기 단계도 넣는다(알림창 · 위젯이 '지금 세탁 기다리기'를 보이게)
      const steps = p.rows.map(r => Object.assign({at: addMin(day, r.at).getTime(), n: r.leave ? '출발' : r.name, s: 'r_' + rt.id + '_' + ds + '_' + r.id, min: r.min || 0, d: !!doneMap[r.id], r: RC(r)}, r.leave ? {ok: '다 했어요'} : {}));
      rows.forEach((r, i) => {
        if (doneMap[r.id]) return;
        const must = r.ring === 'must';
        // 짧게 한 번: 같은 시각에 꼭 울림 단계가 있거나 앞 단계와 시각이 같으면(0분 단계) 따로 울리지 않는다
        if (!must && !bowl && rows.some((x, q) => q !== i && x.at === r.at && (x.ring === 'must' || q < i))) return;
        const base = 'r_' + rt.id + '_' + ds + '_' + r.id, nx = p.rows[p.rows.indexOf(r) + 1];
        const nm = rows.slice(i + 1).find(x => x.ring === 'must'), rp = must && !bowl ? rep : 0;
        const limit = nm ? addMin(day, nm.at).getTime() : addMin(day, r.at + rp * every + 1).getTime();
        for (let j = 0; j <= rp; j++) {
          const atM = r.at + j * every, t = addMin(day, atM).getTime();
          if (j > 0 && t >= limit) break;
          if (t <= now || t > until) continue;
          const left = p.leave != null && !r.leave ? Math.round(p.leave - atM) : null;
          const sub = [r.leave ? (j ? '출발 시각이 ' + (j * every) + '분 지났어요' : '지금 나갈 시간') : left != null ? '출발까지 ' + left + '분' : '', j ? '다시 알림 ' + j + '/' + rp : ''].filter(Boolean).join(' · ');
          const a = {id: base + (j ? '_r' + j : ''), at: t, kind: 'routine', group: rt.name || '루틴', icon: r.leave ? 'car' : bxIconFor(r.name) || bxRtIconKey(rt),
            title: r.leave ? '출발할 시간' : r.name, sub, body: (rt.name || '루틴') + (sub ? ' · ' + sub : ''),
            from: addMin(day, p.start).getTime(), to: p.leave != null ? addMin(day, p.leave).getTime() : 0,
            next: nx ? bxT(hmOf(nx.at)) + ' ' + (nx.leave ? '출발' : nx.name) : ''};
          // series: 이 단계의 알람 묶음. 휴대폰에서 '확인'을 누르면 남은 다시 알림을 지우고, 앱에 '했어요'로 옮긴다
          a.series = base;
          a.pt = a.title; a.ps = sub; a.pg = rt.name || '루틴'; a.lv = must ? lvR : lvS; a.ring = must ? 'must' : 'short';
          if (r.leave) a.ok = '다 했어요';
          if (!j && !bowl) { a.rid = rt.id; a.ds = ds; a.leave = leaveAt; a.steps = steps; }
          // 시험판 69(결정 사안 s10): 시험 기록이 '준비 시작 알람 → 시작까지'를 재는 첫 단계(다시 알림도 같은 묶음)
          if (!i && !bowl) a.first = true;
          if (bowl) { a.sound = 'bowl'; a.bowl = rt.bowl || bxBowlType(); }
          // 시험판 67(결정 사안 s05): 이름 읽어 주기를 켠 루틴은 울릴 때 '씻기, 출발까지 25분'을 휴대폰 목소리로(다시 알림도). 잠금 화면 글과 같은 말만(일정 제목 · 장소 없음)
          if (rt.say && !bowl) a.say = (r.leave ? '출발할 시간' : r.name) + (left != null && !r.leave ? ', 출발까지 ' + left + '분' : '');
          (j ? reps : out).push(a);
        }
      });
      // 소리 없이(기다리기) 단계가 시작될 때: 소리 · 알림 없이 알림창 '진행 중'과 위젯만 고친다(상태 표시줄 '다음 알람'에도 넣지 않음)
      if (!bowl) p.rows.forEach(r => {
        if (r.kind !== 'wait' || doneMap[r.id]) return;
        const t = addMin(day, r.at).getTime(); if (t <= now || t > until) return;
        const sid = 'r_' + rt.id + '_' + ds + '_' + r.id;
        out.push({id: sid, at: t, kind: 'routine', lv: 'silent', ring: 'silent', series: sid, group: rt.name || '루틴', title: r.name, sub: '', body: '',
          rid: rt.id, ds, leave: leaveAt, steps});
      });
      // 루틴이 끝난 10분 뒤: 확인하지 않은 중요한 단계가 있으면 휴대폰이 한 번 더 알린다(대표 요청, 시험판 52부터 약 단계만 → 시험판 68 중요한 단계만, 결정 사안 s20)
      const born = bxRtBornM(rt, ds), todo = rows.filter(r => r.ring === 'must' && r.chk && !doneMap[r.id] && r.at >= born);
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
      const at2 = {id: 'tt_' + e.id + '_' + ds, at: t, kind: 'item', group: '시간표', icon: bxIconFor(e.name) || 'school', title: e.name,
        sub: (e.place ? e.place + ' · ' : '') + lead, body: bxTR(e.start, e.end) + (e.place ? ' · ' + e.place : '') + ' · ' + lead,
        pt: '시간표 알림', ps: lead + ' · 잠금을 풀면 보여요', pg: '시간표', lv: lvT};
      out.push(at2); if (lvT === 'notice') nagOf(at2);
    }
  });
  // 시험판 61(대표 11/5 22:50 "이게 잊기 쉬운 일정인데다 입력 오류가 난 경우가 많아서 … 나중에 알람도 보내줘야 할것같은데 ·
  // 오늘 일정중에 시간이 배정되지 않은 일정이 몇개가 있습니다. 확인하세요" · "내가 실수로 기입한것도 모르고 지나치는 경우가 너무 많아서"):
  // 그날 시간을 정하지 않은 종일 일정(여러 날 · 휴대폰 캘린더 · 홈에서 뺀 캘린더 · 다 한 것은 빼고)이 있으면 확인 알림 한 장.
  // 때는 설정 › 알림의 '종일 일정 알림 시각'(꺼 두었거나 전날로 정했으면 그날 오전 9시). 그 시각이 지난 뒤 오늘 일정을 시간 없이 넣으면 넣은 지 30분 뒤에 한 번 더.
  // 누르면 홈(맨 위 종일 줄, 휴대폰 쪽 open: 'home'). 잠금 화면에는 개수만(일정 제목은 잠금을 풀면)
  {
    const dA = remAbs(remNorm((M.settings || {}).defaultRemindDay, false)), chkT = dA && dA.d === 0 ? dA.t : '09:00';
    const lvC = lvI === 'quiet' ? 'quiet' : 'notice';
    const utOf = ds => M.items.filter(it => (!it.type || it.type === 'item') && it.date === ds && !it.start && !it.done && !it.deletedAt && !it.pc && !/^pc_/.test(it.id || '') &&
      !(typeof bxSpan === 'function' && bxSpan(it)) && (typeof bxHomeOk !== 'function' || bxHomeOk(it)));
    const chk = (ds, t, list, id) => {
      const n = list.length, names = list.slice(0, 3).map(it => it.title || '(제목 없음)').join(' · ') + (n > 3 ? ' 외 ' + (n - 3) + '개' : '');
      const head = relDay(ds, ymd(new Date(t))) + ' 시간이 정해지지 않은 일정이 ' + n + '개 있어요. 확인하세요.';
      out.push({id, at: t, kind: 'item', group: '일정', icon: 'bell', title: '시간을 정하지 않은 일정', sub: head, body: head + ' ' + names,
        pt: '확인할 일정', ps: '시간을 정하지 않은 일정이 ' + n + '개 있어요', pg: '일정', lv: lvC, open: 'home'});
    };
    for (let k = 0; k <= days; k++) {
      const day = addDays(sod(new Date(now)), k), ds = ymd(day), list = utOf(ds); if (!list.length) continue;
      const t = addMin(day, toMin(chkT)).getTime();
      if (t > now && t <= until) chk(ds, t, list, 'utc_' + ds);
      // 오늘, 확인 시각이 지난 뒤 시간 없이 넣은 일정: 마지막으로 넣은 지 30분 뒤(그사이 더 넣으면 뒤로 밀림)
      if (k === 0 && t <= now) {
        const late = list.filter(it => Date.parse(it.createdAt || '') > t);
        const last = late.reduce((m, it) => Math.max(m, Date.parse(it.createdAt)), 0), t2 = last + 30 * 60000;
        if (late.length && t2 > now && t2 <= until) chk(ds, t2, list, 'utc_' + ds + '_' + last);
      }
    }
  }
  // 휴대폰에 거는 알람은 최대 200개(앱 하나가 걸 수 있는 알람은 500개, 명상 종 몫을 남긴다). 고르는 순서(문제점 점검 기술 1):
  // ① 앞으로 48시간의 알람과 다시 알림 ② 그 뒤의 첫 알람(최대 days일) ③ 남는 자리에 앞 7일의 다시 알림
  const CAP = 200, near = now + 2 * 864e5, repEnd = now + 7 * 864e5, byAt = (a, b) => a.at - b.at;
  out.sort(byAt); nags.forEach(a => reps.push(a)); reps.sort(byAt);
  const tierA = out.filter(a => a.at <= near).concat(reps.filter(a => a.at <= near)).sort(byAt);
  const tierB = out.filter(a => a.at > near), tierC = reps.filter(a => a.at > near && a.at <= repEnd);
  const pick = tierA.slice(0, CAP), takeB = tierB.slice(0, Math.max(0, CAP - pick.length));
  // 알람이 이어지는 끝: 다 들어갔으면 계획 기간 끝, 잘렸으면 처음 빠진 알람 시각
  const cut = tierA.length > CAP ? tierA[CAP].at : tierB.length > takeB.length ? tierB[takeB.length].at : until;
  const plan = pick.concat(takeB, tierC.slice(0, Math.max(0, CAP - pick.length - takeB.length)));
  // 아침 보고: 아침 루틴 첫 알람에 붙이거나, 없으면 정한 시각에 따로(web-src/brief.js). 알람이 끊기는 곳 뒤로는 걸지 않는다
  const list = bxAddReports(plan, days).filter(a => a.kind !== 'report' || a.at < cut);
  // 앱을 오래 열지 않는 사람: 알람이 끝나기 전날 낮 12시에 '알람이 곧 끝나요'. 앱을 열면 계획을 새로 세워 이 알림도 뒤로 밀린다
  if (list.length) {
    let t = addMin(sod(new Date(cut - 864e5)), 12 * 60).getTime();
    if (t >= cut - 3 * 3600e3) t = cut - 3 * 3600e3;
    if (t < now + 3600e3) t = now + 3600e3;
    if (t < cut) list.push({id: 'bx_renew', at: t, kind: 'item', lv: 'notice', group: window.BX_NAME, icon: 'bell', title: '알람이 곧 끝나요',
      sub: '앱을 한 번 열어 주세요', body: '앱을 한 번 열어 주세요. 열면 앞으로 2주 치 알람을 다시 걸어요.',
      pt: '알람이 곧 끝나요', ps: '앱을 한 번 열어 주세요', pg: window.BX_NAME});
  }
  return list.sort(byAt);
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
    replace: "'<span class=\"c-chip' + (i.done ? ' done' : '') + (lt ? ' late' : '') + '\" style=\"--c:' + (lt ? 'var(--warn)' : i.done ? 'var(--done)' : catColor(i.categoryId)) + '\" data-item=\"' + esc(i.id) + '\" title=\"두 번 누르면 수정\"><i class=\"dot\" style=\"--c:' + (lt ? 'var(--warn)' : i.done ? 'var(--done)' : catColor(i.categoryId)) + '\"></i><span>' + (i.start ? '<b class=\"c-t\">' + bxT(i.start) + ' </b>' : '')"
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
    replace: "\nfunction bxMic(id, prompt){ return window.BX_HAS_MIC ? '<button type=\"button\" class=\"bx-mic\" data-act=\"bx-mic\" data-for=\"' + id + '\" data-prompt=\"' + esc(prompt || '') + '\" aria-label=\"말하기\"><svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"9\" y=\"3\" width=\"6\" height=\"12\" rx=\"3\"/><path d=\"M5 11a7 7 0 0 0 14 0\"/><path d=\"M12 18v3\"/></svg></button>' : ''; }\nwindow.BX_parse = function(text){ return parseQuick(text, new Date()); };\nwindow.BX_parseAt = function(text, now){ return parseQuick(text, now); };\nwindow.BX_toast = function(msg){ toast(msg); };"
  },
  {
    name: '사용 설명서에서 앱에 없는 장(Claude 연동·AI 정리·아침 보고·링크 공유·바로가기 설치) 빼기',
    find: "  ['도움말', [['g-faq', '자주 묻는 질문']]]\n];",
    replace: "  ['도움말', [['g-faq', '자주 묻는 질문']]]\n];\nif (window.BX_APP) { const off = ['g-start', 'g-report', 'g-ai', 'g-share', 'g-devices', 'g-widget']; for (let i = GUIDE.length - 1; i >= 0; i--) { GUIDE[i][1] = GUIDE[i][1].filter(x => !off.includes(x[0])); if (!GUIDE[i][1].length) GUIDE.splice(i, 1); } }"
  },
  {
    name: '시간표(D-06) 코드 넣기: web-src/timetable.js',
    find: '\nwindow.BX_back = function(){',
    replace: '\n' + readFileSync(join(root, 'web-src', 'timetable.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'travel.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'calendar.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'home.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'brief.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'icons.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'rticons.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'meditation.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'start.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'flow.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'tidy.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'v30.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'v31.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'v32.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'v36.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'space.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'motion.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'setall.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'v38.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'v39.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'v40.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'v41.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'v42.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'v43.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'v44.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'v45.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'v46.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'v48.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'v49.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'v51.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'v52.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'v53.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'v55.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'v59.js'), 'utf8') + '\n' + readFileSync(join(root, 'web-src', 'v60.js'), 'utf8') + '\nwindow.BX_back = function(){'
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
  // 시험판 59(대표 11/5 19:57 '30분 뒤에 마트 갈거야'): 지금부터 N분 · N시간 뒤 → 날짜 · 시각(web-src/v59.js)
  s = bxRelTime(s, now);
  s = s.replace(/내일\\s*모레/g, '모레');
  // 시험판 56(대표 위젯 사진 11/5 13:44 '12시까지 경영학 수업'): '10시 12시까지' · '10시에서 12시까지'처럼 '부터' 없이 적은 끝 시각도 범위로
  s = s.replace(new RegExp('(' + TIME + ')\\\\s*(?:에서)?\\\\s*(?=' + TIME + '\\\\s*까지)'), '$1~');
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
  // 시험판 59: '마트 갈거야 · 들를 예정' → '마트', '약 먹어야 해' → '약 먹기'(web-src/v59.js). '예정'을 지우기 전에
  t = ' ' + bxTitleTail(t) + ' ';
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
    replace: 'touchedDate: false, baseDate: date, travel: 0, tvSrc: \'\', tvKey: \'\', prep: null, prepNew: null, prepMin: {}, prepRing: {}, prepSave: false, touchedTravel: false, touchedPrep: false, touchedTime: false'
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
  },
  {
    // 시험판 62(대표 11/6 선택실 4 · 1번 B '세 칸 바퀴(삼성 시계처럼)', 결정 사안 s02): 앱의 시간 페이지는 휴대폰 시계 창 대신
    // 시작 · 끝 칸 + 바퀴(web-src/v44.js bxTwHtml · bxTwMount). 웹은 그대로
    name: '시간 페이지: 시작 · 끝 칸과 바퀴(앱)',
    find: `'<div class="fgrid"><label class="fg-l" for="f-start">시간</label><div class="trange"><input type="time" id="f-start" class="inp" value="' + esc(F.start) + '" aria-label="시작"><span class="tilde">~</span><input type="time" id="f-end" class="inp" value="' + esc(F.end) + '" aria-label="끝"></div>' +`,
    replace: `'<div class="fgrid"><label class="fg-l" for="f-start">시간</label>' + (window.BX_APP ? bxTwHtml() : '<div class="trange"><input type="time" id="f-start" class="inp" value="' + esc(F.start) + '" aria-label="시작"><span class="tilde">~</span><input type="time" id="f-end" class="inp" value="' + esc(F.end) + '" aria-label="끝"></div>') +`
  },
  {
    name: '└ 그린 뒤 바퀴를 고른 칸으로 맞추기',
    find: "  el.innerHTML = html;\n}\nfunction drawFCat(){",
    replace: "  el.innerHTML = html;\n  if (window.BX_APP) bxTwMount(el);\n}\nfunction drawFCat(){"
  }
];
patches.push(...step4, ...calendar, ...nav, ...fix10, ...icons, ...home, ...tidy, ...safe, ...v30, ...v31, ...v32, ...v36, ...words, ...v37, ...v38, ...v39, ...v40, ...v41, ...v42, ...v43, ...v51, ...v52);

for (const p of patches) {
  const count = html.split(p.find).length - 1;
  // all: true는 같은 글자가 여러 곳이면 모두 바꾼다(단어 점검, patches-words.mjs). 한 곳도 없으면 멈춘다
  if (p.all && count >= 1) {
    html = html.split(p.find).join(p.replace);
    console.log(`적용: ${p.name} (${count}곳)`);
    continue;
  }
  if (count !== 1) {
    console.error(`바꿀 곳을 찾지 못했습니다 (${count}곳): ${p.name}`);
    process.exit(1);
  }
  html = html.replace(p.find, () => p.replace);
  console.log(`적용: ${p.name}`);
}

// 시험판 55(대표 11/5 01:30, 결정 기록 D-28): 단추 · 칩 · 나눔 단추 · 글자 단추 · 아이콘 단추 · 체크 · 스위치는 app.css 맨 앞 '공통 부품' 한 곳.
// 공통 부품이 가져간 웹 원본 규칙(scripts/ui-owned.mjs)을 원본 <style>에서 지운다. 못 찾거나 수가 다르면 멈춘다
{
  const want = uiOwned.map(o => Object.assign({ hit: 0 }, o));
  const norm = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
  html = html.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/g, (m, a, css, b) => a + css.replace(/([^{}]*)\{([^{}]*)\}/g, (r, sel, body) => {
    const o = want.find(w => w.sel === norm(sel));
    if (!o) return r;
    o.hit++;
    const lead = /^(?:\s|\/\*[\s\S]*?\*\/)*/.exec(sel)[0], s = sel.slice(lead.length);
    if (o.set) { let bd = body; for (const [k, v] of Object.entries(o.set)) bd = bd.replace(new RegExp('(^|;)(\\s*)' + k + '\\s*:[^;]*'), '$1$2' + k + ':' + v); return lead + s + '{' + bd + '}'; }
    if (o.drop) { const keep = body.split(';').filter(d => d.trim() && !o.drop.includes(d.split(':')[0].trim().toLowerCase())); return lead + (keep.length ? s + '{' + keep.join(';') + '}' : ''); }
    return lead;
  }) + b);
  const bad = want.filter(w => w.hit !== (w.n || 1));
  if (bad.length) { bad.forEach(w => console.error(`공통 부품이 가져갈 원본 규칙 수가 다릅니다: ${w.sel} (${w.hit}곳, 바라는 수 ${w.n || 1})`)); process.exit(1); }
  console.log('공통 부품이 가져간 원본 규칙 ' + want.reduce((n, w) => n + w.hit, 0) + '개(scripts/ui-owned.mjs)');
}

// 시험판 51(대표 11/4 디자인 가이드 '6단계로 줄이기'): 글자 크기는 28 · 20 · 16 · 14 · 13 · 11.5만 쓴다.
// 원본 · 패치 · 모듈 어디에서 온 font-size든 가장 가까운 단계로 맞춘다. 명상 타이머 숫자만 따로(50 · 38). 0(글자 숨김)은 그대로
{
  const step = v => v === 0 ? 0 : v <= 11.5 ? 11.5 : v <= 13 ? 13 : v <= 14.5 ? 14 : v <= 17 ? 16 : v <= 24 ? 20 : v <= 34 ? 28 : v <= 44 ? 38 : 50;
  let n = 0;
  html = html.replace(/font-size:(\s*)(\d+(?:\.\d+)?)px/g, (m0, sp, v) => { const s = step(+v); if (s !== +v) n++; return 'font-size:' + sp + s + 'px'; });
  console.log(`글자 크기 6단계: ${n}곳을 가까운 단계로`);
}
// 시험판 54(대표 상시 규칙 11/4 22:59, 결정 기록 D-27): 앱 모양 규칙은 web-src/app.css 한 곳.
// 웹 원본 머리 규칙(<head>의 작은 <style>) 바로 뒤, 원본 화면 규칙(<body>의 <style>) 앞에 넣는다. 모듈은 <style>을 붙이지 않는다
// 시험판 55(대표 11/5 01:30 '글꼴 · 크기 · 굵기 · 자간 · 행간을 역할별로', 결정 기록 D-28): 글자 크기 단계마다 줄 높이 · 자간은 하나.
// 글자 크기를 정한 규칙에는 그 단계의 공통 값(app.css 공통 부품 --lh-* · --ls-*)을 넣고, 그 규칙의 다른 줄 높이 · 자간은 지운다.
// 크기를 물려받는 글자는 그 값도 함께 물려받는다. 명상 타이머 숫자(50 · 38)와 0(숨김)은 그대로
const ROLE = { 28: 'title', 20: 'heading', 16: 'body', 14: 'sub', 13: 'note', 11.5: 'cap' };
let roleN = 0;
const roleType = css => css.replace(/([^{}]*)\{([^{}]*)\}/g, (r, sel, body) => {
  const m = /(?:^|;)\s*font-size\s*:\s*(\d+(?:\.\d+)?)px/.exec(body);
  if (!m || !ROLE[+m[1]] || sel.trim().startsWith('@')) return r;
  roleN++;
  const role = ROLE[+m[1]];
  const keep = body.split(';').filter(d => d.trim() && !/^\s*(line-height|letter-spacing)\s*:/i.test(d));
  return sel + '{' + keep.join(';') + ';line-height:var(--lh-' + role + ');letter-spacing:var(--ls-' + role + ')}';
});
html = html.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/g, (m, a, css, b) => a + roleType(css) + b);
{
  const css = roleType(readFileSync(join(root, 'web-src', 'app.css'), 'utf8'));
  console.log('글자 역할(줄 높이 · 자간): 글자 크기를 정한 규칙 ' + roleN + '곳에 단계 값');
  if (html.split('</head>').length !== 2) { console.error('</head>를 한 곳에서 찾지 못했습니다'); process.exit(1); }
  if (/<\/style/i.test(css)) { console.error('app.css 안에 </style 글자가 있습니다'); process.exit(1); }
  html = html.replace('</head>', () => '<style id="bx-app-css">\n' + css + '</style></head>');
  console.log('앱 모양 규칙(app.css) ' + Math.round(css.length / 1024) + 'KB');
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
// 처음 여는 화면 같은 곳의 앱 이름 자리(@@BX_NAME@@)
html = html.split('@@BX_NAME@@').join(APP_NAME);
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'index.html'), html);
copyFileSync(join(root, 'web-src', 'app-shim.js'), join(out, 'app-shim.js'));
// 명상 종소리(싱잉볼)는 앱 안에서도 휴대폰 쪽 플레이어(BxAlarm.bowl, res/raw)로 튼다. 같은 파일을 두 번 넣지 않으려고 www에는 복사하지 않는다
console.log(`www/index.html (${(html.length / 1024).toFixed(0)}KB) 만듦`);
