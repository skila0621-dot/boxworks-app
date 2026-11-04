/* ---------- 시험판 42: 일정 첨부 · 사진과 파일(대표 요청 11/3 18:15 · 정할 것 17번) ----------
   - 새 일정 · 일정 수정 창의 칩 줄 끝에 '사진·파일'. 누르면 사진 고르기 · 사진 찍기 · 파일, 붙인 것은 작은 그림(사진) · 이름(파일)으로.
   - 권한을 받지 않는다: 휴대폰 사진 선택기 · 카메라 앱 · 파일 창(Play 정책상 사진 전체 권한은 갤러리 앱만, 2025-05-28부터).
   - 고른 것은 곧바로 앱 안에 복사한다(휴대폰 쪽 BxAttachPlugin). 사진은 긴 변 2048px JPEG로 줄이고 작은 그림을 따로 둔다.
     원본은 갤러리에 그대로(대표 기본값 11/3 '줄인 사본만'). 한 일정에 10개, 파일 하나 20MB까지.
   - 일정 줄에는 📎와 개수. 첨부가 있는 일정을 열면 '사진·파일' 칸이 열린 채로 보인다.
   - 사진을 누르면 앱 안에서 크게, '다른 앱으로 열기'(확대 · 공유). 파일은 누르면 휴대폰 앱으로 연다.
   - 백업 파일: 첨부가 있으면 zip 하나(boxworks.json + attach/…). 불러오기는 json · zip 둘 다. 클라우드 자동 백업에서는 첨부 폴더를 뺀다(25MB).
   - 어느 일정에도 붙어 있지 않은 파일은 하루가 지나면 지운다(되돌리기 · 휴지통 30일 동안은 일정이 남아 있어서 지워지지 않음).
   문서: 일정 item.att = [{id, kind:'img'|'file', path:'attach/…', thumb?, name, mime, size, w?, h?, at}] — path는 앱 폴더 기준 */
const BX_ATT_MAX = 10;
const BX_CLIP_ICON = '<svg class="i" viewBox="0 0 24 24"><path d="m20.6 11.4-8.4 8.4a5.4 5.4 0 0 1-7.6-7.6l8.4-8.4a3.6 3.6 0 0 1 5.1 5.1l-8.4 8.3a1.8 1.8 0 0 1-2.5-2.5l7.7-7.7"/></svg>';
const BX_IMG_ICON = '<svg class="i" viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="m20.5 16-4.8-4.8L6.2 19.5"/></svg>';
const BX_CAM_ICON = '<svg class="i" viewBox="0 0 24 24"><path d="M4.5 8.5h3l1.6-2.5h5.8l1.6 2.5h3A1.5 1.5 0 0 1 21 10v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18v-8a1.5 1.5 0 0 1 1.5-1.5z"/><circle cx="12" cy="13.6" r="3.3"/></svg>';
const BX_FILE_ICON = '<svg class="i" viewBox="0 0 24 24"><path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z"/><path d="M14 3.5V8h4.5"/></svg>';
var bxAttBase = null;
function bxAttPl(){ return (window.BX_APP && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.BxAttach) || null; }
function bxAttSrc(rel){
  if (!rel || !bxAttBase) return '';
  const f = 'file://' + bxAttBase + '/' + rel;
  try { return window.Capacitor && window.Capacitor.convertFileSrc ? window.Capacitor.convertFileSrc(f) : f; } catch (e) { return f; }
}
function bxAttOf(it){ return it && Array.isArray(it.att) ? it.att.filter(a => a && a.path) : []; }
function bxAttSize(n){ n = +n || 0; return n >= 1048576 ? (n / 1048576).toFixed(1) + 'MB' : Math.max(1, Math.round(n / 1024)) + 'KB'; }
function bxAttImgHtml(a, cls){
  const s = bxAttSrc(a.thumb || a.path);
  return '<img class="' + (cls || '') + '" alt="" loading="lazy" decoding="async" data-bxatt-rel="' + esc(a.thumb || a.path) + '"' + (s ? ' src="' + esc(s) + '"' : '') + ' onerror="this.parentNode.classList.add(\'miss\')">';
}
// 휴대폰이 앱 폴더 위치를 알려 주면 그림 주소를 채운다(앱을 연 직후 잠깐 비어 있을 수 있음)
(function bxAttInit(){
  const pl = bxAttPl(); if (!pl || !pl.info) return;
  pl.info().then(r => {
    bxAttBase = (r && r.base) || null;
    if (bxAttBase) document.querySelectorAll('img[data-bxatt-rel]:not([src])').forEach(i => { i.src = bxAttSrc(i.dataset.bxattRel); });
  }).catch(() => {});
})();

