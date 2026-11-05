#!/usr/bin/env node
// 와이어프레임(실제 화면) — 대표 11/5 22:31 "선택실에서 선택이 진행되고 개발이 완료되면 와이어프레임에 변경된것으로 교체 … 몇 버전에서 업데이트됨 이런식으로만 표기"
//   1) 정렬 점검 장면을 폭 384 · 라이트 · 오전 · 오후로 찍는다(움직임 멈춤): node tests/layout/run.cjs --widths 384 --themes light --clocks 12 --snap DIR
//   2) node tests/layout/wire.cjs --snap DIR --out PAGE [--trial 60]
//      화면마다 사진 지문(눈에 보이는 그대로: 흑백 · 1/4로 줄여 · 32단계)을 지난 시험판과 비교해 바뀐 화면만 '시험판 N에서 바뀜'.
//      (모양 지문(run.cjs digest)은 창 뒤에 가려진 화면까지 세어, 보이지 않는 곳만 바뀐 화면도 '바뀜'이 되어 쓰지 않음)
//      지문 · 바뀐 시험판은 tests/layout/wire/manifest.json(저장소)에 남긴다. 사진은 PAGE/img/<화면>@<시험판>.jpg — 바뀐 화면 것만 새로 올리고,
//      바뀌지 않은 화면은 전에 올린 사진(같은 주소에 남아 있음)을 그대로 쓴다. 바뀐 화면은 바로 전 사진도 남겨 전후로 보인다.
//   3) 통합관리실이 PAGE/index.html을 와이어프레임 페이지로 올린다(files = PAGE/upload.json). 사진은 사람이 하나하나 보지 않는다
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const SNAP = arg('snap', ''), OUT = arg('out', ''), SUB = '384-light';
if (!SNAP || !OUT) { console.log('쓰는 법: node tests/layout/wire.cjs --snap DIR --out PAGE [--trial N] [--seed]'); process.exit(1); }
const TRIAL = +(arg('trial', '') || (fs.readFileSync(path.join(ROOT, 'web-src', 'tidy.js'), 'utf8').match(/const BX_TRIAL = (\d+)/) || [])[1]);
const SEED = process.argv.includes('--seed');   // 처음 한 번: 이 시험판 화면을 '이전부터'로 남김(바뀜 표시 없음)
const MAN = path.join(__dirname, 'wire', 'manifest.json');
const man = fs.existsSync(MAN) ? JSON.parse(fs.readFileSync(MAN, 'utf8')) : { trial: 0, screens: {} };
const PREV = man.trial || null;
const res = JSON.parse(fs.readFileSync(path.join(SNAP, SUB, 'result.json'), 'utf8'));
// 사진 지문: 같은 환경에서 찍으면 같은 사진이라 같은 지문. 줄여서 재므로 글자 가장자리의 아주 작은 차이는 묻힌다
const sigOut = execFileSync('python3', ['-I', '-c', 'import json,sys,os,hashlib\nfrom PIL import Image\nd=sys.argv[1]; out={}\nfor n in sorted(os.listdir(d)):\n  if not n.endswith(".png"): continue\n  im=Image.open(os.path.join(d,n)).convert("L"); im=im.resize((max(1,im.width//4),max(1,im.height//4)), Image.BOX)\n  out[n]=hashlib.sha1(bytes(v//8 for v in im.tobytes())).hexdigest()[:16]\nprint(json.dumps(out))', path.join(SNAP, SUB)], { maxBuffer: 1 << 24 }).toString();
const SIG = JSON.parse(sigOut);
const hash = t => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
// 화면 이름: 장면 번호를 뗀 이름(장면이 늘어 번호가 밀려도 같은 화면)
const labelOf = nm => nm.replace(/^\d+_/, '').replace(/_+/g, ' ').trim();
const fileKey = label => 's' + hash(label);
fs.mkdirSync(path.join(OUT, 'img'), { recursive: true });
const conv = [], upload = {}, seen = new Set();
let changed = 0, added = 0;
for (const [nm, rec] of Object.entries(res.states)) {
  if (!rec.top) continue;
  const label = labelOf(nm); if (seen.has(label)) continue; seen.add(label);
  const st = SIG[nm + '.png'], sb = SIG[nm + '__bottom.png'];
  if (!st) continue;
  const scrolls = !!sb && sb !== st;
  const h = st + (scrolls ? '|' + sb : '');
  const key = fileKey(label), cur = man.screens[label];
  if (cur && cur.h === h) { cur.order = Object.keys(res.states).indexOf(nm); continue; }
  const s = { h, ht: st, hb: scrolls ? sb : null, key, since: TRIAL, img: TRIAL, scrolls: !!scrolls, order: Object.keys(res.states).indexOf(nm) };
  if (SEED) s.seed = true;
  // 전후 그림은 바뀐 쪽(위 · 아래까지 내림)을 보여 준다
  else if (cur) { s.prev = cur.img; s.prevBottom = cur.ht === st && !!cur.hb && scrolls; changed++; } else { s.isNew = !!PREV; added++; }
  man.screens[label] = s;
  for (const [src, dst] of [[nm + '.png', key + '@' + TRIAL + '.jpg']].concat(scrolls ? [[nm + '__bottom.png', key + '@' + TRIAL + '_b.jpg']] : [])) {
    conv.push([path.join(SNAP, SUB, src), path.join(OUT, 'img', dst)]);
    upload['img/' + dst] = path.join(OUT, 'img', dst);
  }
}
// 이번 장면에 없는 화면은 목록에서 뺀다(사진은 페이지에 남아도 쓰지 않음)
for (const label of Object.keys(man.screens)) if (!seen.has(label)) delete man.screens[label];
// PNG → JPEG(폭 384 그대로, 품질 80) 한 번에
if (conv.length) {
  const list = path.join(OUT, 'conv.json'); fs.writeFileSync(list, JSON.stringify(conv));
  execFileSync('python3', ['-I', '-c', 'import json,sys\nfrom PIL import Image\nfor a,b in json.load(open(sys.argv[1])):\n  Image.open(a).convert("RGB").save(b, quality=80, optimize=True)', list]);
  fs.rmSync(list);
}
man.trialPrev = SEED ? null : PREV; man.trial = TRIAL; man.at = new Date().toISOString();
fs.mkdirSync(path.dirname(MAN), { recursive: true });
fs.writeFileSync(MAN, JSON.stringify(man, null, 1));

