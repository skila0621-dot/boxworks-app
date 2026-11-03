package kr.boxworks.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import org.json.JSONObject;

/** 알림의 '확인'과 '5분 뒤' 버튼. 앱을 열지 않고 응답한다(D-01). */
public class AlarmActionReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String act = intent.getStringExtra(AlarmNotify.EXTRA_ACT);
        if ("report-close".equals(act)) {
            androidx.core.app.NotificationManagerCompat.from(context).cancel(AlarmNotify.REPORT_ID);
            return;
        }
        if ("ongoing-x".equals(act)) {
            if (AlarmStore.unlocked(context)) RoutineOngoing.hide(context);
            return;
        }
        // 휴대폰을 쓰는 중 울리던 알람: 알림을 밀어 지우면 소리만 멈춘다(확인한 것은 아님)
        if ("ring-off".equals(act)) {
            AlarmRingService.stop(context);
            return;
        }
        // '확인'·'5분 뒤'를 누르면 앱이 직접 울리던 소리도 멈춘다
        AlarmRingService.stop(context);
        JSONObject o = AlarmNotify.fromIntent(intent);
        AlarmStore.confirm(context, o, !"snooze".equals(act));
        if ("snooze".equals(act)) AlarmNotify.snooze(context, o);
        else if (o.optJSONObject("report") != null) AlarmNotify.showReport(context, o.optJSONObject("report"));
        AlarmNotify.dismiss(context, o.optString("id"));
        AlarmActivity.handledElsewhere(o.optString("id"), o.optString("series"));
        // 위젯의 '확인'(widget=true)도 같은 동작: 남은 다시 알림을 지우고 진행 알림·위젯을 고친다
        // 잠금을 풀기 전에는 진행 알림·위젯이 쓰는 저장소를 읽을 수 없어 건너뛴다
        if (AlarmStore.unlocked(context)) {
            RoutineOngoing.post(context);
            BxWidgetProvider.refreshAll(context);
        }
    }
}
