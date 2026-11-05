/* ---------- 시험판 59 ----------
   1) 말로 넣기: 지금부터 'N분 뒤 · N시간 후 · 한 시간 반 뒤 · 10분 있다가 · 30분 안에'를 시각으로(지금 + 그만큼, 자정을 넘으면 다음 날).
      대표 11/5 19:57 "30분 뒤에 마트 갈거야 이런 입력도 처리가 어렵네." 말로 넣기 규칙(build-web.mjs bxQuickPre)이 부른다
   2) 제목 끝 말끝 정리: '갈거야 · 갈 거야 · 갈게 · 가려고' 같은 가다 · 오다 · 들르다는 앞의 장소만 남기고,
      '먹어야 해 · 할 거야 · 사려고' 같은 다른 말은 '먹기 · 하기 · 사기'로. 말로 넣기 규칙(bxQuickFix)이 부른다
   3) 길게 누르기(대표 11/5 20:35 "길게누르기는 상세 옵션으로 들어가는 동작으로 인식하지 다른 페이지로 넘어간다는 인식은 덜하다"):
      일정 · 루틴 · 수업 · 메모 줄, 날짜 칸 같은 '것'을 길게 누르면 다른 페이지로 넘어가지 않는다.
      옵션이 있는 것은 옵션 창, 아직 옵션이 없는 것은 손을 떼도 아무 일 없음(옵션은 선택실 5에서 정함).
      단추(빠른 추가 · 보기 설정 같은)는 휴대폰 기본처럼 오래 눌러도 누르기로 친다 */

// ── 1. 지금부터 N분 뒤 ──
const BX_KH = {한: 1, 두: 2, 세: 3, 네: 4, 다섯: 5, 여섯: 6, 일곱: 7, 여덟: 8, 아홉: 9, 열: 10, 열한: 11, 열두: 12};
const BX_SD = {일: 1, 이: 2, 삼: 3, 사: 4, 오: 5, 육: 6, 칠: 7, 팔: 8, 구: 9};
function bxKNum(s){
  if (s == null || s === '') return null;
  if (/^\d+$/.test(s)) return +s;
  if (BX_KH[s] != null) return BX_KH[s];
  // 이십 · 삼십오 · 십 · 오(분)
  const m = /^([이삼사오육칠팔구])?십([일이삼사오육칠팔구])?$/.exec(s);
  if (m) return (m[1] ? BX_SD[m[1]] : 1) * 10 + (m[2] ? BX_SD[m[2]] : 0);
  return BX_SD[s] != null ? BX_SD[s] : null;
}
const BX_RH = '\\d{1,2}|열한|열두|한|두|세|네|다섯|여섯|일곱|여덟|아홉|열';
const BX_RM = '\\d{1,3}|[이삼사오]?십[일이삼사오육칠팔구]?|오';
// 'N시 30분 뒤'의 30분은 시각의 일부라 건너뛴다(앞에 '시'가 붙은 분)
const BX_REL = new RegExp('(^|\\s)(?:지금\\s*(?:부터|으로부터|에서)?\\s*)?(?:(' + BX_RH + ')\\s*시간(?:\\s*(반))?(?:\\s*(' + BX_RM + ')\\s*분)?|(?<!시\\s*)(' + BX_RM + ')\\s*분|(반)\\s*시간)' +
  '\\s*(?:쯤|정도|가량)?\\s*(?:뒤|후|있다가|이따가|이따|지나서|지나면|있으면|안에|안으로|내로|이내)(?:에|에는|엔)?(?=\\s|$|[,.!?])');
function bxRelTime(s, now){
  const m = BX_REL.exec(s); if (!m) return s;
  const h = m[2] ? bxKNum(m[2]) : 0, half = m[3] || m[6] ? 30 : 0, mi = m[4] ? bxKNum(m[4]) : m[5] ? bxKNum(m[5]) : 0;
  const add = (h || 0) * 60 + half + (mi || 0);
  if (!(add > 0) || add > 24 * 60) return s;
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + add);
  const when = ' ' + ymd(t) + ' ' + pad(t.getHours()) + ':' + pad(t.getMinutes()) + ' ';
  let out = s.slice(0, m.index) + m[1] + when + s.slice(m.index + m[0].length);
  // 같이 말한 '오늘'은 지운다(날짜는 위에서 정함)
  out = out.replace(/(^|\s)(?:오늘|금일)(?=\s|$)/g, ' ');
  return out;
}
window.BX_relTime = (s, now) => bxRelTime(String(s || ''), now || new Date());

// ── 2. 제목 끝 말끝 ──
// 가다 · 오다 · 들르다: 앞에 장소가 있으면 말끝을 통째로 뺀다('마트 갈거야' → '마트')
const BX_TAIL_FUT = '\\s?(?:거야|거예요|거에요|거임|꺼야|게|께|게요|께요|래|래요|예정(?:이야|이에요|임)?)';
const BX_TAIL_GO = new RegExp('(\\S)\\s+(?:갈|올|들를|가볼|다녀올|갔다\\s?올)' + BX_TAIL_FUT + '(?=\\s)' +
  '|(\\S)\\s+(?:가|오|들르|가보|다녀오)(?:려고|려구|기로)(?:\\s?(?:해|해요|함|했어|했어요|했음))?(?=\\s)' +
  '|(\\S)\\s+(?:가야|와야|들러야|가봐야)겠(?:다|어|네|음)(?=\\s)', 'g');
