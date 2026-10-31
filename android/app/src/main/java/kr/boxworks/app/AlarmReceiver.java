package kr.boxworks.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import org.json.JSONObject;

/** 예약한 시각이 되면 알림을 띄운다. */
public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        JSONObject o = AlarmNotify.fromIntent(intent);
        AlarmStore.remove(context, o.optString("id"));
        String kind = o.optString("kind");
        if (o.optString("sound").startsWith("bowl")) {
            // 종소리는 알림 소리에 맡기지 않고 앱이 직접 끝까지 튼다(알림은 소리 없이 글만)
            AlarmNotify.showSoft(context, o);
            BowlPlayer.play(context, o.optString("sound"), goAsync());
            BxWidgetProvider.refreshAll(context);
            return;
        } else if ("report".equals(kind)) {
            AlarmNotify.showReport(context, o.optJSONObject("report"));
        } else if ("rcheck".equals(kind)) {
            // 루틴이 끝난 뒤: 확인하지 않은 단계가 있을 때만 알람을 띄운다
            java.util.List<String> miss = AlarmStore.unconfirmed(context, o.optJSONArray("check"));
            if (!miss.isEmpty()) {
                try {
                    o.put("kind", "routine");
                    o.put("title", "확인하지 않은 단계 " + miss.size() + "개");
                    String names = android.text.TextUtils.join(" · ", miss);
                    o.put("sub", names);
                    o.put("body", o.optString("group") + " · " + names);
                    o.put("next", "앱에서 했는지 표시해 주세요");
                } catch (Exception ignored) {
                }
                AlarmNotify.show(context, o);
            }
        } else {
            AlarmNotify.show(context, o);
        }
        BxWidgetProvider.refreshAll(context);
    }
}