// 일정 줄: 📎 개수(장소 다음)
function bxAttMeta(it){
  const n = bxAttOf(it).length;
  return n ? '<span class="meta bx-att-m">' + BX_CLIP_ICON + '<span class="sr">첨부 </span>' + n + '</span>' : '';
}

/* 일정 창 */
const bxEdit42 = drawEdit;
drawEdit = function(){
  if (window.BX_APP && F && F.att === undefined) {
    const it = F.mode === 'edit' ? getDoc(F.id) : null, a = bxAttOf(it);
    if (a.length) { F.att = a.map(x => Object.assign({}, x)); if (!F.panel) F.panel = 'att'; }
  }
  return bxEdit42.apply(this, arguments);
};
const bxChips42 = drawFChips;
drawFChips = function(){
  const r = bxChips42.apply(this, arguments);
  const el = document.getElementById('f-chips');
  if (window.BX_APP && el && F && bxAttPl() && !el.querySelector('[data-fpanel="att"]')) {
    const n = (F.att || []).length, on = F.panel === 'att';
    el.insertAdjacentHTML('beforeend', '<button type="button" class="fchip' + (n ? ' set' : '') + '" role="tab" data-fpanel="att" aria-selected="' + on + '" aria-expanded="' + on + '">' + BX_CLIP_ICON + '<span>' + (n ? '사진·파일 ' + n : '사진·파일') + '</span></button>');
  }
  return r;
};
const bxPanel42 = drawFPanel;
drawFPanel = function(){
  if (window.BX_APP && F && F.panel === 'att') {
    const el = document.getElementById('f-panel'); if (!el) return;
    el.hidden = false; el.innerHTML = '<div id="f-att"></div>'; bxAttDraw(); return;
  }
  return bxPanel42.apply(this, arguments);
};
function bxAttDraw(){
  const el = document.getElementById('f-att'); if (!el || !F) return;
  const list = F.att || [], imgs = list.filter(a => a.kind === 'img'), files = list.filter(a => a.kind !== 'img'), full = list.length >= BX_ATT_MAX;
  const x = (a, what) => '<button type="button" class="bx-att-x" data-bxatt-del="' + esc(a.id) + '" aria-label="' + esc((a.name || what) + ' 빼기') + '">' + ICON.close + '</button>';
  const dis = full ? ' disabled' : '';
  el.innerHTML =
    (imgs.length ? '<div class="bx-att-grid">' + imgs.map(a => '<div class="bx-att-th"><button type="button" class="bx-att-open" data-bxatt-view="' + esc(a.id) + '" aria-label="' + esc((a.name || '사진') + ' 크게 보기') + '">' + bxAttImgHtml(a) + '<small class="bx-att-miss">이 휴대폰에 없음</small></button>' + x(a, '사진') + '</div>').join('') + '</div>' : '') +
    (files.length ? '<div class="bx-att-files">' + files.map(a => '<div class="bx-att-f"><button type="button" class="bx-att-fopen" data-bxatt-view="' + esc(a.id) + '">' + BX_FILE_ICON + '<span class="bx-att-fn">' + esc(a.name || '파일') + '</span><small>' + esc(bxAttSize(a.size)) + '</small></button>' + x(a, '파일') + '</div>').join('') + '</div>' : '') +
    '<div class="bx-att-add">' +
      '<button type="button" class="btn sm" data-bxatt-add="img"' + dis + '>' + BX_IMG_ICON + '사진 고르기</button>' +
      '<button type="button" class="btn sm" data-bxatt-add="cam"' + dis + '>' + BX_CAM_ICON + '사진 찍기</button>' +
      '<button type="button" class="btn sm" data-bxatt-add="file"' + dis + '>' + BX_FILE_ICON + '파일</button></div>' +
    '<p class="p small bx-att-note">' + (full ? '한 일정에 ' + BX_ATT_MAX + '개까지 붙일 수 있어요.' : '사진은 줄여서 이 앱 안에 저장해요. 원본은 갤러리에 그대로 있어요.') + '</p>';
}
async function bxAttAdd(kind){
  const pl = bxAttPl(); if (!pl || !F) return;
  const fd = F, room = BX_ATT_MAX - (F.att || []).length;
  if (room <= 0) { toast('한 일정에 ' + BX_ATT_MAX + '개까지 붙일 수 있어요'); return; }
  let r;
  try { r = kind === 'img' ? await pl.pickImages({max: room}) : kind === 'cam' ? await pl.takePhoto() : await pl.pickFiles(); }
  catch (e) { toast((e && e.message) || '열지 못했어요'); return; }
  // 고르는 동안 창을 닫았으면 붙이지 않는다(복사된 파일은 하루 뒤 정리)
  if (F !== fd) return;
  const got = ((r && r.files) || []).filter(a => a && a.path).map(a => Object.assign({at: nowIso()}, a));
  const keep = got.slice(0, Math.max(0, BX_ATT_MAX - (F.att || []).length));
  F.att = (F.att || []).concat(keep);
  F.panel = 'att';
  drawFChips(); drawFPanel();
  const msg = [];
  if (keep.length) msg.push(keep.length === 1 ? (keep[0].kind === 'img' ? '사진' : '파일') + '을 붙였어요' : keep.length + '개를 붙였어요');
  const over = got.length - keep.length + ((r && r.over) || 0);
  if (over) msg.push(over + '개는 ' + BX_ATT_MAX + '개가 넘어서 뺐어요');
  if (r && r.big) msg.push(r.big + '개는 20MB가 넘어서 못 붙였어요');
  if (r && r.failed) msg.push(r.failed + '개는 읽지 못했어요');
  if (msg.length) toast(msg.join(' · '));
}
// 저장: 붙이거나 뺀 것이 있을 때만 att를 적는다
const bxFF42 = bxFFields;
bxFFields = function(fields){
  bxFF42.apply(this, arguments);
  if (F && F.att !== undefined) fields.att = F.att.length ? F.att.map(a => Object.assign({}, a)) : null;
};

