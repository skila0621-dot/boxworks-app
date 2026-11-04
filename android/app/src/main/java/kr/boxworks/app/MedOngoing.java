package kr.boxworks.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

/**
 * 시험판 48(대표 11/4 13:45 "명상을 시작했는데 갑자기 일이 생기면 취소할 수 있어야 한다. 앱 밖에서도 계속 진행되고 정지 버튼이 어디에도 없다"):
 * 명상하는 동안 알림창 · 잠금 화면에 붙는 알림 한 장. '명상 중 · 10분'과 남은 시간(거꾸로 세기), '명상 끝내기' 단추.
 * 끝내기를 누르면 남은 명상 종 · 배경 소리를 모두 멈추고, 앱은 다음에 보일 때 '명상 중' 화면을 치운다(SoundPrefs.medCancel).
 * 배경 소리가 나오는 동안에는 소리 서비스(BxSoundService)의 알림이 같은 모양으로 대신한다(알림이 두 장이 되지 않게).
 * 포그라운드 서비스는 쓰지 않는다(배경 소리가 없을 때). 명상이 끝나면(끝 종) 스스로 지운다.
 */
final class MedOngoing {
    static final String CHANNEL = "bx_med_v1";
    static final int NOTIF_ID = 0x0B40;
    static final String ACT_STOP = "med-stop";

    private MedOngoing() {}

    private static SharedPreferences prefs(Context c) {
        return SoundPrefs.prefs(c);
    }

    /** 앱에서 명상을 시작할 때 */
    static void start(Context c, long startAt, long endAt, int min, String bg, boolean bell) {
        try {
            prefs(c).edit().putLong("medStart", startAt).putLong("medEnd", endAt).putInt("medMin", min)
                .putString("medBg", bg == null ? "" : bg).putBoolean("medBell", bell).apply();
        } catch (Exception ignored) {
        }
        // 배경 소리가 이미 나오는 중이면 그 알림을 명상 알림 모양으로 바꾼다(알림이 두 장이 되지 않게)
        if (BxSoundService.refreshMedNotice(c)) return;
        post(c);
    }

    /** 명상이 끝났거나 멈췄을 때: 기억과 알림을 지운다 */
    static void clear(Context c) {
        try {
            prefs(c).edit().remove("medStart").remove("medEnd").remove("medMin").remove("medBg").remove("medBell").apply();
        } catch (Exception ignored) {
        }
        try {
            NotificationManagerCompat.from(c).cancel(NOTIF_ID);
        } catch (Exception ignored) {
        }
    }

    static long endAt(Context c) {
        try {
            return prefs(c).getLong("medEnd", 0);
        } catch (Exception e) {
            return 0;
        }
    }

    static boolean active(Context c) {
        return endAt(c) > System.currentTimeMillis();
    }

    /** 알림의 '명상 끝내기': 남은 종 · 배경 소리 · 지금 울리는 종을 모두 멈춘다 */
    static void stopAll(Context c) {
        clear(c);
        try {
            MainActivity.stopMeditation(c, true);
        } catch (Exception ignored) {
        }
        try {
            BxSoundService.requestStop(c);
        } catch (Exception ignored) {
        }
        SoundPrefs.medCancel(c, System.currentTimeMillis());
        BxSoundPlugin.medStopped();
    }

    /** 배경 소리 없이 하는 명상: 따로 알림을 붙인다. 배경 소리 서비스가 명상 알림을 대신하는 중이면 붙이지 않는다 */
    static void post(Context c) {
        if (!active(c)) {
            clear(c);
            return;
        }
        if (BxSoundService.medNotice()) {
            try {
                NotificationManagerCompat.from(c).cancel(NOTIF_ID);
            } catch (Exception ignored) {
            }
            return;
        }
        try {
            NotificationManagerCompat.from(c).notify(NOTIF_ID, build(c, false));
        } catch (SecurityException ignored) {
        } catch (Exception ignored) {
        }
    }

    /** 명상 알림 한 장. service: 배경 소리 서비스가 포그라운드 알림으로 쓸 때(채널 · 지울 수 없음은 서비스가 정함) */
    static Notification build(Context c, boolean service) {
        ensureChannel(c);
        long now = System.currentTimeMillis();
        long end = 0, start = 0;
        int min = 0;
        String bg = "";
        boolean bell = true;
        try {
            SharedPreferences p = prefs(c);
            end = p.getLong("medEnd", 0);
            start = p.getLong("medStart", 0);
            min = p.getInt("medMin", 0);
            bg = p.getString("medBg", "");
            bell = p.getBoolean("medBell", true);
        } catch (Exception ignored) {
        }
        String title = "명상 중" + (min > 0 ? " · " + min + "분" : "");
        String text = (bg == null || bg.isEmpty() ? "" : "배경 소리 " + bg + " · ") + (bell ? "끝나면 종이 울려요" : "끝나면 알림만 와요");

        Intent open = new Intent(c, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openPi = PendingIntent.getActivity(c, NOTIF_ID, open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Intent stop = new Intent(c, AlarmActionReceiver.class);
        stop.setAction("kr.boxworks.app.ACT." + ACT_STOP);
        stop.putExtra(AlarmNotify.EXTRA_ACT, ACT_STOP);
        PendingIntent stopPi = PendingIntent.getBroadcast(c, NOTIF_ID + 1, stop,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder b = new NotificationCompat.Builder(c, service ? BxSoundService.CHANNEL : CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_bx)
            .setContentTitle(title)
            .setContentText(text)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setCategory(service ? NotificationCompat.CATEGORY_SERVICE : NotificationCompat.CATEGORY_PROGRESS)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            // 명상은 감출 내용이 없어 잠금 화면에서도 바로 끝낼 수 있게 다 보인다
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(openPi)
            .addAction(0, "명상 끝내기", stopPi);
        if (end > now) {
            // 남은 시간을 알림 머리에 거꾸로 세어 보여 준다(따로 고쳐 쓰지 않아도 맞다)
            b.setWhen(end).setShowWhen(true).setUsesChronometer(true).setChronometerCountDown(true);
            if (!service) b.setTimeoutAfter(Math.max(60_000L, end - now + 60_000L));
        } else {
            b.setShowWhen(false);
        }
        if (service) b.setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE);
        return b.build();
    }

    private static void ensureChannel(Context c) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null || nm.getNotificationChannel(CHANNEL) != null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL, "명상 중", NotificationManager.IMPORTANCE_LOW);
        ch.setDescription("명상하는 동안 남은 시간과 '명상 끝내기'를 알림창 · 잠금 화면에 붙여 둬요. 소리는 나지 않아요");
        ch.setSound(null, null);
        ch.enableVibration(false);
        ch.setShowBadge(false);
        ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(ch);
    }
}
