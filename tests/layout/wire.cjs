#!/usr/bin/env node
// 와이어프레임(실제 화면) — 대표 11/5 22:31 "선택실에서 선택이 진행되고 개발이 완료되면 와이어프레임에 변경된것으로 교체 … 몇 버전에서 업데이트됨 이런식으로만 표기"
//   1) 정렬 점검 장면을 폭 384 · 라이트 · 오전 · 오후로 찍는다(움직임 멈춤): node tests/layout/run.cjs --widths 384 --themes light --clocks 12 --snap DIR
//   2) node tests/layout/wire.cjs --snap DIR --out PAGE [--trial 60]
//      화면마다 사진 지문(눈에 보이는 그대로: 흑백 · 1/4로 줄여 · 32단계)을 지난 시험판과 비교해 바뀐 화면만 '시험판 N에서 바뀜'.
//      (모양 지문(run.cjs digest)은 창 뒤에 가려진 화면까지 세어, 보이지 않는 곳만 바뀐 화면도 '바뀜'이 되어 쓰지 않음)
//      지문 · 바뀐 시험판은 tests/layout/wire/manifest.json(저장소)에 남긴다. 사진은 PAGE/img/<화면>@<시험판>.jpg — 바뀐 화면 것만 새로 올리고,
//      바뀌지 않은 화면은 전에 올린 사진(같은 주소에 남아 있음)을 그대로 쓴다. 바뀐 화면은 바로 전 사진도 남겨 전후로 보인다.
//   3) 통합관리실이 PAGE/index.html을 와이어프레임 페이지로 올린다(files = PAGE/upload.json). 사진은 사람이 하나하나 보지 않는다
//   4) 수정 지시(대표 11/6 14:44): 페이지에서 사진을 눌러 고칠 곳에 번호 핀 + 메모 → 그 페이지 db 'notes'(주인만).
//      {n, label, key, img, trial, part, x, y, memo, status open|done|drop, at, updatedAt, doneIn, doneNote, doneAt, reopenedAt}
//      통합관리실이 시험판마다 읽어 고치고 status 'done' · doneIn · doneNote로 바꾼다(README '와이어프레임 수정 지시')
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
  else if (cur && cur.img === TRIAL) { if (cur.prev != null) { s.prev = cur.prev; s.prevBottom = cur.prevBottom; changed++; } else if (cur.isNew) { s.isNew = true; added++; } if (cur.seed) s.seed = true; }
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
// 같은 시험판을 다시 만들면(수정 지시 화면만 고칠 때 등) 전 시험판 번호를 그대로 둔다
if (man.trial !== TRIAL) man.trialPrev = SEED ? null : PREV;
man.trial = TRIAL; man.at = new Date().toISOString();
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
// 시험판 70(대표 11/6 14:44 '와이어프레임은 제작된 화면을 보고 수정을 지시하는 곳'): 지금 사진을 누르면 크게 열리고, 고칠 곳을 누르면 번호 핀 + 메모
const pw = (label, s, b, part) => '<span class="pw" data-img="' + img(s, b) + '" data-label="' + esc(label) + '" data-key="' + s.key + '" data-trial="' + s.img + '" data-part="' + part + '" role="button" tabindex="0" aria-label="' + esc(label) + ' ' + part + ' 사진 크게 보기 · 수정 지시">' +
  '<img src="' + img(s, b) + '" alt="' + esc(label) + (b ? ' 아래까지' : '') + '" loading="lazy" width="384" height="832"></span>';
const card = ([label, s]) => '<li class="sc' + (fresh(s) ? ' new' : '') + '" data-area="' + esc(areaOf(label)) + '" data-key="' + s.key + '"><div class="sc-h"><b>' + esc(label) + '</b>' + tag(s) + '</div>' +
  '<div class="sc-p"><figure>' + pw(label, s, 0, '위') + '<figcaption>위</figcaption></figure>' +
  (s.scrolls ? '<figure>' + pw(label, s, 1, '아래까지') + '<figcaption>아래까지 내림</figcaption></figure>' : '') + '</div><div class="sc-n" data-key="' + s.key + '"></div></li>';
