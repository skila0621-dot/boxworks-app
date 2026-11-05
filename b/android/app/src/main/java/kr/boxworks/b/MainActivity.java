package kr.boxworks.b;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

/**
 * 화면(웹)을 띄우는 곳. 다리(BPlugin)를 등록하고, 다른 앱에서 공유해 들어온 글(SEND text/plain)을 pendingShare로 받아 두며,
 * 앱을 열 때마다 다시 계획해 웹에 'changed'를 알린다.
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BPlugin.class);
        super.onCreate(savedInstanceState);
        BNotify.ensureChannels(this);
        // 화면 끝에서 더 밀 때 화면 전체가 늘어나는 효과를 끈다(A와 같음)
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().setOverScrollMode(android.view.View.OVER_SCROLL_NEVER);
            }
        } catch (Exception ignored) {
        }
    }

    /** 처음 열릴 때(BridgeActivity가 load에서 부른다)와 떠 있을 때 모두 여기로 온다 */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        String s = sharedText(intent);
        if (s == null) return;
        BStore.setPendingShare(getApplicationContext(), s);
        // 화면을 다시 그릴 때 같은 글을 또 받지 않게
        intent.setAction(Intent.ACTION_MAIN);
        BPlugin.emit("shared", null);
    }

    private static String sharedText(Intent i) {
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
    public void onResume() {
        super.onResume();
        final Context c = getApplicationContext();
        // 울리던 알람의 소리는 멈춘다(알림은 대답할 때까지 남는다)
        BRingService.quietFor(c, null);
        BEngine.bg(() -> {
            BEngine.replan(c, false);
            BReplanJob.ensure(c);
            BPlugin.emit("resume", null);
        });
    }
}
