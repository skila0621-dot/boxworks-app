package kr.boxworks.app;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * 카톡 같은 앱에서 '공유' → 박스웍스로 받은 글(시험판 35, 공유의 첫걸음 · 결정 기록 D-12). 서버 없이 휴대폰 안에서만.
 * 웹에서는 Capacitor.Plugins.BxShareIn: consume()(앱이 공유로 처음 열렸을 때) · 'shared' 알림(앱이 이미 열려 있을 때).
 * 받은 글은 새 일정 창의 제목 칸에 넣어 말로 넣기와 같은 해석으로 날짜·시각을 채운다(web-src/flow.js BX_openShared)
 */
@CapacitorPlugin(name = "BxShareIn")
public class BxShareInPlugin extends Plugin {
    private String pending = null;

    private static String textOf(Intent i) {
        if (i == null || !Intent.ACTION_SEND.equals(i.getAction())) return null;
        String type = i.getType();
        if (type != null && !type.startsWith("text/")) return null;
        CharSequence t = i.getCharSequenceExtra(Intent.EXTRA_TEXT);
        String s = t == null ? "" : t.toString().trim();
        String sub = i.getStringExtra(Intent.EXTRA_SUBJECT);
        if (s.isEmpty() && sub != null) s = sub.trim();
        if (s.isEmpty()) return null;
        return s.length() > 4000 ? s.substring(0, 4000) : s;
    }

    @Override
    public void load() {
        Intent i = getActivity() == null ? null : getActivity().getIntent();
        String s = textOf(i);
        if (s != null) {
            pending = s;
            // 다시 그릴 때 같은 글을 또 받지 않게
            i.setAction(Intent.ACTION_MAIN);
        }
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        String s = textOf(intent);
        if (s == null) return;
        intent.setAction(Intent.ACTION_MAIN);
        JSObject o = new JSObject();
        o.put("text", s);
        notifyListeners("shared", o, true);
    }

    @PluginMethod
    public void consume(PluginCall call) {
        JSObject r = new JSObject();
        r.put("text", pending == null ? "" : pending);
        pending = null;
        call.resolve(r);
    }
}