// ── 페이지 ──
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const AREAS = [['홈', /^홈|^오늘|^지난|^다음 날|^알림 카드|^앱 안/], ['캘린더', /^캘린더|^날짜|^주간|^일 보기|^월간|^짧은 캘린더/], ['루틴', /^루틴|^출근|^새 루틴/], ['시간표', /^시간표|^수업/], ['메모', /^메모/],
  ['일정 넣기 · 고치기', /^새 일정|^일정|^종일|^시간 미지정|^알림 페이지|^출발|^장소|^사진/], ['설정 · 더보기', /^설정|^더보기|^기능|^위젯|^도움말|^찾기|^명상/], ['처음 실행 · 도우미', /^처음|도우미|^알람 허락/]];
const areaOf = label => (AREAS.find(([, re]) => re.test(label)) || ['그 밖의 창 · 페이지'])[0];
const all = Object.entries(man.screens).sort((a, b) => a[1].order - b[1].order);
const img = (s, b) => 'img/' + s.key + '@' + s.img + (b ? '_b' : '') + '.jpg';
const pimg = (s, b) => 'img/' + s.key + '@' + s.prev + (b ? '_b' : '') + '.jpg';
const fresh = s => s.since === TRIAL && !s.seed;
const tag = s => '<span class="tg' + (fresh(s) ? ' now' : '') + '">시험판 ' + s.since + (s.seed ? ' 이전부터' : s.isNew ? '에서 새로 생김' : '에서 바뀜') + '</span>';
const card = ([label, s]) => '<li class="sc' + (fresh(s) ? ' new' : '') + '" data-area="' + esc(areaOf(label)) + '"><div class="sc-h"><b>' + esc(label) + '</b>' + tag(s) + '</div>' +
  '<div class="sc-p"><figure><img src="' + img(s) + '" alt="' + esc(label) + '" loading="lazy" width="384" height="832"><figcaption>위</figcaption></figure>' +
  (s.scrolls ? '<figure><img src="' + img(s, 1) + '" alt="' + esc(label) + ' 아래까지" loading="lazy" width="384" height="832"><figcaption>아래까지 내림</figcaption></figure>' : '') + '</div></li>';
