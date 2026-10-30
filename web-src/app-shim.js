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
  var style = document.createElement('style');
  style.textContent = [
    '.bx-app [data-act="widget"],.bx-app #g-widget{display:none!important}',
    // 월간 달력: 웹은 휴대폰 폭에서 점만 보여 주는데, 앱에서는 칸마다 일정 제목을 색 띠로 보여 줌
    '@media (max-width:719px){',
    '.bx-app .cell{min-height:86px;align-items:stretch;padding:4px 1px 6px;gap:2px}',
    '.bx-app .cell .c-top{justify-content:center}',
    '.bx-app .cell .c-num{width:26px;height:26px;font-size:13.5px}',
    '.bx-app .cell .c-dots{display:none}',
    '.bx-app .c-chips{display:flex;flex-direction:column;gap:2px;min-width:0}',
    '.bx-app .c-chip{display:block;min-width:0;font-size:10.5px;font-weight:600;line-height:1.3;padding:1px 2px 1px 3px;border-left:2px solid var(--c);border-radius:3px;background:color-mix(in srgb,var(--c) 14%,transparent);color:var(--ink);text-align:left;overflow:hidden;white-space:nowrap}',
    '.bx-app .c-chip .dot,.bx-app .c-chip .c-t{display:none}',
    '.bx-app .c-chip span{display:block;overflow:hidden;white-space:nowrap;text-overflow:clip}',
    '.bx-app .c-chip.done span{text-decoration:line-through;color:var(--ink-3)}',
    '.bx-app .c-more{font-size:10.5px;font-weight:700;color:var(--ink-3);line-height:1.2;padding-left:3px;text-align:left}',
    '}',
    // Claude가 보내던 아침 일정 보고 설정은 앱에서 쓰지 않음(앱의 아침 보고는 5단계에서 휴대폰이 직접 만듦)
    '.bx-app section[aria-labelledby="s-report"]{display:none!important}'
  ].join('');
  (document.head || document.documentElement).appendChild(style);

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

  // 휴대폰 알람(2단계). 박스웍스가 계산한 앞으로 7일의 알람 목록을 휴대폰에 예약한다.
  // 목록이 바뀐 때만 다시 예약하고, 알림 권한은 알람이 처음 생길 때 한 번만 묻는다(D-01).
  var alarm = plugin('BxAlarm');
  var memo = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  if (alarm) {
    var lastSig = null, timer = null, checked = false;
    var syncAlarms = async function () {
      if (typeof window.BX_alarmPlan !== 'function') return;
      var list = window.BX_alarmPlan(7);
      if (!list) return;
      var sig = JSON.stringify(list);
      if (sig === lastSig) return;
      lastSig = sig;
      try { await alarm.sync({ alarms: list }); } catch (e) { lastSig = null; }
      if (list.length && !checked) { checked = true; askPermissions(false); }
    };
    var askPermissions = async function (fromTest) {
      try {
        var st = await alarm.status();
        if (!st.notifications && (fromTest || memo.get('bx:askNotif') !== '1')) {
          memo.set('bx:askNotif', '1');
          st = await alarm.requestNotifications();
          if (!st.notifications && fromTest && window.confirm('알림이 꺼져 있어서 알람이 울리지 않아요. 휴대폰 설정에서 박스웍스 알림을 켤까요?')) {
            alarm.openSettings({ which: 'notifications' });
            return false;
          }
        }
        if (st.notifications && !st.exact && (fromTest || memo.get('bx:askExact') !== '1')) {
          memo.set('bx:askExact', '1');
          if (window.confirm('알람이 정확한 시각에 울리려면 다음 화면에서 박스웍스를 허용해 주세요.')) alarm.openSettings({ which: 'exact' });
        }
        if (st.notifications && !st.fullScreen && (fromTest || memo.get('bx:askFull') !== '1')) {
          memo.set('bx:askFull', '1');
          if (window.confirm('잠금 화면에서도 알람을 크게 띄우려면 다음 화면에서 박스웍스를 허용해 주세요.')) alarm.openSettings({ which: 'fullscreen' });
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
    var app2 = plugin('App');
    if (app2 && app2.addListener) app2.addListener('resume', function () { lastSig = null; window.BX_afterRender(); });
    // 설정 > 알림 > 휴대폰 알람 시험
    document.addEventListener('click', async function (ev) {
      var b = ev.target && ev.target.closest && ev.target.closest('[data-act="bx-alarm-test"]');
      if (!b) return;
      ev.preventDefault();
      ev.stopPropagation();
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

  window.claude = {
    use: function (name) {
      return Promise.resolve(name === 'downloads' ? downloads : null);
    }
  };
})();