/* 크게 보기(사진): 화면 위에 검은 판. 뒤로 · 닫기 · '다른 앱으로 열기'(확대 · 공유는 휴대폰 사진 앱에서) */
function bxAttFind(id){ return ((F && F.att) || []).find(a => a.id === id) || null; }
function bxAttOpenExt(a){
  const pl = bxAttPl(); if (!pl || !a) return;
  pl.open({path: a.path, mime: a.mime || '*/*', title: a.name || '열 앱 고르기'}).catch(e => toast((e && e.message) || '열지 못했어요'));
}
function bxAttViewClose(){ const v = document.getElementById('bx-att-view'); if (v) v.remove(); }
function bxAttView(a){
  if (!a) return;
  if (a.kind !== 'img') { bxAttOpenExt(a); return; }
  bxAttViewClose();
  const v = document.createElement('div');
  v.id = 'bx-att-view'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true'); v.setAttribute('aria-label', a.name || '사진');
  const s = bxAttSrc(a.path);
  v.innerHTML = '<div class="bx-av-top"><span class="bx-av-n">' + esc(a.name || '사진') + '</span><button type="button" class="bx-av-x" data-bxatt-close aria-label="닫기">' + ICON.close + '</button></div>' +
    '<div class="bx-av-img" data-bxatt-close><img alt="' + esc(a.name || '사진') + '"' + (s ? ' src="' + esc(s) + '"' : '') + ' onerror="this.parentNode.classList.add(\'miss\')"><p class="bx-av-miss">이 휴대폰에 파일이 없어요. 다른 휴대폰에서 백업 파일(zip)로 옮기면 함께 옮겨져요.</p></div>' +
    '<div class="bx-av-bot"><button type="button" class="btn" data-bxatt-ext="' + esc(a.id) + '">다른 앱으로 열기</button></div>';
  v.__att = a;
  document.body.appendChild(v);
  const b = v.querySelector('.bx-av-x'); if (b) { try { b.focus({preventScroll: true}); } catch (e) { b.focus(); } }
}
// 휴대폰 뒤로: 크게 보기부터 닫는다(BX_back은 이 파일 다음에 만들어짐)
setTimeout(() => {
  const back = window.BX_back; if (typeof back !== 'function' || back.bx42) return;
  window.BX_back = function(){ if (document.getElementById('bx-att-view')) { bxAttViewClose(); return true; } return back.apply(this, arguments); };
  window.BX_back.bx42 = true;
}, 0);