// 다른 말: [기 꼴, 할 꼴(ㄹ · 을), 해야 꼴(아 · 어 · 여야), 하려고 꼴]
const BX_VERBS = [
  ['먹기', '먹을', '먹어야', '먹으려고'], ['마시기', '마실', '마셔야', '마시려고'], ['사기', '살', '사야', '사려고'], ['보기', '볼', '봐야', '보려고'],
  ['만나기', '만날', '만나야', '만나려고'], ['챙기기', '챙길', '챙겨야', '챙기려고'], ['보내기', '보낼', '보내야', '보내려고'], ['씻기', '씻을', '씻어야', '씻으려고'],
  ['받기', '받을', '받아야', '받으려고'], ['내기', '낼', '내야', '내려고'], ['주기', '줄', '줘야', '주려고'], ['바꾸기', '바꿀', '바꿔야', '바꾸려고'],
  ['찾기', '찾을', '찾아야', '찾으려고'], ['넣기', '넣을', '넣어야', '넣으려고'], ['읽기', '읽을', '읽어야', '읽으려고'], ['쓰기', '쓸', '써야', '쓰려고'],
  ['끝내기', '끝낼', '끝내야', '끝내려고'], ['치우기', '치울', '치워야', '치우려고'], ['타기', '탈', '타야', '타려고'], ['자기', '잘', '자야', '자려고'],
  ['일어나기', '일어날', '일어나야', '일어나려고'], ['나가기', '나갈', '나가야', '나가려고'], ['돌리기', '돌릴', '돌려야', '돌리려고'], ['널기', '널', '널어야', '널려고'],
  ['만들기', '만들', '만들어야', '만들려고'], ['걸기', '걸', '걸어야', '걸려고'], ['맡기기', '맡길', '맡겨야', '맡기려고'], ['가져가기', '가져갈', '가져가야', '가져가려고'],
  ['가져오기', '가져올', '가져와야', '가져오려고']
];
const BX_TAIL_MUST = '\\s?(?:돼|되|해|함|됨|된다|한다|지|겠다|겠어|겠네|겠음|해요|돼요)';
const BX_TAIL_INT = '(?:\\s?(?:해|해요|함|했어|했어요|했음))?';
const BX_VERB_RX = BX_VERBS.map(([to, fut, must, int]) => [new RegExp('(^|\\s)(?:' + fut + BX_TAIL_FUT + '|' + must + BX_TAIL_MUST + '|' + int + BX_TAIL_INT + '|' + to + '로\\s?(?:했어|했어요|함|해|했음))(?=\\s)', 'g'), to]);
// '공부할 거야 · 청소해야 해 · 운동하려고' 같은 '하다' 말: 붙은 이름 + 하기
const BX_HADA = new RegExp('(^|\\s)([가-힣]{1,8}?)(?:할' + BX_TAIL_FUT + '|해야' + BX_TAIL_MUST + '|하려고' + BX_TAIL_INT + '|하기로\\s?(?:했어|했어요|함|해|했음))(?=\\s)', 'g');
function bxTitleTail(t){
  let s = ' ' + String(t || '').trim() + ' ';
  s = s.replace(BX_TAIL_GO, (m, a, b, c) => (a || b || c) + ' ');
  for (const [rx, to] of BX_VERB_RX) s = s.replace(rx, (m, pre) => pre + to);
  s = s.replace(BX_HADA, (m, pre, noun) => pre + noun + '하기');
  return s.replace(/\s+/g, ' ').trim();
}
window.BX_titleTail = bxTitleTail;

// ── 3. 길게 누르기: '것'은 다른 페이지로 넘어가지 않게 ──
// 옵션 창을 여는 길게 누르기(flow.js 일정 · v32.js 루틴 탭 · v39.js 캘린더 칩)와 시간표 블록 들어 옮기기(timetable.js)는 그대로.
// 그 밖의 '것'은 0.48초 넘게 누르고 그 자리에서 떼면, 뒤따르는 누르기를 flow.js가 삼킨다(bxIlpAt)
const BX_LP_ITEM = '.row-main, .row .chk, .row[data-rid], .bx-mm-row, .cal .cell, .c-chip, .bx-cchip[data-bxcsel], .rt-open, .rt-item, .tt-b, .bx-tt-row';
let bxLpAny = null;
document.addEventListener('pointerdown', ev => {
  if (!window.BX_APP || (ev.button != null && ev.button > 0) || !ev.target.closest) { bxLpAny = null; return; }
  const el = ev.target.closest(BX_LP_ITEM);
  bxLpAny = el && !el.closest('#sheet-root') ? {x: ev.clientX, y: ev.clientY, t: Date.now()} : null;
}, true);
document.addEventListener('pointermove', ev => { if (bxLpAny && (Math.abs(ev.clientX - bxLpAny.x) > 10 || Math.abs(ev.clientY - bxLpAny.y) > 10)) bxLpAny = null; }, true);
document.addEventListener('pointercancel', () => { bxLpAny = null; }, true);
document.addEventListener('pointerup', () => { if (bxLpAny && Date.now() - bxLpAny.t >= 480) bxIlpAt = Date.now(); bxLpAny = null; }, true);
