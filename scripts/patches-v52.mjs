// 시험판 52(대표 11/4 16:34 · 16:58, 결정 기록 D-25): 루틴 단계마다 세기(꼭 울림 · 짧게 한 번 · 소리 없이).
// 원본(boxworks.html)의 루틴 자료 · '오늘' 계산 · 홈 카드를 바꾼다. 세기를 고르는 칸 · 기본값은 web-src/v52.js, 알람 계획은 build-web.mjs.
// 다른 패치가 모두 바꾼 뒤의 글자를 찾으므로 목록 맨 끝에 붙인다(build-web.mjs).
export default [
  {
    name: '루틴 세기(52): 단계에 고른 세기(step.ring)를 저장해 둔다',
    find: `min: clampInt(s.min, 0, 600, 0), kind: s.kind === 'wait' ? 'wait' : 'do'};`,
    replace: `min: clampInt(s.min, 0, 600, 0), kind: s.kind === 'wait' ? 'wait' : 'do', ring: s.kind !== 'wait' && (s.ring === 'must' || s.ring === 'short') ? s.ring : undefined};`
  },
  {
    name: '└ 루틴 창 저장',
    find: `.trim().slice(0, 30) || '단계 ' + (i + 1), min: clampInt(s.min, 0, 600, 0), kind: s.kind === 'wait' ? 'wait' : 'do'}));`,
    replace: `.trim().slice(0, 30) || '단계 ' + (i + 1), min: clampInt(s.min, 0, 600, 0), kind: s.kind === 'wait' ? 'wait' : 'do', ring: s.kind !== 'wait' && (s.ring === 'must' || s.ring === 'short') ? s.ring : undefined}));`
  },
  {
    // '약속' · '예약'도 '먹었어요'가 되던 것. 앱에서 단계 체크는 하고 싶은 사람만 한 번 누른다(시작했어요 → 끝냈어요 두 번이 아니라)
    name: '└ 단계 단추 글: 약 단계만 먹었어요, 그 밖은 했어요',
    find: `  if (/약/.test(s.name)) return '먹었어요';
  if (/출발/.test(s.name)) return '출발했어요';
  return s.min > 0 ? '시작했어요' : '했어요';`,
    replace: `  if (bxIsMed(s.name)) return '먹었어요';
  if (/출발/.test(s.name)) return '출발했어요';
  return window.BX_APP ? '했어요' : s.min > 0 ? '시작했어요' : '했어요';`
  },
  {
    name: '└ 시간표의 줄마다 세기',
    find: `const rows = rt.steps.map(s => { const r = {id: s.id, name: s.name, at: t, min: s.min, kind: s.kind, ok: okLabel(s)}; t += s.min; return r; });`,
    replace: `const rows = rt.steps.map((s, i) => { const r = {id: s.id, name: s.name, at: t, min: s.min, kind: s.kind, ok: okLabel(s), ring: bxStepRing(s, i, rt.steps)}; t += s.min; return r; });`
  },
  {
    name: "└ 출발은 꼭 울림, 확인 단추는 '다 했어요'(대표 16:58 \"출근 직전에 '다 했다' 누르면 될 일\")",
    find: `ok: '출발했어요', leave: true});`,
    replace: `ok: '다 했어요', leave: true, ring: 'must'});`
  },
  {
    name: '└ 오늘: 짧게 한 번 단계는 끝 시각이 지나면 저절로 지나감(기다리기처럼)',
    find: `return Object.assign({}, r, {done: done[r.id] || (r.kind === 'wait' && nowM >= r.at + r.min ? 'auto' : null), started: st, extra: extra[r.id] || 0, endM: Math.max(r.at, sm == null ? r.at : sm) + r.min + (extra[r.id] || 0)}); });`,
    replace: `const endM = Math.max(r.at, sm == null ? r.at : sm) + r.min + (extra[r.id] || 0); return Object.assign({}, r, {done: done[r.id] || ((r.kind === 'wait' ? nowM >= r.at + r.min : r.ring === 'short' && nowM >= endM) ? 'auto' : null), started: st, extra: extra[r.id] || 0, endM}); });`
  },
  {
    // 꼭 울림 단계(기상 · 약 · 출발)를 확인하지 않았어도 다음 단계 시각이 되면 '지금'은 다음 단계(놓친 단계로 붙잡지 않음)
    name: "└ 오늘: '지금' 단계는 시각으로",
    find: `const cur = after ? null : todo.find(r => !r.done && r.at <= nowM) || null;`,
    replace: `const tAt = todo.reduce((a, r) => r.at <= nowM ? r.at : a, null);
  const cur = after ? null : todo.find(r => r.started && !r.done && r.at <= nowM) || todo.find(r => !r.done && r.at === tAt) || null;`
  },
  {
    // 체크는 하고 싶은 사람만 하므로 'N/M 완료'로 세지 않는다
    name: '└ 홈 루틴 카드: 끝난 루틴은 완료 개수 없이',
    find: `else if (s.after) { const td = s.rows.filter(r => r.kind !== 'wait'); now = '<p class="rt-note">시간이 지났어요 · ' + td.filter(r => r.done).length + '/' + td.length + ' 완료</p>'; }`,
    replace: `else if (s.after) now = '<p class="rt-note">시간이 지났어요</p>';`
  },
  {
    // 짧게 한 번 단계: '12분 지남'(주황) 대신 끝 시각과 다음 단계, 단추는 눌러도 되고 안 눌러도 되는 모양
    name: "└ 홈 루틴 카드 '지금' 줄",
    find: `      const late = s.nowM - c.at;
      now = '<div class="rt-now' + (late >= 10 ? ' late' : '') + '"><span class="rt-badge">지금</span><b>' + esc(c.name) + '</b><span class="rt-left tnum">' + bxT(mm(c.at)) + (late >= 1 ? ' · ' + leftText(late * 60000) + ' 지남' : ' · 지금 할 차례') + '</span><button type="button" class="btn sm primary" data-act="rt-ok" data-rid="' + rid + '" data-sid="' + esc(c.id) + '">' + esc(c.ok) + '</button></div>';`,
    replace: `      const late = s.nowM - c.at, sh = c.ring === 'short';
      const lt = sh ? (c.min ? bxT(mm(c.at + c.min)) + '까지' : bxT(mm(c.at))) + (s.next ? ' · 다음 ' + esc(s.next.leave ? '출발' : s.next.name) : '') : bxT(mm(c.at)) + (late >= 1 ? ' · ' + leftText(late * 60000) + ' 지남' : ' · 지금 할 차례');
      now = '<div class="rt-now' + (late >= 10 && !sh ? ' late' : '') + '"><span class="rt-badge">지금</span><b>' + esc(c.name) + '</b><span class="rt-left tnum">' + lt + '</span><button type="button" class="btn sm' + (sh ? '' : ' primary') + '" data-act="rt-ok" data-rid="' + rid + '" data-sid="' + esc(c.id) + '">' + esc(c.ok) + '</button></div>';`
  },
  {
    // 시각이 지나 저절로 지나간 단계는 흐리게(지운 줄 · 체크 표시 없이). 확인한 단계만 체크와 시각
    name: '└ 홈 루틴 카드 단계 목록: 저절로 지나간 단계',
    find: `const isCur = s.cur && s.cur.id === r.id, cls = r.done ? 'done' : r.kind === 'wait' ? 'wait' : isCur ? 'cur' : '';
    const st = r.done ? ICON.check + (r.done === 'auto' ? '끝' : hm(new Date(r.done))) : r.kind === 'wait' ? '기다리기' : isCur ? (r.started ? '하는 중' : '지금') : '';`,
    // 확인한 단계는 체크만(시각 '07:00'이 24시간으로 보이던 것, 이름 칸이 좁아 '기상하…'로 잘리던 것)
    replace: `const isCur = s.cur && s.cur.id === r.id, cls = r.done === 'auto' && window.BX_APP ? 'past' + (r.kind === 'wait' ? ' wait' : '') : r.done ? 'done' : r.kind === 'wait' ? 'wait' : isCur ? 'cur' : '';
    const st = r.done === 'auto' && window.BX_APP ? '' : r.done ? ICON.check + (window.BX_APP ? '' : r.done === 'auto' ? '끝' : hm(new Date(r.done))) : r.kind === 'wait' ? '기다리기' : isCur ? (r.started ? '하는 중' : '지금') : '';`
  },
  {
    // 앱을 열어 둔 동안 화면 안에 뜨는 알림 카드도 같은 규칙: 꼭 울림 단계만(짧게 한 번은 휴대폰 알림 한 장으로 충분), '10분 뒤 출발' 카드 없음
    name: '└ 앱 안 알림 카드: 꼭 울림 단계만',
    find: `const todo = rows.filter(r => r.kind !== 'wait'), i = todo.findIndex(r => !r.done);
  if (i < 0) return out;`,
    replace: `const todo = rows.filter(r => r.kind !== 'wait'), i = todo.findIndex(r => !r.done);
  if (i < 0) return out;
  if (window.BX_APP && todo[i].ring !== 'must' && !todo[i].started) return out;`
  },
  {
    name: "└ 앱 안 알림 카드: '10분 뒤 출발'은 웹에서만",
    find: `if (leave && !leave.done) out.push({t: T(leave.at - 10), sid: leave.id, k: 'h', kind: 'heads'});`,
    replace: `if (leave && !leave.done && !window.BX_APP) out.push({t: T(leave.at - 10), sid: leave.id, k: 'h', kind: 'heads'});`
  }
];
