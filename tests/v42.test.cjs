// 시험판 42: 일정 첨부(대표 요청 11/3 18:15 · 정할 것 17번) — 사진 고르기 · 찍기 · 파일, 줄에 📎, 크게 보기 · 다른 앱으로 열기,
// 한 일정에 10개, 저장 · 빼기, '메모 …'라도 첨부가 있으면 일정으로, 백업 zip 만들기 · 불러오기, 안 쓰는 파일 정리
const { openApp, settings, checker } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
const img = (id, name) => ({ id, kind: 'img', path: 'attach/' + id + '.jpg', thumb: 'attach/' + id + '_t.jpg', name: name || id + '.jpg', mime: 'image/jpeg', size: 345678, w: 2048, h: 1536 });
const pdf = (id, name) => ({ id, kind: 'file', path: 'attach/' + id + '.pdf', name, mime: 'application/pdf', size: 120000 });
function seed() {
  return [['settings', settings()],
    ['it_1', { type: 'item', title: '병원 예약', date: '2026-11-02', start: '09:00', end: '10:00', categoryId: null, att: [img('a1', '진료 안내.jpg'), pdf('f1', '처방전.pdf')], createdAt: old, updatedAt: old }],
    ['it_2', { type: 'item', title: '회의', date: '2026-11-02', start: '11:00', end: '12:00', categoryId: null, createdAt: old, updatedAt: old }]];
}
const doc = (p, id) => p.evaluate(id => (window.BX_T.docs().find(([k]) => k === id) || [0, null])[1], id);
const calls = (p, name) => p.evaluate(n => (window.__attCalls || []).filter(c => c[0] === n).map(c => c[1]), name);
const toasts = p => p.evaluate(() => Array.from(document.querySelectorAll('.toast')).map(t => t.textContent).join(' | '));
const clickAct = (p, act) => p.evaluate(a => { const b = document.createElement('button'); b.dataset.act = a; b.style.display = 'none'; document.body.appendChild(b); b.click(); b.remove(); }, act);

// 압축하지 않은 zip(휴대폰 쪽 BxAttachPlugin.zip과 같은 모양)
function crc32(buf) { let c, crc = 0xffffffff; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ 0xffffffff) >>> 0; }
function storedZip(entries) {
  const locals = [], cds = []; let off = 0;
  for (const [name, data] of entries) {
    const nb = Buffer.from(name, 'utf8'), crc = crc32(data);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(0, 8); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nb.length, 26);
    locals.push(lh, nb, data);
    const cd = Buffer.alloc(46); cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(20, 4); cd.writeUInt16LE(20, 6); cd.writeUInt16LE(0x0800, 8); cd.writeUInt32LE(crc, 16); cd.writeUInt32LE(data.length, 20); cd.writeUInt32LE(data.length, 24); cd.writeUInt16LE(nb.length, 28); cd.writeUInt32LE(off, 42);
    cds.push(cd, nb);
    off += 30 + nb.length + data.length;
  }
  const cdBuf = Buffer.concat(cds), eo = Buffer.alloc(22);
  eo.writeUInt32LE(0x06054b50, 0); eo.writeUInt16LE(entries.length, 8); eo.writeUInt16LE(entries.length, 10); eo.writeUInt32LE(cdBuf.length, 12); eo.writeUInt32LE(off, 16);
  return Buffer.concat([...locals, cdBuf, eo]);
}