document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const t = ev.target;
  const v = document.getElementById('bx-att-view');
  if (v && v.contains(t)) {
    ev.preventDefault(); ev.stopPropagation();
    if (t.closest('[data-bxatt-ext]')) { bxAttOpenExt(v.__att); return; }
    if (t.closest('.bx-av-x') || (t.closest('[data-bxatt-close]') && !t.closest('img'))) bxAttViewClose();
    return;
  }
  const add = t.closest('[data-bxatt-add]');
  if (add) { ev.preventDefault(); ev.stopPropagation(); if (!add.disabled) bxAttAdd(add.dataset.bxattAdd); return; }
  const del = t.closest('[data-bxatt-del]');
  if (del && F) { ev.preventDefault(); ev.stopPropagation(); F.att = (F.att || []).filter(a => a.id !== del.dataset.bxattDel); drawFChips(); drawFPanel(); return; }
  const op = t.closest('[data-bxatt-view]');
  if (op && F) { ev.preventDefault(); ev.stopPropagation(); bxAttView(bxAttFind(op.dataset.bxattView)); }
}, true);

/* 안 쓰는 파일 정리: 어느 문서에도 없는 파일 중 하루가 지난 것(앱을 열고 15초 뒤 한 번) */
function bxAttRefs(withF){
  const s = new Set();
  const add = a => { if (a && a.path) s.add(a.path); if (a && a.thumb) s.add(a.thumb); };
  allDocs().forEach(d => { if (d && Array.isArray(d.att)) d.att.forEach(add); });
  if (withF && F && F.att) F.att.forEach(add);
  return s;
}
async function bxAttGc(){
  const pl = bxAttPl(); if (!pl || !pl.list || !pl.remove || !M || !S.firstServer) return;
  try {
    const r = await pl.list(), refs = bxAttRefs(true), old = Date.now() - 864e5;
    const gone = ((r && r.files) || []).filter(f => f && f.path && !refs.has(f.path) && +f.mtime > 0 && +f.mtime < old).map(f => f.path);
    if (gone.length) await pl.remove({paths: gone});
  } catch (e) { /* 다음에 다시 */ }
}
setTimeout(() => bxAttGc(), 15000);

