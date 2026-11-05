package kr.boxworks.app;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * 홈 화면 위젯과 박스웍스 화면을 잇는 연결부. 웹에서는 Capacitor.Plugins.BxWidget.
 * update(data): 위젯에 보여 줄 앞으로의 일정·알람 시각을 넘긴다.
 * 위젯 단추로 앱이 열리면 알림을 보낸다: 'speak'(말하기) · 'add'(일정 추가, 시험판 36) · 'open'(줄 누르기 {k, id, ds}, 시험판 36)
 * · 'memo'(✎ 메모, 시험판 41) · 'home'(앱 열기 · 위젯 누르기 → 홈 화면, 시험판 48).
 * 앱이 꺼져 있다가 열렸으면 consumeLaunch()로 알려 준다.
 */
@CapacitorPlugin(name = "BxWidget")
public class BxWidgetPlugin extends Plugin {
    private boolean pendingSpeak = false;
    private boolean pendingAdd = false;
    private boolean pendingMemo = false;
    private boolean pendingHome = false;
    private String pendingDs = null;
    private JSObject pendingOpen = null;

    @Override
    public void load() {
        take(getActivity() == null ? null : getActivity().getIntent(), false);
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        take(intent, true);
    }

    /** 위젯에서 온 인텐트면 알리고(live) 아니면 남겨 둔다. 한 번 읽은 인텐트는 보통 열기로 바꿔 다시 읽지 않게 */
    private void take(Intent i, boolean live) {
        if (i == null || i.getAction() == null) return;
        String a = i.getAction();
        // 새 일정 · 말하기는 위젯이 보고 있던 날짜(ds)로 연다(시험판 36, ‹ ›로 넘긴 날)
        String ds = i.getStringExtra("ds");
        if (BxWidgetProvider.ACTION_SPEAK.equals(a)) {
            JSObject o = new JSObject();
            if (ds != null) o.put("ds", ds);
            if (live) notifyListeners("speak", o, true);
            else { pendingSpeak = true; pendingDs = ds; }
        } else if (BxWidgetProvider.ACTION_ADD.equals(a)) {
            JSObject o = new JSObject();
            if (ds != null) o.put("ds", ds);
            if (live) notifyListeners("add", o, true);
            else { pendingAdd = true; pendingDs = ds; }
        } else if (BxWidgetProvider.ACTION_MEMO.equals(a)) {
            // ✎ 메모(시험판 41, 대표 요청 11/3 23:38): 메모 화면 + 맨 위 칸에 커서
            if (live) notifyListeners("memo", new JSObject(), true);
            else pendingMemo = true;
        } else if (BxWidgetProvider.ACTION_HOME.equals(a)) {
            // 시험판 48: 위젯을 눌러 열면 홈 화면으로
            if (live) notifyListeners("home", new JSObject(), true);
            else pendingHome = true;
        } else if (BxWidgetProvider.ACTION_OPEN.equals(a)) {
            JSObject o = new JSObject();
            o.put("k", i.getStringExtra("k"));
            o.put("id", i.getStringExtra("id"));
            o.put("ds", i.getStringExtra("ds"));
            if (live) notifyListeners("open", o, true);
            else pendingOpen = o;
        } else {
            return;
        }
        i.setAction(Intent.ACTION_MAIN);
    }

    @PluginMethod
    public void consumeLaunch(PluginCall call) {
        JSObject r = new JSObject();
        r.put("speak", pendingSpeak);
        r.put("add", pendingAdd);
        r.put("memo", pendingMemo);
        r.put("home", pendingHome);
        if (pendingDs != null) r.put("ds", pendingDs);
        if (pendingOpen != null) r.put("open", pendingOpen);
        pendingSpeak = false;
        pendingAdd = false;
        pendingMemo = false;
        pendingHome = false;
        pendingDs = null;
        pendingOpen = null;
        call.resolve(r);
    }

    /**
     * 키보드 올리기(시험판 41): 위젯 ✎로 메모 화면을 열면 웹에서 맨 위 칸에 커서를 둔 뒤 부른다.
     * 사람이 누르지 않은 칸은 커서만 가고 키보드가 안 뜰 때가 있어서 휴대폰 쪽에서 띄운다
     */
    @PluginMethod
    public void keyboard(PluginCall call) {
        final android.app.Activity act = getActivity();
        if (act == null || getBridge() == null || getBridge().getWebView() == null) {
            call.resolve();
            return;
        }
        act.runOnUiThread(() -> {
            try {
                android.webkit.WebView wv = getBridge().getWebView();
                wv.requestFocus();
                if (android.os.Build.VERSION.SDK_INT >= 30 && wv.getWindowInsetsController() != null) {
                    wv.getWindowInsetsController().show(android.view.WindowInsets.Type.ime());
                }
                android.view.inputmethod.InputMethodManager imm = (android.view.inputmethod.InputMethodManager) act.getSystemService(android.content.Context.INPUT_METHOD_SERVICE);
                if (imm != null) imm.showSoftInput(wv, 0);
            } catch (Exception ignored) {
            }
            call.resolve();
        });
    }

    /** 홈 화면에 놓인 위젯 수(list: 4×2 오늘 일정, now: 2×2 지금 단계)와 앱에서 바로 놓기를 할 수 있는지 */
    @PluginMethod
    public void placed(PluginCall call) {
        android.content.Context c = getContext();
        android.appwidget.AppWidgetManager m = android.appwidget.AppWidgetManager.getInstance(c);
        JSObject r = new JSObject();
        r.put("list", m == null ? 0 : m.getAppWidgetIds(new android.content.ComponentName(c, BxWidgetProvider.class)).length);
        r.put("now", m == null ? 0 : m.getAppWidgetIds(new android.content.ComponentName(c, BxNowWidget.class)).length);
        r.put("canPin", m != null && android.os.Build.VERSION.SDK_INT >= 26 && m.isRequestPinAppWidgetSupported());
        call.resolve(r);
    }

    /** 홈 화면에 위젯 놓기(전체 흐름 와이어프레임 17). 휴대폰이 놓을 자리를 묻는 창을 띄운다 */
    @PluginMethod
    public void pin(PluginCall call) {
        android.content.Context c = getContext();
        android.appwidget.AppWidgetManager m = android.appwidget.AppWidgetManager.getInstance(c);
        if (m == null || android.os.Build.VERSION.SDK_INT < 26 || !m.isRequestPinAppWidgetSupported()) {
            call.reject("이 휴대폰은 앱에서 위젯을 바로 놓을 수 없어요", "unavailable");
            return;
        }
        Class<?> k = "list".equals(call.getString("which", "now")) ? BxWidgetProvider.class : BxNowWidget.class;
        boolean ok = m.requestPinAppWidget(new android.content.ComponentName(c, k), null, null);
        JSObject r = new JSObject();
        r.put("asked", ok);
        call.resolve(r);
    }

    @PluginMethod
    public void update(PluginCall call) {
        JSObject d = call.getObject("data");
        if (d == null) {
            call.reject("위젯 자료가 없어요");
            return;
        }
        // 시각 표시(시험판 58): 위젯 자료와 함께 온다(알람 목록보다 먼저 올 수 있어서 여기서도 받는다)
        if (d.has("h24")) BxTime.set(getContext(), d.optBoolean("h24", false));
        BxWidgetProvider.save(getContext(), d.toString());
        call.resolve();
    }
}