module.exports = async function () {
  const c = checker('시험판 42 · 일정 첨부(사진 · 파일) · 백업 zip');
  let app = await openApp({ data: seed() });
  try {
    const p = app.page;
    const day = Date.parse('2026-11-02T06:50:00+09:00');
    await p.evaluate(d => { window.__attFiles = [
      { path: 'attach/a1.jpg', mtime: d - 3 * 864e5 }, { path: 'attach/a1_t.jpg', mtime: d - 3 * 864e5 }, { path: 'attach/f1.pdf', mtime: d - 3 * 864e5 },
      { path: 'attach/gone.jpg', mtime: d - 2 * 864e5 }, { path: 'attach/fresh.jpg', mtime: d - 3600e3 }]; }, day);
    // (1) 일정 줄에 📎 개수
    c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('#tcard2 .row')).map(r => [r.querySelector('.row-title').textContent, (r.querySelector('.bx-att-m') || {}).textContent || ''])),
      [['병원 예약', '첨부 2'], ['회의', '']], '홈 줄: 첨부가 있으면 📎 개수');
    // (2) 첨부가 있는 일정: 줄에 '사진·파일 2개'. 시험판 44부터는 저절로 열지 않고, 줄을 누르면 사진·파일 페이지
    await p.click('#tcard2 .row-main[data-id="it_1"]'); await p.waitForTimeout(500);
    c.ok(await p.evaluate(() => !document.getElementById('bx-ep')), '열 때 사진·파일 페이지를 저절로 열지 않음');
    await p.evaluate(() => { const b = document.querySelector('#f-chips [data-bxmore]'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); }); await p.click('#f-chips [data-fpanel="att"]'); await p.waitForTimeout(300);
    const ed = await p.evaluate(() => ({
      chip: (document.querySelector('#f-chips [data-fpanel="att"]') || {}).textContent || '',
      open: !!document.querySelector('#bx-ep #f-panel:not([hidden]) #f-att'),
      thumbs: Array.from(document.querySelectorAll('#f-att .bx-att-th img')).map(i => i.getAttribute('src')),
      files: Array.from(document.querySelectorAll('#f-att .bx-att-f')).map(f => f.querySelector('.bx-att-fn').textContent + ' ' + f.querySelector('small').textContent),
      btns: Array.from(document.querySelectorAll('#f-att [data-bxatt-add]')).map(b => b.textContent.trim())
    }));
    c.eq(ed.chip.trim(), '사진·파일 2개', "줄 '사진·파일 2개'");
    c.ok(ed.open, '줄을 누르면 사진·파일 페이지');
    c.eq(ed.thumbs, ['https://localhost/_capacitor_file_/data/user/0/kr.boxworks.app/files/attach/a1_t.jpg'], '사진은 작은 그림(앱 폴더 주소)');
    c.eq(ed.files, ['처방전.pdf 117KB'], '파일은 이름 · 크기');
    c.eq(ed.btns, ['사진 고르기', '사진 찍기', '파일'], '붙이기 단추 셋');
    // (3) 사진 크게 보기 · 다른 앱으로 열기 · 뒤로
    await p.click('#f-att [data-bxatt-view="a1"]'); await p.waitForTimeout(300);
    c.eq(await p.evaluate(() => { const v = document.getElementById('bx-att-view'); return v ? [v.querySelector('.bx-av-n').textContent, v.querySelector('.bx-av-img img').getAttribute('src')] : null; }),
      ['진료 안내.jpg', 'https://localhost/_capacitor_file_/data/user/0/kr.boxworks.app/files/attach/a1.jpg'], '크게 보기: 이름 · 줄이기 전 사진(2048px)');
    await p.click('#bx-att-view [data-bxatt-ext]'); await p.waitForTimeout(200);
    c.eq((await calls(p, 'open')).map(x => [x.path, x.mime]), [['attach/a1.jpg', 'image/jpeg']], '다른 앱으로 열기');
    await p.evaluate(() => window.BX_back()); await p.waitForTimeout(200);
    c.ok(await p.evaluate(() => !document.getElementById('bx-att-view') && !!document.getElementById('f-att')), '뒤로: 크게 보기만 닫히고 일정 창은 그대로');
    // (4) 파일은 누르면 휴대폰 앱으로
    await p.click('#f-att [data-bxatt-view="f1"]'); await p.waitForTimeout(200);
    c.eq((await calls(p, 'open')).map(x => x.path), ['attach/a1.jpg', 'attach/f1.pdf'], '파일은 누르면 휴대폰 앱으로 열기');
    // (5) 빼고 저장
    await p.click('#f-att [data-bxatt-del="f1"]'); await p.waitForTimeout(200);
    c.eq(await p.evaluate(() => (document.querySelector('#f-chips [data-fpanel="att"]') || {}).textContent.trim()), '사진·파일 1개', '빼면 줄 숫자도');
    await p.click('#bx-ep [data-bxep="done"]'); await p.waitForTimeout(200);
    await p.evaluate(() => document.querySelector('#sheet-root [data-act="save"]').click()); await p.waitForTimeout(500);
    c.eq(((await doc(p, 'it_1')).att || []).map(a => a.id), ['a1'], '저장하면 뺀 파일은 일정에서 빠짐');
    // (6) 새 일정에 사진 고르기 · 찍기
    await p.click('.bx-fab'); await p.waitForTimeout(400);
    await p.fill('#f-title', '내일 3시 치과'); await p.waitForTimeout(200);
    await p.evaluate(() => { const b = document.querySelector('#f-chips [data-bxmore]'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); }); await p.click('#f-chips [data-fpanel="att"]'); await p.waitForTimeout(300);
    await p.evaluate(x => { window.__attNext = [{ files: x }]; }, [img('b1'), img('b2')]);
    await p.click('#f-att [data-bxatt-add="img"]'); await p.waitForTimeout(400);
    c.eq(await calls(p, 'pickImages'), [{ max: 10 }], '사진 고르기: 남은 자리만큼(10)');
    c.eq(await p.evaluate(() => document.querySelectorAll('#f-att .bx-att-th').length), 2, '고른 사진 둘');
    c.ok(/2개를 붙였어요/.test(await toasts(p)), "안내 '2개를 붙였어요'");
    await p.evaluate(x => { window.__attNext = [{ files: x }]; }, [img('c1', '사진 11월 2일 06:50.jpg')]);
    await p.click('#f-att [data-bxatt-add="cam"]'); await p.waitForTimeout(400);
    c.eq((await calls(p, 'takePhoto')).length, 1, '사진 찍기');
    await p.click('#bx-ep [data-bxep="done"]'); await p.waitForTimeout(200);
    await p.evaluate(() => document.querySelector('#sheet-root [data-act="save"]').click()); await p.waitForTimeout(500);
    const nid = await p.evaluate(() => (window.BX_T.docs().find(([, d]) => d && d.type === 'item' && /치과/.test(d.title || '')) || [null])[0]);
    const nd = nid && await doc(p, nid);
    c.ok(nd && nd.date === '2026-11-03' && nd.start === '15:00' && (nd.att || []).map(a => a.id).join() === 'b1,b2,c1' && nd.att.every(a => a.at), '새 일정: 날짜 · 시각과 사진 셋(붙인 시각 포함) ' + JSON.stringify(nd && { d: nd.date, s: nd.start, a: (nd.att || []).map(a => a.id) }));
    // (7) 한 일정에 10개까지
    await p.evaluate(id => window.BX_T.day('2026-11-03'), nid); await p.waitForTimeout(400);
    await p.evaluate(id => { const b = document.querySelector('#sheet-root [data-act="edit"][data-id="' + id + '"]'); if (b) b.click(); }, nid); await p.waitForTimeout(500);
    await p.evaluate(x => { window.__attNext = [{ files: x }]; }, Array.from({ length: 8 }, (_, i) => img('d' + i)));
    await p.evaluate(() => { const b = document.querySelector('#f-chips [data-bxmore]'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); }); await p.click('#f-chips [data-fpanel="att"]'); await p.waitForTimeout(300);
    await p.click('#f-att [data-bxatt-add="img"]'); await p.waitForTimeout(400);
    c.eq((await calls(p, 'pickImages')).slice(-1), [{ max: 7 }], '세 장 있으면 7장까지 고르기');
    const full = await p.evaluate(() => ({ n: document.querySelectorAll('#f-att .bx-att-th').length, dis: Array.from(document.querySelectorAll('#f-att [data-bxatt-add]')).every(b => b.disabled), note: document.querySelector('#f-att .bx-att-note').textContent }));
    c.ok(full.n === 10 && full.dis && /10개까지/.test(full.note), '10개면 단추가 잠기고 한 줄 안내 ' + JSON.stringify(full));
    c.ok(/1개는 10개가 넘어서 뺐어요/.test(await toasts(p)), '넘친 것은 빼고 알려 줌');
    await p.evaluate(() => window.BX_back()); await p.waitForTimeout(300);
    c.ok(await p.evaluate(() => !document.getElementById('bx-ep') && !!document.getElementById('f-chips') && /사진·파일 3개/.test(document.querySelector('#f-chips [data-fpanel="att"]').textContent)), '휴대폰 뒤로: 페이지에서 바꾼 것을 되돌리고 일정 창으로(3개)');
    await p.evaluate(() => window.BX_back()); await p.waitForTimeout(300);
    c.eq(((await doc(p, nid)).att || []).length, 3, '저장하지 않고 닫으면 그대로(3개)');
    // (8) '메모 …'로 시작해도 사진을 붙이면 일정으로
    await p.click('.bx-fab'); await p.waitForTimeout(400);
    await p.fill('#f-title', '메모 사진 정리'); await p.waitForTimeout(200);
    await p.evaluate(() => { const b = document.querySelector('#f-chips [data-bxmore]'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); }); await p.click('#f-chips [data-fpanel="att"]'); await p.waitForTimeout(200);
    await p.evaluate(x => { window.__attNext = [{ files: x }]; }, [img('e1')]);
    await p.click('#f-att [data-bxatt-add="img"]'); await p.waitForTimeout(400);
    await p.click('#bx-ep [data-bxep="done"]'); await p.waitForTimeout(200);
    await p.evaluate(() => document.querySelector('#sheet-root [data-act="save"]').click()); await p.waitForTimeout(500);
    c.ok(await p.evaluate(() => window.BX_T.docs().some(([, d]) => d && d.type === 'item' && (d.att || []).some(a => a.id === 'e1')) && !window.BX_T.docs().some(([, d]) => d && d.type === 'memo')), "'메모 …'라도 첨부가 있으면 일정으로(메모에는 첨부가 없음)");
    // (9) 안 쓰는 파일 정리: 어느 일정에도 없고 하루가 지난 것만(f1은 방금 뺐지만 하루가 지났다고 침)
    await p.waitForFunction(() => (window.__attCalls || []).some(x => x[0] === 'remove'), null, { timeout: 20000 }).catch(() => {});
    c.eq((await calls(p, 'remove')).map(x => x.paths.slice().sort()), [['attach/f1.pdf', 'attach/gone.jpg']], '정리: 붙어 있지 않고 하루 지난 파일만(방금 만든 것 · 붙어 있는 것은 그대로)');
    // (10) 백업: 첨부가 있으면 zip 하나
    await p.evaluate(() => { window.Capacitor.Plugins.Share = { share: async x => { window.__share = x; return {}; } }; });
    await clickAct(p, 'export-json'); await p.waitForTimeout(600);
    const z = (await calls(p, 'zip'))[0];
    const zj = z && JSON.parse(z.json);
    c.ok(z && z.name === '스케줄러-백업-20261102.zip' && z.files.includes('attach/a1.jpg') && z.files.includes('attach/a1_t.jpg') && z.files.includes('attach/c1.jpg') && !z.files.includes('attach/f1.pdf'), 'zip: 앱 이름 백업 파일, 붙어 있는 사진과 작은 그림 ' + JSON.stringify(z && { n: z.name, f: z.files.length }));
    c.ok(zj && zj.app === 'boxworks' && zj.items.some(x => x.id === 'it_1' && x.att && x.att[0].path === 'attach/a1.jpg'), 'zip 안 boxworks.json에 일정과 첨부 정보');
    c.eq(await p.evaluate(() => window.__share && window.__share.files), ['file:///cache/스케줄러-백업-20261102.zip'], '저장할 곳 고르기로 넘김');
    c.ok(/사진·파일 \d+개 포함/.test(await toasts(p)), '안내: 사진·파일 N개 포함');
    c.eq(app.errors, [], '화면 오류(첨부)');
  } finally { await app.close(); }

  // (11) 첨부가 없으면 json 그대로 · zip 불러오기(첨부를 앱 폴더에 되살림)
  app = await openApp({ data: [['settings', settings()]] });
  try {
    const p = app.page;
    await p.evaluate(() => {
      window.__fs = [];
      window.Capacitor.Plugins.Filesystem = { writeFile: async x => { window.__fs.push(x); return { uri: 'file:///cache/' + x.path }; } };
      window.Capacitor.Plugins.Share = { share: async x => { window.__share = x; return {}; } };
    });
    await clickAct(p, 'export-json'); await p.waitForTimeout(500);
    c.eq(await p.evaluate(() => [(window.__fs[0] || {}).path, (window.__attCalls || []).filter(x => x[0] === 'zip').length]), ['스케줄러-백업-20261102.json', 0], '첨부가 없으면 지금처럼 json(이름은 앱 이름)');
    const bk = { app: 'boxworks', version: 2, exportedAt: old, items: [{ id: 'z_1', type: 'item', title: '여권 사진', date: '2026-11-05', start: '10:00', end: '', categoryId: null, att: [img('z1', '여권.jpg')], createdAt: old, updatedAt: old }] };
    const zip = storedZip([['boxworks.json', Buffer.from(JSON.stringify(bk), 'utf8')], ['attach/z1.jpg', Buffer.from([0xff, 0xd8, 1, 2, 3, 0xff, 0xd9])], ['attach/z1_t.jpg', Buffer.from([0xff, 0xd8, 9, 0xff, 0xd9])]]);
    await p.evaluate(() => { const i = document.createElement('input'); i.type = 'file'; i.id = 'import-file'; i.className = 'sr'; document.body.appendChild(i); });
    await p.setInputFiles('#import-file', { name: '스케줄러-백업-20261104.zip', mimeType: 'application/zip', buffer: zip });
    await p.waitForTimeout(800);
    const fsw = await p.evaluate(() => window.__fs.filter(x => /^attach\//.test(x.path)).map(x => [x.path, x.directory, atob(x.data).length]));
    c.eq(fsw, [['attach/z1.jpg', 'DATA', 7], ['attach/z1_t.jpg', 'DATA', 5]], 'zip 불러오기: 사진을 앱 폴더에 되살림');
    c.ok(((await doc(p, 'z_1')) || {}).att && (await doc(p, 'z_1')).att[0].path === 'attach/z1.jpg', 'zip 불러오기: 일정과 첨부 정보');
    c.ok(/사진·파일 1개도 되살렸어요/.test(await toasts(p)), '안내: 사진·파일도 되살림');
    c.eq(app.errors, [], '화면 오류(백업)');
  } finally { await app.close(); }
  return c.done();
};
