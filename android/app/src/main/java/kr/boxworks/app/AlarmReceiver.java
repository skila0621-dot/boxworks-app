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
        AlarmNotify.show(context, o);
    }
}
