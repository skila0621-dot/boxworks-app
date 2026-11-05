// 시험용 작은 웹 서버(모듈 스크립트는 file:// 에서 안 열림)
const http = require('http'), fs = require('fs'), path = require('path');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
module.exports = function serve(root, port = 0) {
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      const u = decodeURIComponent(q.url.split('?')[0].split('#')[0]);
      const f = path.join(root, u === '/' ? 'index.html' : u);
      if (!f.startsWith(root)) { r.writeHead(403); return r.end(); }
      fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end('no'); } r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); r.end(b); });
    });
    s.listen(port, '127.0.0.1', () => res({ url: 'http://127.0.0.1:' + s.address().port + '/', close: () => s.close() }));
  });
};
