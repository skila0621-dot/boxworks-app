// 자동 시험 도구. 앱 화면(www/index.html)을 헤드리스 크롬에서 열고, 휴대폰 쪽 기능(Capacitor 플러그인)은 흉내 낸다.
// 먼저 `node scripts/build-web.mjs`로 www/index.html을 만든 뒤 `node tests/run.cjs`로 돌린다.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
// BX_APP_HTML: 다른 곳에 만든 www/index.html로 열기(덧칠 정리 도구 · 전후 비교)
const APP = process.env.BX_APP_HTML ? path.resolve(process.env.BX_APP_HTML) : path.join(ROOT, 'www', 'index.html');
const APP_URL = pathToFileURL(APP).href;

// 시험에 쓰는 '지금': 2026년 11월 2일 월요일 오전 6시 50분(한국 시각)
const NOW = '2026-11-02T06:50:00+09:00';

const ymdOf = ms => {
  const d = new Date(ms + 9 * 3600e3);
  return d.toISOString().slice(0, 10);
};
const hmOf = ms => new Date(ms + 9 * 3600e3).toISOString().slice(11, 16);

/** 첫 실행을 마친 사용자 설정. mods로 켠 기능을 바꾼다 */
function settings(extra = {}) {
  const old = '2026-10-29T00:00:00.000Z';
  return Object.assign({ type: 'settings', weekStart: 1, onboarded: true, welcomed: true,
    bxStart: { at: old, mods: { report: false, routines: true, tt: true, med: true } }, bxRtHelp: { at: old }, bxTtHelp: { at: old },
    // 시험들은 명상을 아래 메뉴에서 연다(사용자가 아래 메뉴를 고친 휴대폰). 새 기본값(시간 · 행동 관리 + 더보기)은 v35에서 본다
    bxDock: ['med', 'routines', 'month', 'tt'], bxDockMig: 1 }, extra);
}

/**
 * 앱을 연다.
 * now: 시계 · data: [[id, 문서], ...] (처음 한 번만 넣는다) · perms: 알람 권한 상태 · speech: true | false | null(플러그인 없음)
 * sound: 배경 소리 플러그인(BxSound)을 둘지
 */