const changedNow = all.filter(([, s]) => fresh(s) && s.prev != null), addedNow = all.filter(([, s]) => fresh(s) && s.isNew).length;
const pair = ([label, s]) => { const b = s.prevBottom ? 1 : 0, w = b ? ' · 아래까지 내림' : ''; return '<li class="pr"><div class="sc-h"><b>' + esc(label) + '</b><span class="tg now">시험판 ' + s.prev + ' → ' + TRIAL + '</span></div><div class="sc-p">' +
  '<figure><img src="' + pimg(s, b) + '" alt="' + esc(label) + ' 전" loading="lazy" width="384" height="832"><figcaption>전(시험판 ' + s.prev + w + ')</figcaption></figure>' +
  '<figure><img src="' + img(s, b) + '" alt="' + esc(label) + ' 후" loading="lazy" width="384" height="832"><figcaption>후(시험판 ' + TRIAL + w + ')</figcaption></figure></div></li>'; };
const areas = Array.from(new Set(all.map(([l]) => areaOf(l))));
const page = `<title>박스웍스 와이어프레임 (실제 화면)</title>
<style>
@font-face { font-family: "BX Pretendard"; src: url("fonts/BXPretendard.woff2") format("woff2"); font-weight: 400 800; font-style: normal; font-display: swap; }
:root { --bg: #e9ebef; --panel: #f7f8fa; --line: #d5d9e0; --fg: #14171c; --muted: #5a6270; --pick: #7c3aed; --pick-soft: #efe8fd;
  --f: "BX Pretendard", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", system-ui, sans-serif; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #07080a; --panel: #14161a; --line: #272b32; --fg: #e8eaed; --muted: #9aa1ab; --pick: #a98bfa; --pick-soft: #241a3d; color-scheme: dark; } }
:root[data-theme="dark"] { --bg: #07080a; --panel: #14161a; --line: #272b32; --fg: #e8eaed; --muted: #9aa1ab; --pick: #a98bfa; --pick-soft: #241a3d; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font-family: var(--f); font-size: 15px; line-height: 1.6; -webkit-font-smoothing: antialiased; word-break: keep-all; overflow-wrap: break-word;
  padding: 0 max(16px, env(safe-area-inset-right, 0px)) 56px max(16px, env(safe-area-inset-left, 0px)); }
.wrap { max-width: 1180px; margin: 0 auto; }
header { padding: 32px 0 8px; display: grid; gap: 8px; }
h1 { margin: 0; font-size: clamp(24px, 5.6vw, 32px); line-height: 1.2; font-weight: 800; letter-spacing: -0.02em; }
.lead { margin: 0; color: var(--muted); max-width: 760px; }
h2 { margin: 30px 0 12px; font-size: 18px; font-weight: 800; }
h2 small { margin-left: 8px; font-size: 13px; font-weight: 700; color: var(--muted); }
.bar { position: sticky; top: 0; z-index: 5; margin: 12px -16px 0; padding: 10px 16px; background: color-mix(in srgb, var(--bg) 92%, transparent); backdrop-filter: blur(8px); display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; }
.bar::-webkit-scrollbar { display: none; }
.bar button { flex: none; height: 36px; padding: 0 14px; border-radius: 10px; border: 1px solid var(--line); background: var(--panel); color: var(--fg); font: 600 14px/1 var(--f); cursor: pointer; }
.bar button[aria-pressed="true"] { background: var(--pick-soft); border-color: var(--pick); color: var(--pick); }
.grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); gap: 14px; }
.pairs { grid-template-columns: repeat(auto-fill, minmax(min(100%, 380px), 1fr)); }
.sc, .pr { background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: 12px; display: grid; gap: 10px; align-content: start; }
.sc.new { border-color: var(--pick); }
.sc-h { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 8px; }
.sc-h b { font-size: 15px; }
.tg { font-size: 12px; font-weight: 700; color: var(--muted); white-space: nowrap; }
.tg.now { color: var(--pick); }
.sc-p { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 8px; }
figure { margin: 0; display: grid; gap: 4px; }
figure img { width: 100%; height: auto; border-radius: 10px; border: 1px solid var(--line); display: block; background: #fff; }
figcaption { font-size: 12px; color: var(--muted); text-align: center; }
.empty { color: var(--muted); }
.note { margin: 28px 0 0; font-size: 12.5px; color: var(--muted); }
[hidden] { display: none !important; }
</style>
<div class="wrap">
  <header>
    <h1>박스웍스 와이어프레임 (실제 화면)</h1>
    <p class="lead">시험판마다 정렬 점검이 여는 화면 ${all.length}곳을 폭 384 · 라이트로 찍어 자동으로 바꿔 넣어요. 지난 시험판과 보이는 화면이 달라진 곳에만 '시험판 N에서 바뀜'이 붙어요(같은 일정 · 루틴 · 수업 · 메모로 찍어 서로 비교돼요). 지금: 시험판 ${TRIAL}.</p>
  </header>
  <nav class="bar" aria-label="구역">
    <button type="button" data-f="" aria-pressed="true">전체</button>
    ${changedNow.length || addedNow ? '<button type="button" data-f="now" aria-pressed="false">이번에 바뀐 것</button>' : ''}
    ${areas.map(a => '<button type="button" data-f="' + esc(a) + '" aria-pressed="false">' + esc(a) + '</button>').join('')}
  </nav>
  <section id="now">
    <h2>이번에 바뀐 화면<small>시험판 ${man.trialPrev ? man.trialPrev + ' → ' : ''}${TRIAL} · ${changedNow.length}곳${addedNow ? ' · 새 화면 ' + addedNow + '곳' : ''}</small></h2>
    ${changedNow.length ? '<ul class="grid pairs">' + changedNow.map(pair).join('') + '</ul>' : '<p class="empty">이번 시험판에서 모양이 바뀐 화면은 없어요.</p>'}
  </section>
  ${areas.map(a => '<section class="area" data-area="' + esc(a) + '"><h2>' + esc(a) + '<small>' + all.filter(([l]) => areaOf(l) === a).length + '곳</small></h2><ul class="grid">' + all.filter(([l]) => areaOf(l) === a).map(card).join('') + '</ul></section>').join('\n  ')}
  <p class="note">만드는 곳: 저장소 tests/layout/wire.cjs(화면 지문 · 바뀐 시험판은 tests/layout/wire/manifest.json). 같은 일정 · 루틴 · 수업 · 메모(정렬 점검 자료)로 찍어 화면끼리 비교할 수 있어요. 손으로 그린 와이어프레임(11/3까지)은 「박스웍스 현재 화면 와이어프레임」에 기록으로 남아 있어요.</p>
</div>
<script>
(function () {
  var bs = document.querySelectorAll('.bar button');
  bs.forEach(function (b) { b.addEventListener('click', function () {
    var f = b.getAttribute('data-f');
    bs.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    document.getElementById('now').hidden = !(f === '' || f === 'now');
    document.querySelectorAll('.area').forEach(function (s) {
      if (f === 'now') { var any = false; s.querySelectorAll('.sc').forEach(function (c) { var on = c.classList.contains('new'); c.hidden = !on; any = any || on; }); s.hidden = !any; }
      else { s.querySelectorAll('.sc').forEach(function (c) { c.hidden = false; }); s.hidden = !(f === '' || s.getAttribute('data-area') === f); }
    });
  }); });
})();
</script>
`;
fs.writeFileSync(path.join(OUT, 'index.html'), page);
fs.writeFileSync(path.join(OUT, 'upload.json'), JSON.stringify(upload, null, 1));
console.log('시험판 ' + TRIAL + ': 화면 ' + all.length + '곳 · 바뀜 ' + changed + ' · 새 화면 ' + added + ' · 올릴 사진 ' + Object.keys(upload).length + '장 → ' + OUT);
