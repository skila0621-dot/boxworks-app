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
    '.bx-app section[aria-labelledby="s-report"]{display:none!important}',
    // 말로 넣기 마이크 버튼
    '.bx-app .bx-inrow{display:flex;align-items:center;gap:8px}',
    '.bx-app .bx-inrow > input{flex:1;min-width:0}',
    '.bx-app .bx-mic{flex:none;width:44px;height:44px;border-radius:22px;border:0;background:var(--accent);color:var(--accent-ink);display:inline-flex;align-items:center;justify-content:center;cursor:pointer}',
    '.bx-app .bx-mic.busy{opacity:.55}',
    '.bx-app .rt-make-a{justify-content:space-between}',
    // 시간표(D-06)
    '.bx-app .tt-mode{display:flex;justify-content:center;margin:6px 0 14px}',
    '.bx-app .page-head .sec-link.add{align-self:center}',
    '.bx-app .tt-add{margin:2px 0 12px}',
    '.bx-app .tt-add .inp{height:46px}',
    '.bx-app .tt-add .btn{flex:none;height:44px}',
    '.bx-app .tt-empty{margin:0 0 12px}',
    '.bx-app .tt-wrap{margin:0 -4px}',
    '.bx-app .tt-grid,.bx-app .tt-body{display:grid;grid-template-columns:26px repeat(var(--n),minmax(0,1fr))}',
    '.bx-app .tt-h{height:30px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--ink-3)}',
    '.bx-app .tt-h.today{color:var(--accent)}.bx-app .tt-h.sun{color:var(--sun)}.bx-app .tt-h.sat{color:var(--sat)}',
    '.bx-app .tt-body{position:relative;border-top:1px solid var(--line)}',
    '.bx-app .tt-lines{position:absolute;inset:0;pointer-events:none}',
    '.bx-app .tt-line{position:absolute;left:0;right:0;border-top:1px solid var(--line)}',
    '.bx-app .tt-line span{position:absolute;left:0;top:-7px;width:22px;text-align:right;font-size:10.5px;color:var(--ink-3);background:var(--bg);font-variant-numeric:tabular-nums}',
    '.bx-app .tt-col{position:relative;border-left:1px solid var(--line)}',
    '.bx-app .tt-col.today{background:color-mix(in srgb,var(--accent) 6%,transparent)}',
    '.bx-app .tt-b{position:absolute;left:2px;right:2px;display:flex;flex-direction:column;align-items:flex-start;gap:1px;padding:3px 3px 3px 4px;border:0;border-left:3px solid var(--c);border-radius:6px;background:color-mix(in srgb,var(--c) 17%,var(--bg));color:var(--ink);text-align:left;overflow:hidden;font-family:inherit;cursor:pointer}',
    '.bx-app .tt-b b{font-size:11.5px;font-weight:700;line-height:1.25;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;word-break:keep-all;overflow-wrap:anywhere}',
    '.bx-app .tt-b small{font-size:10px;color:var(--ink-2);line-height:1.2;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;max-width:100%}',
    '.bx-app .tt-now{position:absolute;left:-1px;right:0;height:2px;background:var(--accent);z-index:1}',
    '.bx-app .tt-card{margin-top:14px}',
    '.bx-app .tt-row{align-items:center}',
    '.bx-app .tt-dot{flex:none;width:12px;height:12px;border-radius:6px;background:var(--c);margin:0 10px 0 9px}',
    '.bx-app .tt-form{display:flex;flex-direction:column;gap:8px}',
    '.bx-app .tt-l{font-size:13px;font-weight:700;color:var(--ink-2);margin-top:6px}',
    '.bx-app .tt-days{display:flex;gap:6px}',
    '.bx-app .tt-dbtn,.bx-app .tt-pill{display:flex;align-items:center;justify-content:center;text-align:center;padding:0;flex:1;min-width:0;height:42px;border-radius:12px;border:1.5px solid var(--line);background:var(--bg);font:inherit;font-weight:700;color:var(--ink)}',
    '.bx-app .tt-pills{display:flex;gap:6px}.bx-app .tt-pill{font-size:13px;font-weight:600}',
    '.bx-app .tt-pill[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}',
    '.bx-app .tt-sub{display:flex;align-items:center;justify-content:space-between;margin:-4px 0 12px}',
    '.bx-app .tt-dbtn.sun{color:var(--sun)}.bx-app .tt-dbtn.sat{color:var(--sat)}',
    '.bx-app .tt-dbtn[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}',
    '.bx-app .tt-times{display:flex;align-items:center;gap:8px}.bx-app .tt-times .inp{flex:1;min-width:0}',
    '.bx-app .tt-sws{display:flex;gap:12px;padding:4px 2px}',
    '.bx-app .tt-sw{width:32px;height:32px;border-radius:16px;border:0;background:var(--c)}',
    '.bx-app .tt-sw[aria-pressed="true"]{box-shadow:0 0 0 3px var(--bg),0 0 0 5px var(--c)}',
    '.bx-app .tt-hint{color:var(--warn-ink);margin:0}',
    // 출발 시각 계산·준비 루틴(4단계): 새 일정 창의 '출발' 칸과 일정 줄의 출발 시각
    '.bx-app .tv-cus{display:flex;align-items:center;gap:8px;margin-top:10px}',
    '.bx-app .tv-mem{margin:8px 0 0;color:var(--accent)}',
    '.bx-app .tv-h{margin-top:18px}.bx-app .tv-h small{font-weight:500;color:var(--ink-3);margin-left:4px}',
    '.bx-app .tv-line{list-style:none;margin:16px 0 8px;padding:0}',
    '.bx-app .tv-line li{display:flex;align-items:center;gap:12px;min-height:36px;position:relative;padding-left:20px}',
    '.bx-app .tv-line li::before{content:"";position:absolute;left:3px;top:50%;width:9px;height:9px;margin-top:-5px;border-radius:50%;background:var(--line-2)}',
    '.bx-app .tv-line li::after{content:"";position:absolute;left:7px;top:calc(50% + 6px);height:calc(100% - 12px);width:1px;background:var(--line-2)}',
    '.bx-app .tv-line li:last-child::after{display:none}',
    '.bx-app .tv-line li.go::before{background:var(--accent)}.bx-app .tv-line li.arr::before{background:var(--ink)}',
    '.bx-app .tv-line b{min-width:46px;font-size:15px}.bx-app .tv-line span{flex:1;min-width:0;font-size:15px}',
    '.bx-app .tv-line small{margin-left:6px;color:var(--ink-3);font-size:13px}',
    '.bx-app .tv-line li.go span{font-weight:700;color:var(--accent)}.bx-app .tv-line li.wait span{color:var(--ink-3)}',
    '.bx-app .tv-line .i{width:16px;height:16px;color:var(--ink-3)}',
    '.bx-app .meta.bx-go{color:var(--accent);font-weight:700}.bx-app .meta.bx-go .i{width:14px;height:14px}',
    // 휴대폰 캘린더(D-05): 설정 칸, 캘린더 고르기, 일정 창
    '.bx-app .pc-set-note{margin:2px 0 10px;color:var(--ink-3)}',
    '.bx-app .pc-cals{display:flex;flex-direction:column;gap:6px;margin:6px 0 10px}',
    '.bx-app .pc-calb{display:flex;align-items:center;gap:10px;min-height:48px;padding:6px 12px;border-radius:12px;background:var(--sunk);border:0;color:var(--ink);text-align:left;font-size:15px}',
    '.bx-app .pc-calb span{flex:1;min-width:0;display:flex;flex-direction:column}.bx-app .pc-calb small{color:var(--ink-3);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.bx-app .pc-calb .i{width:18px;height:18px;color:var(--accent);opacity:0}.bx-app .pc-calb[aria-pressed="true"] .i{opacity:1}',
    '.bx-app .pc-calb[aria-pressed="false"]{color:var(--ink-3)}',
    '.bx-app .pc-cal-name{display:flex;align-items:center;gap:8px;color:var(--ink-2);font-size:14px;font-weight:700}',
    '.bx-app .pc-title{font-size:22px;margin:8px 0 4px;line-height:1.3}.bx-app .pc-when{margin:0;color:var(--ink-2);font-size:16px}',
    '.bx-app .pc-loc{display:flex;align-items:center;gap:6px;margin:8px 0 0;color:var(--ink-2)}.bx-app .pc-loc .i{width:16px;height:16px}',
    '.bx-app .pc-note{margin:10px 0 0;padding:10px 12px;border-radius:12px;background:var(--sunk);color:var(--ink-2);white-space:pre-wrap;font-size:14px}',
    '.bx-app .pc-ro{margin-top:14px;color:var(--ink-3)}',
    // AI 정리(Claude 연동 필요)는 앱에서 숨김(D-04). 사용 설명서의 Claude 연동 장은 숨김
    '.bx-app [data-act="ai-capture"],.bx-app #g-ai,.bx-app #g-share,.bx-app #g-start,.bx-app #g-report,.bx-app [data-to="g-ai"],.bx-app [data-to="g-share"],.bx-app [data-to="g-report"]{display:none!important}'
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
    if (app2 && app2.addListener) app2.addListener('resume', function () { lastSig = null; window.BX_afterRender(); if (window.BX_pcRefresh) window.BX_pcRefresh(true); });
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

  // 말로 넣기(3단계). 휴대폰 기본 음성 인식으로 받은 글자를 칸에 넣고,
  // 박스웍스가 글자를 칠 때와 똑같이 해석하게 한다(날짜·시각 자동 인식).
  var speech = plugin('BxSpeech');
  if (speech) {
    window.BX_HAS_MIC = true;
    document.addEventListener('click', async function (ev) {
      var b = ev.target && ev.target.closest && ev.target.closest('[data-act="bx-mic"]');
      if (!b) return;
      ev.preventDefault();
      ev.stopPropagation();
      if (b.classList.contains('busy')) return;
      var field = document.getElementById(b.getAttribute('data-for'));
      b.classList.add('busy');
      try {
        var r = await speech.listen({ prompt: b.getAttribute('data-prompt') || '말해 보세요' });
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