async function openApp({ now = NOW, data = null, perms = null, speech = true, sound = true, width = 390, height = 844, colorScheme = 'light', insets = null } = {}) {
  if (!fs.existsSync(APP)) throw new Error('www/index.html이 없습니다. 먼저 node scripts/build-web.mjs');
  const browser = await chromium.launch();
  // width · height · colorScheme: 자동 정렬 점검(tests/layout)이 폭 360 · 384 · 412, 라이트 · 다크로 연다
  const ctx = await browser.newContext({ viewport: { width, height }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', colorScheme });
  await ctx.addInitScript(({ data, perms, speech, sound }) => {
    window.__sync = [];
    window.__bg = [];
    window.__perm = perms || { notifications: true, exact: true, fullScreen: true, battery: true };
    const plugins = {
      BxAlarm: {
        sync: async x => { window.__sync.push(x); return {}; },
        status: async () => window.__perm,
        requestNotifications: async () => window.__perm,
        confirmed: async () => ({ done: {} }),
        local: async () => ({}), cancelLocal: async () => ({}), bowl: async () => {}, test: async () => ({}), openSettings: async () => ({})
      },
      // 위젯 단추로 앱이 열리는 것(시험판 36): window.__wl[이름](자료)로 흉내 낸다('speak' · 'add' · 'open' · 'memo')
      // keyboard: 위젯 ✎ 메모로 열 때 키보드 올리기(시험판 41) — 부른 횟수를 window.__kb에
      BxWidget: { update: async x => { window.__wd = x.data; return {}; }, consumeLaunch: async () => ({}), placed: async () => ({ list: 0, now: 0, canPin: true }), pin: async () => ({ asked: true }),
        keyboard: async () => { window.__kb = (window.__kb || 0) + 1; return {}; },
        addListener: (ev, cb) => { (window.__wl = window.__wl || {})[ev] = cb; return { remove() {} }; } },
      // 일정 첨부(시험판 42): 부른 것은 window.__attCalls, 고른 결과는 window.__attNext(차례로 꺼냄), 앱 폴더 파일 목록은 window.__attFiles
      BxAttach: {
        info: async () => ({ base: '/data/user/0/kr.boxworks.app/files', max: 10 }),
        pickImages: async x => { (window.__attCalls = window.__attCalls || []).push(['pickImages', x]); return (window.__attNext || []).shift() || { files: [] }; },
        takePhoto: async x => { (window.__attCalls = window.__attCalls || []).push(['takePhoto', x]); return (window.__attNext || []).shift() || { files: [] }; },
        pickFiles: async x => { (window.__attCalls = window.__attCalls || []).push(['pickFiles', x]); return (window.__attNext || []).shift() || { files: [] }; },
        open: async x => { (window.__attCalls = window.__attCalls || []).push(['open', x]); return {}; },
        list: async () => ({ files: window.__attFiles || [] }),
        remove: async x => { (window.__attCalls = window.__attCalls || []).push(['remove', x]); return { removed: ((x && x.paths) || []).length }; },
        zip: async x => { (window.__attCalls = window.__attCalls || []).push(['zip', x]); return { uri: 'file:///cache/' + x.name, size: 1000, files: x.files.length }; }
      }
    };
    // 배경 소리(시험판 33): 부른 것을 window.__bg에 남기고, 휴대폰이 알려 주는 'state'는 window.__bgL로 흉내 낸다
    if (sound) {
      const off = { playing: false, sound: '', mode: '', until: 0 };
      plugins.BxSound = {
        st: off,
        play: async x => { window.__bg.push(['play', x]); plugins.BxSound.st = { playing: true, sound: x.sound, mode: x.mode, until: x.until || 0 }; return plugins.BxSound.st; },
        preview: async x => { window.__bg.push(['preview', x]); return {}; },
        stop: async () => { window.__bg.push(['stop']); plugins.BxSound.st = off; return {}; },
        status: async () => plugins.BxSound.st,
        addListener: (ev, cb) => { if (ev === 'state') window.__bgL = cb; (window.__bgLs = window.__bgLs || {})[ev] = cb; return { remove() {} }; },
        // 시험판 48: 명상 알림('명상 중 · 남은 시간 · 명상 끝내기'). 부른 것을 window.__mo에
        medOngoing: async x => { (window.__mo = window.__mo || []).push(x); return {}; }
      };
    }
    if (speech !== null) {
      plugins.BxSpeech = {
        available: async () => ({ available: speech === true }),
        listen: async () => ({ text: '' }), listenLong: async () => ({ text: '' }), stop: async () => ({}),
        addListener: () => ({ remove() {} })
      };
    }
    window.Capacitor = { isNativePlatform: () => true, Plugins: plugins, convertFileSrc: f => String(f).replace('file://', 'https://localhost/_capacitor_file_') };
    // 자료는 이 창에서 처음 열 때 한 번만 넣는다(다시 불러와도 앱이 저장한 것을 그대로 쓰게)
    if (data && !sessionStorage.getItem('__seeded')) {
      localStorage.setItem('bx:data', JSON.stringify(data));
      sessionStorage.setItem('__seeded', '1');
    }
  }, { data, perms, speech, sound });
  const page = await ctx.newPage();
  // insets: 휴대폰 위 · 아래 막대 자리(env(safe-area-inset-*)). 대표 휴대폰은 아래에 버튼 세 개 막대가 있다
  if (insets) { const c = await ctx.newCDPSession(page); await c.send('Emulation.setSafeAreaInsetsOverride', { insets: Object.assign({ top: 0, bottom: 0, left: 0, right: 0 }, insets) }); }
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.clock.setSystemTime(new Date(now));
  await page.goto(APP_URL);
  await ready(page);
  return { browser, page, errors, close: () => browser.close() };
}

/** 앱이 다 뜰 때까지 기다린다(느린 CI에서도 같은 결과가 나오게) */
async function ready(page) {
  await page.waitForFunction(() => window.BX_T && typeof window.BX_alarmPlan === 'function' && (document.querySelector('.dock') || document.getElementById('bx-start')), null, { timeout: 20000 });
  await page.waitForTimeout(500);
}

/** 간단한 확인 도구: 실패를 모아 두었다가 끝에 한꺼번에 알린다 */
function checker(name) {
  const fails = [];
  let n = 0;
  const ok = (cond, msg) => { n++; if (!cond) fails.push(msg); };
  const eq = (got, want, msg) => ok(JSON.stringify(got) === JSON.stringify(want), msg + ' — 기대 ' + JSON.stringify(want) + ', 실제 ' + JSON.stringify(got));
  const done = () => ({ name, n, fails });
  return { ok, eq, done };
}

module.exports = { ROOT, NOW, openApp, ready, settings, checker, ymdOf, hmOf };