const changedNow = all.filter(([, s]) => fresh(s) && s.prev != null), addedNow = all.filter(([, s]) => fresh(s) && s.isNew).length;
const pair = ([label, s]) => { const b = s.prevBottom ? 1 : 0, w = b ? ' · 아래까지 내림' : ''; return '<li class="pr"><div class="sc-h"><b>' + esc(label) + '</b><span class="tg now">시험판 ' + s.prev + ' → ' + TRIAL + '</span></div><div class="sc-p">' +
  '<figure><img src="' + pimg(s, b) + '" alt="' + esc(label) + ' 전" loading="lazy" width="384" height="832"><figcaption>전(시험판 ' + s.prev + w + ')</figcaption></figure>' +
  '<figure>' + pw(label, s, b, b ? '아래까지' : '위') + '<figcaption>후(시험판 ' + TRIAL + w + ')</figcaption></figure></div></li>'; };
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
/* 수정 지시(시험판 70): 사진 위 번호 핀 · 크게 보기 · 목록 */
.pw { position: relative; display: block; cursor: zoom-in; border-radius: 10px; -webkit-tap-highlight-color: transparent; }
.pw:focus-visible { outline: 2px solid var(--pick); outline-offset: 2px; }
.pin { position: absolute; transform: translate(-50%, -50%); min-width: 22px; height: 22px; padding: 0 5px; border-radius: 11px; background: #e5484d; color: #fff; font: 800 12px/22px var(--f); text-align: center; box-shadow: 0 0 0 2px #fff, 0 2px 6px rgba(0,0,0,.35); pointer-events: none; }
.pin.old { background: #8a8f98; }
.pin.ok { background: #1f7a4f; }
.pin.tmp { background: var(--pick); }
.pin.big { min-width: 30px; height: 30px; border-radius: 15px; font-size: 15px; line-height: 30px; pointer-events: auto; cursor: pointer; border: 0; padding: 0 7px; }
.pin.on { box-shadow: 0 0 0 3px #fff, 0 0 0 6px #7c3aed, 0 2px 6px rgba(0,0,0,.35); }
.sc-n:empty { display: none; }
.sc-n { display: grid; gap: 4px; }
.sc-n button, .fx-row { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 8px; align-items: start; text-align: left; border: 1px solid var(--line); background: var(--bg); color: var(--fg); border-radius: 10px; padding: 6px 8px; font: 500 13px/1.45 var(--f); cursor: pointer; }
.sc-n b, .fx-row b { color: #e5484d; font-weight: 800; }
.sc-n small { display: block; color: var(--muted); font-size: 12px; }
.fx { background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: 14px; display: grid; gap: 10px; }
.fx-h { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; }
.fx-h b { font-size: 16px; } .fx-h small { color: var(--muted); font-size: 13px; }
.fx-list { display: grid; gap: 6px; }
.fx-row span small { display: block; color: var(--muted); font-size: 12px; }
.fx-row.done b { color: #1f7a4f; }
.fx-row.drop b { color: var(--muted); }
.fx details summary { cursor: pointer; color: var(--muted); font-size: 13px; font-weight: 700; }
.fx .st { font-size: 12.5px; color: var(--muted); }
#ov { position: fixed; inset: 0; z-index: 60; background: #0b0c0f; display: flex; flex-direction: column; color: #fff; }
.ov-h { display: flex; align-items: center; gap: 8px; padding: max(10px, env(safe-area-inset-top, 0px)) 12px 8px; }
.ov-h b { flex: 1; min-width: 0; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ov-h button { flex: none; width: 44px; height: 44px; border: 0; border-radius: 22px; background: rgba(255,255,255,.12); color: #fff; font: 700 20px/1 var(--f); cursor: pointer; }
.ov-b { flex: 1; overflow: auto; padding: 0 12px 16px; display: grid; gap: 10px; align-content: start; justify-items: center; }
.ov-hint { margin: 0; font-size: 13px; color: #c9ccd3; text-align: center; }
.ov-img { position: relative; width: min(100%, 440px); }
.ov-img img { width: 100%; height: auto; display: block; border-radius: 12px; background: #fff; cursor: crosshair; }
.ov-list { width: min(100%, 440px); display: grid; gap: 6px; }
.ov-list button { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 8px; text-align: left; border: 1px solid rgba(255,255,255,.18); background: rgba(255,255,255,.06); color: #fff; border-radius: 10px; padding: 8px 10px; font: 500 14px/1.45 var(--f); cursor: pointer; }
.ov-list button b { color: #ff8a8d; } .ov-list button small { display: block; color: #a9adb6; font-size: 12px; }
.ov-f { padding: 10px 12px max(12px, env(safe-area-inset-bottom, 0px)); background: #14161a; border-top: 1px solid rgba(255,255,255,.12); display: grid; gap: 8px; grid-template-columns: min(100%, 440px); justify-content: center; }
.ov-f label { font-size: 13px; font-weight: 700; color: #c9ccd3; }
.ov-f .dn { margin: 0; font-size: 13px; color: #8fd9b0; }
.ov-f textarea { width: 100%; min-height: 64px; resize: vertical; border: 1px solid rgba(255,255,255,.25); border-radius: 10px; background: #0b0c0f; color: #fff; font: 16px/1.5 var(--f); padding: 8px 10px; }
.ov-f .r { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.ov-f .r button { height: 44px; padding: 0 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,.25); background: transparent; color: #fff; font: 700 15px/1 var(--f); cursor: pointer; }
.ov-f .r button.go { background: #7c3aed; border-color: #7c3aed; }
.ov-f .r button.del { color: #ff8a8d; }
.ov-f .r span { font-size: 12.5px; color: #a9adb6; }
</style>
<div class="wrap">
  <header>
    <h1>박스웍스 와이어프레임 (실제 화면)</h1>
    <p class="lead">만든 화면을 보고 <b>고칠 것을 지시하는 곳</b>이에요. 사진을 누르면 크게 열리고, 고칠 곳을 누르면 번호가 생겨 메모를 달 수 있어요. 통합관리실이 시험판을 만들 때 읽고 고치면 '시험판 N에서 고침'으로 바뀌어요. 화면 ${all.length}곳은 시험판마다 폭 384 · 라이트로 자동으로 바뀌고, 달라진 곳에 '시험판 N에서 바뀜'이 붙어요. 지금: 시험판 ${TRIAL}.</p>
  </header>
  <section class="fx" id="fx" aria-labelledby="fxH"><div class="fx-h"><b id="fxH">수정 지시</b><small id="fxN">불러오는 중</small></div><div class="fx-list" id="fxList"></div><details id="fxDone" hidden><summary id="fxDoneS"></summary><div class="fx-list" id="fxDoneList"></div></details><p class="st" id="fxSt"></p></section>
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
<div id="ov" hidden role="dialog" aria-modal="true" aria-labelledby="ovT">
  <div class="ov-h"><b id="ovT"></b><button type="button" id="ovX" aria-label="닫기">×</button></div>
  <div class="ov-b"><p class="ov-hint" id="ovHint">고칠 곳을 누르면 번호가 생겨요</p><div class="ov-img"><img id="ovI" alt=""><div id="ovPins"></div></div><div class="ov-list" id="ovList"></div></div>
  <div class="ov-f" id="ovF" hidden><p class="dn" id="ovDone" hidden></p><label for="ovTa" id="ovL"></label><textarea id="ovTa" placeholder="예: 이 글자를 한 단계 작게 · 이 단추를 아래로"></textarea><div class="r"><button type="button" class="go" id="ovSave">저장</button><button type="button" id="ovRe" hidden>안 고쳐졌어요 · 다시 열기</button><button type="button" id="ovCancel">닫기</button><button type="button" class="del" id="ovDel" hidden>지우기</button><span id="ovMsg" role="status"></span></div></div>
</div>
<script>
(function () {
  'use strict';
  // 수정 지시(대표 11/6 14:44): 사진을 크게 열어 고칠 곳에 번호 핀 + 메모 → 이 페이지 db 'notes'에 저장.
  // 통합관리실이 시험판을 만들 때 읽고 고친 뒤 status 'done' · doneIn(시험판) · doneNote(한 줄)로 바꾼다
  const $ = id => document.getElementById(id);
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const notes = new Map(); let col = null, ready = false, failed = false, busy = false;
  const md = iso => { const d = new Date(iso); return isNaN(d) ? '' : (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  const list = () => Array.from(notes.values());
  const isOpen = n => n.status !== 'done' && n.status !== 'drop';
  const open = () => list().filter(isOpen).sort((a, b) => a.n - b.n);
  const closed = () => list().filter(n => !isOpen(n)).sort((a, b) => b.n - a.n);
  const nextN = () => list().reduce((m, n) => Math.max(m, n.n || 0), 0) + 1;
  const partTxt = n => n.part === '아래까지' ? ' · 아래까지' : '';
  // 같은 화면 · 같은 부분의 남은 지시: 이 사진에 단 것은 빨강, 지난 시험판 사진에 단 것은 회색(자리만 참고)
  const pinsFor = (key, part, img) => open().filter(n => n.key === key && n.part === part).map(n => ({ n, cls: n.img === img ? '' : ' old' }));
  const curImg = (key, part) => { const w = document.querySelector('.sc .pw[data-key="' + key + '"][data-part="' + part + '"]'); return w ? w.dataset.img : ''; };
  const pinEl = (tag, n, cls) => { const p = document.createElement(tag); p.className = 'pin' + cls; p.textContent = n.n; p.style.left = (n.x * 100) + '%'; p.style.top = (n.y * 100) + '%'; return p; };
  const row = n => { const st = n.status === 'done' ? 'done' : n.status === 'drop' ? 'drop' : '';
    return '<button type="button" class="fx-row' + (st ? ' ' + st : '') + '" data-note="' + n.id + '"><b>' + (st === 'done' ? '✓ ' : '') + n.n + '</b><span>' + esc(n.label) + partTxt(n) + ' — ' + esc(n.memo || '(메모 없음)') +
      '<small>' + (st === 'done' ? '시험판 ' + esc(n.doneIn || '') + '에서 고침' + (n.doneNote ? ' · ' + esc(n.doneNote) : '') : st === 'drop' ? '하지 않기로 함' + (n.doneNote ? ' · ' + esc(n.doneNote) : '') : '시험판 ' + n.trial + ' 사진 · ' + md(n.at) + (n.reopenedAt ? ' · 다시 엶' : '')) + '</small></span></button>'; };
  function draw() {
    document.querySelectorAll('.pw').forEach(w => {
      w.querySelectorAll('.pin').forEach(x => x.remove());
      pinsFor(w.dataset.key, w.dataset.part, w.dataset.img).forEach(({ n, cls }) => w.append(pinEl('span', n, cls)));
    });
    document.querySelectorAll('.sc-n').forEach(box => {
      box.innerHTML = open().filter(n => n.key === box.dataset.key).map(n => '<button type="button" data-note="' + n.id + '"><b>' + n.n + '</b><span>' + esc(n.memo || '(메모 없음)') +
        (n.img !== curImg(n.key, n.part) ? '<small>시험판 ' + n.trial + ' 사진에 단 것</small>' : '') + '</span></button>').join('');
    });
    const o = open(), d = closed();
    $('fxN').textContent = !ready ? '불러오는 중' : failed ? '지금은 저장할 수 없어요' : '남은 ' + o.length + '개 · 고친 ' + d.filter(n => n.status === 'done').length + '개';
    $('fxList').innerHTML = o.length ? o.map(row).join('') : (ready && !failed ? '<p class="st">아직 수정 지시가 없어요. 화면 사진을 눌러 고칠 곳에 번호를 달아 보세요.</p>' : '');
    $('fxDone').hidden = !d.length; $('fxDoneS').textContent = '고친 것 ' + d.length + '개';
    $('fxDoneList').innerHTML = d.map(row).join('');
    if (ov) drawOv();
  }
  // 크게 보기
  let ov = null; // {img, label, key, trial, part, tmp: {x, y} | null, edit: id | null, from}
  const vv = window.visualViewport;
  function fit() { const o = $('ov'); if (!vv || o.hidden) return; o.style.top = vv.offsetTop + 'px'; o.style.height = vv.height + 'px'; o.style.bottom = 'auto'; }
  if (vv) { vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit); }
  function setImg() { $('ovI').src = ov.img; $('ovI').alt = ov.label + ' ' + ov.part; $('ovT').textContent = ov.label + (ov.part === '아래까지' ? ' · 아래까지 내림' : '') + ' · 시험판 ' + ov.trial + ' 사진'; }
  function openOv(d, focusId, from) {
    ov = { img: d.img, label: d.label, key: d.key, trial: Number(d.trial), part: d.part, tmp: null, edit: null, from: from || null };
    setImg(); $('ov').hidden = false; document.body.style.overflow = 'hidden'; fit();
    $('ov').querySelector('.ov-b').scrollTop = 0;
    if (focusId && notes.get(focusId)) editNote(focusId); else { hideForm(); drawOv(); }
    try { $('ovX').focus({ preventScroll: true }); } catch (e) {}
  }
  function closeOv() { const from = ov && ov.from; ov = null; $('ov').hidden = true; document.body.style.overflow = ''; if (from && from.focus) try { from.focus({ preventScroll: true }); } catch (e) {} }
  function hideForm() { $('ovF').hidden = true; $('ovMsg').textContent = ''; delArm = false; $('ovDel').textContent = '지우기'; }
  function drawOv() {
    const box = $('ovPins'); box.innerHTML = '';
    pinsFor(ov.key, ov.part, ov.img).forEach(({ n, cls }) => { const b = pinEl('button', n, ' big' + cls + (ov.edit === n.id ? ' on' : '')); b.type = 'button'; b.dataset.note = n.id; b.setAttribute('aria-label', n.n + '번 수정 지시 보기'); box.append(b); });
    const ed = ov.edit && notes.get(ov.edit);
    if (ed && !isOpen(ed) && ed.img === ov.img) box.append(pinEl('span', ed, ' big ok on'));
    if (ov.tmp) box.append(pinEl('span', { n: nextN(), x: ov.tmp.x, y: ov.tmp.y }, ' big tmp on'));
    $('ovList').innerHTML = open().filter(n => n.key === ov.key).map(n => '<button type="button" data-note="' + n.id + '"><b>' + n.n + '</b><span>' + esc(n.memo || '(메모 없음)') + '<small>' + (n.img === ov.img ? '이 사진' : '시험판 ' + n.trial + partTxt(n) + ' 사진에 단 것') + ' · ' + md(n.at) + '</small></span></button>').join('');
    $('ovHint').textContent = col ? '고칠 곳을 누르면 번호가 생겨요' : !ready ? '불러오는 중이에요' : 'claude.ai에서 이 페이지를 열어야 수정 지시를 달 수 있어요';
  }
  function editNote(id) {
    const n = notes.get(id); if (!n) return;
    if (n.img !== ov.img) { ov.img = n.img; ov.trial = n.trial; ov.part = n.part; setImg(); }
    ov.tmp = null; ov.edit = id; hideForm();
    const dn = n.status === 'done' ? '✓ 시험판 ' + (n.doneIn || '') + '에서 고쳤어요' + (n.doneNote ? ' — ' + n.doneNote : '') : n.status === 'drop' ? '하지 않기로 했어요' + (n.doneNote ? ' — ' + n.doneNote : '') : '';
    $('ovDone').hidden = !dn; $('ovDone').textContent = dn;
    $('ovL').textContent = n.n + '번 메모'; $('ovTa').value = n.memo || ''; $('ovDel').hidden = false; $('ovRe').hidden = isOpen(n); $('ovF').hidden = false; drawOv();
  }
  $('ovI').addEventListener('click', ev => {
    if (!ov) return;
    if (!col) { drawOv(); return; }
    const r = $('ovI').getBoundingClientRect(); if (!r.width || !r.height) return;
    const keep = ov.tmp && !ov.edit ? $('ovTa').value : '';
    ov.tmp = { x: Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (ev.clientY - r.top) / r.height)) };
    ov.edit = null; hideForm(); $('ovDone').hidden = true;
    $('ovL').textContent = nextN() + '번 — 무엇을 어떻게 고칠까요?'; $('ovTa').value = keep; $('ovDel').hidden = true; $('ovRe').hidden = true; $('ovF').hidden = false; drawOv();
    setTimeout(() => { try { $('ovTa').focus({ preventScroll: true }); } catch (e) {} }, 30);
  });
  async function write(fn, okMsg) {
    if (!ov || !col || busy) return; busy = true; $('ovMsg').textContent = '저장하는 중…';
    try { await fn(new Date().toISOString()); ov.tmp = null; ov.edit = null; hideForm(); draw(); if (okMsg) { $('fxSt').textContent = okMsg; } }
    catch (e) { $('ovMsg').textContent = e && e.code === 'quota_exceeded' ? '저장 공간이 가득 찼어요' : '저장하지 못했어요. 잠시 뒤 다시 눌러 주세요'; }
    busy = false;
  }
  $('ovSave').addEventListener('click', () => write(async at => {
    const memo = $('ovTa').value.trim();
    if (ov.edit) { await col.doc(ov.edit).update({ memo, updatedAt: at }); const n = notes.get(ov.edit); if (n) n.memo = memo; return; }
    if (!ov.tmp) return;
    const id = 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const doc = { n: nextN(), label: ov.label, key: ov.key, img: ov.img, trial: ov.trial, part: ov.part, x: Math.round(ov.tmp.x * 1000) / 1000, y: Math.round(ov.tmp.y * 1000) / 1000, memo, status: 'open', at, updatedAt: at };
    await col.doc(id).set(doc); notes.set(id, Object.assign({ id }, doc));
  }));
  $('ovRe').addEventListener('click', () => write(async at => {
    const id = ov.edit, memo = $('ovTa').value.trim(), n = notes.get(id);
    await col.doc(id).update({ memo, status: 'open', reopenedAt: at, updatedAt: at });
    if (n) Object.assign(n, { memo, status: 'open', reopenedAt: at });
  }, '다시 열었어요. 다음 시험판에서 다시 고쳐요'));
  let delArm = false;
  $('ovDel').addEventListener('click', () => {
    if (!delArm) { delArm = true; $('ovDel').textContent = '한 번 더 누르면 지워요'; return; }
    write(async () => { const id = ov.edit; await col.doc(id).delete(); notes.delete(id); });
  });
  $('ovCancel').addEventListener('click', () => { if (!ov) return; ov.tmp = null; ov.edit = null; hideForm(); drawOv(); });
  $('ovX').addEventListener('click', closeOv);
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && ov) { closeOv(); return; }
    const w = ev.target.closest && ev.target.closest('.pw');
    if (w && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); openOv(w.dataset, null, w); }
  });
  document.addEventListener('click', ev => {
    const w = ev.target.closest('.pw'); if (w) { openOv(w.dataset, null, w); return; }
    const b = ev.target.closest('[data-note]'); if (!b) return;
    const n = notes.get(b.dataset.note); if (!n) return;
    if (ov) { editNote(n.id); return; }
    const w2 = document.querySelector('.pw[data-img="' + n.img + '"]') || document.querySelector('.pw[data-key="' + n.key + '"][data-part="' + n.part + '"]');
    openOv(w2 ? w2.dataset : { img: n.img, label: n.label, key: n.key, trial: String(n.trial), part: n.part }, n.id, b);
  });
  draw();
  (async () => {
    let db = null; try { db = window.claude && window.claude.use ? await window.claude.use('db') : null; } catch (e) { db = null; }
    if (!db) { ready = true; failed = true; $('fxSt').textContent = 'claude.ai에서 이 페이지를 열면 수정 지시를 달고 저장할 수 있어요'; draw(); return; }
    col = db.collection('notes');
    const listen = () => col.limit(1000).onSnapshot(snap => {
      notes.clear();
      snap.docs.forEach(d => { if (!d.exists) return; const x = d.data() || {}; if (Number.isFinite(x.n) && typeof x.img === 'string' && typeof x.key === 'string') notes.set(d.id, Object.assign({}, x, { id: d.id })); });
      ready = true; failed = false; draw();
    }, err => { if (err && err.code === 'unavailable') setTimeout(listen, 3000); else { ready = true; failed = true; $('fxSt').textContent = '수정 지시를 불러오지 못했어요(' + (err && err.code || '알 수 없음') + ')'; draw(); } });
    listen();
  })();
})();
</script>
<a class="bx-back-f" href="https://claude.ai/artifact/Qf3o5SdboeHN7LQvENFg4C" target="_blank" rel="noopener">← 결정 사안</a>
<style>.bx-back-f{position:fixed;left:max(12px,env(safe-area-inset-left,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:40;display:inline-flex;align-items:center;height:44px;padding:0 16px;border-radius:22px;font:700 14px/1 system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;text-decoration:none;color:#fff;background:#14171c;box-shadow:0 4px 14px rgba(0,0,0,.2)}@media (prefers-color-scheme:dark){.bx-back-f{background:#e8eaed;color:#14171c}}body{padding-bottom:calc(84px + env(safe-area-inset-bottom,0px))!important}</style>
`;
// 결정 · 결재 사안으로 돌아가는 단추(대표 11/6 03:10 '선택실 · 청음실 · 와이어프레임을 보고 결재 창으로 다시 찾아와야 해서 번거롭다')
fs.writeFileSync(path.join(OUT, 'index.html'), page);
fs.writeFileSync(path.join(OUT, 'upload.json'), JSON.stringify(upload, null, 1));
console.log('시험판 ' + TRIAL + ': 화면 ' + all.length + '곳 · 바뀜 ' + changed + ' · 새 화면 ' + added + ' · 올릴 사진 ' + Object.keys(upload).length + '장 → ' + OUT);
