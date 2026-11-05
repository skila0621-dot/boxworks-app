package kr.boxworks.b;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import org.json.JSONObject;

/** 알림 단추(시작했어요 · 나갔어요 · n분만 · 이번엔 안 가요 · 했어요 · 10분 뒤). 앱을 열지 않고 대답한다. 잠금을 풀기 전에도 된다 */
public class BActionReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        final Context c = context.getApplicationContext() != null ? context.getApplicationContext() : context;
        final String act = intent.getStringExtra(BNotify.EXTRA_ACT);
        final String key = intent.getStringExtra(BNotify.EXTRA_KEY);
        final String kind = intent.getStringExtra(BNotify.EXTRA_KIND);
        final Double n = intent.hasExtra(BNotify.EXTRA_N) ? intent.getDoubleExtra(BNotify.EXTRA_N, 0) : null;
        final String snapJson = intent.getStringExtra(BNotify.EXTRA_SNAP);
        // 밀어 지우면 소리만 멈춘다(바로)
        if ("ring-off".equals(act)) {
            BRingService.quietFor(c, key);
            return;
        }
        final PendingResult pr = goAsync();
        BEngine.bg(() -> {
            try {
                JSONObject snap = snapJson == null ? null : BJson.parseObj(snapJson);
                BActions.handle(c, key, act, kind, n, snap);
            } finally {
                pr.finish();
            }
        });
    }
}
