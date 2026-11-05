/* ---------- 시험판 43: 캘린더 보기 바꾸기를 왼쪽 아래 '일 · 주 · 월'로(대표 아이디어 11/4 0:46 · 결정 0:55 '가') ----------
   대표: "월간/주간 보는 버튼은 새 일정 추가 버튼과 같은 방식으로 왼쪽 하단에 일/주/월 보기로 바꾸게 되면, 비게 되는 윗공간으로
   캘린더를 당겨서 캘린더가 더 많이 보이게." "일 주 월 보기는 작게 만들어도 될 것 같다."
   - 위의 '월간 | 주간' 줄을 뺐다(timetable.js · flow.js). '오늘'은 '‹ 11월 ›' 줄 오른쪽 끝.
   - 왼쪽 아래 작은 '일 · 주 · 월'(높이 44, + 단추와 가운데를 맞춤). 캘린더 · 주간 · 하루 보기에서만.
   - '일'은 캘린더 안의 하루 보기: 그날 일정 · 메모, ‹ ›와 옆으로 밀기로 하루씩. 홈으로 넘어가지 않아 일 · 주 · 월이 그대로 보인다.
   - 월간 칸 높이는 화면에 맞춰 늘리고(최소 86px), 칸이 크면 일정을 3줄(넓으면 4줄)까지 보인다. 넘치면 '+N'.
   - 단추가 아래쪽 주의 월~수 칸 일부를 가린다(대표가 알고 고름, 11/4 0:55). 그래서 작게 만든다 */
var bxCalLanes = null;
const BX_VSW = [['day', '일', '하루 보기'], ['week', '주', '한 주 보기'], ['month', '월', '한 달 보기']];
function bxVswOn(){ return !!(window.BX_APP && !S.widget && (S.view === 'month' || S.view === 'week' || S.view === 'day')); }
function bxVswSync(){
  const on = bxVswOn();
  document.documentElement.classList.toggle('bx-vsw-on', on);
  let el = document.getElementById('bx-vsw');
  if (!el) {
    if (!on) return;
    el = document.createElement('div');
    el.id = 'bx-vsw'; el.className = 'bx-vsw'; el.setAttribute('role', 'group'); el.setAttribute('aria-label', '캘린더 보기');
    document.body.appendChild(el);
  }
  const sig = S.view;
  if (el.dataset.v === sig) return;
  el.dataset.v = sig;
  el.innerHTML = BX_VSW.map(([k, t, a]) => '<button type="button" data-bxvsw="' + k + '" aria-pressed="' + (S.view === k) + '" aria-label="' + a + '">' + t + '</button>').join('');
}
// 보기를 바꿀 때 이어 볼 날짜: 하루 보기의 날 · 주간이면 그 주(이번 주면 오늘) · 월간이면 고른 날(그 달이 아니면 그 달 1일, 이번 달이면 오늘)
function bxCalBase(){
  const today = M.today;
  if (S.view === 'day' && isDate(S.selDate)) return S.selDate;
  if (S.view === 'week') {
    if (!S.weekOff) return isDate(S.selDate) && ymd(startOfWeek(parseYmd(S.selDate))) === ymd(startOfWeek(parseYmd(today))) ? S.selDate : today;
    return ymd(addDays(startOfWeek(parseYmd(today)), S.weekOff * 7));
  }
  const y = S.monthY, m = S.monthM, t = parseYmd(today);
  if (isDate(S.selDate)) { const d = parseYmd(S.selDate); if (d.getFullYear() === y && d.getMonth() === m) return S.selDate; }
  return t.getFullYear() === y && t.getMonth() === m ? today : ymd(new Date(y, m, 1));
}
function bxCalView(to){
  if (!M) return;
  const base = bxCalBase();
  if (to === S.view && to !== 'day') return;
  if (to === 'day') { S.selDate = base; go('day'); }
  else if (to === 'week') {
    const off = Math.round((startOfWeek(parseYmd(base)) - startOfWeek(parseYmd(M.today))) / (7 * 864e5));
    S.selDate = base; go('week', {weekOff: off});
  } else go('month', {date: base});
  window.scrollTo(0, 0);
}

