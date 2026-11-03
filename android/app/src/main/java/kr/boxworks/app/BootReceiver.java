package kr.boxworks.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * 휴대폰을 껐다 켜거나 앱을 업데이트하거나 시간이 바뀌면 알람을 다시 예약한다.
 * 다시 켠 뒤 잠금을 처음 풀기 전(LOCKED_BOOT_COMPLETED)에도 다시 건다. 전에는 잠금을 풀 때까지 알람이 없었다(문제점 점검 기술 2).
 */
public class BootReceiver extends BroadcastReceiver {
    static final int MISSED_ID = 0x0B31;
    static final int TZ_ID = 0x0B32;
    private static final long MISSED_WITHIN_MS = 12L * 3600 * 1000;

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent == null ? "" : String.valueOf(intent.getAction());
        // 받은 신호가 이 다섯 가지가 아니면 아무것도 하지 않는다(다른 앱도 이 수신기를 부를 수 있어서)
        boolean boot = Intent.ACTION_BOOT_COMPLETED.equals(action) || "android.intent.action.LOCKED_BOOT_COMPLETED".equals(action);
        boolean known = boot || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action) || Intent.ACTION_TIME_CHANGED.equals(action)
            || Intent.ACTION_TIMEZONE_CHANGED.equals(action);
        if (!known) return;
        // 꺼져 있는 동안 지나간 알람은 말없이 버리지 않고 한 장으로 알린다
        if (boot || Intent.ACTION_TIME_CHANGED.equals(action)) {
            int missed = AlarmStore.takeMissed(context, MISSED_WITHIN_MS);
            if (missed > 0) {
                AlarmNotify.showInfo(context, MISSED_ID, "지나간 알람 " + missed + "개",
                    "휴대폰이 꺼져 있거나 시간이 바뀌는 동안 울리지 못한 알람이 있어요. " + AlarmNotify.appName(context) + "에서 확인해 주세요.");
            }
        }
        AlarmStore.rescheduleAll(context);
        if (Intent.ACTION_TIMEZONE_CHANGED.equals(action)) {
            AlarmNotify.showInfo(context, TZ_ID, "시간대가 바뀌었어요",
                "앱을 한 번 열면 알람 시각을 새 시간대에 맞춰요.");
        }
        if (AlarmStore.unlocked(context)) BxWidgetProvider.refreshAll(context);
    }
}
