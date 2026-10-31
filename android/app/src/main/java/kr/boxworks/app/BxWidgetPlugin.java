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
 * 위젯의 말하기 단추로 앱이 열리면 'speak' 알림을 보내고, 처음 켜질 때는 consumeLaunch()로 알려 준다.
 */
@CapacitorPlugin(name = "BxWidget")
public class BxWidgetPlugin extends Plugin {
    private boolean pendingSpeak = false;

    @Override
    public void load() {
        Intent i = getActivity() == null ? null : getActivity().getIntent();
        if (i != null && BxWidgetProvider.ACTION_SPEAK.equals(i.getAction())) {
            pendingSpeak = true;
            i.setAction(Intent.ACTION_MAIN);
        }
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        if (intent != null && BxWidgetProvider.ACTION_SPEAK.equals(intent.getAction())) {
            intent.setAction(Intent.ACTION_MAIN);
            notifyListeners("speak", new JSObject(), true);
        }
    }

    @PluginMethod
    public void consumeLaunch(PluginCall call) {
        JSObject r = new JSObject();
        r.put("speak", pendingSpeak);
        pendingSpeak = false;
        call.resolve(r);
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
        BxWidgetProvider.save(getContext(), d.toString());
        call.resolve();
    }
}