/* 하루 보기 */
function bxDayViewHtml(){
  const ds = isDate(S.selDate) ? S.selDate : M.today, d = parseYmd(ds);
  if (!isDate(S.selDate)) S.selDate = ds;
  const its = bxCalFilter(dayItems(ds)), hol = HOLIDAYS[ds], doneN = its.filter(i => i.done).length, rel = relDay(ds, M.today);
  const head = '<div class="page-head bx-ch bx-dayv-h"><div class="bx-ch-mid">' +
      '<button type="button" class="nav-btn" data-act="bx-dayv-nav" data-d="-1" aria-label="전날">' + ICON.chevL + '</button>' +
      '<h1>' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일 (' + WD[d.getDay()] + ')</h1>' +
      '<button type="button" class="nav-btn" data-act="bx-dayv-nav" data-d="1" aria-label="다음 날">' + ICON.chevR + '</button>' +
      (ds !== M.today ? '<button type="button" class="bx-ch-today" data-act="bx-dayv-today">오늘</button>' : '') + '</div>' +
    '<p>' + (rel !== fmtMD(ds) ? esc(rel) + ' · ' : '') + '일정 <b>' + its.length + '</b>개 · 완료 <b>' + doneN + '</b>개</p>' +
    (typeof bxCalChipsHtml === 'function' ? bxCalChipsHtml() : '') + '</div>';
  const list = (typeof bxCalFilterNote === 'function' ? bxCalFilterNote() : '') + (hol ? '<p class="day-hol">' + esc(hol) + '</p>' : '') +
    (its.length ? '<div class="list">' + its.map(i => rowHtml(i, {day: ds})).join('') + '</div>' : '<p class="empty bx-dayv-none">일정 없음 · 오른쪽 아래 +로 넣어요</p>');
  return head + '<section class="tcard bx-dayv" aria-label="' + esc(fmtMD(ds)) + ' 일정"><div class="tc-body">' + list + (typeof bxMemoOn === 'function' && bxMemoOn() ? bxMemoSecHtml(ds) : '') + '</div></section>';
}
if (typeof BX_HELP === 'object') {
  BX_HELP.month = ['날짜를 누르면 그날 일정이 열리고, 거기서 바로 추가할 수 있어요. 일정을 길게 누르면 수정 · 삭제가 바로 나와요.', '옆으로 밀면 이전·다음 달로 넘어가요.', '위의 캘린더 칩을 누르면 그 캘린더만 보여요. 길게 누르면 색 바꾸기 · 이 캘린더 빼기.', '왼쪽 아래 일 · 주 · 월로 보기를 바꿔요.', '오른쪽 아래 +는 고른 날짜에 일정을 추가해요.'];
  BX_HELP.week = ['옆으로 밀면 이전·다음 주로 넘어가요.', '요일 옆 ‘+ 추가’로 그날 일정을 추가해요.', '왼쪽 아래 일 · 주 · 월로 보기를 바꿔요.'];
  BX_HELP.day = ['‹ ›를 누르거나 옆으로 밀면 하루씩 넘어가요.', '일정을 누르면 고치고, 길게 누르면 수정 · 완료 · 내일로 · 삭제가 바로 나와요.', '아래 메모 칸에 그날 메모를 적어요.', '왼쪽 아래 일 · 주 · 월로 보기를 바꿔요. 오른쪽 아래 +는 이날 일정을 추가해요.'];
}

/* 월간 칸 높이: 화면 아래(아래 메뉴 위)까지 채우고, 칸이 크면 줄 수를 늘린다. 줄 수가 바뀌면 한 번 더 그린다 */
function bxCalFit(){
  const cal = document.querySelector('.screen.month .cal'); if (!cal || !window.BX_APP) return false;
  const cells = cal.querySelectorAll('.cell').length; if (!cells) return false;
  const rows = Math.ceil(cells / 7), top = cal.getBoundingClientRect().top + window.scrollY;
  const dock = (document.querySelector('.dock') || {}).offsetHeight || 66;
  const h = Math.max(86, Math.floor((window.innerHeight - top - dock - 8) / rows));
  document.documentElement.style.setProperty('--bx-cell-h', h + 'px');
  // 날짜 줄 27 + 일정 줄마다 18 + '+N' 16 + 아래 여백 6(실측). 86px이면 2줄, 103px부터 3줄, 121px부터 4줄
  const lanes = Math.max(2, Math.min(4, Math.floor((h - 47) / 18)));
  if (lanes !== bxCalLanes) { bxCalLanes = lanes; return true; }
  return false;
}
const bxRender43 = render;
render = function(){
  const r = bxRender43.apply(this, arguments);
  if (window.BX_APP) {
    bxVswSync();
    if (S.view === 'month' && bxCalFit()) bxRender43.apply(this, arguments);
  }
  return r;
};
let bxCalFitT = 0;
window.addEventListener('resize', () => { clearTimeout(bxCalFitT); bxCalFitT = setTimeout(() => { if (window.BX_APP && S.view === 'month' && !SH && bxCalFit()) render(); }, 150); });

document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const v = ev.target.closest('[data-bxvsw]');
  if (v) { ev.preventDefault(); ev.stopPropagation(); bxCalView(v.dataset.bxvsw); return; }
  const n = ev.target.closest('[data-act="bx-dayv-nav"],[data-act="bx-dayv-today"]');
  if (n && S.view === 'day') {
    ev.preventDefault(); ev.stopPropagation();
    S.selDate = n.dataset.act === 'bx-dayv-today' ? M.today : ymd(addDays(parseYmd(isDate(S.selDate) ? S.selDate : M.today), +n.dataset.d || 0));
    render();
  }
}, true);
// 휴대폰 뒤로: 하루 보기 → 월간(주간 → 월간과 같게). BX_back은 이 파일 다음에 만들어진다
setTimeout(() => {
  const back = window.BX_back; if (typeof back !== 'function' || back.bx43) return;
  window.BX_back = function(){
    if (!SH && !document.getElementById('bx-att-view') && !document.getElementById('bx-start') && S.view === 'day') { bxCalView('month'); return true; }
    return back.apply(this, arguments);
  };
  window.BX_back.bx43 = true;
}, 0);

// 모양 규칙은 web-src/app.css로 옮김(시험판 54 덧칠 정리)
