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
  style.textContent = '.bx-app [data-act="widget"],.bx-app #g-widget{display:none!important}';
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

  window.claude = {
    use: function (name) {
      return Promise.resolve(name === 'downloads' ? downloads : null);
    }
  };
})();
