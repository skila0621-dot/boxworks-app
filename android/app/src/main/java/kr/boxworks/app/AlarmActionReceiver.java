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
        JSONObject o = AlarmNotify.fromIntent(intent);
        if ("snooze".equals(act)) AlarmNotify.snooze(context, o);
        AlarmNotify.dismiss(context, o.optString("id"));
        AlarmActivity.closeIfShowing();
    }
}
