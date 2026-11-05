package kr.boxworks.b;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * 재부팅(SPEC 6절): 잠금을 풀기 전(LOCKED_BOOT_COMPLETED)에는 저장해 둔 알람만 다시 건다(캘린더는 잠금을 푼 뒤에만 읽힌다).
 * BOOT_COMPLETED · MY_PACKAGE_REPLACED · TIME_SET · TIMEZONE_CHANGED에는 다시 계획 + 캘린더 감시 등록.
 */
public class BBootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        final Context c = context.getApplicationContext() != null ? context.getApplicationContext() : context;
        String action = intent == null ? "" : String.valueOf(intent.getAction());
        if ("android.intent.action.LOCKED_BOOT_COMPLETED".equals(action)) {
            BScheduler.rescheduleAll(c);
            return;
        }
        // 이 다섯 가지가 아니면 아무것도 하지 않는다(다른 앱도 이 수신기를 부를 수 있어서)
        boolean known = Intent.ACTION_BOOT_COMPLETED.equals(action) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)
            || Intent.ACTION_TIME_CHANGED.equals(action) || Intent.ACTION_TIMEZONE_CHANGED.equals(action);
        if (!known) return;
        final PendingResult pr = goAsync();
        BEngine.bg(() -> {
            try {
                BNotify.ensureChannels(c);
                // 같은 알람도 모두 다시 건다(캘린더를 못 읽으면 저장해 둔 것만)
                BEngine.replan(c, true);
                BReplanJob.ensure(c);
            } finally {
                pr.finish();
            }
        });
    }
}
