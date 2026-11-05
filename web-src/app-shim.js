/*
 * 박스웍스 안드로이드 앱 연결부.
 * 웹 박스웍스는 claude.ai 안에서 window.claude 기능(계정 저장소, AI, 파일 받기)을 씁니다.
 * 앱에서는 그 자리를 휴대폰 기능으로 채웁니다.
 *  - 저장소(db)·계정(user): 주지 않음 → 박스웍스가 휴대폰 안 저장(localStorage)으로 동작
 *  - AI(sample): 주지 않음 → 규칙 해석만 사용 (D-02, D-04)
 *  - 파일 받기(downloads): 휴대폰에 파일을 만들고 공유 창을 열어 저장할 곳을 고르게 함
 */
(function () {
  var cap = window.Capacitor;
  if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return;
  window.BX_APP = true;
  document.documentElement.classList.add('bx-app');

  // 앱에서는 쓰지 않는 웹 전용 메뉴를 숨김: 위젯 모드(PC 바탕화면용)와 그 설명
  // 모양 규칙은 web-src/app.css로 옮김(시험판 54 덧칠 정리)

  function plugin(name) {
    return (cap.Plugins && cap.Plugins[name]) || null;
  }

  function toBase64(text) {
    var bytes = new TextEncoder().encode(String(text));
    var bin = '';
    for (var i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin);
  }

  function fail(code, message) {
    return Object.assign(new Error(message || code), { code: code });
  }

  var downloads = {
    save: async function (o) {
      var fs = plugin('Filesystem');
      var share = plugin('Share');
      if (!fs || !share) throw fail('unavailable');
      var file = await fs.writeFile({
        path: String(o.filename || 'boxworks.txt'),
        data: toBase64(o.data),
        directory: 'CACHE'
      });
      try {
        await share.share({ title: o.filename, files: [file.uri], dialogTitle: '파일 저장할 곳 고르기' });
      } catch (e) {
        throw fail('declined', e && e.message);
      }
    }
  };

  // 휴대폰 뒤로 버튼. 박스웍스 안에서 되돌아갈 곳이 있으면 거기로 가고,
  // 오늘 화면에서 누르면 앱을 끄지 않고 뒤로 보냄(안드로이드 12 이후 기본 동작과 같음)
  var app = plugin('App');
  if (app && app.addListener) {
    app.addListener('backButton', function () {
      var handled = false;
      try { handled = typeof window.BX_back === 'function' && window.BX_back(); } catch (e) {}
      if (!handled && app.minimizeApp) app.minimizeApp();
    });
  }

  // 휴대폰 알람(2단계). 박스웍스가 계산한 앞으로 14일의 알람 목록을 휴대폰에 예약한다(끝나기 전날 '알람이 곧 끝나요').
  // 목록이 바뀐 때만 다시 예약하고, 알림 권한은 알람이 처음 생길 때 한 번만 묻는다(D-01).
  var alarm = plugin('BxAlarm');
  var memo = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  if (alarm) {
    var lastSig = null, lastWidget = null, timer = null, checked = false;
    var syncAlarms = async function () {
      if (typeof window.BX_alarmPlan !== 'function') return;
      var list = window.BX_alarmPlan(14);
      if (!list) return;
      var real = list.filter(function (a) { return a.kind !== 'report' && a.id !== 'bx_renew'; }).length;
      if ((real > 0) !== (permCount > 0)) { permCount = real; permCheck(); } else permCount = real;
      // 홈 화면 위젯(4안-6): 앞으로의 일정과 알람 시각을 넘긴다(아침 보고는 알람이 아니라 뺀다)
      var widget = plugin('BxWidget');
      if (widget && typeof window.BX_widgetData === 'function') {
        var wd = window.BX_widgetData(list.filter(function (a) { return a.kind !== 'report' && a.id !== 'bx_renew'; }));
        var wsig = wd ? JSON.stringify({ i: wd.items, r: wd.routines, l: wd.late, li: wd.lateI, o: wd.only, h: wd.h24 }) : null;
        if (wd && wsig !== lastWidget) { lastWidget = wsig; widget.update({ data: wd }).catch(function () { lastWidget = null; }); }
      }
      // 잠금 화면에 보여 줄 것(설정): alarm(기본) | title | none
      var lock = typeof window.BX_lockMode === 'function' ? window.BX_lockMode() : 'alarm';
      // 시각 표시(시험판 58): 잠금 화면 알람 · 루틴 진행 알림도 앱과 같은 표시로
      var h24 = typeof window.BX_clock24 === 'function' && !!window.BX_clock24();
      var sig = lock + (h24 ? '|24|' : '|12|') + JSON.stringify(list);
      if (sig === lastSig) return;
      lastSig = sig;
      try { await alarm.sync({ alarms: list, lock: lock, h24: h24 }); } catch (e) { lastSig = null; }
      // 처음 알람이 생길 때 알람 허락 화면(전체 흐름 와이어프레임 6). 빠진 허락이 있을 때 한 번만
      // 아침 보고만 있을 때는 묻지 않는다(사용자가 만든 첫 알람이 생길 때)
      if (!checked && list.some(function (a) { return a.kind !== 'report' && a.id !== 'bx_renew'; })) { checked = true; permFirst(list); }
    };
    // 알람 허락 화면이 쓰는 휴대폰 쪽 함수(web-src/start.js의 bxPermOpen)
    window.BX_perm = {
      status: function () { return alarm.status(); },
      notifications: function () { return alarm.requestNotifications(); },
      open: function (which) { return alarm.openSettings({ which: which }); },
      test: function () { return alarm.test({ seconds: 10 }); }
    };
    // 알림이나 정확한 알람이 꺼져 있으면 홈 맨 위에 빨간 줄(문제점 점검 기술 9). 앱을 열 때·돌아올 때·알람이 처음 생길 때 확인.
    // 시험판 34: 배터리가 '제한'이거나, 삼성인데 '제한 없음'이 아니면(절전 앱·깊은 절전 앱에 들어갈 수 있음) 그것도(대표 지적 11/3)
    var permCount = 0;
    var permCheck = function () {
      Promise.resolve(alarm.status()).then(function (st) {
        var bad = permCount > 0 && st ? (!st.notifications ? 'notifications' : !st.exact ? 'exact' : st.restricted ? 'restricted' : (st.maker === 'samsung' && !st.battery) ? 'battery' : '') : '';
        var el = document.getElementById('bx-permbar');
        if (!bad) { if (el) el.remove(); return; }
        if (!el) {
          var host = document.getElementById('banner');
          if (!host || !host.parentNode) return;
          el = document.createElement('div');
          el.id = 'bx-permbar';
          el.setAttribute('role', 'alert');
          host.parentNode.insertBefore(el, host.nextSibling);
        }
        el.setAttribute('data-which', bad);
        var msg = { notifications: '알림이 꺼져 있어 알람이 울리지 않아요', exact: '정확한 알람이 꺼져 있어 알람이 늦을 수 있어요',
          restricted: '배터리가 ‘제한’이라 알람이 울리지 않을 수 있어요. 앱 정보 › 배터리 › ‘제한 없음’',
          battery: '삼성 절전 때문에 알람이 늦거나 안 울릴 수 있어요. 앱 정보 › 배터리 › ‘제한 없음’' }[bad];
        el.innerHTML = '<span>' + msg + '</span><button type="button" class="btn sm" data-act="bx-perm-fix">' + (bad === 'battery' || bad === 'restricted' ? '설정 열기' : '켜기') + '</button>';
      }).catch(function () {});
    };
    window.BX_permCheck = permCheck;
    document.addEventListener('click', function (ev) {
      var b = ev.target && ev.target.closest && ev.target.closest('[data-act="bx-perm-fix"]');
      if (!b) return;
      ev.preventDefault();
      ev.stopPropagation();
      var bar = document.getElementById('bx-permbar'), which = bar ? bar.getAttribute('data-which') : 'notifications';
      var go = which === 'notifications'
        ? Promise.resolve(alarm.requestNotifications()).then(function (st) { if (!st || !st.notifications) return alarm.openSettings({ which: 'notifications' }); permCheck(); })
        : Promise.resolve(alarm.openSettings({ which: which === 'restricted' ? 'battery' : which }));
      go.catch(function () {});
    }, true);
    var permFirst = async function (list) {
      try {
        if (memo.get('bx:permShown') === '1' || typeof window.BX_permOpen !== 'function') return;
        var st = await alarm.status();
        // 삼성은 절전에서 빼기도 꼭 할 일(시험판 34)
        if (st.notifications && st.exact && st.fullScreen && !(st.maker === 'samsung' && !st.battery)) return;
        memo.set('bx:permShown', '1');
        var first = list.filter(function (a) { return a.kind !== 'report' && a.id !== 'bx_renew'; })[0];
        window.BX_permOpen(first ? first.at : 0, st);
      } catch (e) {}
    };
    var askPermissions = async function (fromTest) {
      try {
        var st = await alarm.status();
        if (!st.notifications && (fromTest || memo.get('bx:askNotif') !== '1')) {
          memo.set('bx:askNotif', '1');
          st = await alarm.requestNotifications();
          if (!st.notifications && fromTest && window.confirm('알림이 꺼져 있어서 알람이 울리지 않아요. 휴대폰 설정에서 ' + window.BX_NAME + ' 알림을 켤까요?')) {
            alarm.openSettings({ which: 'notifications' });
            return false;
          }
        }
        if (st.notifications && !st.exact && (fromTest || memo.get('bx:askExact') !== '1')) {
          memo.set('bx:askExact', '1');
          if (window.confirm('알람이 정확한 시각에 울리려면 다음 화면에서 ' + window.BX_NAME + ' 앱을 허용해 주세요.')) alarm.openSettings({ which: 'exact' });
        }
        if (st.notifications && !st.fullScreen && (fromTest || memo.get('bx:askFull') !== '1')) {
          memo.set('bx:askFull', '1');
          if (window.confirm('잠금 화면에서도 알람을 크게 띄우려면 다음 화면에서 ' + window.BX_NAME + ' 앱을 허용해 주세요.')) alarm.openSettings({ which: 'fullscreen' });
        }
        return !!st.notifications;
      } catch (e) {
        return false;
      }
    };
    window.BX_afterRender = function () {
      clearTimeout(timer);
      timer = setTimeout(syncAlarms, 700);
    };
    // 앱 안에서 루틴 단계를 처리하면, 휴대폰을 쓰는 중 울리던 알람 소리도 멈춘다(시험판 32, 휴대폰 쪽 AlarmRingService)
    document.addEventListener('click', function (ev) {
      var b = ev.target && ev.target.closest && ev.target.closest('[data-act="rt-ok"],[data-act="rt-done"],[data-act="rt-skip"],[data-act="bx-rt-alldone"]');
      if (b && alarm.ringOff) alarm.ringOff().catch(function () {});
    }, true);
    // 휴대폰 알람에서 '확인'한 루틴 단계를 앱에 '했어요'로 옮긴다(켤 때·돌아올 때)
    var pullConfirmed = function () {
      if (!alarm.confirmed) return;
      alarm.confirmed().then(function (r) { if (r && r.done && window.BX_applyConfirmed) window.BX_applyConfirmed(r.done); }).catch(function () {});
    };
    setTimeout(pullConfirmed, 1500);
    var app2 = plugin('App');
    if (app2 && app2.addListener) app2.addListener('resume', function () { if (window.BX_permRefresh) window.BX_permRefresh(); permCheck(); lastSig = null; pullConfirmed(); window.BX_afterRender(); if (window.BX_pcRefresh) window.BX_pcRefresh(true); });
    // 설정 > 알림 > 휴대폰 알람 시험
    document.addEventListener('click', async function (ev) {
      var b = ev.target && ev.target.closest && ev.target.closest('[data-act="bx-alarm-test"]');
      if (!b) return;
      ev.preventDefault();
      ev.stopPropagation();
      try {
        var st0 = await alarm.status();
        if (!(st0.notifications && st0.exact && st0.fullScreen) && typeof window.BX_permOpen === 'function') { window.BX_permOpen(0, st0); return; }
      } catch (e0) {}
      var ok = await askPermissions(true);
      if (!ok) return;
      try {
        await alarm.test({ seconds: 10 });
        if (window.BX_toast) window.BX_toast('10초 뒤 알람이 울려요. 화면을 끄고 기다려 보세요.');
      } catch (e) {
        if (window.BX_toast) window.BX_toast('시험 알람을 예약하지 못했어요.');
      }
    }, true);
  }

  // 위젯의 말하기 단추로 앱이 열리면: 새 일정 창을 열고 바로 마이크를 켠다
  var widgetPl = plugin('BxWidget');
  if (widgetPl) {
    // 홈 화면에 놓인 위젯 수(위젯 두기 제안을 보일지 정함, web-src/flow.js)
    var placedRefresh = function () {
      if (!widgetPl.placed) return;
      widgetPl.placed().then(function (r) { var prev = JSON.stringify(window.BX_WPLACED || null); window.BX_WPLACED = r; if (JSON.stringify(r) !== prev && window.BX_afterRender) { try { window.BX_rerender && window.BX_rerender(); } catch (e) {} } }).catch(function () {});
    };
    setTimeout(placedRefresh, 1200);
    var app3 = plugin('App');
    if (app3 && app3.addListener) app3.addListener('resume', placedRefresh);
    window.BX_widgetPin = function (which) { return widgetPl.pin({ which: which || 'now' }); };
    // 시험판 48(대표 11/4 14:07): 위젯 단추로 들어오면 보던 화면(캘린더 등) 위가 아니라 먼저 홈 화면으로 간다.
    // 넣고 나서 잘 들어갔는지 홈에서 바로 보이게. 위젯이 다른 날을 보고 있었으면 홈도 그날(web-src/v48.js BX_goHome)
    var toHome = function (ds) { if (typeof window.BX_goHome === 'function') window.BX_goHome(ds); };
    var speakNow = function (r) {
      toHome(r && r.ds);
      // 위젯이 다른 날을 보고 있었으면 그 날짜로(시험판 36, ‹ ›)
      if (r && r.ds && typeof window.BX_newOn === 'function') { setTimeout(function () { window.BX_newOn(r.ds, true); }, 300); return; }
      setTimeout(function () {
        var add = document.querySelector('.bx-fab');
        if (!add) return;
        add.click();
        setTimeout(function () { var m = document.querySelector('[data-act="bx-mic"][data-for="f-title"]'); if (m) m.click(); }, 350);
      }, 300);
    };
    // 위젯 '일정 추가'(시험판 36, 대표 요청 11/3: 일정 추가와 마이크를 따로): 새 일정 창만 연다(글자로 넣기)
    var addNow = function (r) {
      toHome(r && r.ds);
      if (r && r.ds && typeof window.BX_newOn === 'function') { setTimeout(function () { window.BX_newOn(r.ds, false); }, 300); return; }
      setTimeout(function () { var add = document.querySelector('.bx-fab'); if (add) add.click(); }, 300);
    };
    // 위젯의 줄을 누르면: 일정은 고치기 창, 루틴 · 시간표는 그 화면(web-src/v36.js BX_openFromWidget)
    var openRow = function (o) {
      if (o && o.k === 'item') toHome(o.ds);
      setTimeout(function () { if (o && typeof window.BX_openFromWidget === 'function') window.BX_openFromWidget(o); }, 300);
    };
    // 위젯 ✎ 메모(시험판 41, 대표 요청 11/3 23:38): 메모 화면 + 맨 위 칸에 커서(web-src/v41.js BX_memoQuick)
    var memoNow = function () {
      toHome();
      setTimeout(function () { if (typeof window.BX_memoQuick === 'function') window.BX_memoQuick(); }, 300);
    };
    // 누르지 않은 칸에 커서만 두면 키보드가 안 뜰 때가 있어 휴대폰 쪽에서 올린다(BxWidgetPlugin.keyboard)
    window.BX_keyboard = function () { if (widgetPl.keyboard) widgetPl.keyboard().catch(function () {}); };
    if (widgetPl.addListener) {
      widgetPl.addListener('speak', speakNow);
      widgetPl.addListener('add', addNow);
      widgetPl.addListener('open', openRow);
      widgetPl.addListener('memo', memoNow);
      // '앱 열기' · 위젯 누르기(시험판 48): 홈 화면으로
      widgetPl.addListener('home', function () { toHome(); });
    }
    if (widgetPl.consumeLaunch) widgetPl.consumeLaunch().then(function (r) {
      if (!r) return;
      if (r.speak) setTimeout(function () { speakNow(r); }, 700);
      else if (r.add) setTimeout(function () { addNow(r); }, 700);
      else if (r.memo) setTimeout(memoNow, 700);
      else if (r.open) setTimeout(function () { openRow(r.open); }, 700);
      else if (r.home) setTimeout(function () { toHome(); }, 700);
    }).catch(function () {});
  }

  // 다른 앱에서 '공유' → 박스웍스 일정으로(시험판 35): 받은 글로 새 일정 창(web-src/flow.js BX_openShared)
  var shareIn = plugin('BxShareIn');
  if (shareIn) {
    var openShared = function (r) { var t = r && r.text ? String(r.text) : ''; if (t && typeof window.BX_openShared === 'function') setTimeout(function () { window.BX_openShared(t); }, 300); };
    if (shareIn.addListener) shareIn.addListener('shared', openShared);
    if (shareIn.consume) setTimeout(function () { shareIn.consume().then(openShared).catch(function () {}); }, 900);
  }

  // 말로 넣기(3단계). 휴대폰 기본 음성 인식으로 받은 글자를 칸에 넣고,
  // 박스웍스가 글자를 칠 때와 똑같이 해석하게 한다(날짜·시각 자동 인식).
  var speech = plugin('BxSpeech');
  // 듣는 동안 화면 아래에 뜨는 막대: 들은 글자가 바로 보이고 '끝'으로 마친다
  var listenLongUi = function (prompt, ex) {
    var bar = document.createElement('div');
    bar.className = 'bx-listen';
    bar.setAttribute('role', 'status');
    bar.innerHTML = '<div class="bx-ls-top"><i class="bx-ls-dot"></i><b>듣는 중</b><span class="bx-ls-hint">말을 3초쯤 멈추면 끝나요</span></div><p class="bx-ls-text"></p>' +
      // 새 일정: 듣는 동안 예문 두 개(대표 결정 11/2 밤: 말하기를 누르면 설명이 뜨는 창)
      (ex ? '<div class="bx-ls-ex"><span>이렇게 말해 보세요</span>' + String(ex).split('|').slice(0, 2).map(function (x) { return '<b>“' + x.replace(/[<>&]/g, '') + '”</b>'; }).join('') + '</div>' : '') +
      '<button type="button" class="btn primary bx-ls-stop">끝</button>';
    bar.querySelector('.bx-ls-text').textContent = prompt;
    bar.querySelector('.bx-ls-text').classList.add('ph');
    document.body.appendChild(bar);
    var sub = null;
    if (speech.addListener) {
      Promise.resolve(speech.addListener('partial', function (d) {
        var t = bar.querySelector('.bx-ls-text');
        if (d && d.text) { t.textContent = d.text; t.classList.remove('ph'); }
      })).then(function (h) { sub = h; });
    }
    bar.querySelector('.bx-ls-stop').addEventListener('click', function (ev) { ev.stopPropagation(); speech.stop().catch(function () {}); });
    var done = function () { if (sub && sub.remove) sub.remove(); bar.remove(); };
    return speech.listenLong({ prompt: prompt }).then(function (r) { done(); return r; }, function (e) { done(); throw e; });
  };
  if (speech) {
    window.BX_HAS_MIC = true;
    // 음성 인식이 없는 휴대폰: 마이크를 숨기고, 일정 칸을 처음 누를 때 키보드 마이크를 안내한다(D-10 보완 11/2, P-17)
    if (speech.available) {
      Promise.resolve(speech.available()).then(function (r) {
        if (!r || r.available !== false) return;
        window.BX_HAS_MIC = false;
        window.BX_NO_MIC = true;
        if (window.BX_rerender) window.BX_rerender();
      }).catch(function () {});
    }
    document.addEventListener('focusin', function (ev) {
      var t = ev.target;
      if (!window.BX_NO_MIC || !t || !/^(f-title|day-in|tt-in|rt-text|bx-rt-say)$/.test(t.id || '')) return;
      if (memo.get('bx:noMicTold') === '1') return;
      memo.set('bx:noMicTold', '1');
      if (window.BX_toast) window.BX_toast('이 휴대폰에서는 ' + window.BX_NAME + ' 마이크를 쓸 수 없어요. 키보드의 마이크로 말해도 똑같이 정리돼요.');
    }, true);
    document.addEventListener('click', async function (ev) {
      var b = ev.target && ev.target.closest && ev.target.closest('[data-act="bx-mic"]');
      if (!b) return;
      ev.preventDefault();
      ev.stopPropagation();
      if (b.classList.contains('busy')) return;
      var field = document.getElementById(b.getAttribute('data-for'));
      b.classList.add('busy');
      try {
        var r = null;
        if (speech.listenLong) {
          // 앱 안에서 길게 듣기: 말이 잠깐 끊겨도 이어 듣고, '끝'을 누르면 마친다(대표 지적: 입력 시간이 너무 짧음)
          try { r = await listenLongUi(b.getAttribute('data-prompt') || '말해 보세요', b.getAttribute('data-ex')); }
          catch (e2) { if (e2 && (e2.code === 'unavailable' || e2.code === 'denied')) r = null; else throw e2; }
        }
        if (!r) r = await speech.listen({ prompt: b.getAttribute('data-prompt') || '말해 보세요' });
        var text = (r && r.text ? String(r.text) : '').trim();
        field = document.getElementById(b.getAttribute('data-for')) || field;
        if (text && field) {
          field.value = field.value.trim() ? field.value.trim() + ' ' + text : text;
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.focus();
        }
      } catch (e) {
        if (e && e.code === 'unavailable' && window.BX_toast) window.BX_toast('이 휴대폰에서 음성 인식을 쓸 수 없어요. 키보드의 마이크를 써 주세요.');
      } finally {
        b.classList.remove('busy');
      }
    }, true);
  }

  window.claude = {
    use: function (name) {
      return Promise.resolve(name === 'downloads' ? downloads : null);
    }
  };
})();