/* 백업: 첨부가 있으면 zip(boxworks.json + attach/…), 없으면 지금처럼 json. 파일 이름은 앱 이름으로(이름은 한 곳에서, D-16) */
function bxBackupBase(){ return (window.BX_NAME || '스케줄러') + '-백업-' + M.today.replace(/-/g, ''); }
const bxExport42 = exportJson;
exportJson = async function(){
  if (!window.BX_APP) return bxExport42.apply(this, arguments);
  const base = bxBackupBase(), files = Array.from(bxAttRefs(false));
  const pl = bxAttPl(), share = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Share;
  if (!files.length || !pl || !pl.zip || !share) return offerFile(base + '.json', bxBackupText());
  let r;
  try { toast('백업 파일을 만드는 중이에요'); r = await pl.zip({json: bxBackupText(), files, name: base + '.zip'}); }
  catch (e) { toast('백업 파일을 만들지 못했어요. 다시 해 보세요.'); return; }
  try { await share.share({title: base + '.zip', files: [r.uri], dialogTitle: '파일 저장할 곳 고르기'}); }
  catch (e) { return; }
  toast('백업 파일을 저장했어요 · 사진·파일 ' + files.filter(p => !/_t\.jpg$/.test(p)).length + '개 포함');
};
// 표 파일 이름도 앱 이름으로
const bxCsv42 = exportCsv;
exportCsv = function(){
  if (!window.BX_APP) return bxCsv42.apply(this, arguments);
  const of = offerFile;
  offerFile = (name, data) => { offerFile = of; return of(String(name).replace(/^boxworks-/, (window.BX_NAME || '스케줄러') + '-'), data); };
  try { return bxCsv42.apply(this, arguments); } finally { offerFile = of; }
};

