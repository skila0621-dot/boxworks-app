// 휴대폰에 설치하지 않고 화면만 확인하는 미리보기 페이지(claude.ai 페이지로 올림).
// www/index.html(앱 화면)을 그대로 쓰고, 휴대폰 기능(알람·마이크·캘린더)은 흉내만 낸다.
// 쓰는 법: npm run build:web && node scripts/build-preview.mjs <내보낼 파일>
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || join(root, 'preview.html');
let html = readFileSync(join(root, 'www', 'index.html'), 'utf8');
const shim = readFileSync(join(root, 'web-src', 'app-shim.js'), 'utf8');

const mock = `<script>
/* 미리보기: 휴대폰 앱처럼 보이게 하되 알람·마이크는 실제로 동작하지 않음 */
window.BX_PREVIEW = true;
(function () {
  function ok(v) { return Promise.resolve(v || {}); }
  function say(m) { setTimeout(function () { if (window.BX_toast) window.BX_toast(m); }, 30); }
  window.Capacitor = { isNativePlatform: function () { return true; }, Plugins: {
    App: { addListener: function () { return { remove: function () {} }; }, minimizeApp: ok },
    BxAlarm: {
      sync: function (o) { return ok({ scheduled: (o && o.alarms || []).length }); },
      test: function () { say('미리보기에서는 알람이 울리지 않아요. 설치한 앱에서 시험해 주세요.'); var e = new Error('preview'); e.code = 'preview'; return Promise.reject(e); },
      status: function () { return ok({ notifications: true, exact: true, fullScreen: true, scheduled: 0 }); },
      requestNotifications: function () { return ok({ notifications: 'granted' }); },
      openSettings: ok
    },
    BxSpeech: { listen: function () { say('미리보기에서는 앱 마이크가 동작하지 않아요. 키보드의 마이크를 써 주세요.'); var e = new Error('preview'); e.code = 'cancelled'; return Promise.reject(e); } }
  } };
  try { ['bx:askNotif', 'bx:askExact', 'bx:askFull'].forEach(function (k) { localStorage.setItem(k, '1'); }); } catch (e) {}
  // 알람 시험·마이크 단추는 미리보기 안내만 하고 멈춤(앱 쪽 처리보다 먼저 받음)
  window.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest && ev.target.closest('[data-act="bx-alarm-test"],[data-act="bx-mic"]');
    if (!t) return;
    ev.preventDefault(); ev.stopPropagation();
    say(t.getAttribute('data-act') === 'bx-mic' ? '미리보기에서는 앱 마이크가 동작하지 않아요. 키보드의 마이크를 써 주세요.' : '미리보기에서는 알람이 울리지 않아요. 설치한 앱에서 시험해 주세요.');
  }, true);
})();
</script>`;

// 앱 화면의 문서 틀을 벗기고(페이지 틀은 올릴 때 붙음) 연결부를 안에 넣는다
const bodyStart = html.indexOf('<body>');
const headPart = html.slice(0, bodyStart);
let body = html.slice(bodyStart + 6).replace(/<\/body>\s*<\/html>\s*$/, '');
if (!headPart.includes('<script src="app-shim.js"></script>')) throw new Error('app-shim 자리를 찾지 못했습니다');
const title = '<title>박스웍스 시험판</title>';
body = body.replace('<title>박스웍스 스케줄러</title>', '');
const badge = '<style>.bx-app .brand-t small::after{content:" · 미리보기";color:var(--accent)}</style>';
writeFileSync(out, title + '\n' + mock + '\n<script>\n' + shim + '\n</script>\n' + badge + '\n' + body);
console.log('미리보기 만듦: ' + out + ' (' + Math.round((title.length + mock.length + shim.length + body.length) / 1024) + 'KB)');
