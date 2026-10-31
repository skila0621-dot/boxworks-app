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
