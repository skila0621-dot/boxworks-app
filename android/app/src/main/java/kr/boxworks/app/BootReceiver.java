package kr.boxworks.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** 휴대폰을 껐다 켜거나 앱을 업데이트하거나 시간이 바뀌면 알람을 다시 예약한다. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        AlarmStore.rescheduleAll(context);
    }
}