// 불러오기: zip이면 attach/…를 앱 폴더에 넣고 boxworks.json을 불러온다
function bxB64(u8){ let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
async function bxZipRead(buf){
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength), out = [];
  let e = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
  if (e < 0) throw new Error('zip');
  const n = dv.getUint16(e + 10, true);
  let p = dv.getUint32(e + 16, true);
  for (let k = 0; k < n; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('zip');
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lho = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(buf.subarray(p + 46, p + 46 + nl));
    const ds = lho + 30 + dv.getUint16(lho + 26, true) + dv.getUint16(lho + 28, true);
    let data = buf.subarray(ds, ds + csize);
    if (method === 8) {
      if (typeof DecompressionStream !== 'function') throw new Error('deflate');
      data = new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    } else if (method !== 0) throw new Error('method');
    if (!/\/$/.test(name)) out.push({name, data});
    p += 46 + nl + xl + cl;
  }
  return out;
}
const bxImport42 = importJson;
importJson = async function(file){
  if (!window.BX_APP || !file || typeof file.slice !== 'function') return bxImport42.apply(this, arguments);
  let head = null;
  try { head = new Uint8Array(await file.slice(0, 4).arrayBuffer()); } catch (e) { head = null; }
  if (!(head && head[0] === 0x50 && head[1] === 0x4b)) return bxImport42.apply(this, arguments);
  let ents;
  try { ents = await bxZipRead(new Uint8Array(await file.arrayBuffer())); } catch (e) { toast('백업 파일(zip)을 읽지 못했어요.'); return; }
  const js = ents.find(x => x.name === 'boxworks.json') || ents.find(x => /\.json$/i.test(x.name));
  if (!js) { toast('백업 파일 안에 일정이 없어요.'); return; }
  const fs = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem;
  let put = 0, bad = 0;
  for (const x of ents) {
    if (!/^attach\/[A-Za-z0-9_.-]{1,80}$/.test(x.name)) continue;
    if (!fs) { bad++; continue; }
    try { await fs.writeFile({path: x.name, data: bxB64(x.data), directory: 'DATA', recursive: true}); put++; } catch (e) { bad++; }
  }
  const text = new TextDecoder().decode(js.data);
  await bxImport42.call(this, {text: async () => text});
  const pics = ents.filter(x => /^attach\//.test(x.name) && !/_t\.jpg$/.test(x.name)).length;
  if (put || bad) toast('사진·파일 ' + pics + '개도 되살렸어요' + (bad ? ' · ' + bad + '개는 넣지 못했어요' : ''));
  document.querySelectorAll('img[data-bxatt-rel]').forEach(i => { i.src = bxAttSrc(i.dataset.bxattRel); });
};

(function bxV42Style(){
  if (!window.BX_APP) return;
  const st = document.createElement('style');
  st.id = 'bx-v42';
  st.textContent = [
    'html.bx-app .meta.bx-att-m{display:inline-flex;align-items:center;gap:2px}html.bx-app .meta.bx-att-m svg.i{width:14px;height:14px}',
    'html.bx-app .bx-att-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:10px}',
    'html.bx-app .bx-att-th{position:relative;aspect-ratio:1;border-radius:14px;overflow:hidden;background:var(--sunk)}',
    'html.bx-app .bx-att-open{display:block;width:100%;height:100%;padding:0;border:0;background:transparent}',
    'html.bx-app .bx-att-open img{display:block;width:100%;height:100%;object-fit:cover}',
    'html.bx-app .bx-att-miss{display:none}html.bx-app .miss > img{display:none}html.bx-app .miss .bx-att-miss{display:flex;height:100%;align-items:center;justify-content:center;padding:6px;font-size:13px;color:var(--ink-3);text-align:center}',
    'html.bx-app .bx-att-x{position:absolute;top:5px;right:5px;width:30px;height:30px;padding:0;border:0;border-radius:15px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55);color:#fff}',
    'html.bx-app .bx-att-x svg.i{width:16px;height:16px}',
    'html.bx-app .bx-att-files{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}',
    'html.bx-app .bx-att-f{position:relative;display:flex;align-items:center;border-radius:14px;background:var(--sunk)}',
    'html.bx-app .bx-att-fopen{flex:1;min-width:0;display:flex;align-items:center;gap:10px;height:52px;padding:0 44px 0 14px;border:0;background:transparent;color:var(--ink);text-align:left}',
    'html.bx-app .bx-att-fopen svg.i{flex:none;width:20px;height:20px;color:var(--accent-text)}',
    'html.bx-app .bx-att-fn{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:16px;font-weight:600}',
    'html.bx-app .bx-att-fopen small{flex:none;color:var(--ink-3);font-size:13px}',
    'html.bx-app .bx-att-f .bx-att-x{top:11px;background:color-mix(in srgb,var(--ink) 14%,transparent);color:var(--ink)}',
    'html.bx-app .bx-att-add{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}',
    'html.bx-app .bx-att-add .btn{min-width:0;justify-content:center;gap:5px;padding:0 6px;white-space:nowrap}html.bx-app .bx-att-add .btn svg.i{flex:none;width:17px;height:17px}',
    'html.bx-app .bx-att-note{margin:10px 2px 0;color:var(--ink-3)}',
    // 크게 보기
    '#bx-att-view{position:fixed;inset:0;z-index:400;display:flex;flex-direction:column;background:#08090c;color:#fff;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}',
    '#bx-att-view .bx-av-top{display:flex;align-items:center;gap:8px;min-height:56px;padding:0 6px 0 18px}',
    '#bx-att-view .bx-av-n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:16px;font-weight:600;opacity:.9}',
    '#bx-att-view .bx-av-x{width:48px;height:48px;border:0;background:transparent;color:#fff;display:flex;align-items:center;justify-content:center}#bx-att-view .bx-av-x svg.i{width:24px;height:24px}',
    '#bx-att-view .bx-av-img{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:0 8px}',
    '#bx-att-view .bx-av-img img{max-width:100%;max-height:100%;object-fit:contain;border-radius:6px}',
    '#bx-att-view .bx-av-miss{display:none;max-width:280px;text-align:center;line-height:1.6;opacity:.8}#bx-att-view .miss img{display:none}#bx-att-view .miss .bx-av-miss{display:block}',
    '#bx-att-view .bx-av-bot{display:flex;justify-content:center;padding:12px 16px 18px}#bx-att-view .bx-av-bot .btn{min-width:200px}'
  ].join('\n');
  (document.head || document.documentElement).appendChild(st);
})();
